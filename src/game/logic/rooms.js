import { clamp, intersects } from '../utils';

export function getRoomAvatarBox(state) {
  return {
    x: state.roomPlayer.x,
    y: state.roomPlayer.y,
    width: state.roomPlayer.width,
    height: state.roomPlayer.height,
  };
}

export function getRoomObjectBox(element) {
  if (!element) {
    return null;
  }

  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

export function moveRoomAvatar(state, refs, delta, updateRoomNearbyObject, updateRoomAvatarRender) {
  let dx = 0;
  let dy = 0;

  if (state.roomKeys.has('arrowup') || state.roomKeys.has('w')) {
    dy -= 1;
  }
  if (state.roomKeys.has('arrowdown') || state.roomKeys.has('s')) {
    dy += 1;
  }
  if (state.roomKeys.has('arrowleft') || state.roomKeys.has('a')) {
    dx -= 1;
  }
  if (state.roomKeys.has('arrowright') || state.roomKeys.has('d')) {
    dx += 1;
  }

  const moving = dx !== 0 || dy !== 0;
  const walkWidth = refs.roomWalkArea.clientWidth;
  const walkHeight = refs.roomWalkArea.clientHeight;
  const magnitude = Math.hypot(dx, dy) || 1;
  const step = state.roomPlayer.speed * (delta / 16.666);

  if (moving) {
    state.roomPlayer.x = clamp(state.roomPlayer.x + (dx / magnitude) * step, 8, Math.max(8, walkWidth - state.roomPlayer.width - 8));
    state.roomPlayer.y = clamp(state.roomPlayer.y + (dy / magnitude) * step, 8, Math.max(8, walkHeight - state.roomPlayer.height - 8));
  }

  updateRoomAvatarRender(moving);
  updateRoomNearbyObject();
}
