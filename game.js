const world = document.getElementById("world");
const playerElement = document.getElementById("player");
const promptElement = document.getElementById("interactionPrompt");
const panelTitle = document.getElementById("panelTitle");
const panelDescription = document.getElementById("panelDescription");
const panelFacts = document.getElementById("panelFacts");
const houseBrowserList = document.getElementById("houseBrowserList");
const enterRoomButton = document.getElementById("enterRoomButton");
const visitLink = document.getElementById("visitLink");
const toggleMapButton = document.getElementById("toggleMapButton");
const webRoom = document.getElementById("webRoom");
const webRoomTitle = document.getElementById("webRoomTitle");
const webRoomMode = document.getElementById("webRoomMode");
const webRoomAddress = document.getElementById("webRoomAddress");
const webRoomDescription = document.getElementById("webRoomDescription");
const webRoomSearchForm = document.getElementById("webRoomSearchForm");
const webRoomSearchInput = document.getElementById("webRoomSearchInput");
const webRoomExternalLink = document.getElementById("webRoomExternalLink");
const webRoomStatus = document.getElementById("webRoomStatus");
const webRoomResults = document.getElementById("webRoomResults");
const closeWebRoomButton = document.getElementById("closeWebRoomButton");
const mapOverlay = document.getElementById("mapOverlay");
const closeMapButton = document.getElementById("closeMapButton");
const mapHouseMarkers = document.getElementById("mapHouseMarkers");
const mapPlayerMarker = document.getElementById("mapPlayerMarker");

const worldBounds = {
  width: 1280,
  height: 720,
};

const player = {
  x: 120,
  y: 460,
  width: 34,
  height: 46,
  speed: 3,
};

const keys = new Set();

const houses = [
  {
    id: "wikipedia",
    name: "Wikipedia House",
    url: "https://www.wikipedia.org/",
    description:
      "A public knowledge house. Imagine shelves, librarians, and an endless set of linked rooms made of articles.",
    facts: [
      "Open encyclopedia energy.",
      "Neutral facade and library mood.",
      "Best fit for discovery and deep reading.",
    ],
    roomMode: "Knowledge Library",
    roomAddress: "museum://wikipedia-house/library",
    roomIntro:
      "Search Wikipedia from inside the house. The room fetches article suggestions and a summary preview without leaving the game.",
    searchPlaceholder: "Search for a person, idea, place, or event",
    townFact: "Wikipedia House: a public knowledge library.",
    chips: ["internet", "museum", "world wide web", "Alan Turing"],
    lot: { x: 110, y: 96, width: 210, height: 180 },
    collision: { x: 146, y: 152, width: 138, height: 118 },
    interactZone: { x: 132, y: 210, width: 166, height: 84 },
  },
  {
    id: "google",
    name: "Google House",
    url: "https://www.google.com/",
    description:
      "A bright search lobby. You step up to the house and it points you toward the rest of the town.",
    facts: [
      "Search-first front door.",
      "Color-striped roof mirrors the brand palette.",
      "Feels like a portal more than a library.",
    ],
    roomMode: "Search Lobby",
    roomAddress: "museum://google-house/search-lobby",
    roomIntro:
      "Google blocks live embedding, so this room acts like a search concierge: type a query and choose which corridor to take.",
    searchPlaceholder: "Type what you want to search for",
    townFact: "Google House: a bright search engine lobby.",
    chips: ["best museums", "history of the web", "pixel art town", "maps of Prague"],
    roomTip:
      "Google does not allow a live website embed here. Instead, the room lets you shape the search and choose a destination like web, images, news, or maps.",
    lot: { x: 960, y: 96, width: 210, height: 180 },
    collision: { x: 996, y: 152, width: 138, height: 118 },
    interactZone: { x: 982, y: 210, width: 166, height: 84 },
  },
  {
    id: "archive",
    name: "Internet Archive House",
    url: "https://archive.org/",
    description:
      "A preservation vault. This one adds the museum feeling: the internet remembered as a physical archive.",
    facts: [
      "Fits the museum theme directly.",
      "Feels older, quieter, and heavier.",
      "Useful as a memory-building in the town.",
    ],
    roomMode: "Memory Vault",
    roomAddress: "museum://internet-archive-house/vault",
    roomIntro:
      "Use a URL to ask the Wayback Machine for the closest saved snapshot, or use a topic to jump into archive.org search.",
    searchPlaceholder: "Paste a URL or type a topic",
    townFact: "Archive House: a memory vault for internet history.",
    chips: ["wikipedia.org", "google.com", "flash games", "old web design"],
    lot: { x: 905, y: 448, width: 210, height: 180 },
    collision: { x: 941, y: 504, width: 138, height: 118 },
    interactZone: { x: 927, y: 562, width: 166, height: 84 },
  },
  {
    id: "browser",
    name: "Browser House",
    url: "https://duckduckgo.com/",
    description:
      "A flexible navigator house for quick web jumps. Use it when you want one generic browser-style room.",
    facts: [
      "Same visual style as Wikipedia House.",
      "Best for general queries and direct URLs.",
      "Acts as a utility browser inside the town.",
    ],
    roomMode: "Navigator Room",
    roomAddress: "museum://browser-house/navigator",
    roomIntro:
      "Type a URL or a search query. This room prepares direct routes to open the web quickly.",
    searchPlaceholder: "Type a URL like example.com or a search query",
    townFact: "Browser House: a general web navigator room.",
    chips: ["open source browsers", "web standards", "example.com", "internet history"],
    roomTip:
      "Paste a direct URL to open it immediately, or use a query to get multiple search routes.",
    lot: { x: 165, y: 448, width: 210, height: 180 },
    collision: { x: 201, y: 504, width: 138, height: 118 },
    interactZone: { x: 187, y: 562, width: 166, height: 84 },
  },
];

