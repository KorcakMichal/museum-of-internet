import { scrapeWebsiteAndCreateSummary } from './website-scraper-summary';

const DUCKDUCKGO_ENDPOINT = 'https://api.duckduckgo.com/';

function normalizeDomain(input) {
  const raw = (input || '').trim();
  if (!raw) {
    return '';
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

function toDisplayName(domain) {
  const root = (domain || '').split('.')[0] || 'website';
  return root
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function compactText(text, maxLength = 720) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) {
    return '';
  }

  if (clean.length <= maxLength) {
    return clean;
  }

  return `${clean.slice(0, maxLength - 1).trimEnd()}...`;
}

function getPaletteText(colors, max = 10) {
  if (!Array.isArray(colors) || colors.length === 0) {
    return '';
  }

  const entries = colors
    .slice(0, max)
    .map((entry) => (typeof entry?.value === 'string' ? entry.value : ''))
    .filter(Boolean);

  return entries.join(', ');
}

function appendPaletteToSummary(summary, colors) {
  const paletteText = getPaletteText(colors);
  if (!paletteText) {
    return summary;
  }

  if ((summary || '').toLowerCase().includes('color palette from page:')) {
    return summary;
  }

  return `${summary}\nColor palette from page: ${paletteText}.`;
}

function buildFallbackSummary(domain) {
  const displayName = toDisplayName(domain);
  return `Official web domain for ${displayName}. Open this house to explore more links and pages related to ${domain}.`;
}

function extractSummaryFromDuckDuckGo(data, domain) {
  if (!data || typeof data !== 'object') {
    return '';
  }

  if (typeof data.AbstractText === 'string' && data.AbstractText.trim()) {
    return data.AbstractText.trim();
  }

  const relatedTopics = Array.isArray(data.RelatedTopics) ? data.RelatedTopics : [];
  const matchingTopic = relatedTopics.find((topic) => {
    if (!topic || typeof topic.Text !== 'string') {
      return false;
    }

    if (!topic.FirstURL) {
      return false;
    }

    try {
      const topicDomain = new URL(topic.FirstURL).hostname.replace(/^www\./, '').toLowerCase();
      return topicDomain.includes(domain);
    } catch {
      return false;
    }
  });

  return matchingTopic?.Text?.trim() || '';
}

async function fetchDuckDuckGoSummary(query, signal) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    no_html: '1',
    no_redirect: '1',
    skip_disambig: '1',
  });

  const response = await fetch(`${DUCKDUCKGO_ENDPOINT}?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`DuckDuckGo summary request failed: HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Returns a short human-readable summary for a domain.
 */
export async function getDomainSummary({ domain, signal } = {}) {
  const normalizedDomain = normalizeDomain(domain);
  if (!normalizedDomain) {
    throw new Error('A valid domain is required for summary lookup.');
  }

  const baseResult = {
    domain: normalizedDomain,
    title: toDisplayName(normalizedDomain),
    source: 'fallback',
    url: `https://${normalizedDomain}`,
    summary: buildFallbackSummary(normalizedDomain),
    colors: [],
    colorCount: 0,
  };

  try {
    const data = await fetchDuckDuckGoSummary(normalizedDomain, signal);
    const externalSummary = compactText(extractSummaryFromDuckDuckGo(data, normalizedDomain));

    if (!externalSummary) {
      const scraped = await scrapeWebsiteAndCreateSummary({
        url: baseResult.url,
        signal,
      });
      const scrapedSummary = compactText(scraped?.summary || '');

      if (scrapedSummary) {
        const scrapedColors = Array.isArray(scraped?.colors) ? scraped.colors : [];
        const scrapedResult = {
          ...baseResult,
          source: `scraper-${scraped.source || 'unknown'}`,
          summary: appendPaletteToSummary(scrapedSummary, scrapedColors),
          colors: scrapedColors,
          colorCount: Number.isFinite(scraped?.colorCount) ? scraped.colorCount : scrapedColors.length,
        };

        console.info('[DomainSummary] Using scraper summary (DuckDuckGo empty)', {
          domain: normalizedDomain,
          source: scrapedResult.source,
          summaryLength: scrapedResult.summary.length,
          summaryPreview: scrapedResult.summary.slice(0, 180),
        });

        return scrapedResult;
      }

      console.info('[DomainSummary] Using fallback summary (no DuckDuckGo or scraper text)', {
        domain: normalizedDomain,
        source: baseResult.source,
        summaryLength: baseResult.summary.length,
        summaryPreview: baseResult.summary.slice(0, 180),
      });
      return baseResult;
    }

    let result = {
      ...baseResult,
      source: 'duckduckgo',
      summary: externalSummary,
    };

    try {
      const scrapedForPalette = await scrapeWebsiteAndCreateSummary({
        url: baseResult.url,
        signal,
      });
      const paletteColors = Array.isArray(scrapedForPalette?.colors) ? scrapedForPalette.colors : [];
      result = {
        ...result,
        colors: paletteColors,
        colorCount: Number.isFinite(scrapedForPalette?.colorCount) ? scrapedForPalette.colorCount : paletteColors.length,
        summary: appendPaletteToSummary(result.summary, paletteColors),
      };
    } catch {
      // Keep DuckDuckGo summary even if scraper enrichment fails.
    }

    console.info('[DomainSummary] Using DuckDuckGo summary', {
      domain: normalizedDomain,
      source: result.source,
      summaryLength: result.summary.length,
      summaryPreview: result.summary.slice(0, 180),
    });

    return result;
  } catch {
    try {
      const scraped = await scrapeWebsiteAndCreateSummary({
        url: baseResult.url,
        signal,
      });
      const scrapedSummary = compactText(scraped?.summary || '');

      if (scrapedSummary) {
        const scrapedColors = Array.isArray(scraped?.colors) ? scraped.colors : [];
        const scrapedResult = {
          ...baseResult,
          source: `scraper-${scraped.source || 'unknown'}`,
          summary: appendPaletteToSummary(scrapedSummary, scrapedColors),
          colors: scrapedColors,
          colorCount: Number.isFinite(scraped?.colorCount) ? scraped.colorCount : scrapedColors.length,
        };

        console.info('[DomainSummary] Using scraper summary (DuckDuckGo failed)', {
          domain: normalizedDomain,
          source: scrapedResult.source,
          summaryLength: scrapedResult.summary.length,
          summaryPreview: scrapedResult.summary.slice(0, 180),
        });

        return scrapedResult;
      }
    } catch {
      // Fall through to base fallback.
    }

    console.info('[DomainSummary] Using fallback summary (DuckDuckGo and scraper failed)', {
      domain: normalizedDomain,
      source: baseResult.source,
      summaryLength: baseResult.summary.length,
      summaryPreview: baseResult.summary.slice(0, 180),
    });
    return baseResult;
  }
}

// Backward-compatible alias for typo-based calls.
export const getDomainSummery = getDomainSummary;
