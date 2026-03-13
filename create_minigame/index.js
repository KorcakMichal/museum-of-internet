require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const OpenAI = require('openai');
const dns = require('dns').promises;
const net = require('net');
const fs = require('fs').promises;

const path = require('path');

// ─── Prompt loader ─────────────────────────────────────────────────────────
// Reads a .txt file from prompts/ and replaces {{variable}} placeholders.
async function loadPrompt(filename, vars) {
  const filePath = path.join(__dirname, 'prompts', filename);
  let template = await fs.readFile(filePath, 'utf8');
  for (const [key, value] of Object.entries(vars)) {
    template = template.replaceAll(`{{${key}}}`, value ?? '');
  }
  return template;
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/design', express.static(path.join(__dirname, '..', 'design')));

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
    'X-Title': 'museum-of-internet',
  },
});

// SSRF protection: block private/loopback IP ranges
function isPrivateIP(ip) {
  const privateRanges = [
    /^127\./,                          // loopback
    /^10\./,                           // private Class A
    /^172\.(1[6-9]|2\d|3[01])\./,      // private Class B
    /^192\.168\./,                     // private Class C
    /^::1$/,                           // IPv6 loopback
    /^fc00:/i,                         // IPv6 unique local
    /^fe80:/i,                         // IPv6 link-local
    /^169\.254\./,                     // link-local
    /^0\./,                            // "this" network
  ];
  return privateRanges.some(r => r.test(ip));
}

async function validateUrlSafety(url) {
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only http/https URLs are allowed');
  }

  // Resolve hostname to IP and block private ranges (SSRF protection)
  const hostname = parsed.hostname;
  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) throw new Error('Requests to private IP addresses are not allowed');
  } else {
    const { address } = await dns.lookup(hostname);
    if (isPrivateIP(address)) throw new Error('Requests to private IP addresses are not allowed');
  }
}

async function scrapeWebsite(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    maxRedirects: 5,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MinigameBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    maxContentLength: 2 * 1024 * 1024, // 2MB limit
  });

  const $ = cheerio.load(response.data);

  const title =
    $('title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    url;

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';

  const themeColor = $('meta[name="theme-color"]').attr('content') || '';

  // Remove noise before extracting text
  $('script, style, nav, footer, header, noscript, svg').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 2000);

  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().trim();
    if (text) headings.push(text);
  });

  // Collect colors found in inline styles and meta tags
  const colorSet = new Set();
  if (themeColor) colorSet.add(themeColor);
  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const matches = style.match(/#[0-9a-fA-F]{3,6}|rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/g) || [];
    matches.forEach(c => colorSet.add(c));
  });

  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const siteName = $('meta[property="og:site_name"]').attr('content') || '';

  return {
    url,
    title,
    description,
    themeColor,
    bodyText,
    headings: headings.slice(0, 10),
    colors: Array.from(colorSet).slice(0, 10),
    ogImage,
    siteName,
  };
}

async function readDesignReferenceImages(designReferences = []) {
  const designRoot = path.join(__dirname, '..', 'design', 'exmaples');
  const allowedExt = new Set(['.png', '.jpg', '.jpeg', '.jfif', '.webp']);
  const imageInputs = [];

  for (const ref of designReferences.slice(0, 3)) {
    const normalized = String(ref).replace('\\', '/');
    const encodedName = normalized.startsWith('/design/exmaples/')
      ? normalized.slice('/design/exmaples/'.length)
      : normalized;

    let fileName;
    try {
      fileName = decodeURIComponent(encodedName);
    } catch {
      continue;
    }

    // Prevent directory traversal and keep only known image types
    const safeName = path.basename(fileName);
    const ext = path.extname(safeName).toLowerCase();
    if (!allowedExt.has(ext)) continue;

    const fullPath = path.join(designRoot, safeName);
    if (!fullPath.startsWith(designRoot)) continue;

    try {
      const data = await fs.readFile(fullPath);
      if (data.length > 2 * 1024 * 1024) continue;

      const mime = ext === '.jpg' ? 'image/jpeg' : `image/${ext.slice(1)}`;
      const base64 = data.toString('base64');
      imageInputs.push({
        type: 'image_url',
        image_url: { url: `data:${mime};base64,${base64}` },
      });
    } catch {
      // Ignore missing/unreadable references and continue with valid ones.
    }
  }

  return imageInputs;
}

