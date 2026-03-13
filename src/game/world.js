/**
 * game/world.js — World / scene management.
 * Holds all AI-generated content for the current scene.
 */

/**
 * Creates and returns a world instance.
 *
 * @param {{ ai: object }} deps
 * @returns {{ init: Function, update: Function, getState: Function }}
 */
export function createWorld({ ai }) {
  let state = {
    scene: null,
    entities: [],
    loaded: false,
  };

  return {
    async init() {
      const scene = await ai.generateScene({ theme: 'internet museum' });
      state = { ...state, scene, loaded: true };
    },

    update(_delta) {
      // Future: tick world logic, animate entities, etc.
    },

    getState() {
      return { ...state };
    },
  };
}
