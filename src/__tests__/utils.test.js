import { describe, it, expect, vi } from 'vitest';
import { createEventEmitter, clamp, sleep } from '../utils/index.js';

describe('createEventEmitter', () => {
  it('calls a registered listener when the event is emitted', () => {
    const emitter = createEventEmitter();
    const fn = vi.fn();
    emitter.on('test', fn);
    emitter.emit('test', 42);
    expect(fn).toHaveBeenCalledWith(42);
  });

  it('does not call a listener after it is removed', () => {
    const emitter = createEventEmitter();
    const fn = vi.fn();
    emitter.on('tick', fn);
    emitter.off('tick', fn);
    emitter.emit('tick');
    expect(fn).not.toHaveBeenCalled();
  });

  it('silently ignores emit for events with no listeners', () => {
    const emitter = createEventEmitter();
    expect(() => emitter.emit('noop')).not.toThrow();
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('sleep', () => {
  it('resolves after the specified delay', async () => {
    const start = Date.now();
    await sleep(20);
    expect(Date.now() - start).toBeGreaterThanOrEqual(15);
  });
});
