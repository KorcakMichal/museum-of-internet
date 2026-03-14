const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';

function buildFallbackReply(context = {}) {
  const nearbyHouseName = typeof context?.nearbyHouse?.name === 'string' ? context.nearbyHouse.name : '';
  if (nearbyHouseName) {
    return `Ugh, fine. Go to ${nearbyHouseName} next, then use M to open the map and stop wandering.`;
  }
  return 'Yes, yes. Walk to a house and press E to enter, and use M if you are lost again.';
}

function normalizeContent(payload) {
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

async function requestNpcReply({ openRouterKey, model, npcName, playerMessage, context, signal }) {
  const nearbyHouseName = context?.nearbyHouse?.name || 'none';
  const nearbyHouseHost = context?.nearbyHouse?.host || 'none';

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 90,
      messages: [
        {
          role: 'system',
          content:
            'You are DNS Grandma in a game called Museum of Internet. Reply in 1-2 short sentences. Your tone is unfriendly, impatient, and slightly sarcastic, but never hateful or profane. You must always provide a direct, practical answer related to this game. You can and should explain controls when useful (WASD/arrow movement, E interact, M map, Escape close). If the player asks abusive, insulting, or non-game-related questions, dismiss them and send them away to game actions by redirecting to what they should do in-game. Avoid markdown.',
        },
        {
          role: 'user',
          content: `Player message: ${playerMessage}\nNearby house name: ${nearbyHouseName}\nNearby house host: ${nearbyHouseHost}`,
        },
      ],
    }),
    signal,
  });

  const rawText = await response.text();
  let data = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const details = data?.error?.message || rawText || `HTTP ${response.status}`;
    throw new Error(`OpenRouter NPC request failed: ${details}`);
  }

  const reply = normalizeContent(data);
  if (!reply) {
    throw new Error('OpenRouter NPC request returned empty content.');
  }

  return reply;
}

/**
 * Gets an NPC answer from OpenRouter with a safe local fallback.
 */
export async function getNpcAnswer({
  npcName = 'DNS Grandma',
  playerMessage = 'How should I explore this town?',
  context = {},
  model = DEFAULT_MODEL,
  openRouterKey = import.meta.env.OPENROUTER_KEY,
  signal,
} = {}) {
  if (signal?.aborted) {
    throw new Error('NPC answer request aborted.');
  }

  if (!openRouterKey) {
    return buildFallbackReply(context);
  }

  try {
    return await requestNpcReply({
      openRouterKey,
      model,
      npcName,
      playerMessage,
      context,
      signal,
    });
  } catch {
    return buildFallbackReply(context);
  }
}
