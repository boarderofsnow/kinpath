/**
 * Source organization registry for resource attribution.
 *
 * Rather than linking to specific article URLs (which may break over time),
 * we map source domains to their parent organizations and link to reliable
 * institutional landing pages.
 */

export interface SourceOrganization {
  /** Human-readable organization name */
  name: string;
  /** Short name for compact display */
  shortName: string;
  /** A reliable, stable URL for this organization (homepage or section landing) */
  reliableUrl: string;
  /** Brief description of the organization's authority */
  authority: string;
}

/**
 * Maps domain patterns to known source organizations.
 * Order matters — more specific domains should come first.
 */
const SOURCE_REGISTRY: { pattern: string; org: SourceOrganization }[] = [
  {
    pattern: "publications.aap.org",
    org: {
      name: "American Academy of Pediatrics",
      shortName: "AAP",
      reliableUrl: "https://publications.aap.org/pediatrics",
      authority: "Leading pediatric medical organization",
    },
  },
  {
    pattern: "healthychildren.org",
    org: {
      name: "HealthyChildren.org (AAP)",
      shortName: "AAP",
      reliableUrl: "https://www.healthychildren.org",
      authority: "Parent resource from the American Academy of Pediatrics",
    },
  },
  {
    pattern: "aap.org",
    org: {
      name: "American Academy of Pediatrics",
      shortName: "AAP",
      reliableUrl: "https://www.healthychildren.org",
      authority: "Leading pediatric medical organization",
    },
  },
  {
    pattern: "acog.org",
    org: {
      name: "American College of Obstetricians and Gynecologists",
      shortName: "ACOG",
      reliableUrl: "https://www.acog.org/womens-health",
      authority: "Leading authority on obstetric and gynecologic care",
    },
  },
  {
    pattern: "cdc.gov",
    org: {
      name: "Centers for Disease Control and Prevention",
      shortName: "CDC",
      reliableUrl: "https://www.cdc.gov",
      authority: "U.S. federal public health agency",
    },
  },
  {
    pattern: "who.int",
    org: {
      name: "World Health Organization",
      shortName: "WHO",
      reliableUrl: "https://www.who.int",
      authority: "United Nations global health authority",
    },
  },
  {
    pattern: "zerotothree.org",
    org: {
      name: "Zero to Three",
      shortName: "Zero to Three",
      reliableUrl: "https://www.zerotothree.org",
      authority: "National nonprofit for early childhood development",
    },
  },
  {
    pattern: "apa.org",
    org: {
      name: "American Psychological Association",
      shortName: "APA",
      reliableUrl: "https://www.apa.org/topics",
      authority: "Leading scientific and professional psychology organization",
    },
  },
  {
    pattern: "nimh.nih.gov",
    org: {
      name: "National Institute of Mental Health",
      shortName: "NIMH",
      reliableUrl: "https://www.nimh.nih.gov/health",
      authority: "U.S. federal research agency on mental health",
    },
  },
  {
    pattern: "gottman.com",
    org: {
      name: "The Gottman Institute",
      shortName: "Gottman",
      reliableUrl: "https://www.gottman.com",
      authority: "Research-based relationship and parenting guidance",
    },
  },
  {
    pattern: "nhtsa.gov",
    org: {
      name: "National Highway Traffic Safety Administration",
      shortName: "NHTSA",
      reliableUrl: "https://www.nhtsa.gov/equipment/car-seats-and-booster-seats",
      authority: "U.S. federal vehicle and child passenger safety agency",
    },
  },
  {
    pattern: "marchofdimes.org",
    org: {
      name: "March of Dimes",
      shortName: "March of Dimes",
      reliableUrl: "https://www.marchofdimes.org",
      authority: "Nonprofit for maternal and infant health",
    },
  },
  {
    pattern: "llli.org",
    org: {
      name: "La Leche League International",
      shortName: "LLL",
      reliableUrl: "https://www.llli.org",
      authority: "International breastfeeding support organization",
    },
  },
];

/**
 * Resolve a source URL to its parent organization.
 * Returns the organization info if the domain is recognized, or null.
 */
export function resolveSource(sourceUrl: string): SourceOrganization | null {
  try {
    const hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");

    for (const entry of SOURCE_REGISTRY) {
      if (hostname === entry.pattern || hostname.endsWith(`.${entry.pattern}`)) {
        return entry.org;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get the reliable URL for a given source URL.
 * If the organization is recognized, returns the organization's stable landing page.
 * Otherwise returns the original URL as-is.
 */
export function getReliableSourceUrl(sourceUrl: string): string {
  const org = resolveSource(sourceUrl);
  return org?.reliableUrl ?? sourceUrl;
}

/**
 * Map from original source_url domain to a reliable section-level URL.
 * Used by the database migration to update all source URLs at once.
 */
export function getReliableSectionUrl(sourceUrl: string): string {
  try {
    const url = new URL(sourceUrl);
    const hostname = url.hostname.replace(/^www\./, "");
    const path = url.pathname;

    // ACOG: Map to womens-health landing
    if (hostname === "acog.org" || hostname.endsWith(".acog.org")) {
      if (path.includes("immunization") || path.includes("vaccin")) {
        return "https://www.acog.org/womens-health/faqs/immunization-during-pregnancy";
      }
      return "https://www.acog.org/womens-health";
    }

    // AAP patient care → HealthyChildren
    if (hostname === "aap.org" || hostname.endsWith(".aap.org")) {
      if (path.includes("breastfeeding")) {
        return "https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/default.aspx";
      }
      if (path.includes("immuniz")) {
        return "https://www.healthychildren.org/English/safety-prevention/immunizations/Pages/default.aspx";
      }
      return "https://www.healthychildren.org";
    }

    // AAP Publications
    if (hostname === "publications.aap.org") {
      return "https://publications.aap.org/pediatrics";
    }

    // HealthyChildren
    if (hostname === "healthychildren.org" || hostname.endsWith(".healthychildren.org")) {
      return "https://www.healthychildren.org";
    }

    // CDC: Route by topic
    if (hostname === "cdc.gov" || hostname.endsWith(".cdc.gov")) {
      if (path.includes("breastfeeding")) return "https://www.cdc.gov/breastfeeding/index.htm";
      if (path.includes("vaccine")) return "https://www.cdc.gov/vaccines/index.html";
      if (path.includes("ncbddd") || path.includes("actearly")) return "https://www.cdc.gov/ncbddd/actearly/index.html";
      return "https://www.cdc.gov";
    }

    // WHO
    if (hostname === "who.int" || hostname.endsWith(".who.int")) {
      return "https://www.who.int/health-topics/vaccines-and-immunization";
    }

    // Zero to Three
    if (hostname === "zerotothree.org" || hostname.endsWith(".zerotothree.org")) {
      return "https://www.zerotothree.org";
    }

    // APA
    if (hostname === "apa.org" || hostname.endsWith(".apa.org")) {
      return "https://www.apa.org/topics/parenting";
    }

    // NIMH
    if (hostname === "nimh.nih.gov" || hostname.endsWith(".nimh.nih.gov")) {
      return "https://www.nimh.nih.gov/health/topics/perinatal-depression";
    }

    // Gottman
    if (hostname === "gottman.com" || hostname.endsWith(".gottman.com")) {
      return "https://www.gottman.com/parents/";
    }

    // NHTSA
    if (hostname === "nhtsa.gov" || hostname.endsWith(".nhtsa.gov")) {
      return "https://www.nhtsa.gov/equipment/car-seats-and-booster-seats";
    }

    // Fallback: return original URL
    return sourceUrl;
  } catch {
    return sourceUrl;
  }
}
