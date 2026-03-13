export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function getSiteHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return '';
  }
}

export function normalizeWebsiteInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname || !url.hostname.includes('.')) {
      return null;
    }

    return {
      url: url.toString(),
      host: url.hostname.replace(/^www\./, '').toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function getWebsiteDisplayName(host) {
  const normalizedHost = (host || '').trim().toLowerCase().replace(/^www\./, '');
  if (!normalizedHost) {
    return 'Website';
  }

  return normalizedHost;
}

export function looksLikeUrl(query) {
  return query.includes('.') || query.startsWith('http://') || query.startsWith('https://');
}

export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export function extractDuckDuckGoResults(data, limit = 6) {
  const collected = [];

  function collectFromTopics(topics) {
    if (!Array.isArray(topics)) {
      return;
    }

    topics.forEach((topic) => {
      if (collected.length >= limit) {
        return;
      }

      if (topic && Array.isArray(topic.Topics)) {
        collectFromTopics(topic.Topics);
        return;
      }

      if (topic && topic.FirstURL) {
        collected.push(topic);
      }
    });
  }

  if (data?.AbstractURL) {
    collected.push({
      Text: data.AbstractText || data.Heading || 'DuckDuckGo instant answer',
      FirstURL: data.AbstractURL,
    });
  }

  collectFromTopics(data?.RelatedTopics);
  return collected.slice(0, limit);
}

export function buildWebsiteCandidates(query, apiResults, limit = 10) {
  const preferredHosts = {
    github: 'github.com',
    google: 'google.com',
    wikipedia: 'wikipedia.org',
    youtube: 'youtube.com',
    reddit: 'reddit.com',
    stackoverflow: 'stackoverflow.com',
    archive: 'archive.org',
    duckduckgo: 'duckduckgo.com',
  };

  const candidateMap = new Map();
  const rawInput = query.trim().toLowerCase();
  const compactInput = rawInput.replace(/\s+/g, '');
  const slug = compactInput.replace(/[^a-z0-9.-]/g, '');

  function addCandidate(rawUrl, description, priority) {
    const normalized = normalizeWebsiteInput(rawUrl);
    if (!normalized) {
      return;
    }

    const existing = candidateMap.get(normalized.host);
    if (!existing || priority < existing.priority) {
      candidateMap.set(normalized.host, {
        host: normalized.host,
        url: normalized.url,
        description: description || `Suggested website: ${normalized.url}`,
        priority,
      });
      return;
    }

    if (!existing.description && description) {
      existing.description = description;
    }
  }

  if (preferredHosts[compactInput]) {
    addCandidate(preferredHosts[compactInput], 'Likely official website match for your query.', 0);
  }

  if (slug && !slug.includes('/')) {
    addCandidate(`${slug}.com`, `Common domain guess for "${query}".`, 1);
    addCandidate(`${slug}.org`, `Possible organization domain for "${query}".`, 2);
    addCandidate(`${slug}.net`, `Possible network domain for "${query}".`, 2);
  }

  apiResults.forEach((result) => {
    if (result?.FirstURL) {
      addCandidate(result.FirstURL, result.Text || 'Result from free search API.', 3);
    }
  });

  return Array.from(candidateMap.values())
    .sort((a, b) => a.priority - b.priority || a.host.localeCompare(b.host))
    .slice(0, limit)
    .map(({ host, url, description }) => ({ host, url, description }));
}