const generatedLotSlots = [
  { x: 390, y: 96, width: 210, height: 180 },
  { x: 680, y: 96, width: 210, height: 180 },
  { x: 390, y: 448, width: 210, height: 180 },
  { x: 680, y: 448, width: 210, height: 180 },
];

const generatedHousePalettes = [
  { roof: "#2b4f7f", body: "#deecff" },
  { roof: "#7d4322", body: "#ffe4cf" },
  { roof: "#3f6e3e", body: "#d9f4d8" },
  { roof: "#6b3c76", body: "#f3dffd" },
];

const obstacles = [
  { x: 0, y: 0, width: worldBounds.width, height: 70 },
  { x: 0, y: 660, width: worldBounds.width, height: 60 },
  ...houses.map((house) => house.collision),
];

let nearbyHouse = null;
let selectedHouse = null;
let lastTimestamp = 0;
let activeWebRoomHouse = null;
let isMapOpen = false;
let generatedHouseCount = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function getDefaultPanelFacts() {
  return houses.map((house) => house.townFact);
}

function getSiteHost(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeWebsiteInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-zA-Z][a-zA-Z\d+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!url.hostname || !url.hostname.includes(".")) {
      return null;
    }

    return {
      url: url.toString(),
      host: url.hostname.replace(/^www\./, "").toLowerCase(),
    };
  } catch {
    return null;
  }
}

