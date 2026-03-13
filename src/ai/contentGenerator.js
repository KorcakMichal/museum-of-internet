/**
 * ai/contentGenerator.js — AI content generation module.
 *
 * This module is the single integration point for all AI-powered content.
 * Swap out or extend `callAI` to connect to any LLM provider
 * (e.g., OpenAI, Anthropic, local model, etc.).
 */

/**
 * Sends a prompt to the configured AI provider and returns the raw text response.
 * Replace this stub with a real API call when an LLM provider is chosen.
 *
 * @param {string} prompt
 * @returns {Promise<string>}
 */
async function callAI(prompt) {
  // TODO: replace with real LLM API call, e.g.:
  // const response = await fetch('https://api.openai.com/v1/chat/completions', { ... });
  // return (await response.json()).choices[0].message.content;
  console.warn('[AI] callAI is a stub. Prompt received:', prompt);
  return JSON.stringify({ name: 'Stub', description: `Stub response for: ${prompt}` });
}

/**
 * Creates and returns an AI content generator instance.
 *
 * @returns {{ generateScene: Function, generateNarrative: Function, generateItem: Function }}
 */
export function createAIContentGenerator() {
  return {
    /**
     * Generates a scene description for the given theme.
     *
     * @param {{ theme: string }} options
     * @returns {Promise<{ description: string, [key: string]: unknown }>}
     */
    async generateScene({ theme }) {
      const raw = await callAI(
        `Describe a unique location inside a "${theme}" for a browser game. ` +
          'Return JSON with at least a "description" field.',
      );
      return JSON.parse(raw);
    },

    /**
     * Generates narrative text (dialogue, lore, signs, etc.).
     *
     * @param {{ context: string }} options
     * @returns {Promise<string>}
     */
    async generateNarrative({ context }) {
      const raw = await callAI(
        `Write a short, atmospheric game narrative for the following context: ${context}`,
      );
      return raw;
    },

    /**
     * Generates a collectible or interactable item.
     *
     * @param {{ type: string }} options
     * @returns {Promise<{ name: string, description: string, [key: string]: unknown }>}
     */
    async generateItem({ type }) {
      const raw = await callAI(
        `Create a "${type}" item for a browser game. ` +
          'Return JSON with "name" and "description" fields.',
      );
      return JSON.parse(raw);
    },
  };
}
