import { clamp, intersects } from '../utils';
import { worldBounds } from '../config';
import { updateMapPlayerMarker } from '../ui/map';

export function canOccupy(state, x, y) {
  const next = { x, y, width: state.player.width, height: state.player.height };

  if (x < 0 || y < 0 || x + state.player.width > worldBounds.width || y + state.player.height > worldBounds.height) {
    return false;
  }

  return !state.obstacles.some((obstacle) => intersects(next, obstacle));
}

export function updatePlayerRender(state, refs) {
  refs.playerElement.style.left = `${state.player.x}px`;
  refs.playerElement.style.top = `${state.player.y}px`;

  // Center the camera on the player
  const viewWidth = window.innerWidth;
  const viewHeight = window.innerHeight;
  const scrollX = state.player.x + state.player.width / 2 - viewWidth / 2;
  const scrollY = state.player.y + state.player.height / 2 - viewHeight / 2;

  // Apply smooth camera transition via the world wrapper
  refs.world.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
  updateMapPlayerMarker(state, refs);
}

export function movePlayer(state, refs, delta) {
  let dx = 0;
  let dy = 0;

  if (state.keys.has('arrowup') || state.keys.has('w')) {
    dy -= 1;
  }
  if (state.keys.has('arrowdown') || state.keys.has('s')) {
    dy += 1;
  }
  if (state.keys.has('arrowleft') || state.keys.has('a')) {
    dx -= 1;
  }
  if (state.keys.has('arrowright') || state.keys.has('d')) {
    dx += 1;
  }

  const moving = dx !== 0 || dy !== 0;
  refs.playerElement.classList.toggle('walking', moving);

  if (!moving) {
    return;
  }

  const magnitude = Math.hypot(dx, dy) || 1;
  const step = state.player.speed * (delta / 16.666);
  const nextX = clamp(state.player.x + (dx / magnitude) * step, 0, worldBounds.width - state.player.width);
  const nextY = clamp(state.player.y + (dy / magnitude) * step, 0, worldBounds.height - state.player.height);

  if (canOccupy(state, nextX, state.player.y)) {
    state.player.x = nextX;
  }
  if (canOccupy(state, state.player.x, nextY)) {
    state.player.y = nextY;
  }
}
