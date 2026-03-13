# Museum of Internet

Small prototype where websites exist as houses in a walkable town..

## Current prototype

- Walk with `WASD` or arrow keys.
- Move close to a house.
- Press `E` to enter an in-page web room for that website-house.
- Use the panel button to open the real site.
- The real sites open in a new tab because websites like Google and Wikipedia block being embedded inside iframes.

## In-page interaction model

- Browser House is the core navigator room.
- Searching URLs can create custom website houses in town.

## Houses included

- Browser
- Generated custom website houses

## Run

Use the React development server:

```bash
npm install
npm run dev
```

Build and preview production output:

```bash
npm run build
npm run preview
```

## Project Structure

- `src/App.jsx`: React UI shell for game DOM.
- `src/main.jsx`: React app bootstrap.
- `src/game/index.js`: game init entrypoint used by React lifecycle.
- `src/game/dom.js`: DOM reference collection and validation.
- `src/game/state.js`: mutable game state factory.
- `src/game/config.js`: constants and base house configuration.
- `src/game/utils.js`: utility functions (math, URL parsing, API helpers).
- `src/game/engine.js`: core game loop, movement, map, room, and search behavior.
- `game.js`: compatibility shim that forwards to modular implementation.

## Next good additions

- Add more website houses and districts.
- Add interior scenes for each website.
- Replace CSS characters with sprite art from `design/exmaples/`.
- Add dialog, quests, and collectible internet artifacts.