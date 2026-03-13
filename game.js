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
const webRoomLabel = document.getElementById("webRoomLabel");
const webRoomTitle = document.getElementById("webRoomTitle");
const webRoomDescription = document.getElementById("webRoomDescription");
const webRoomSearchForm = document.getElementById("webRoomSearchForm");
const webRoomSearchInput = document.getElementById("webRoomSearchInput");
const webRoomExternalLink = document.getElementById("webRoomExternalLink");
const webRoomStatus = document.getElementById("webRoomStatus");
const webRoomResults = document.getElementById("webRoomResults");
const webRoomActions = webRoom.querySelector(".web-room-actions");
const roomScene = document.getElementById("roomScene");
const roomWalkArea = document.getElementById("roomWalkArea");
const roomAvatar = document.getElementById("roomAvatar");
const roomNpc = document.getElementById("roomNpc");
const roomNewspapers = document.getElementById("roomNewspapers");
const roomInteractionHint = document.getElementById("roomInteractionHint");
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
const roomKeys = new Set();

const roomPlayer = {
  x: 24,
  y: 150,
  width: 34,
  height: 46,
  speed: 2.8,
};

let nearbyRoomObject = null;

const houses = [
  {
    id: "browser",
    name: "Browser House",
    url: "https://duckduckgo.com/",
    description:
      "A flexible navigator house for quick web jumps. Use it when you want one generic browser-style room.",
    facts: [
      "Central hub for creating custom website houses.",
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

function getWebsiteDisplayName(host) {
  const normalizedHost = (host || "").trim().toLowerCase().replace(/^www\./, "");
  if (!normalizedHost) {
    return "Website";
  }

  return normalizedHost;
}

function isWebsiteShortcutHouse(house) {
  return house?.interactionType === "website-shortcut";
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
  const idSafeName = displayName.replace(/[^a-z0-9-]/g, "-");
  const id = `site-${idSafeName}-${generatedHouseCount}`;

  const house = {
    id,
    name: `${displayName} House`,
    url: website.url,
    interactionType: "website-shortcut",
    description: `A custom website house generated from ${website.host}.`,
    facts: [
      `Generated from: ${website.host}`,
      "Spawned automatically from the Browser House.",
      "Use this as a quick shortcut in your town.",
    ],
    roomMode: "Website Shortcut Room",
    roomAddress: `museum://website-house/${website.host}`,
    roomIntro: `This custom house was generated from your browser search and points directly to ${website.host}.`,
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

function createHouseFromWebsiteUrl(url) {
  const website = normalizeWebsiteInput(url);
  if (!website) {
    setStatus("Could not parse that website address.");
    return null;
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

  return { website, houseResult };
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

function resetRoomAvatar() {
  roomPlayer.x = 24;
  roomPlayer.y = 150;
  nearbyRoomObject = null;
  setRoomInteractionHint(null);
  roomNpc?.classList.remove("nearby");
  roomNewspapers?.classList.remove("nearby");
  updateRoomAvatarRender(false);
}

function getRoomAvatarBox() {
  return {
    x: roomPlayer.x,
    y: roomPlayer.y,
    width: roomPlayer.width,
    height: roomPlayer.height,
  };
}

function getRoomObjectBox(element) {
  if (!element) {
    return null;
  }

  return {
    x: element.offsetLeft,
    y: element.offsetTop,
    width: element.offsetWidth,
    height: element.offsetHeight,
  };
}

function setRoomInteractionHint(target) {
  if (!roomInteractionHint) {
    return;
  }

  if (!target) {
    roomInteractionHint.textContent = "";
    roomInteractionHint.classList.add("hidden");
    return;
  }

  const labels = {
    npc: "Press E to talk with the character",
    newspapers: "Press E to read newspapers",
  };

  roomInteractionHint.textContent = labels[target] || "Press E to interact";
  roomInteractionHint.classList.remove("hidden");
}

function updateRoomNearbyObject() {
  if (!roomWalkArea || !roomAvatar) {
    nearbyRoomObject = null;
    return;
  }

  const avatar = getRoomAvatarBox();
  const checkArea = {
    x: avatar.x - 14,
    y: avatar.y - 14,
    width: avatar.width + 28,
    height: avatar.height + 28,
  };

  const npcBox = getRoomObjectBox(roomNpc);
  const newspapersBox = getRoomObjectBox(roomNewspapers);

  if (roomNpc) {
    roomNpc.classList.toggle("nearby", Boolean(npcBox && intersects(checkArea, npcBox)));
  }
  if (roomNewspapers) {
    roomNewspapers.classList.toggle("nearby", Boolean(newspapersBox && intersects(checkArea, newspapersBox)));
  }

  if (npcBox && intersects(checkArea, npcBox)) {
    nearbyRoomObject = "npc";
  } else if (newspapersBox && intersects(checkArea, newspapersBox)) {
    nearbyRoomObject = "newspapers";
  } else {
    nearbyRoomObject = null;
  }

  setRoomInteractionHint(nearbyRoomObject);
}

function interactWithRoomObject() {
  if (!nearbyRoomObject || !activeWebRoomHouse) {
    if (isCustomIndoorRoomOpen()) {
      roomInteractionHint.textContent = "Move closer to the character or newspapers.";
      roomInteractionHint.classList.remove("hidden");
    } else {
      setStatus("Walk close to the character or newspapers first.");
    }
    return;
  }

  if (nearbyRoomObject === "npc") {
    if (isCustomIndoorRoomOpen()) {
      roomInteractionHint.textContent = `Character: Welcome to ${activeWebRoomHouse.name}.`;
      roomInteractionHint.classList.remove("hidden");
    } else {
      setStatus(`Character: Welcome to ${activeWebRoomHouse.name}. I can help you navigate this room.`);
    }
    return;
  }

  if (nearbyRoomObject === "newspapers") {
    if (isCustomIndoorRoomOpen()) {
      roomInteractionHint.textContent = "Newspapers: Headlines mention browsers and internet history.";
      roomInteractionHint.classList.remove("hidden");
    } else {
      setStatus("Newspapers: Headlines mention browsers, open web standards, and internet history.");
    }
  }
}

function moveRoomAvatar(delta) {
  if (!roomWalkArea || !roomAvatar) {
    return;
  }

  let dx = 0;
  let dy = 0;

  if (roomKeys.has("arrowup") || roomKeys.has("w")) {
    dy -= 1;
  }
  if (roomKeys.has("arrowdown") || roomKeys.has("s")) {
    dy += 1;
  }
  if (roomKeys.has("arrowleft") || roomKeys.has("a")) {
    dx -= 1;
  }
  if (roomKeys.has("arrowright") || roomKeys.has("d")) {
    dx += 1;
  }

  const moving = dx !== 0 || dy !== 0;
  const walkWidth = roomWalkArea.clientWidth;
  const walkHeight = roomWalkArea.clientHeight;
  const magnitude = Math.hypot(dx, dy) || 1;
  const step = roomPlayer.speed * (delta / 16.666);

  if (moving) {
    roomPlayer.x = clamp(roomPlayer.x + (dx / magnitude) * step, 8, Math.max(8, walkWidth - roomPlayer.width - 8));
    roomPlayer.y = clamp(roomPlayer.y + (dy / magnitude) * step, 8, Math.max(8, walkHeight - roomPlayer.height - 8));
  }

  updateRoomAvatarRender(moving);
  updateRoomNearbyObject();
}

function updateRoomAvatarRender(moving) {
  if (!roomAvatar) {
    return;
  }

  roomAvatar.style.left = `${roomPlayer.x}px`;
  roomAvatar.style.top = `${roomPlayer.y}px`;
  roomAvatar.classList.toggle("walking", moving);
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

function setWebRoomResultsVisible(visible) {
  webRoomResults.classList.toggle("hidden", !visible);
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

function renderWebsiteShortcutRoom(house, query = "") {
  clearElement(webRoomResults);
  setWebRoomResultsVisible(false);
}

function setDefaultWebRoomContent(house) {
  if (isWebsiteShortcutHouse(house)) {
    renderWebsiteShortcutRoom(house);
    return;
  }

  setWebRoomResultsVisible(true);

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
  webRoomLabel.textContent = house.roomMode || "Inside Website House";
  webRoomTitle.textContent = house.name;
  webRoomDescription.textContent = house.roomIntro;
  webRoomSearchInput.value = "";
  webRoomSearchInput.placeholder = house.searchPlaceholder;
  webRoomExternalLink.href = house.url;
  const useIndoorScene = isWebsiteShortcutHouse(house);
  setWebRoomContentMode(useIndoorScene);
  roomScene?.classList.toggle("hidden", !useIndoorScene);
  webRoom.classList.remove("hidden");
  webRoom.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  if (useIndoorScene) {
    resetRoomAvatar();
    setStatus("");
  } else {
    roomKeys.clear();
    nearbyRoomObject = null;
    setRoomInteractionHint(null);
    setStatus("Navigator room active. Use search below.");
  }
  setDefaultWebRoomContent(house);
  if (useIndoorScene) {
    updateRoomNearbyObject();
  }
  webRoomSearchInput.focus();
}

function closeWebRoom() {
  activeWebRoomHouse = null;
  keys.clear();
  roomKeys.clear();
  nearbyRoomObject = null;
  setRoomInteractionHint(null);
  webRoom.classList.add("hidden");
  webRoom.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function isWebRoomOpen() {
  return !webRoom.classList.contains("hidden");
}

function isCustomIndoorRoomOpen() {
  return isWebRoomOpen() && isWebsiteShortcutHouse(activeWebRoomHouse);
}

function setWebRoomContentMode(useIndoorScene) {
  webRoomDescription.classList.toggle("hidden", useIndoorScene);
  webRoomSearchForm.classList.toggle("hidden", useIndoorScene);
  webRoomActions?.classList.toggle("hidden", useIndoorScene);
  webRoomStatus.classList.toggle("hidden", useIndoorScene);
  webRoomResults.classList.toggle("hidden", useIndoorScene);
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

function looksLikeUrl(query) {
  return query.includes(".") || query.startsWith("http://") || query.startsWith("https://");
}

function extractDuckDuckGoResults(data, limit = 6) {
  const collected = [];

  function collectFromTopics(topics) {
    if (!Array.isArray(topics)) {
      return;
    }

    topics.forEach((topic) => {
      if (collected.length >= limit) {
        return;
      }

      if (topic && Array.isArray(topic.Topics)) {
        collectFromTopics(topic.Topics);
        return;
      }

      if (topic && topic.FirstURL) {
        collected.push(topic);
      }
    });
  }

  if (data?.AbstractURL) {
    collected.push({
      Text: data.AbstractText || data.Heading || "DuckDuckGo instant answer",
      FirstURL: data.AbstractURL,
    });
  }

  collectFromTopics(data?.RelatedTopics);

  return collected.slice(0, limit);
}

function buildWebsiteCandidates(query, apiResults, limit = 10) {
  const preferredHosts = {
    github: "github.com",
    google: "google.com",
    wikipedia: "wikipedia.org",
    youtube: "youtube.com",
    reddit: "reddit.com",
    stackoverflow: "stackoverflow.com",
    archive: "archive.org",
    duckduckgo: "duckduckgo.com",
  };

  const candidateMap = new Map();
  const rawInput = query.trim().toLowerCase();
  const compactInput = rawInput.replace(/\s+/g, "");
  const slug = compactInput.replace(/[^a-z0-9.-]/g, "");

  function addCandidate(rawUrl, description, priority) {
    const normalized = normalizeWebsiteInput(rawUrl);
    if (!normalized) {
      return;
    }

    const existing = candidateMap.get(normalized.host);
    if (!existing || priority < existing.priority) {
      candidateMap.set(normalized.host, {
        host: normalized.host,
        url: normalized.url,
        description: description || `Suggested website: ${normalized.url}`,
        priority,
      });
      return;
    }

    if (!existing.description && description) {
      existing.description = description;
    }
  }

  if (preferredHosts[compactInput]) {
    addCandidate(preferredHosts[compactInput], "Likely official website match for your query.", 0);
  }

  if (slug && !slug.includes("/")) {
    addCandidate(`${slug}.com`, `Common domain guess for "${query}".`, 1);
    addCandidate(`${slug}.org`, `Possible organization domain for "${query}".`, 2);
    addCandidate(`${slug}.net`, `Possible network domain for "${query}".`, 2);
  }

  apiResults.forEach((result) => {
    if (result?.FirstURL) {
      addCandidate(result.FirstURL, result.Text || "Result from free search API.", 3);
    }
  });

  return Array.from(candidateMap.values())
    .sort((a, b) => a.priority - b.priority || a.host.localeCompare(b.host))
    .slice(0, limit)
    .map(({ host, url, description }) => ({ host, url, description }));
}

async function runBrowserSearch(query) {
  clearElement(webRoomResults);

  if (looksLikeUrl(query)) {
    const creationResult = createHouseFromWebsiteUrl(query);
    if (!creationResult) {
      setStatus("That does not look like a valid website address.");
      setDefaultWebRoomContent(activeWebRoomHouse);
      return;
    }

    const { website, houseResult } = creationResult;

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
  setStatus(`Searching websites for \"${query}\" with a free API...`);

  let apiResults = [];
  try {
    const apiData = await fetchJson(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&no_redirect=1&skip_disambig=1`
    );
    apiResults = extractDuckDuckGoResults(apiData);
  } catch {
    apiResults = [];
  }

  const websiteCandidates = buildWebsiteCandidates(query, apiResults);

  if (websiteCandidates.length === 0) {
    webRoomResults.appendChild(
      makeCard({
        title: `No direct website matches for \"${query}\"`,
        description: "Try a more specific query or use a search route below.",
        hero: true,
      })
    );

    setStatus("No direct website matches found.");

    webRoomResults.appendChild(
      makeCard({
        title: "Search Routes",
        description: "Use these routes to continue searching on the web.",
        actions: [
          makeLink("Open DuckDuckGo", `https://duckduckgo.com/?q=${encoded}`, "button-primary"),
          makeLink("Open Google", `https://www.google.com/search?q=${encoded}`),
          makeLink("Open Wikipedia", `https://en.wikipedia.org/w/index.php?search=${encoded}`),
        ],
      })
    );
    return;
  }

  webRoomResults.appendChild(
    makeCard({
      title: `Possible webpages for \"${query}\"`,
      description: "Choose a website result and optionally create a house from it.",
      hero: true,
    })
  );

  websiteCandidates.forEach((candidate) => {
    webRoomResults.appendChild(
      makeCard({
        title: candidate.host,
        description: candidate.description,
        actions: [
          makeLink("Open Website", candidate.url, "button-primary"),
          makeButton("Create House", () => {
            createHouseFromWebsiteUrl(candidate.url);
          }),
        ],
      })
    );
  });

  setStatus(`Found ${websiteCandidates.length} possible website${websiteCandidates.length === 1 ? "" : "s"}.`);
}

async function runWebsiteShortcutSearch(house) {
  renderWebsiteShortcutRoom(house);
  const host = getSiteHost(house.url) || house.url;
  setStatus(`Website shortcut room active for ${host}.`);
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
      browser: () => runBrowserSearch(trimmedQuery),
    };

    const selectedHandler = handlers[activeWebRoomHouse.id];
    if (selectedHandler) {
      await selectedHandler();
      return;
    }

    if (isWebsiteShortcutHouse(activeWebRoomHouse)) {
      await runWebsiteShortcutSearch(activeWebRoomHouse);
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

  if (isCustomIndoorRoomOpen()) {
    moveRoomAvatar(delta);
  } else {
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
    if (isCustomIndoorRoomOpen() && ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      event.preventDefault();
      roomKeys.add(key);
    }

    if (isCustomIndoorRoomOpen() && key === "e") {
      event.preventDefault();
      interactWithRoomObject();
    }

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
  const key = event.key.toLowerCase();
  keys.delete(key);
  roomKeys.delete(key);
});

enterRoomButton.addEventListener("click", () => {
  if (selectedHouse) {
    openWebRoom(selectedHouse);
  }
});

toggleMapButton.addEventListener("click", toggleMap);
closeMapButton.addEventListener("click", () => setMapOpen(false));

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
updateRoomAvatarRender(false);
renderMapHouseMarkers();
renderHouseBrowser();
setPanelContent(null);
requestAnimationFrame(gameLoop);