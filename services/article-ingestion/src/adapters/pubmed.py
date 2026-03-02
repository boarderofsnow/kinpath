"""
PubMed E-Utilities adapter for Supabase.
Ported from the local platform's ingestion/pubmed.py with Supabase upsert.
"""

import requests
import time
import logging
import xml.etree.ElementTree as ET
from typing import List, Tuple, Optional
from datetime import datetime

from src.adapters.base import SourceAdapter
from src.config import (
    PUBMED_ESEARCH_URL, PUBMED_EFETCH_URL,
    PUBMED_BATCH_SIZE, MAX_RETRIES, RETRY_BACKOFF,
)

logger = logging.getLogger(__name__)


class RateLimiter:
    """Simple token-bucket rate limiter."""
    def __init__(self, max_per_second: int = 3):
        self.min_interval = 1.0 / max_per_second
        self.last_call = 0.0

    def wait(self):
        now = time.time()
        elapsed = now - self.last_call
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_call = time.time()


class PubMedAdapter(SourceAdapter):
    """PubMed E-Utilities adapter."""

    ESEARCH_MAX = 9999

    def __init__(self, api_key: str = ""):
        self.api_key = api_key
        rate = 10 if api_key else 3
        self._limiter = RateLimiter(max_per_second=rate)

    def _params(self, extra: dict = None) -> dict:
        params = {}
        if self.api_key:
            params["api_key"] = self.api_key
        if extra:
            params.update(extra)
        return params

    def _get(self, url: str, params: dict, timeout: int = 60) -> requests.Response:
        last_err = None
        for attempt in range(MAX_RETRIES):
            try:
                self._limiter.wait()
                resp = requests.get(url, params=params, timeout=timeout)
                resp.raise_for_status()
                return resp
            except (requests.RequestException, requests.HTTPError) as e:
                last_err = e
                if attempt < MAX_RETRIES - 1:
                    wait = RETRY_BACKOFF ** (attempt + 1)
                    logger.warning(f"PubMed request failed (attempt {attempt+1}), retrying in {wait}s: {e}")
                    time.sleep(wait)
        raise last_err

    def validate_credentials(self, api_key: str = None) -> bool:
        key = api_key or self.api_key
        try:
            params = {"db": "pubmed", "term": "test", "retmax": 1}
            if key:
                params["api_key"] = key
            resp = requests.get(PUBMED_ESEARCH_URL, params=params, timeout=10)
            return resp.status_code == 200
        except Exception:
            return False

    def fetch_articles(self, config: dict, since: datetime = None) -> List[dict]:
        """
        Fetch articles for configured journals.

        If `since` is provided (incremental mode), only fetch articles
        published from that date onward. Otherwise fetch the full range
        from config (backfill mode).

        config should contain: {"journals": {"AJOG": {"query": "...", "issn": "..."}}}
        """
        journals = config.get("journals", {})
        search_terms = config.get("search_terms", "(pregnancy OR prenatal OR pediatric OR neonatal)")

        # Incremental: narrow the date range to only recent articles
        if since is not None:
            date_range = f"{since.strftime('%Y/%m/%d')}:3000/12/31"
            logger.info(f"Incremental mode — fetching articles since {since.strftime('%Y-%m-%d')}")
        else:
            date_range = config.get("date_range", "1900/01/01:2026/12/31")
            logger.info(f"Full/backfill mode — fetching entire date range: {date_range}")

        all_articles = []
        for journal_name, journal_config in journals.items():
            logger.info(f"Fetching PMIDs for {journal_name}...")
            query = journal_config["query"]

            total_count, pmids = self._collect_all_pmids(query, search_terms, date_range)
            logger.info(f"  {journal_name}: {len(pmids)} unique PMIDs (total count: {total_count})")

            # Fetch article details in batches
            for i in range(0, len(pmids), 200):
                batch = pmids[i:i+200]
                articles = self._fetch_details(batch)
                all_articles.extend(articles)
                logger.info(f"  Fetched details for {min(i+200, len(pmids))}/{len(pmids)} articles")

        return all_articles

    # ─── PMID Collection (date-segmented for >9999 results) ───────

    def _search_count(self, query: str, search_terms: str, date_range: str) -> int:
        params = self._params({
            "db": "pubmed", "term": f"{query} AND {search_terms} AND {date_range}[dp]",
            "retmax": 0, "rettype": "count",
        })
        resp = self._get(PUBMED_ESEARCH_URL, params, timeout=30)
        root = ET.fromstring(resp.text)
        return int(root.findtext("Count", "0"))

    def _search_pmids(self, query, search_terms, date_range, retstart=0, retmax=9999):
        params = self._params({
            "db": "pubmed",
            "term": f"{query} AND {search_terms} AND {date_range}[dp]",
            "retstart": retstart, "retmax": min(retmax, self.ESEARCH_MAX),
            "rettype": "uilist", "sort": "pub_date",
        })
        resp = self._get(PUBMED_ESEARCH_URL, params, timeout=30)
        root = ET.fromstring(resp.text)
        count = int(root.findtext("Count", "0"))
        pmids = [el.text for el in root.findall(".//Id")]
        return count, pmids

    def _find_date_segments(self, query, search_terms, start_year, end_year, max_per=9000):
        date_range = f"{start_year}/01/01:{end_year}/12/31"
        count = self._search_count(query, search_terms, date_range)
        if count <= max_per or start_year == end_year:
            return [(date_range, count)]
        mid = (start_year + end_year) // 2
        left = self._find_date_segments(query, search_terms, start_year, mid, max_per)
        right = self._find_date_segments(query, search_terms, mid + 1, end_year, max_per)
        return left + right

    def _collect_all_pmids(self, query, search_terms, date_range):
        parts = date_range.split(":")
        start_year = int(parts[0].split("/")[0])
        end_year = int(parts[1].split("/")[0])

        total_count = self._search_count(query, search_terms, date_range)
        if total_count == 0:
            return 0, []
        if total_count <= self.ESEARCH_MAX:
            _, pmids = self._search_pmids(query, search_terms, date_range)
            return total_count, pmids

        logger.info(f"  Result set ({total_count:,}) exceeds 9,999 — segmenting by date")
        segments = self._find_date_segments(query, search_terms, start_year, end_year)
        all_pmids = set()
        for seg_range, seg_count in segments:
            if seg_count == 0:
                continue
            _, pmids = self._search_pmids(query, search_terms, seg_range)
            all_pmids.update(pmids)

        return total_count, sorted(all_pmids)

    # ─── Article Detail Fetching ──────────────────────────────────

    def _fetch_details(self, pmids: List[str]) -> List[dict]:
        if not pmids:
            return []
        params = self._params({
            "db": "pubmed", "id": ",".join(pmids), "rettype": "xml",
        })
        resp = self._get(PUBMED_EFETCH_URL, params, timeout=120)
        root = ET.fromstring(resp.text)
        articles = []
        for pa in root.findall(".//PubmedArticle"):
            try:
                article = self._parse_article(pa)
                if article:
                    articles.append(article)
            except Exception as e:
                pmid = "?"
                try:
                    pmid = pa.find(".//MedlineCitation").findtext("PMID", "?")
                except:
                    pass
                logger.warning(f"Failed to parse PMID {pmid}: {e}")
        return articles

    def _parse_article(self, pubmed_article) -> Optional[dict]:
        """Parse a PubmedArticle XML element into a dict matching our schema."""
        mc = pubmed_article.find(".//MedlineCitation")
        article_el = mc.find(".//Article")
        if article_el is None:
            return None

        pmid = mc.findtext("PMID", "")
        title = article_el.findtext("ArticleTitle", "Untitled")

        # DOI
        doi = None
        for eloc in article_el.findall(".//ELocationID"):
            if eloc.get("EIdType") == "doi":
                doi = eloc.text
                break
        if not doi:
            for aid in pubmed_article.findall(".//ArticleId"):
                if aid.get("IdType") == "doi":
                    doi = aid.text
                    break

        # PII
        pii = None
        for aid in pubmed_article.findall(".//ArticleId"):
            if aid.get("IdType") == "pii":
                pii = aid.text
                break

        # Authors
        authors = []
        for author in article_el.findall(".//Author"):
            last = author.findtext("LastName", "")
            first = author.findtext("ForeName", "")
            affil = author.findtext(".//Affiliation", "")
            if last:
                authors.append({"name": f"{first} {last}".strip(), "affiliation": affil})

        # Abstract
        abstract_parts = []
        for abs_text in article_el.findall(".//AbstractText"):
            label = abs_text.get("Label", "")
            full_text = ET.tostring(abs_text, encoding="unicode", method="text").strip()
            if label:
                abstract_parts.append(f"{label}: {full_text}")
            else:
                abstract_parts.append(full_text)
        abstract = "\n".join(abstract_parts)

        # Journal
        journal = article_el.find(".//Journal")
        journal_name = journal.findtext("Title", "") if journal else ""
        issn = journal.findtext("ISSN", "") if journal else ""
        volume = journal.findtext(".//Volume", "") if journal else ""
        issue = journal.findtext(".//Issue", "") if journal else ""
        pages = article_el.findtext(".//Pagination/MedlinePgn", "")

        # Publication date
        pub_date = self._parse_pub_date(article_el.find(".//PubDate"))

        # MeSH terms
        mesh_terms = []
        for mesh in mc.findall(".//MeshHeading"):
            descriptor = mesh.findtext("DescriptorName", "")
            if descriptor:
                mesh_terms.append(descriptor)

        # Keywords
        keywords = []
        for kw in mc.findall(".//KeywordList/Keyword"):
            if kw.text:
                keywords.append(kw.text)

        # Publication type
        pub_types = [pt.text for pt in article_el.findall(".//PublicationType") if pt.text]
        article_type = "; ".join(pub_types) if pub_types else None

        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
        full_text_url = f"https://doi.org/{doi}" if doi else None

        return {
            "pmid": pmid,
            "doi": doi,
            "pii": pii,
            "title": title,
            "authors": authors,
            "abstract": abstract,
            "journal_name": journal_name,
            "journal_issn": issn,
            "publication_date": pub_date,
            "volume": volume,
            "issue": issue,
            "pages": pages,
            "url": url,
            "full_text_url": full_text_url,
            "keywords": keywords,
            "mesh_terms": mesh_terms,
            "article_type": article_type,
            "raw_metadata": {"xml_source": "pubmed_efetch"},
        }

    def _parse_pub_date(self, pub_date_el) -> Optional[str]:
        if pub_date_el is None:
            return None
        year = pub_date_el.findtext("Year", "")
        month = pub_date_el.findtext("Month", "01")
        day = pub_date_el.findtext("Day", "01")
        month_map = {
            "jan": "01", "feb": "02", "mar": "03", "apr": "04",
            "may": "05", "jun": "06", "jul": "07", "aug": "08",
            "sep": "09", "oct": "10", "nov": "11", "dec": "12",
        }
        if month.lower()[:3] in month_map:
            month = month_map[month.lower()[:3]]
        try:
            return f"{year}-{int(month):02d}-{int(day):02d}"
        except (ValueError, TypeError):
            return f"{year}-01-01" if year else None
