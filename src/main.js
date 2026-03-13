/**
 * main.js — Application entry point.
 * Bootstraps the game and wires up all modules.
 */
import { createGame } from './game/index.js';
import { createAIContentGenerator } from './ai/index.js';
import { createUI } from './ui/index.js';

async function bootstrap() {
  const root = document.getElementById('app');

  // Initialise modules
  const ai = createAIContentGenerator();
  const ui = createUI(root);
  const game = createGame({ ai, ui });

  // Start the game loop
  await game.start();
}

bootstrap().catch((err) => {
  console.error('[Museum of Internet] Failed to start:', err);
});