function isLikelyRenderableHtml(html) {
  if (!html || typeof html !== 'string') return false;
  const trimmed = html.trimStart();
  // Must actually begin with an HTML structure, not explanation prose
  if (!/^(<!doctype\s+html|<html|<head|<!--)/i.test(trimmed)) return false;
  const lowered = trimmed.toLowerCase();
  return lowered.includes('<canvas') && lowered.includes('<script');
}

function extractRenderableHtml(text) {
  if (!text || typeof text !== 'string') return '';

  // 1) Prefer fenced HTML if present anywhere in the response.
  const fenceMatch = text.match(/```(?:html)?\n?([\s\S]+?)\n?```/i);
  if (fenceMatch) return fenceMatch[1].trim();

  // 2) Extract from first HTML/doctype tag to closing </html> if embedded in prose.
  const lower = text.toLowerCase();
  const doctypeIdx = lower.indexOf('<!doctype html');
  const htmlIdx = lower.indexOf('<html');
  const startIdx = doctypeIdx >= 0 ? doctypeIdx : htmlIdx;
  if (startIdx >= 0) {
    const endIdx = lower.lastIndexOf('</html>');
    if (endIdx > startIdx) {
      return text.slice(startIdx, endIdx + '</html>'.length).trim();
    }
    return text.slice(startIdx).trim();
  }

  return text.trim();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildFallbackRoomHtml(siteData) {
  const title = escapeHtml(siteData.siteName || siteData.title || 'Website');
  const facts = [
    siteData.title,
    siteData.description,
    ...(siteData.headings || []),
  ].filter(Boolean).map(v => String(v).slice(0, 80));

  const notes = (facts.length > 0 ? facts : ['Explore this room inspired by the website.'])
    .slice(0, 6)
    .map(escapeHtml);

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - Pixel Room</title>
  <style>
    html,body{margin:0;height:100%;background:#0b0f1e;display:grid;place-items:center;font-family:monospace}
    canvas{width:960px;height:640px;image-rendering:pixelated;image-rendering:crisp-edges;background:#12182c;outline:4px solid #2b3563}
    @media (max-width: 1000px){canvas{width:96vw;height:64vw;max-height:90vh}}
  </style>
</head>
<body>
  <canvas id="game" width="480" height="320"></canvas>
  <script>
    const canvas = document.getElementById('game');
    const ctx = canvas.getContext('2d');
    const tile = 16;
    const keys = new Set();
    let popup = '';
    let popupUntil = 0;
    const player = { x: 240, y: 160, w: 12, h: 12, speed: 90 };
    const walls = [
      { x: 0, y: 0, w: 480, h: 16 },
      { x: 0, y: 304, w: 480, h: 16 },
      { x: 0, y: 0, w: 16, h: 320 },
      { x: 464, y: 0, w: 16, h: 320 },
    ];
    const objects = [
      { x: 64, y: 56, w: 48, h: 32, name: 'Terminal Desk', note: ${JSON.stringify(notes[0] || 'Site home and key sections live here.')} },
      { x: 176, y: 72, w: 64, h: 24, name: 'Wall Poster', note: ${JSON.stringify(notes[1] || 'Main description and tone of the website.')} },
      { x: 320, y: 56, w: 56, h: 28, name: 'Info Board', note: ${JSON.stringify(notes[2] || 'Highlighted topics from the page.')} },
      { x: 84, y: 210, w: 58, h: 34, name: 'Bookshelf', note: ${JSON.stringify(notes[3] || 'Collected knowledge from the website.')} },
      { x: 278, y: 214, w: 74, h: 30, name: 'Display Case', note: ${JSON.stringify(notes[4] || 'Featured headline and details.')} },
      { x: 202, y: 146, w: 66, h: 38, name: 'Center Exhibit', note: ${JSON.stringify(notes[5] || 'Core identity of the site.')} },
    ];

    const intersects = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
    const dist2 = (ax,ay,bx,by) => (ax-bx)*(ax-bx)+(ay-by)*(ay-by);

    function nearestObject() {
      let best = null;
      let bestD = 999999;
      for (const o of objects) {
        const d = dist2(player.x + player.w/2, player.y + player.h/2, o.x + o.w/2, o.y + o.h/2);
        if (d < bestD) { bestD = d; best = o; }
      }
      return bestD < 72*72 ? best : null;
    }

    function drawRoom() {
      for (let y=0; y<320; y+=tile) {
        for (let x=0; x<480; x+=tile) {
          const alt = ((x+y)/tile)%2===0;
          ctx.fillStyle = alt ? '#1a2342' : '#202b52';
          ctx.fillRect(x, y, tile, tile);
        }
      }
      ctx.fillStyle = '#111a35';
      for (const w of walls) ctx.fillRect(w.x, w.y, w.w, w.h);

      for (const o of objects) {
        ctx.fillStyle = '#4f5f9e';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = '#2a3569';
        ctx.fillRect(o.x+2, o.y+2, o.w-4, o.h-4);
      }

      const n = nearestObject();
      if (n) {
        ctx.strokeStyle = '#ff7ab8';
        ctx.lineWidth = 2;
        ctx.strokeRect(n.x-2, n.y-2, n.w+4, n.h+4);
      }
    }

    function drawPlayer() {
      ctx.fillStyle = '#f5c28b';
      ctx.fillRect(player.x+2, player.y, 8, 8);
      ctx.fillStyle = '#7ed4ff';
      ctx.fillRect(player.x+1, player.y+8, 10, 4);
      ctx.fillStyle = '#111';
      ctx.fillRect(player.x+4, player.y+3, 1, 1);
      ctx.fillRect(player.x+7, player.y+3, 1, 1);
    }

    function drawHud() {
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, 480, 18);
      ctx.fillStyle = '#d9ddff';
      ctx.font = '8px monospace';
      ctx.fillText('${title}  |  WASD/Arrows move  |  SPACE interact', 6, 12);
    }

    function drawPopup() {
      const now = performance.now();
      if (!popup || now > popupUntil) return;
      ctx.fillStyle = 'rgba(7, 9, 18, 0.9)';
      ctx.fillRect(16, 250, 448, 56);
      ctx.strokeStyle = '#5f77ce';
      ctx.strokeRect(16, 250, 448, 56);
      ctx.fillStyle = '#eaf0ff';
      ctx.font = '10px monospace';
      ctx.fillText(popup.slice(0, 88), 24, 282);
    }

    window.addEventListener('keydown', (e) => {
      keys.add(e.key.toLowerCase());
      if (e.key === ' ') {
        const n = nearestObject();
        if (n) {
          popup = n.name + ': ' + n.note;
          popupUntil = performance.now() + 5000;
        }
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));

    let last = performance.now();
    function loop(now) {
      const dt = Math.min(0.033, (now-last)/1000);
      last = now;

      const prev = { x: player.x, y: player.y };
      const left = keys.has('arrowleft') || keys.has('a');
      const right = keys.has('arrowright') || keys.has('d');
      const up = keys.has('arrowup') || keys.has('w');
      const down = keys.has('arrowdown') || keys.has('s');
      player.x += (right-left) * player.speed * dt;
      player.y += (down-up) * player.speed * dt;

      const pBox = { x: player.x, y: player.y, w: player.w, h: player.h };
      const blocks = walls.concat(objects);
      for (const b of blocks) {
        if (intersects(pBox, b)) {
          player.x = prev.x;
          player.y = prev.y;
          break;
        }
      }

      drawRoom();
      drawPlayer();
      drawHud();
      drawPopup();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  </script>
</body>
</html>`;
}

async function createRoomCreativeConcept(siteData, designReferences = [], styleBrief = '') {
  const colorHint =
    siteData.colors.length > 0
      ? siteData.colors.join(', ')
      : siteData.themeColor || 'derive a fitting palette from the site theme';

  const designHint = designReferences.length > 0
    ? `Design references selected by user: ${designReferences.join(', ')}`
    : 'No explicit design references provided. Keep a clean, cozy pixel interior style.';

  const styleHint = styleBrief && styleBrief.trim().length > 0
    ? `User style direction: ${styleBrief.trim().slice(0, 800)}`
    : 'User style direction: none provided.';

  const creativePrompt = await loadPrompt('concept.txt', {
    url:         siteData.url,
    siteName:    siteData.siteName || siteData.title,
    title:       siteData.title,
    description: siteData.description,
    bodyText:    siteData.bodyText.slice(0, 600),
    headings:    siteData.headings.slice(0, 6).join(' | '),
    colorHint,
    designHint,
    styleHint,
  });

  const imageInputs = await readDesignReferenceImages(designReferences);
  const creativeUserContent = [{ type: 'text', text: creativePrompt }, ...imageInputs];

  const creativeCompletion = await openai.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: creativeUserContent }],
    max_tokens: 900,
    temperature: 0.7,
  });

  return creativeCompletion.choices[0]?.message?.content?.trim() || '';
}

async function generateMinigameFromConcept(siteData, creativeConcept, designReferences = [], styleBrief = '') {
  const colorHint =
    siteData.colors.length > 0
      ? siteData.colors.join(', ')
      : siteData.themeColor || 'derive a fitting palette from the site theme';

  const designHint = designReferences.length > 0
    ? `Design references selected by user: ${designReferences.join(', ')}`
    : 'No explicit design references provided. Keep a clean, cozy pixel interior style.';

  const styleHint = styleBrief && styleBrief.trim().length > 0
    ? `User style direction: ${styleBrief.trim().slice(0, 800)}`
    : 'User style direction: none provided.';

    const prompt = await loadPrompt('generate.txt', {
     url:            siteData.url,
     siteName:       siteData.siteName || siteData.title,
     title:          siteData.title,
     description:    siteData.description,
     bodyText:       siteData.bodyText.slice(0, 600),
     headings:       siteData.headings.slice(0, 6).join(' | '),
     colorHint,
     designHint,
     styleHint,
     creativeConcept,
    });

  const imageInputs = await readDesignReferenceImages(designReferences);
  const userContent = [{ type: 'text', text: prompt }, ...imageInputs];

  const completion = await openai.chat.completions.create({
    model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    messages: [{ role: 'user', content: userContent }],
    max_tokens: 4096,
    temperature: 0.8,
  });

  const firstRaw = completion.choices[0]?.message?.content || '';
  let html = extractRenderableHtml(firstRaw);

  if (!isLikelyRenderableHtml(html)) {
    // Retry once with a strict repair instruction to reduce fallback frequency.
    const repairCompletion = await openai.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'user', content: userContent },
        { role: 'assistant', content: firstRaw },
        {
          role: 'user',
          content:
            'Your previous response was invalid for rendering. Return ONLY a full raw HTML document now. '
            + 'Start with <!DOCTYPE html>, include one <canvas> and one <script>, and end with </html>. '
            + 'No prose, no markdown, no backticks, no explanation.',
        },
      ],
      max_tokens: 4096,
      temperature: 0.4,
    });

    const secondRaw = repairCompletion.choices[0]?.message?.content || '';
    html = extractRenderableHtml(secondRaw);
  }

  if (!isLikelyRenderableHtml(html)) {
    console.warn('[generate] Model output not renderable, using fallback room');
    return buildFallbackRoomHtml(siteData);
  }

  return html;
}

// ─── Endpoint ──────────────────────────────────────────────────────────────

app.post('/create-minigame', async (req, res) => {
  const { url, designReferences, styleBrief } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '`url` (string) is required in the request body' });
  }

  // Basic URL validation
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: 'Only http/https URLs are supported' });
  }

  // SSRF check
  try {
    await validateUrlSafety(url);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  // Scrape
  let siteData;
  try {
    siteData = await scrapeWebsite(url);
  } catch (err) {
    const status = err.response?.status;
    return res.status(502).json({
      error: status
        ? `Failed to fetch website (HTTP ${status})`
        : `Failed to fetch website: ${err.message}`,
    });
  }

  // Generate (2-step: concept, then final HTML)
  let html;
  let creativeConcept;
  try {
    const sanitizedRefs = Array.isArray(designReferences)
      ? designReferences.filter(v => typeof v === 'string').slice(0, 3)
      : [];

    const sanitizedStyleBrief =
      typeof styleBrief === 'string' ? styleBrief.trim().slice(0, 800) : '';

    creativeConcept = await createRoomCreativeConcept(siteData, sanitizedRefs, sanitizedStyleBrief);
    html = await generateMinigameFromConcept(
      siteData,
      creativeConcept,
      sanitizedRefs,
      sanitizedStyleBrief,
    );
  } catch (err) {
    return res.status(500).json({ error: `AI generation failed: ${err.message}` });
  }

  res.json({
    success: true,
    url,
    title: siteData.title,
    designReferences: Array.isArray(designReferences) ? designReferences.slice(0, 3) : [],
    styleBrief: typeof styleBrief === 'string' ? styleBrief.slice(0, 800) : '',
    creativeConcept,
    html,
  });
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const START_PORT = Number(process.env.PORT || 3000);

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`Minigame generator listening on http://localhost:${port}`);
    console.log(`POST /create-minigame  { "url": "https://example.com" }`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is busy, trying ${port + 1}...`);
      startServer(port + 1);
      return;
    }
    throw err;
  });
}

startServer(START_PORT);
