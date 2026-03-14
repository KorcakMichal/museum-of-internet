import { getDomRefs } from './dom';
import { createGameEngine } from './engine';

export function initMuseumGame(root = document) {
  const refs = getDomRefs(root);
  if (!refs) {
    return {
      cleanup: () => {},
      pressKey: () => {},
      releaseKey: () => {},
      triggerAction: () => {},
      triggerMap: () => {},
    };
  }

  const engine = createGameEngine(refs);
  engine.start();

  return {
    cleanup: () => engine.stop(),
    pressKey: (key) => engine.pressVirtualKey(key),
    releaseKey: (key) => engine.releaseVirtualKey(key),
    triggerAction: () => engine.triggerVirtualEKey(),
    triggerMap: () => engine.triggerVirtualMapKey(),
  };
}
