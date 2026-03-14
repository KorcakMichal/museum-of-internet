import { getDomainSummary } from './domain-summary';

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

function normalizeHost(input) {
  const raw = (input || '').trim();
  if (!raw) {
    throw new Error('Idea generation requires a host.');
  }

  const withProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    throw new Error('Invalid host provided for idea generation.');
  }
}

function buildPaletteSection(colors) {
  if (!Array.isArray(colors) || colors.length === 0) {
    return '';
  }

  const palette = colors
    .slice(0, 8)
    .map((entry) => (typeof entry?.value === 'string' ? entry.value : ''))
    .filter(Boolean);

  if (palette.length === 0) {
    return '';
  }

  return `\nExtracted website colors (prefer these for walls, props, lighting accents):\n${palette.join(', ')}\n`;
}

function buildRoomPrompt(host, summary, colors) {
  const paletteSection = buildPaletteSection(colors);
  return `You are designing a room that visually represents a website.

Website: ${host}

Browser summary of the page:
${summary}
${paletteSection}

Your task is to imagine how this website would look if it were a physical room inside a house.

Focus only on the visual appearance of the room.

Describe the room in a way that can later be turned into a 2D platformer game level.

Include clear physical objects such as:
- desks
- computers
- screens
- shelves
- posters
- machines
- stacks of items
- cables
- tools
- decorations

Also describe:
- the type of room (hacker room, editorial office, workspace, studio, etc.)
- objects related to the website topic
- atmosphere and lighting
- objects that could act as platforms in a side-view game

Important rules:
- Do NOT explain what the website is.
- Do NOT summarize the website again.
- Only describe how the room looks.
- dont say color if you dont know
- focus on something which describes company, organisation, logo, equipment etc. it should be there
- if it is not it company dont put there many tables and servers style it more in look how could company's room really look like

Write one detailed paragraph describing the room.

Output only the room design description.`;
}

function extractMessageContent(payload) {
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

async function requestOpenRouterRoomDesign({ prompt, model, openRouterKey, signal }) {
  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    }),
    signal,
  });

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const details = data?.error?.message || data?.error || text || `HTTP ${response.status}`;
    throw new Error(`OpenRouter request failed: ${details}`);
  }

  const description = extractMessageContent(data);
  if (!description) {
    throw new Error('OpenRouter returned an empty room design description.');
  }

  return description;
}

/**
 * Generates one room design paragraph using host + summary and the required prompt.
 */
export async function generateIdeas({ host, signal, model = DEFAULT_MODEL, openRouterKey = import.meta.env.OPENROUTER_KEY } = {}) {
  if (signal?.aborted) {
    throw new Error('Idea generation aborted.');
  }

  if (!openRouterKey) {
    throw new Error('Missing OpenRouter key. Set OPENROUTER_KEY in .env or pass openRouterKey explicitly.');
  }

  const normalizedHost = normalizeHost(host);
  const summaryResult = await getDomainSummary({ domain: normalizedHost, signal });
  const summary = summaryResult?.summary || '';
  const colors = Array.isArray(summaryResult?.colors) ? summaryResult.colors : [];
  const prompt = buildRoomPrompt(normalizedHost, summary, colors);

  const description = await requestOpenRouterRoomDesign({
    prompt,
    model,
    openRouterKey,
    signal,
  });

  return {
    host: normalizedHost,
    summary,
    colors,
    prompt,
    description,
    source: 'openrouter',
    model,
  };
}

// Backward-compatible alias for typo-based calls.
export const generateIdea = generateIdeas;
