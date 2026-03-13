import { describe, it, expect } from 'vitest';
import { createPlayer } from '../game/player.js';
import { createWorld } from '../game/world.js';

describe('createPlayer', () => {
  it('initialises with default state', () => {
    const player = createPlayer();
    const state = player.getState();
    expect(state).toMatchObject({ x: 0, y: 0, name: 'Visitor' });
  });

  it('update does not throw', () => {
    const player = createPlayer();
    expect(() => player.update(16)).not.toThrow();
  });

  it('getState returns a copy, not a reference', () => {
    const player = createPlayer();
    const s1 = player.getState();
    s1.x = 999;
    expect(player.getState().x).toBe(0);
  });
});

describe('createWorld', () => {
  it('starts in an unloaded state', () => {
    const ai = { generateScene: async () => ({ description: 'test' }) };
    const world = createWorld({ ai });
    expect(world.getState().loaded).toBe(false);
  });

  it('is loaded after init()', async () => {
    const scene = { description: 'A hall of ancient memes.' };
    const ai = { generateScene: async () => scene };
    const world = createWorld({ ai });
    await world.init();
    const state = world.getState();
    expect(state.loaded).toBe(true);
    expect(state.scene).toEqual(scene);
  });

  it('update does not throw', () => {
    const ai = { generateScene: async () => ({ description: 'test' }) };
    const world = createWorld({ ai });
    expect(() => world.update(16)).not.toThrow();
  });
});
