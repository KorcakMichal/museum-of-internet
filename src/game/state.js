import { worldBounds } from './config';

export function createGameState() {
  const houses = [];
  const player = {
    x: 1280, // Start in center of new map
    y: 720,
    width: 34,
    height: 46,
    speed: 3,
  };

  const roomPlayer = {
    x: 24,
    y: 60,
    width: 160,
    height: 160,
    speed: 2.8,
  };

  return {
    houses,
    player,
    roomPlayer,
    keys: new Set(),
    roomKeys: new Set(),
    obstacles: [
      // Top boundary
      { x: 0, y: 0, width: worldBounds.width, height: 70 },
      // Bottom boundary
      { x: 0, y: worldBounds.height - 60, width: worldBounds.width, height: 60 },
      ...houses.map((house) => house.collision),
    ],
    nearbyRoomObject: null,
    nearbyHouse: null,
    selectedHouse: null,
    activeWebRoomHouse: null,
    lastTimestamp: 0,
    isMapOpen: false,
    generatedHouseCount: 0,
    rafId: null,
  };
}
