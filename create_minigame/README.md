# create-minigame

Express endpoint that turns any public website into an interactive pixel art room using OpenRouter.

## How it works

1. Fetches and parses the target website (title, description, headings, brand colors, body text).
2. Sends the extracted context to an OpenRouter model (default: anthropic/claude-3.5-sonnet) with instructions to generate a complete self-contained pixel art room.
3. Returns the ready-to-play HTML as a string.

## Setup

```bash
cd create_minigame
npm install
cp .env.example .env
# edit .env and add your OPENROUTER_API_KEY
```

## Run

```bash
npm start          # production
npm run dev        # development (auto-restart with nodemon)
```

## API

### `POST /create-minigame`

**Request body (JSON):**
```json
{ "url": "https://example.com" }
```

**Response (JSON):**
```json
{
  "success": true,
  "url": "https://example.com",
  "title": "Example Domain",
  "html": "<!DOCTYPE html>..."
}
```

The `html` field is a complete single-file HTML5 game. Save it as `.html` and open in a browser, or serve it directly.

### `GET /health`

Returns `{ "status": "ok" }`.

## Example — curl

```bash
curl -X POST http://localhost:3000/create-minigame \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com"}'
```

## Notes

- The game genre (platformer / shooter / runner / puzzle / collector) is chosen automatically to fit the site content.
- Brand colors extracted from the page are applied to the pixel art palette.
- SSRF protection is built in — private / loopback IP addresses are blocked.
