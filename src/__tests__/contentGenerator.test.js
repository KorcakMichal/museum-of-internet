import { describe, it, expect, vi } from 'vitest';
import { createAIContentGenerator } from '../ai/contentGenerator.js';

// Silence the stub warning in test output
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('createAIContentGenerator', () => {
  const ai = createAIContentGenerator();

  it('generateScene returns an object with a description', async () => {
    const scene = await ai.generateScene({ theme: 'internet museum' });
    expect(scene).toBeTypeOf('object');
    expect(scene).toHaveProperty('description');
    expect(typeof scene.description).toBe('string');
  });

  it('generateNarrative returns a string', async () => {
    const narrative = await ai.generateNarrative({ context: 'a dusty server room' });
    expect(typeof narrative).toBe('string');
    expect(narrative.length).toBeGreaterThan(0);
  });

  it('generateItem returns an object with name and description', async () => {
    const item = await ai.generateItem({ type: 'relic' });
    expect(item).toHaveProperty('name');
    expect(item).toHaveProperty('description');
  });
});
