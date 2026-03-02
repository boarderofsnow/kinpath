"""
Abstract base class for data source adapters.
Every source (PubMed, Elsevier, Springer, etc.) implements this interface.
"""

from abc import ABC, abstractmethod
from datetime import datetime
from typing import List


class SourceAdapter(ABC):
    """Base interface for all article source adapters."""

    @abstractmethod
    def fetch_articles(self, config: dict, since: datetime = None) -> List[dict]:
        """
        Fetch articles from the source.
        Args:
            config: Source-specific configuration (from articles.sources.config)
            since: Only fetch articles newer than this date (for incremental runs)
        Returns:
            List of article dicts ready for upsert_article()
        """
        pass

    @abstractmethod
    def validate_credentials(self, api_key: str) -> bool:
        """Test that credentials are valid (make a test API call)."""
        pass
