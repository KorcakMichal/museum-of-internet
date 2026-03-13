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

## PixelLab Image Service

The project includes a dedicated PixelLab client service in `src/game/services/pixellab.js`.

Set your token in `.env`:

```dotenv
VITE_PIXELLAB_SECRET_TOKEN=your-token-here
```

Usage:

```js
import { generatePixfluxImage } from './src/game/services/pixellab';

const image = await generatePixfluxImage({
	description: 'cute dragon',
	width: 128,
	height: 128,
	noBackground: true,
});
```

This sends a POST request equivalent to:

`curl https://api.pixellab.ai/v1/generate-image-pixflux --request POST --header 'Content-Type: application/json' --header 'Authorization: Bearer ...' --data '{"description":"cute dragon","image_size":{"height":128,"width":128},"no_background":true}'`

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