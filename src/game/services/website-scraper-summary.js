const JINA_READER_PREFIX = 'https://r.jina.ai/http://';
const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_SUMMARY_MODEL = 'openai/gpt-4o-mini';
const MAX_COLORS = 24;

const COMMON_NAMED_COLORS = new Set([
  'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown',
  'gray', 'grey', 'cyan', 'magenta', 'teal', 'navy', 'lime', 'maroon', 'olive', 'silver',
  'gold', 'beige', 'coral', 'indigo', 'violet', 'turquoise', 'lavender',
]);

function normalizeWebsiteUrl(input) {
  const raw = (input || '').trim();
  if (!raw) {
    throw new Error('A website URL is required.');
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname || !url.hostname.includes('.')) {
      throw new Error('Invalid hostname.');
    }
    return url.toString();
  } catch {
    throw new Error('Invalid website URL.');
  }
}

function compactWhitespace(value) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function removeCommonBoilerplate(text) {
  const lines = (text || '')
    .split('\n')
    .map((line) => compactWhitespace(line))
    .filter(Boolean)
    .filter((line) => line.length > 20)
    .filter((line) => !/^cookie|privacy|terms|accept|sign in|log in|subscribe/i.test(line));

  return lines.join('\n');
}

function estimateReadabilityScore(text) {
  const clean = compactWhitespace(text);
  if (!clean) {
    return 0;
  }

  const words = clean.split(' ').length;
  const uniqueWords = new Set(clean.toLowerCase().split(' ')).size;
  const uniqueRatio = words > 0 ? uniqueWords / words : 0;

  return Number((Math.min(1, words / 500) * 0.6 + uniqueRatio * 0.4).toFixed(3));
}

function buildPaletteText(colors, max = 10) {
  if (!Array.isArray(colors) || colors.length === 0) {
    return '';
  }

  const values = colors
    .slice(0, max)
    .map((entry) => (typeof entry?.value === 'string' ? entry.value : ''))
    .filter(Boolean);

  if (values.length === 0) {
    return '';
  }

  return values.join(', ');
}

function appendPaletteToSummary(summary, colors) {
  const palette = buildPaletteText(colors);
  if (!palette) {
    return summary;
  }

  if ((summary || '').toLowerCase().includes('color palette')) {
    return summary;
  }

  return `${summary}\nColor palette from page: ${palette}.`;
}

function buildLocalSummary(text, colors, maxSentences = 6) {
  const clean = compactWhitespace(text);
  if (!clean) {
    return 'No readable content was extracted from the page.';
  }

  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 35)
    .slice(0, Math.max(1, maxSentences));

  if (sentences.length === 0) {
    return appendPaletteToSummary(clean.slice(0, 700), colors);
  }

  return appendPaletteToSummary(sentences.join(' '), colors);
}

function extractNamedColors(text) {
  const words = compactWhitespace(text).toLowerCase().split(/[^a-z]+/).filter(Boolean);
  const found = [];

  for (const word of words) {
    if (COMMON_NAMED_COLORS.has(word)) {
      found.push(word);
    }
  }

  return found;
}

function extractColors(text) {
  const content = text || '';
  const hexMatches = content.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  const rgbMatches = content.match(/rgba?\([^\)]+\)/gi) || [];
  const hslMatches = content.match(/hsla?\([^\)]+\)/gi) || [];
  const namedMatches = extractNamedColors(content);

  const allMatches = [...hexMatches, ...rgbMatches, ...hslMatches, ...namedMatches]
    .map((value) => compactWhitespace(value))
    .filter(Boolean);

  const frequency = new Map();
  allMatches.forEach((color) => {
    const key = color.toLowerCase();
    frequency.set(key, (frequency.get(key) || 0) + 1);
  });

  const colors = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, MAX_COLORS)
    .map(([value, count]) => ({ value, count }));

  return {
    colors,
    colorCount: colors.length,
  };
}

async function fetchReaderText(url, signal) {
  const readerUrl = `${JINA_READER_PREFIX}${url.replace(/^https?:\/\//, '')}`;
  const response = await fetch(readerUrl, { signal });
  if (!response.ok) {
    throw new Error(`Reader fetch failed: HTTP ${response.status}`);
  }

  return response.text();
}

function buildSummaryPrompt(url, title, content, colors) {
  const palette = buildPaletteText(colors, 12);
  return `Create a detailed but concise webpage summary.

URL: ${url}
Title: ${title || 'Unknown'}

Extracted page colors:
${palette || 'No clear color tokens found.'}

Page content excerpt:
${content.slice(0, 12000)}

Rules:
- Focus on the main purpose, key sections, and notable content details.
- Ignore cookie banners, navigation labels, and legal boilerplate.
- Do not invent details not present in the content.
- Output 1 detailed paragraph.
- Add one final line exactly in this format: Color palette from page: <comma-separated colors>.`;
}

function extractOpenRouterText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return '';
}

async function summarizeWithOpenRouter({ prompt, openRouterKey, model, signal }) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    }),
    signal,
  });

  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const details = payload?.error?.message || payload?.error || raw || `HTTP ${response.status}`;
    throw new Error(`OpenRouter summary failed: ${details}`);
  }

  const summary = extractOpenRouterText(payload);
  if (!summary) {
    throw new Error('OpenRouter returned an empty summary.');
  }

  return summary;
}

/**
 * Scrapes website text content and creates a human-readable summary.
 */
export async function scrapeWebsiteAndCreateSummary({
  url,
  signal,
  openRouterKey = import.meta.env.OPENROUTER_KEY,
  model = DEFAULT_SUMMARY_MODEL,
} = {}) {
  const normalizedUrl = normalizeWebsiteUrl(url);

  const rawText = await fetchReaderText(normalizedUrl, signal);
  const cleaned = removeCommonBoilerplate(rawText);
  const excerpt = cleaned.slice(0, 20000);
  const colorData = extractColors(`${rawText}\n${cleaned}`);
  const titleMatch = rawText.match(/^Title:\s*(.+)$/im);
  const title = compactWhitespace(titleMatch?.[1] || '');

  const resultBase = {
    url: normalizedUrl,
    title,
    scrapedText: excerpt,
    scrapedTextLength: excerpt.length,
    readabilityScore: estimateReadabilityScore(excerpt),
    colors: colorData.colors,
    colorCount: colorData.colorCount,
  };

  if (!excerpt) {
    return {
      ...resultBase,
      source: 'empty',
      summary: 'No readable content was extracted from this website.',
    };
  }

  if (!openRouterKey) {
    return {
      ...resultBase,
      source: 'local-fallback',
      summary: buildLocalSummary(excerpt, colorData.colors),
    };
  }

  try {
    const prompt = buildSummaryPrompt(normalizedUrl, title, excerpt, colorData.colors);
    const summary = await summarizeWithOpenRouter({
      prompt,
      openRouterKey,
      model,
      signal,
    });

    return {
      ...resultBase,
      source: 'openrouter',
      model,
      summary: appendPaletteToSummary(summary, colorData.colors),
    };
  } catch {
    return {
      ...resultBase,
      source: 'local-fallback',
      summary: buildLocalSummary(excerpt, colorData.colors),
    };
  }
}

// Typo-safe alias.
export const scrapeWebsiteAndCreateSummery = scrapeWebsiteAndCreateSummary;
