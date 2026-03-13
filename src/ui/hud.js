/**
 * ui/hud.js — Heads-up display and scene rendering.
 */

const STYLES = `
  #hud {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    pointer-events: none;
  }
  #scene-description {
    padding: 2rem;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 60ch;
    background: rgba(0,0,0,0.6);
    border-right: 1px solid #333;
    border-bottom: 1px solid #333;
    border-bottom-right-radius: 8px;
  }
  #player-info {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    background: rgba(0,0,0,0.5);
    border-top: 1px solid #333;
  }
  .loading {
    color: #888;
    font-style: italic;
  }
`;

/**
 * Creates and returns a HUD instance.
 *
 * @param {HTMLElement} root
 * @returns {{ init: Function, render: Function }}
 */
export function createUI(root) {
  let hudEl = null;
  let sceneEl = null;
  let playerEl = null;

  return {
    init() {
      // Inject styles
      const style = document.createElement('style');
      style.textContent = STYLES;
      document.head.appendChild(style);

      // Build DOM
      hudEl = document.createElement('div');
      hudEl.id = 'hud';

      sceneEl = document.createElement('div');
      sceneEl.id = 'scene-description';
      sceneEl.textContent = 'Loading world…';
      sceneEl.className = 'loading';

      playerEl = document.createElement('div');
      playerEl.id = 'player-info';

      hudEl.appendChild(sceneEl);
      hudEl.appendChild(playerEl);
      root.appendChild(hudEl);
    },

    render({ world, player }) {
      if (!hudEl) return;

      if (world.loaded && world.scene) {
        sceneEl.className = '';
        sceneEl.textContent = world.scene.description ?? 'An unknown place.';
      }

      playerEl.textContent = `${player.name}  |  Position: (${player.x}, ${player.y})`;
    },
  };
}
