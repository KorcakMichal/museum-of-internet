# Museum of Internet

Small prototype where websites exist as houses in a walkable town.

## Current prototype

- Walk with `WASD` or arrow keys.
- Move close to a house.
- Press `E` to enter an in-page web room for that website-house.
- Use the panel button to open the real site.
- The real sites open in a new tab because websites like Google and Wikipedia block being embedded inside iframes.

## In-page interaction model

- Wikipedia House fetches live article suggestions and summary previews inside the overlay.
- Google House works like a search lobby: you type a query and choose web, images, news, or maps corridors.
- Internet Archive House can check the Wayback Machine for a URL or build archive.org search routes for a topic.

## Houses included

- Wikipedia
- Google
- Internet Archive

## Run

You can open `index.html` directly in a browser.

If you want a local server instead, use any static server, for example VS Code Live Server.

## Next good additions

- Add more website houses and districts.
- Add interior scenes for each website.
- Replace CSS characters with sprite art from `design/exmaples/`.
- Add dialog, quests, and collectible internet artifacts.