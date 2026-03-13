/**
 * game/engine.js — Core game loop and module orchestration.
 */
import { createWorld } from './world.js';
import { createPlayer } from './player.js';

/**
 * Creates and returns the main game instance.
 *
 * @param {{ ai: object, ui: object }} deps - Injected module dependencies.
 * @returns {{ start: Function, stop: Function, getState: Function }}
 */
export function createGame({ ai, ui }) {
  const world = createWorld({ ai });
  const player = createPlayer();

  let running = false;
  let lastTime = 0;

  function loop(timestamp) {
    if (!running) return;

    const delta = timestamp - lastTime;
    lastTime = timestamp;

    world.update(delta);
    player.update(delta);
    ui.render({ world: world.getState(), player: player.getState() });

    requestAnimationFrame(loop);
  }

  return {
    async start() {
      await world.init();
      ui.init();
      running = true;
      lastTime = performance.now();
      requestAnimationFrame(loop);
    },

    stop() {
      running = false;
    },

    getState() {
      return {
        running,
        world: world.getState(),
        player: player.getState(),
      };
    },
  };
}
