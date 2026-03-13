import { getDomRefs } from './dom';
import { createGameEngine } from './engine';

export function initMuseumGame(root = document) {
  const refs = getDomRefs(root);
  if (!refs) {
    return () => {};
  }

  const engine = createGameEngine(refs);
  engine.start();

  return () => {
    engine.stop();
  };
}
