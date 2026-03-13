/**
 * game/player.js — Player state and movement.
 */

/**
 * Creates and returns a player instance.
 *
 * @returns {{ update: Function, getState: Function }}
 */
export function createPlayer() {
  let state = {
    x: 0,
    y: 0,
    name: 'Visitor',
  };

  return {
    update(_delta) {
      // Future: handle input, move player, etc.
    },

    getState() {
      return { ...state };
    },
  };
}
