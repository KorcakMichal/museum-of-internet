import { baseHouse, worldBounds } from './config';

export function createGameState() {
  const houses = [{ ...baseHouse }];
  const player = {
    x: 120,
    y: 460,
    width: 34,
    height: 46,
    speed: 3,
  };

  const roomPlayer = {
    x: 24,
    y: 150,
    width: 34,
    height: 46,
    speed: 2.8,
  };

  return {
    houses,
    player,
    roomPlayer,
    keys: new Set(),
    roomKeys: new Set(),
    obstacles: [
      { x: 0, y: 0, width: worldBounds.width, height: 70 },
      { x: 0, y: 660, width: worldBounds.width, height: 60 },
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