function toTitleCase(value) {
  if (!value) {
    return "Website";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getWebsiteDisplayName(host) {
  const parts = host.split(".").filter(Boolean);
  if (parts.length === 0) {
    return "Website";
  }

  const candidate = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return toTitleCase(candidate.replace(/[^a-zA-Z0-9-]/g, ""));
}

function getNextGeneratedLot() {
  return generatedLotSlots.find((slot) => !houses.some((house) => house.lot.x === slot.x && house.lot.y === slot.y));
}

function renderHouseInWorld(house, palette) {
  if (world.querySelector(`[data-house-id="${house.id}"]`)) {
    return;
  }

  const lot = document.createElement("div");
  lot.className = "lot";
  lot.style.left = `${house.lot.x}px`;
  lot.style.top = `${house.lot.y}px`;

  const houseElement = document.createElement("div");
  houseElement.className = "house house-browser";
  houseElement.dataset.houseId = house.id;
  houseElement.style.setProperty("--house-roof", palette.roof);
  houseElement.style.setProperty("--house-body", palette.body);

  const bodyName = house.name.replace(" House", "");
  houseElement.innerHTML = `
    <div class="roof"></div>
    <div class="body">
      <div class="sign">${bodyName}</div>
      <div class="door"></div>
      <div class="window left"></div>
      <div class="window right"></div>
    </div>
  `;

  lot.appendChild(houseElement);

  const firstTree = world.querySelector(".trees");
  if (firstTree) {
    world.insertBefore(lot, firstTree);
  } else {
    world.appendChild(lot);
  }
}

function createWebsiteHouse(website) {
  const existing = houses.find((house) => getSiteHost(house.url) === website.host);
  if (existing) {
    return { status: "exists", house: existing };
  }

  const lot = getNextGeneratedLot();
  if (!lot) {
    return { status: "full" };
  }

  generatedHouseCount += 1;
  const palette = generatedHousePalettes[(generatedHouseCount - 1) % generatedHousePalettes.length];
  const displayName = getWebsiteDisplayName(website.host);
  const id = `site-${displayName.toLowerCase()}-${generatedHouseCount}`;

  const house = {
    id,
    name: `${displayName} House`,
    url: website.url,
    description: `A custom website house generated from ${website.host}.`,
    facts: [
      `Generated from: ${website.host}`,
      "Spawned automatically from the Browser House.",
      "Use this as a quick shortcut in your town.",
    ],
    roomMode: "Website Shortcut Room",
    roomAddress: `museum://website-house/${website.host}`,
    roomIntro: "This custom house was generated from your browser search.",
    searchPlaceholder: "Type a URL or a search query",
    townFact: `${displayName} House: custom website shortcut.`,
    chips: [website.host, `about ${displayName}`, `${displayName} login`],
    roomTip: "You can keep generating houses from Browser House by searching more websites.",
    lot,
    collision: {
      x: lot.x + 36,
      y: lot.y + 56,
      width: 138,
      height: 118,
    },
    interactZone: {
      x: lot.x + 22,
      y: lot.y + 114,
      width: 166,
      height: 84,
    },
  };

  houses.push(house);
  obstacles.push(house.collision);
  renderHouseInWorld(house, palette);
  renderMapHouseMarkers();
  renderHouseBrowser();

  return { status: "created", house };
}

function canOccupy(x, y) {
  const next = { x, y, width: player.width, height: player.height };

  if (x < 0 || y < 0 || x + player.width > worldBounds.width || y + player.height > worldBounds.height) {
    return false;
  }

  return !obstacles.some((obstacle) => intersects(next, obstacle));
}

function movePlayer(delta) {
  let dx = 0;
  let dy = 0;

  if (keys.has("arrowup") || keys.has("w")) {
    dy -= 1;
  }
  if (keys.has("arrowdown") || keys.has("s")) {
    dy += 1;
  }
  if (keys.has("arrowleft") || keys.has("a")) {
    dx -= 1;
  }
  if (keys.has("arrowright") || keys.has("d")) {
    dx += 1;
  }

  const moving = dx !== 0 || dy !== 0;
  playerElement.classList.toggle("walking", moving);

  if (!moving) {
    return;
  }

  const magnitude = Math.hypot(dx, dy) || 1;
  const step = player.speed * (delta / 16.666);
  const nextX = clamp(player.x + (dx / magnitude) * step, 0, worldBounds.width - player.width);
  const nextY = clamp(player.y + (dy / magnitude) * step, 0, worldBounds.height - player.height);

  if (canOccupy(nextX, player.y)) {
    player.x = nextX;
  }
  if (canOccupy(player.x, nextY)) {
    player.y = nextY;
  }
}

function updatePlayerRender() {
  playerElement.style.left = `${player.x}px`;
  playerElement.style.top = `${player.y}px`;
  updateMapPlayerMarker();
}

function toMapPercent(x, y) {
  return {
    x: (x / worldBounds.width) * 100,
    y: (y / worldBounds.height) * 100,
  };
}

function updateMapPlayerMarker() {
  const centerX = player.x + player.width / 2;
  const centerY = player.y + player.height / 2;
  const point = toMapPercent(centerX, centerY);
  mapPlayerMarker.style.left = `${point.x}%`;
  mapPlayerMarker.style.top = `${point.y}%`;
}

function renderMapHouseMarkers() {
  mapHouseMarkers.innerHTML = "";

  houses.forEach((house) => {
    const centerX = house.lot.x + house.lot.width / 2;
    const centerY = house.lot.y + house.lot.height / 2;
    const point = toMapPercent(centerX, centerY);

    const marker = document.createElement("button");
    marker.type = "button";
    marker.className = "map-house-marker";
    marker.style.left = `${point.x}%`;
    marker.style.top = `${point.y}%`;
    marker.textContent = house.name.replace(" House", "");
    marker.title = house.name;
    marker.addEventListener("click", () => {
      setPanelContent(house);
      setMapOpen(false);
    });

    mapHouseMarkers.appendChild(marker);
  });
}

function setMapOpen(open) {
  isMapOpen = open;
  mapOverlay.classList.toggle("hidden", !open);
  mapOverlay.setAttribute("aria-hidden", open ? "false" : "true");
  toggleMapButton.textContent = open ? "Hide Map" : "Show Map";

  if (open) {
    updateMapPlayerMarker();
  }
}

function toggleMap() {
  setMapOpen(!isMapOpen);
}

function updateNearbyHouse() {
  const playerBox = { x: player.x, y: player.y, width: player.width, height: player.height };
  nearbyHouse = houses.find((house) => intersects(playerBox, house.interactZone)) || null;

  document.querySelectorAll(".house").forEach((element) => {
    const isNearby = nearbyHouse && element.dataset.houseId === nearbyHouse.id;
    element.classList.toggle("nearby", Boolean(isNearby));
  });

  if (nearbyHouse) {
    promptElement.textContent = `Press E to enter ${nearbyHouse.name}`;
    promptElement.classList.remove("hidden");
  } else {
    promptElement.classList.add("hidden");
  }

  updateHouseBrowserState();
}

function updateHouseBrowserState() {
  houseBrowserList.querySelectorAll(".house-browser-item").forEach((item) => {
    const houseId = item.dataset.houseId;
    const isSelected = selectedHouse && selectedHouse.id === houseId;
    const isNearby = nearbyHouse && nearbyHouse.id === houseId;

    item.classList.toggle("active", Boolean(isSelected));
    item.classList.toggle("nearby", Boolean(isNearby));
  });
}

function renderHouseBrowser() {
  houseBrowserList.innerHTML = "";

  houses.forEach((house) => {
    const item = document.createElement("article");
    item.className = "house-browser-item";
    item.dataset.houseId = house.id;

    const title = document.createElement("h3");
    title.className = "house-browser-title";
    title.textContent = house.name;

    const actions = document.createElement("div");
    actions.className = "house-browser-actions";

    const focusButton = makeButton("Focus", () => {
      setPanelContent(house);
      setMapOpen(false);
    });

    const enterButton = makeButton("Open", () => {
      openWebRoom(house);
    }, "button-primary");

    const visitButton = makeLink("Visit", house.url);

    actions.appendChild(focusButton);
    actions.appendChild(enterButton);
    actions.appendChild(visitButton);
    item.appendChild(title);
    item.appendChild(actions);
    houseBrowserList.appendChild(item);
  });

  updateHouseBrowserState();
}

function renderFacts(items) {
  panelFacts.innerHTML = "";
  items.forEach((item) => {
    const fact = document.createElement("li");
    fact.textContent = item;
    panelFacts.appendChild(fact);
  });
}

function clearElement(element) {
  element.innerHTML = "";
}

function setStatus(message = "") {
  webRoomStatus.textContent = message;
}

function makeButton(label, onClick, variant = "button-secondary") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `button ${variant}`;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function makeLink(label, href, variant = "button-secondary") {
  const link = document.createElement("a");
  link.className = `button ${variant}`;
  link.href = href;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = label;
  return link;
}

function makeCard({ title, description, meta, hero = false, actions = [] }) {
  const card = document.createElement("article");
  card.className = `web-card${hero ? " hero" : ""}`;

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  if (meta) {
    const metaLine = document.createElement("div");
    metaLine.className = "web-card-meta";
    metaLine.textContent = meta;
    card.appendChild(metaLine);
  }

  if (description) {
    const text = document.createElement("p");
    text.textContent = description;
    card.appendChild(text);
  }

  if (actions.length > 0) {
    const actionRow = document.createElement("div");
    actionRow.className = "web-card-actions";
    actions.forEach((action) => actionRow.appendChild(action));
    card.appendChild(actionRow);
  }

  return card;
}

function renderChipRow(house) {
  const chips = house.chips || [];
  if (chips.length === 0) {
    return null;
  }

  const row = document.createElement("div");
  row.className = "chip-row";

  chips.forEach((query) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = query;
    chip.addEventListener("click", () => {
      webRoomSearchInput.value = query;
      webRoomSearchForm.requestSubmit();
    });
    row.appendChild(chip);
  });

  return row;
}

function setDefaultWebRoomContent(house) {
  clearElement(webRoomResults);

  const intro = makeCard({
    title: house.name,
    description: house.roomIntro,
    hero: true,
  });
  webRoomResults.appendChild(intro);

  const chipRow = renderChipRow(house);
  if (chipRow) {
    webRoomResults.appendChild(chipRow);
  }

  if (house.roomTip) {
    webRoomResults.appendChild(
      makeCard({
        title: "How this house works",
        description: house.roomTip,
      })
    );
  }
}

function setPanelContent(house) {
  selectedHouse = house;

  if (!house) {
    panelTitle.textContent = "Town Square";
    panelDescription.textContent =
      "Walk up to a house and press E. Each building represents a real place on the internet.";
    renderFacts(getDefaultPanelFacts());
    enterRoomButton.classList.add("disabled");
    visitLink.classList.add("disabled");
    visitLink.href = "#";
    updateHouseBrowserState();
    return;
  }

  panelTitle.textContent = house.name;
  panelDescription.textContent = house.description;
  renderFacts(house.facts);
  enterRoomButton.classList.remove("disabled");
  visitLink.href = house.url;
  visitLink.classList.remove("disabled");
  updateHouseBrowserState();
}

function openWebRoom(house) {
  if (!house) {
    return;
  }

  setMapOpen(false);
  activeWebRoomHouse = house;
  keys.clear();
  setPanelContent(house);
  webRoomTitle.textContent = house.name;
  webRoomMode.textContent = house.roomMode;
  webRoomAddress.textContent = house.roomAddress;
  webRoomDescription.textContent = house.roomIntro;
  webRoomSearchInput.value = "";
  webRoomSearchInput.placeholder = house.searchPlaceholder;
  webRoomExternalLink.href = house.url;
  webRoom.classList.remove("hidden");
  webRoom.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setStatus("Choose a prompt below or type into the room.");
  setDefaultWebRoomContent(house);
  webRoomSearchInput.focus();
}

function closeWebRoom() {
  activeWebRoomHouse = null;
  keys.clear();
  webRoom.classList.add("hidden");
  webRoom.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function isWebRoomOpen() {
  return !webRoom.classList.contains("hidden");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

async function fetchWikipediaSummary(title) {
  const encodedTitle = encodeURIComponent(title.replace(/\s+/g, "_"));
  return fetchJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`);
}

async function runWikipediaSearch(query) {
  setStatus(`Searching Wikipedia for \"${query}\"...`);
  clearElement(webRoomResults);

  const data = await fetchJson(
    `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=6&namespace=0&format=json&origin=*`
  );
  const titles = data[1] || [];
  const descriptions = data[2] || [];
  const links = data[3] || [];

  if (titles.length === 0) {
    setStatus("No Wikipedia results came back for that query.");
    webRoomResults.appendChild(
      makeCard({
        title: "No results",
        description: "Try a broader topic, a proper name, or fewer words.",
        hero: true,
      })
    );
    return;
  }

  const summary = await fetchWikipediaSummary(titles[0]).catch(() => null);

  if (summary) {
    webRoomResults.appendChild(
      makeCard({
        title: summary.title,
        description: summary.extract,
        meta: summary.description || "Wikipedia article preview",
        hero: true,
        actions: [
          makeLink("Open Article", summary.content_urls?.desktop?.page || links[0], "button-primary"),
          makeButton("Preview Another Result", () => {
            setStatus("Pick another result below to load a different summary.");
          }),
        ],
      })
    );
  }

  titles.forEach((title, index) => {
    webRoomResults.appendChild(
      makeCard({
        title,
        description: descriptions[index] || "Wikipedia result",
        actions: [
          makeButton("Preview Here", async () => {
            setStatus(`Loading summary for ${title}...`);
            try {
              const preview = await fetchWikipediaSummary(title);
              const firstCard = webRoomResults.querySelector(".web-card.hero");
              const previewCard = makeCard({
                title: preview.title,
                description: preview.extract,
                meta: preview.description || "Wikipedia article preview",
                hero: true,
                actions: [makeLink("Open Article", preview.content_urls?.desktop?.page || links[index], "button-primary")],
              });

              if (firstCard) {
                firstCard.replaceWith(previewCard);
              } else {
                webRoomResults.prepend(previewCard);
              }
              setStatus(`Loaded ${title}.`);
            } catch (error) {
              setStatus("Wikipedia preview failed. You can still open the article directly.");
            }
          }),
          makeLink("Open Article", links[index]),
        ],
      })
    );
  });

  setStatus(`Wikipedia returned ${titles.length} result${titles.length === 1 ? "" : "s"}.`);
}

function runGoogleSearch(query) {
  setStatus(`Prepared Google routes for \"${query}\".`);
  clearElement(webRoomResults);

  const encoded = encodeURIComponent(query);
  const hero = makeCard({
    title: `Search routes for \"${query}\"`,
    description:
      "This room cannot render Google itself, but it can let the player shape the trip before stepping through the real portal.",
    hero: true,
  });
  webRoomResults.appendChild(hero);

  [
    {
      title: "Web Search Corridor",
      description: "Standard Google results page.",
      href: `https://www.google.com/search?q=${encoded}`,
      label: "Open Web Search",
    },
    {
      title: "Images Corridor",
      description: "Jump directly into image search.",
      href: `https://www.google.com/search?tbm=isch&q=${encoded}`,
      label: "Open Images",
    },
    {
      title: "News Corridor",
      description: "Use Google News style search results.",
      href: `https://www.google.com/search?tbm=nws&q=${encoded}`,
      label: "Open News",
    },
    {
      title: "Maps Corridor",
      description: "Turn a place-based query into a map search.",
      href: `https://www.google.com/maps/search/${encoded}`,
      label: "Open Maps",
    },
  ].forEach((item) => {
    webRoomResults.appendChild(
      makeCard({
        title: item.title,
        description: item.description,
        actions: [makeLink(item.label, item.href, "button-primary")],
      })
    );
  });
}

function looksLikeUrl(query) {
  return query.includes(".") || query.startsWith("http://") || query.startsWith("https://");
}

async function runArchiveSearch(query) {
  clearElement(webRoomResults);

  if (!looksLikeUrl(query)) {
    setStatus(`Prepared archive.org search routes for \"${query}\".`);
    const encoded = encodeURIComponent(query);
    webRoomResults.appendChild(
      makeCard({
        title: `Archive search for \"${query}\"`,
        description:
          "This vault can search archive.org collections even when you are not starting from a single URL.",
        hero: true,
      })
    );

    [
      {
        title: "General Search",
        description: "Search all archive.org collections.",
        href: `https://archive.org/search?query=${encoded}`,
      },
      {
        title: "Texts",
        description: "Search books, scans, and documents.",
        href: `https://archive.org/search?query=${encoded}%20mediatype%3Atexts`,
      },
      {
        title: "Video",
        description: "Search moving image collections.",
        href: `https://archive.org/search?query=${encoded}%20mediatype%3Amovies`,
      },
      {
        title: "Audio",
        description: "Search audio collections.",
        href: `https://archive.org/search?query=${encoded}%20mediatype%3Aaudio`,
      },
    ].forEach((item) => {
      webRoomResults.appendChild(
        makeCard({
          title: item.title,
          description: item.description,
          actions: [makeLink("Open Search", item.href, "button-primary")],
        })
      );
    });
    return;
  }

  const normalizedQuery = query.startsWith("http://") || query.startsWith("https://") ? query : `https://${query}`;
  setStatus(`Checking the Wayback Machine for ${normalizedQuery}...`);

  const data = await fetchJson(
    `https://archive.org/wayback/available?url=${encodeURIComponent(normalizedQuery)}`
  );
  const closest = data.archived_snapshots?.closest;

  if (!closest) {
    setStatus("No saved snapshot was found for that URL.");
    webRoomResults.appendChild(
      makeCard({
        title: "No snapshot found",
        description:
          "The Wayback Machine did not return a saved page for that address. Try another URL or use a topic search instead.",
        hero: true,
      })
    );
    return;
  }

  const date = closest.timestamp
    ? `${closest.timestamp.slice(0, 4)}-${closest.timestamp.slice(4, 6)}-${closest.timestamp.slice(6, 8)} ${closest.timestamp.slice(8, 10)}:${closest.timestamp.slice(10, 12)}`
    : "Unknown date";

  webRoomResults.appendChild(
    makeCard({
      title: "Closest preserved snapshot",
      description: `A saved capture exists for ${normalizedQuery}.`,
      meta: `${date} | ${closest.status || "saved"}`,
      hero: true,
      actions: [makeLink("Open Snapshot", closest.url, "button-primary")],
    })
  );

  webRoomResults.appendChild(
    makeCard({
      title: "Open full timeline",
      description: "Jump into the archive calendar to browse more captures of the same address.",
      actions: [
        makeLink(
          "Open Timeline",
          `https://web.archive.org/web/*/${encodeURIComponent(normalizedQuery)}`
        ),
      ],
    })
  );

  setStatus("Wayback snapshot loaded.");
}

function runBrowserSearch(query) {
  clearElement(webRoomResults);

  if (looksLikeUrl(query)) {
    const website = normalizeWebsiteInput(query);
    if (!website) {
      setStatus("That does not look like a valid website address.");
      setDefaultWebRoomContent(activeWebRoomHouse);
      return;
    }

    const houseResult = createWebsiteHouse(website);
    if (houseResult.status === "created") {
      setPanelContent(houseResult.house);
      setStatus(`Generated ${houseResult.house.name} from ${website.host}.`);
    } else if (houseResult.status === "exists") {
      setPanelContent(houseResult.house);
      setStatus(`${houseResult.house.name} already exists in town.`);
    } else {
      setStatus("All custom lot slots are used. Open one of the existing houses instead.");
    }

    webRoomResults.appendChild(
      makeCard({
        title: "Direct URL detected",
        description: "Open this address directly from the navigator room and use the generated house in town.",
        hero: true,
        actions: [
          makeLink("Open URL", website.url, "button-primary"),
          houseResult.house
            ? makeButton("Focus House", () => {
              setPanelContent(houseResult.house);
            })
            : makeButton("Back To Browser House", () => {
              if (activeWebRoomHouse) {
                setPanelContent(activeWebRoomHouse);
              }
            }),
        ],
      })
    );
    return;
  }

  const encoded = encodeURIComponent(query);
  setStatus(`Prepared browser routes for \"${query}\".`);

  webRoomResults.appendChild(
    makeCard({
      title: `Navigator routes for \"${query}\"`,
      description: "Pick the route you want to open in a new tab.",
      hero: true,
    })
  );

  [
    {
      title: "DuckDuckGo",
      description: "Privacy-focused web search.",
      href: `https://duckduckgo.com/?q=${encoded}`,
      label: "Open DuckDuckGo",
    },
    {
      title: "Google Web Search",
      description: "Standard Google results for this query.",
      href: `https://www.google.com/search?q=${encoded}`,
      label: "Open Google",
    },
    {
      title: "Wikipedia Search",
      description: "Jump straight into Wikipedia search.",
      href: `https://en.wikipedia.org/w/index.php?search=${encoded}`,
      label: "Open Wikipedia",
    },
    {
      title: "YouTube Search",
      description: "Search videos for this topic.",
      href: `https://www.youtube.com/results?search_query=${encoded}`,
      label: "Open YouTube",
    },
  ].forEach((item) => {
    webRoomResults.appendChild(
      makeCard({
        title: item.title,
        description: item.description,
        actions: [makeLink(item.label, item.href, "button-primary")],
      })
    );
  });
}

async function handleWebRoomSearch(query) {
  if (!activeWebRoomHouse) {
    return;
  }

  if (!query.trim()) {
    setStatus("Type something first.");
    setDefaultWebRoomContent(activeWebRoomHouse);
    return;
  }

  try {
    const trimmedQuery = query.trim();
    const handlers = {
      wikipedia: () => runWikipediaSearch(trimmedQuery),
      google: () => runGoogleSearch(trimmedQuery),
      archive: () => runArchiveSearch(trimmedQuery),
      browser: () => runBrowserSearch(trimmedQuery),
    };

    const selectedHandler = handlers[activeWebRoomHouse.id];
    if (selectedHandler) {
      await selectedHandler();
      return;
    }

    await runBrowserSearch(trimmedQuery);
  } catch (error) {
    setStatus("That interaction failed. The external site links are still available.");
    setDefaultWebRoomContent(activeWebRoomHouse);
  }
}

function updateCamera() {
  const frame = world.parentElement;
  const vpW = frame.clientWidth;
  const vpH = frame.clientHeight;
  const rawCamX = vpW / 2 - player.x - player.width / 2;
  const rawCamY = vpH / 2 - player.y - player.height / 2;
  const camX = worldBounds.width <= vpW
    ? (vpW - worldBounds.width) / 2
    : clamp(rawCamX, vpW - worldBounds.width, 0);
  const camY = worldBounds.height <= vpH
    ? (vpH - worldBounds.height) / 2
    : clamp(rawCamY, vpH - worldBounds.height, 0);
  world.style.transform = `translate(${camX}px, ${camY}px)`;
}

function gameLoop(timestamp) {
  const delta = timestamp - (lastTimestamp || timestamp);
  lastTimestamp = timestamp;

  if (!isWebRoomOpen()) {
    movePlayer(delta);
  }
  updatePlayerRender();
  updateNearbyHouse();
  updateCamera();

  requestAnimationFrame(gameLoop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (isWebRoomOpen()) {
    if (key === "escape") {
      event.preventDefault();
      closeWebRoom();
    }
    return;
  }

  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", " "].includes(key)) {
    event.preventDefault();
  }

  if (key === "m") {
    event.preventDefault();
    toggleMap();
    return;
  }

  if (key === "escape" && isMapOpen) {
    event.preventDefault();
    setMapOpen(false);
    return;
  }

  if (key === "e" && nearbyHouse) {
    openWebRoom(nearbyHouse);
    return;
  }

  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

enterRoomButton.addEventListener("click", () => {
  if (selectedHouse) {
    openWebRoom(selectedHouse);
  }
});

toggleMapButton.addEventListener("click", toggleMap);
closeMapButton.addEventListener("click", () => setMapOpen(false));

closeWebRoomButton.addEventListener("click", closeWebRoom);

webRoom.addEventListener("click", (event) => {
  if (event.target instanceof HTMLElement && event.target.dataset.closeWebRoom === "true") {
    closeWebRoom();
  }
});

webRoomSearchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleWebRoomSearch(webRoomSearchInput.value);
});

updatePlayerRender();
renderMapHouseMarkers();
renderHouseBrowser();
setPanelContent(null);
requestAnimationFrame(gameLoop);