import { generatedHousePalettes, generatedLotSlots, movementKeys, worldBounds } from './config';
import { createGameState } from './state';
import {
  buildWebsiteCandidates,
  clamp,
  extractDuckDuckGoResults,
  fetchJson,
  getSiteHost,
  getWebsiteDisplayName,
  intersects,
  looksLikeUrl,
  normalizeWebsiteInput,
} from './utils';

function makeButton(label, onClick, variant = 'button-secondary') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `button ${variant}`;
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

function makeLink(label, href, variant = 'button-secondary') {
  const link = document.createElement('a');
  link.className = `button ${variant}`;
  link.href = href;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = label;
  return link;
}

function makeCard({ title, description, meta, hero = false, actions = [] }) {
  const card = document.createElement('article');
  card.className = `web-card${hero ? ' hero' : ''}`;

  const heading = document.createElement('h3');
  heading.textContent = title;
  card.appendChild(heading);

  if (meta) {
    const metaLine = document.createElement('div');
    metaLine.className = 'web-card-meta';
    metaLine.textContent = meta;
    card.appendChild(metaLine);
  }

  if (description) {
    const text = document.createElement('p');
    text.textContent = description;
    card.appendChild(text);
  }

  if (actions.length > 0) {
    const actionRow = document.createElement('div');
    actionRow.className = 'web-card-actions';
    actions.forEach((action) => actionRow.appendChild(action));
    card.appendChild(actionRow);
  }

  return card;
}

export function createGameEngine(refs) {
  const state = createGameState();

  function getDefaultPanelFacts() {
    return state.houses.map((house) => house.townFact);
  }

  function isWebsiteShortcutHouse(house) {
    return house?.interactionType === 'website-shortcut';
  }

  function getNextGeneratedLot() {
    return generatedLotSlots.find(
      (slot) => !state.houses.some((house) => house.lot.x === slot.x && house.lot.y === slot.y),
    );
  }

  function renderFacts(items) {
    refs.panelFacts.innerHTML = '';
    items.forEach((item) => {
      const fact = document.createElement('li');
      fact.textContent = item;
      refs.panelFacts.appendChild(fact);
    });
  }

  function setStatus(message = '') {
    refs.webRoomStatus.textContent = message;
  }

  function setWebRoomResultsVisible(visible) {
    refs.webRoomResults.classList.toggle('hidden', !visible);
  }

  function clearElement(element) {
    element.innerHTML = '';
  }

  function toMapPercent(x, y) {
    return {
      x: (x / worldBounds.width) * 100,
      y: (y / worldBounds.height) * 100,
    };
  }

  function updateMapPlayerMarker() {
    const centerX = state.player.x + state.player.width / 2;
    const centerY = state.player.y + state.player.height / 2;
    const point = toMapPercent(centerX, centerY);
    refs.mapPlayerMarker.style.left = `${point.x}%`;
    refs.mapPlayerMarker.style.top = `${point.y}%`;
  }

  function setPanelContent(house) {
    state.selectedHouse = house;

    if (!house) {
      refs.panelTitle.textContent = 'Town Square';
      refs.panelDescription.textContent =
        'Walk up to a house and press E. Each building represents a real place on the internet.';
      renderFacts(getDefaultPanelFacts());
      refs.enterRoomButton.classList.add('disabled');
      refs.visitLink.classList.add('disabled');
      refs.visitLink.href = '#';
      updateHouseBrowserState();
      return;
    }

    refs.panelTitle.textContent = house.name;
    refs.panelDescription.textContent = house.description;
    renderFacts(house.facts);
    refs.enterRoomButton.classList.remove('disabled');
    refs.visitLink.href = house.url;
    refs.visitLink.classList.remove('disabled');
    updateHouseBrowserState();
  }

  function renderMapHouseMarkers() {
    refs.mapHouseMarkers.innerHTML = '';

    state.houses.forEach((house) => {
      const centerX = house.lot.x + house.lot.width / 2;
      const centerY = house.lot.y + house.lot.height / 2;
      const point = toMapPercent(centerX, centerY);

      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'map-house-marker';
      marker.style.left = `${point.x}%`;
      marker.style.top = `${point.y}%`;
      marker.textContent = house.name.replace(' House', '');
      marker.title = house.name;
      marker.addEventListener('click', () => {
        setPanelContent(house);
        setMapOpen(false);
      });

      refs.mapHouseMarkers.appendChild(marker);
    });
  }

  function setMapOpen(open) {
    state.isMapOpen = open;
    refs.mapOverlay.classList.toggle('hidden', !open);
    refs.mapOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
    refs.toggleMapButton.textContent = open ? 'Hide Map' : 'Show Map';

    if (open) {
      updateMapPlayerMarker();
    }
  }

  function toggleMap() {
    setMapOpen(!state.isMapOpen);
  }

  function renderHouseInWorld(house, palette) {
    if (refs.world.querySelector(`[data-house-id="${house.id}"]`)) {
      return;
    }

    const lot = document.createElement('div');
    lot.className = 'lot';
    lot.style.left = `${house.lot.x}px`;
    lot.style.top = `${house.lot.y}px`;

    const houseElement = document.createElement('div');
    houseElement.className = 'house house-browser';
    houseElement.dataset.houseId = house.id;
    houseElement.style.setProperty('--house-roof', palette.roof);
    houseElement.style.setProperty('--house-body', palette.body);

    const bodyName = house.name.replace(' House', '');
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

    const firstTree = refs.world.querySelector('.trees');
    if (firstTree) {
      refs.world.insertBefore(lot, firstTree);
    } else {
      refs.world.appendChild(lot);
    }
  }

  function createWebsiteHouse(website) {
    const existing = state.houses.find((house) => getSiteHost(house.url) === website.host);
    if (existing) {
      return { status: 'exists', house: existing };
    }

    const lot = getNextGeneratedLot();
    if (!lot) {
      return { status: 'full' };
    }

    state.generatedHouseCount += 1;
    const palette = generatedHousePalettes[(state.generatedHouseCount - 1) % generatedHousePalettes.length];
    const displayName = getWebsiteDisplayName(website.host);
    const idSafeName = displayName.replace(/[^a-z0-9-]/g, '-');
    const id = `site-${idSafeName}-${state.generatedHouseCount}`;

    const house = {
      id,
      name: `${displayName} House`,
      url: website.url,
      interactionType: 'website-shortcut',
      description: `A custom website house generated from ${website.host}.`,
      facts: [
        `Generated from: ${website.host}`,
        'Spawned automatically from the Browser House.',
        'Use this as a quick shortcut in your town.',
      ],
      roomMode: 'Website Shortcut Room',
      roomAddress: `museum://website-house/${website.host}`,
      roomIntro: `This custom house was generated from your browser search and points directly to ${website.host}.`,
      searchPlaceholder: 'Type a URL or a search query',
      townFact: `${displayName} House: custom website shortcut.`,
      chips: [website.host, `about ${displayName}`, `${displayName} login`],
      roomTip: 'You can keep generating houses from Browser House by searching more websites.',
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

    state.houses.push(house);
    state.obstacles.push(house.collision);
    renderHouseInWorld(house, palette);
    renderMapHouseMarkers();
    renderHouseBrowser();

    return { status: 'created', house };
  }

  function createHouseFromWebsiteUrl(url) {
    const website = normalizeWebsiteInput(url);
    if (!website) {
      setStatus('Could not parse that website address.');
      return null;
    }

    const houseResult = createWebsiteHouse(website);
    if (houseResult.status === 'created') {
      setPanelContent(houseResult.house);
      setStatus(`Generated ${houseResult.house.name} from ${website.host}.`);
    } else if (houseResult.status === 'exists') {
      setPanelContent(houseResult.house);
      setStatus(`${houseResult.house.name} already exists in town.`);
    } else {
      setStatus('All custom lot slots are used. Open one of the existing houses instead.');
    }

    return { website, houseResult };
  }

  function canOccupy(x, y) {
    const next = { x, y, width: state.player.width, height: state.player.height };

    if (x < 0 || y < 0 || x + state.player.width > worldBounds.width || y + state.player.height > worldBounds.height) {
      return false;
    }

    return !state.obstacles.some((obstacle) => intersects(next, obstacle));
  }

  function updatePlayerRender() {
    refs.playerElement.style.left = `${state.player.x}px`;
    refs.playerElement.style.top = `${state.player.y}px`;

    // Center the camera on the player
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;
    const scrollX = state.player.x + state.player.width / 2 - viewWidth / 2;
    const scrollY = state.player.y + state.player.height / 2 - viewHeight / 2;

    // Apply smooth camera transition via the world wrapper
    // Note: This makes the map feel like it's rotating or moving under you
    refs.world.style.transform = `translate(${-scrollX}px, ${-scrollY}px)`;
    updateMapPlayerMarker();
  }

  function movePlayer(delta) {
    let dx = 0;
    let dy = 0;

    if (state.keys.has('arrowup') || state.keys.has('w')) {
      dy -= 1;
    }
    if (state.keys.has('arrowdown') || state.keys.has('s')) {
      dy += 1;
    }
    if (state.keys.has('arrowleft') || state.keys.has('a')) {
      dx -= 1;
    }
    if (state.keys.has('arrowright') || state.keys.has('d')) {
      dx += 1;
    }

    const moving = dx !== 0 || dy !== 0;
    refs.playerElement.classList.toggle('walking', moving);

    if (!moving) {
      return;
    }

    const magnitude = Math.hypot(dx, dy) || 1;
    const step = state.player.speed * (delta / 16.666);
    const nextX = clamp(state.player.x + (dx / magnitude) * step, 0, worldBounds.width - state.player.width);
    const nextY = clamp(state.player.y + (dy / magnitude) * step, 0, worldBounds.height - state.player.height);

    if (canOccupy(nextX, state.player.y)) {
      state.player.x = nextX;
    }
    if (canOccupy(state.player.x, nextY)) {
      state.player.y = nextY;
    }
  }

  function getRoomAvatarBox() {
    return {
      x: state.roomPlayer.x,
      y: state.roomPlayer.y,
      width: state.roomPlayer.width,
      height: state.roomPlayer.height,
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
    if (!target) {
      refs.roomInteractionHint.textContent = '';
      refs.roomInteractionHint.classList.add('hidden');
      return;
    }

    const labels = {
      npc: 'Press E to talk with the character',
      newspapers: 'Press E to read newspapers',
    };

    refs.roomInteractionHint.textContent = labels[target] || 'Press E to interact';
    refs.roomInteractionHint.classList.remove('hidden');
  }

  function updateRoomNearbyObject() {
    const avatar = getRoomAvatarBox();
    const checkArea = {
      x: avatar.x - 14,
      y: avatar.y - 14,
      width: avatar.width + 28,
      height: avatar.height + 28,
    };

    const npcBox = getRoomObjectBox(refs.roomNpc);
    const newspapersBox = getRoomObjectBox(refs.roomNewspapers);

    refs.roomNpc.classList.toggle('nearby', Boolean(npcBox && intersects(checkArea, npcBox)));
    refs.roomNewspapers.classList.toggle('nearby', Boolean(newspapersBox && intersects(checkArea, newspapersBox)));

    if (npcBox && intersects(checkArea, npcBox)) {
      state.nearbyRoomObject = 'npc';
    } else if (newspapersBox && intersects(checkArea, newspapersBox)) {
      state.nearbyRoomObject = 'newspapers';
    } else {
      state.nearbyRoomObject = null;
    }

    setRoomInteractionHint(state.nearbyRoomObject);
  }

  function updateRoomAvatarRender(moving) {
    refs.roomAvatar.style.left = `${state.roomPlayer.x}px`;
    refs.roomAvatar.style.top = `${state.roomPlayer.y}px`;
    refs.roomAvatar.classList.toggle('walking', moving);
  }

  function resetRoomAvatar() {
    state.roomPlayer.x = 24;
    state.roomPlayer.y = 150;
    state.nearbyRoomObject = null;
    setRoomInteractionHint(null);
    refs.roomNpc.classList.remove('nearby');
    refs.roomNewspapers.classList.remove('nearby');
    updateRoomAvatarRender(false);
  }

  function moveRoomAvatar(delta) {
    let dx = 0;
    let dy = 0;

    if (state.roomKeys.has('arrowup') || state.roomKeys.has('w')) {
      dy -= 1;
    }
    if (state.roomKeys.has('arrowdown') || state.roomKeys.has('s')) {
      dy += 1;
    }
    if (state.roomKeys.has('arrowleft') || state.roomKeys.has('a')) {
      dx -= 1;
    }
    if (state.roomKeys.has('arrowright') || state.roomKeys.has('d')) {
      dx += 1;
    }

    const moving = dx !== 0 || dy !== 0;
    const walkWidth = refs.roomWalkArea.clientWidth;
    const walkHeight = refs.roomWalkArea.clientHeight;
    const magnitude = Math.hypot(dx, dy) || 1;
    const step = state.roomPlayer.speed * (delta / 16.666);

    if (moving) {
      state.roomPlayer.x = clamp(state.roomPlayer.x + (dx / magnitude) * step, 8, Math.max(8, walkWidth - state.roomPlayer.width - 8));
      state.roomPlayer.y = clamp(state.roomPlayer.y + (dy / magnitude) * step, 8, Math.max(8, walkHeight - state.roomPlayer.height - 8));
    }

    updateRoomAvatarRender(moving);
    updateRoomNearbyObject();
  }

  function interactWithRoomObject() {
    if (!state.nearbyRoomObject || !state.activeWebRoomHouse) {
      if (isCustomIndoorRoomOpen()) {
        refs.roomInteractionHint.textContent = 'Move closer to the character or newspapers.';
        refs.roomInteractionHint.classList.remove('hidden');
      } else {
        setStatus('Walk close to the character or newspapers first.');
      }
      return;
    }

    if (state.nearbyRoomObject === 'npc') {
      if (isCustomIndoorRoomOpen()) {
        refs.roomInteractionHint.textContent = `Character: Welcome to ${state.activeWebRoomHouse.name}.`;
        refs.roomInteractionHint.classList.remove('hidden');
      } else {
        setStatus(`Character: Welcome to ${state.activeWebRoomHouse.name}. I can help you navigate this room.`);
      }
      return;
    }

    if (isCustomIndoorRoomOpen()) {
      refs.roomInteractionHint.textContent = 'Newspapers: Headlines mention browsers and internet history.';
      refs.roomInteractionHint.classList.remove('hidden');
    } else {
      setStatus('Newspapers: Headlines mention browsers, open web standards, and internet history.');
    }
  }

  function isWebRoomOpen() {
    return !refs.webRoom.classList.contains('hidden');
  }

  function isCustomIndoorRoomOpen() {
    return isWebRoomOpen() && isWebsiteShortcutHouse(state.activeWebRoomHouse);
  }

  function setWebRoomContentMode(useIndoorScene) {
    refs.webRoomDescription.classList.toggle('hidden', useIndoorScene);
    refs.webRoomSearchForm.classList.toggle('hidden', useIndoorScene);
    refs.webRoomActions?.classList.toggle('hidden', useIndoorScene);
    refs.webRoomStatus.classList.toggle('hidden', useIndoorScene);
    refs.webRoomResults.classList.toggle('hidden', useIndoorScene);
  }

  function renderChipRow(house) {
    const chips = house.chips || [];
    if (chips.length === 0) {
      return null;
    }

    const row = document.createElement('div');
    row.className = 'chip-row';

    chips.forEach((query) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.textContent = query;
      chip.addEventListener('click', () => {
        refs.webRoomSearchInput.value = query;
        refs.webRoomSearchForm.requestSubmit();
      });
      row.appendChild(chip);
    });

    return row;
  }

  function renderWebsiteShortcutRoom() {
    clearElement(refs.webRoomResults);
    setWebRoomResultsVisible(false);
  }

  function setDefaultWebRoomContent(house) {
    if (isWebsiteShortcutHouse(house)) {
      renderWebsiteShortcutRoom();
      return;
    }

    setWebRoomResultsVisible(true);
    clearElement(refs.webRoomResults);

    const intro = makeCard({
      title: house.name,
      description: house.roomIntro,
      hero: true,
    });
    refs.webRoomResults.appendChild(intro);

    const chipRow = renderChipRow(house);
    if (chipRow) {
      refs.webRoomResults.appendChild(chipRow);
    }

    if (house.roomTip) {
      refs.webRoomResults.appendChild(
        makeCard({
          title: 'How this house works',
          description: house.roomTip,
        }),
      );
    }
  }

  function openWebRoom(house) {
    if (!house) {
      return;
    }

    setMapOpen(false);
    state.activeWebRoomHouse = house;
    state.keys.clear();
    setPanelContent(house);
    refs.webRoomLabel.textContent = house.roomMode || 'Inside Website House';
    refs.webRoomTitle.textContent = house.name;
    refs.webRoomDescription.textContent = house.roomIntro;
    refs.webRoomSearchInput.value = '';
    refs.webRoomSearchInput.placeholder = house.searchPlaceholder;
    refs.webRoomExternalLink.href = house.url;
    const useIndoorScene = isWebsiteShortcutHouse(house);
    setWebRoomContentMode(useIndoorScene);
    refs.roomScene.classList.toggle('hidden', !useIndoorScene);
    refs.webRoom.classList.remove('hidden');
    refs.webRoom.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (useIndoorScene) {
      resetRoomAvatar();
      setStatus('');
    } else {
      state.roomKeys.clear();
      state.nearbyRoomObject = null;
      setRoomInteractionHint(null);
      setStatus('Navigator room active. Use search below.');
    }

    setDefaultWebRoomContent(house);
    if (useIndoorScene) {
      updateRoomNearbyObject();
    }
    refs.webRoomSearchInput.focus();
  }

  function closeWebRoom() {
    state.activeWebRoomHouse = null;
    state.keys.clear();
    state.roomKeys.clear();
    state.nearbyRoomObject = null;
    setRoomInteractionHint(null);
    refs.webRoom.classList.add('hidden');
    refs.webRoom.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function updateHouseBrowserState() {
    refs.houseBrowserList.querySelectorAll('.house-browser-item').forEach((item) => {
      const houseId = item.dataset.houseId;
      const isSelected = state.selectedHouse && state.selectedHouse.id === houseId;
      const isNearby = state.nearbyHouse && state.nearbyHouse.id === houseId;

      item.classList.toggle('active', Boolean(isSelected));
      item.classList.toggle('nearby', Boolean(isNearby));
    });
  }

  function renderHouseBrowser() {
    refs.houseBrowserList.innerHTML = '';

    state.houses.forEach((house) => {
      const item = document.createElement('article');
      item.className = 'house-browser-item';
      item.dataset.houseId = house.id;

      const title = document.createElement('h3');
      title.className = 'house-browser-title';
      title.textContent = house.name;

      const actions = document.createElement('div');
      actions.className = 'house-browser-actions';

      const focusButton = makeButton('Focus', () => {
        setPanelContent(house);
        setMapOpen(false);
      });

      const enterButton = makeButton(
        'Open',
        () => {
          openWebRoom(house);
        },
        'button-primary',
      );

      const visitButton = makeLink('Visit', house.url);

      actions.appendChild(focusButton);
      actions.appendChild(enterButton);
      actions.appendChild(visitButton);
      item.appendChild(title);
      item.appendChild(actions);
      refs.houseBrowserList.appendChild(item);
    });

    updateHouseBrowserState();
  }

  function updateNearbyHouse() {
    const playerBox = { x: state.player.x, y: state.player.y, width: state.player.width, height: state.player.height };
    state.nearbyHouse = state.houses.find((house) => intersects(playerBox, house.interactZone)) || null;

    document.querySelectorAll('.house').forEach((element) => {
      const isNearby = state.nearbyHouse && element.dataset.houseId === state.nearbyHouse.id;
      element.classList.toggle('nearby', Boolean(isNearby));
    });

    if (state.nearbyHouse) {
      refs.promptElement.textContent = `Press E to enter ${state.nearbyHouse.name}`;
      refs.promptElement.classList.remove('hidden');
    } else {
      refs.promptElement.classList.add('hidden');
    }

    updateHouseBrowserState();
  }

  async function runBrowserSearch(query) {
    clearElement(refs.webRoomResults);

    if (looksLikeUrl(query)) {
      const creationResult = createHouseFromWebsiteUrl(query);
      if (!creationResult) {
        setStatus('That does not look like a valid website address.');
        setDefaultWebRoomContent(state.activeWebRoomHouse);
        return;
      }

      const { website, houseResult } = creationResult;

      refs.webRoomResults.appendChild(
        makeCard({
          title: 'Direct URL detected',
          description: 'Open this address directly from the navigator room and use the generated house in town.',
          hero: true,
          actions: [
            makeLink('Open URL', website.url, 'button-primary'),
            houseResult.house
              ? makeButton('Focus House', () => {
                setPanelContent(houseResult.house);
              })
              : makeButton('Back To Browser House', () => {
                if (state.activeWebRoomHouse) {
                  setPanelContent(state.activeWebRoomHouse);
                }
              }),
          ],
        }),
      );
      return;
    }

    const encoded = encodeURIComponent(query);
    setStatus(`Searching websites for "${query}" with a free API...`);

    let apiResults = [];
    try {
      const apiData = await fetchJson(
        `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&no_redirect=1&skip_disambig=1`,
      );
      apiResults = extractDuckDuckGoResults(apiData);
    } catch {
      apiResults = [];
    }

    const websiteCandidates = buildWebsiteCandidates(query, apiResults);

    if (websiteCandidates.length === 0) {
      refs.webRoomResults.appendChild(
        makeCard({
          title: `No direct website matches for "${query}"`,
          description: 'Try a more specific query or use a search route below.',
          hero: true,
        }),
      );

      setStatus('No direct website matches found.');

      refs.webRoomResults.appendChild(
        makeCard({
          title: 'Search Routes',
          description: 'Use these routes to continue searching on the web.',
          actions: [
            makeLink('Open DuckDuckGo', `https://duckduckgo.com/?q=${encoded}`, 'button-primary'),
            makeLink('Open Google', `https://www.google.com/search?q=${encoded}`),
            makeLink('Open Wikipedia', `https://en.wikipedia.org/w/index.php?search=${encoded}`),
          ],
        }),
      );
      return;
    }

    refs.webRoomResults.appendChild(
      makeCard({
        title: `Possible webpages for "${query}"`,
        description: 'Choose a website result and optionally create a house from it.',
        hero: true,
      }),
    );

    websiteCandidates.forEach((candidate) => {
      refs.webRoomResults.appendChild(
        makeCard({
          title: candidate.host,
          description: candidate.description,
          actions: [
            makeLink('Open Website', candidate.url, 'button-primary'),
            makeButton('Create House', () => {
              createHouseFromWebsiteUrl(candidate.url);
            }),
          ],
        }),
      );
    });

    setStatus(`Found ${websiteCandidates.length} possible website${websiteCandidates.length === 1 ? '' : 's'}.`);
  }

  async function runWebsiteShortcutSearch(house) {
    renderWebsiteShortcutRoom();
    const host = getSiteHost(house.url) || house.url;
    setStatus(`Website shortcut room active for ${host}.`);
  }

  async function handleWebRoomSearch(query) {
    if (!state.activeWebRoomHouse) {
      return;
    }

    if (!query.trim()) {
      setStatus('Type something first.');
      setDefaultWebRoomContent(state.activeWebRoomHouse);
      return;
    }

    try {
      const trimmedQuery = query.trim();
      const handlers = {
        browser: () => runBrowserSearch(trimmedQuery),
      };

      const selectedHandler = handlers[state.activeWebRoomHouse.id];
      if (selectedHandler) {
        await selectedHandler();
        return;
      }

      if (isWebsiteShortcutHouse(state.activeWebRoomHouse)) {
        await runWebsiteShortcutSearch(state.activeWebRoomHouse);
        return;
      }

      await runBrowserSearch(trimmedQuery);
    } catch {
      setStatus('That interaction failed. The external site links are still available.');
      setDefaultWebRoomContent(state.activeWebRoomHouse);
    }
  }

  function updateCamera() {
    const frame = refs.world.parentElement;
    const vpW = frame.clientWidth;
    const vpH = frame.clientHeight;
    const rawCamX = vpW / 2 - state.player.x - state.player.width / 2;
    const rawCamY = vpH / 2 - state.player.y - state.player.height / 2;
    const camX = worldBounds.width <= vpW ? (vpW - worldBounds.width) / 2 : clamp(rawCamX, vpW - worldBounds.width, 0);
    const camY = worldBounds.height <= vpH ? (vpH - worldBounds.height) / 2 : clamp(rawCamY, vpH - worldBounds.height, 0);
    refs.world.style.transform = `translate(${camX}px, ${camY}px)`;
  }

  function gameLoop(timestamp) {
    const delta = timestamp - (state.lastTimestamp || timestamp);
    state.lastTimestamp = timestamp;

    if (isCustomIndoorRoomOpen()) {
      moveRoomAvatar(delta);
    } else {
      movePlayer(delta);
    }

    updatePlayerRender();
    updateNearbyHouse();
    updateCamera();

    state.rafId = requestAnimationFrame(gameLoop);
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();

    if (isWebRoomOpen()) {
      if (isCustomIndoorRoomOpen() && movementKeys.includes(key)) {
        event.preventDefault();
        state.roomKeys.add(key);
      }

      if (isCustomIndoorRoomOpen() && key === 'e') {
        event.preventDefault();
        interactWithRoomObject();
      }

      if (key === 'escape') {
        event.preventDefault();
        closeWebRoom();
      }
      return;
    }

    if ([...movementKeys, 'e', ' '].includes(key)) {
      event.preventDefault();
    }

    if (key === 'm') {
      event.preventDefault();
      toggleMap();
      return;
    }

    if (key === 'escape' && state.isMapOpen) {
      event.preventDefault();
      setMapOpen(false);
      return;
    }

    if (key === 'e' && state.nearbyHouse) {
      openWebRoom(state.nearbyHouse);
      return;
    }

    state.keys.add(key);
  }

  function onKeyUp(event) {
    const key = event.key.toLowerCase();
    state.keys.delete(key);
    state.roomKeys.delete(key);
  }

  function onEnterRoomClick() {
    if (state.selectedHouse) {
      openWebRoom(state.selectedHouse);
    }
  }

  function onCloseMapClick() {
    setMapOpen(false);
  }

  function onWebRoomClick(event) {
    if (event.target instanceof HTMLElement && event.target.dataset.closeWebRoom === 'true') {
      closeWebRoom();
    }
  }

  async function onWebRoomSubmit(event) {
    event.preventDefault();
    await handleWebRoomSearch(refs.webRoomSearchInput.value);
  }

  function start() {
    updatePlayerRender();
    updateRoomAvatarRender(false);
    renderMapHouseMarkers();
    renderHouseBrowser();
    setPanelContent(null);
    state.rafId = requestAnimationFrame(gameLoop);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    refs.enterRoomButton.addEventListener('click', onEnterRoomClick);
    refs.toggleMapButton.addEventListener('click', toggleMap);
    refs.closeMapButton.addEventListener('click', onCloseMapClick);
    refs.webRoom.addEventListener('click', onWebRoomClick);
    refs.webRoomSearchForm.addEventListener('submit', onWebRoomSubmit);
  }

  function stop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    refs.enterRoomButton.removeEventListener('click', onEnterRoomClick);
    refs.toggleMapButton.removeEventListener('click', toggleMap);
    refs.closeMapButton.removeEventListener('click', onCloseMapClick);
    refs.webRoom.removeEventListener('click', onWebRoomClick);
    refs.webRoomSearchForm.removeEventListener('submit', onWebRoomSubmit);
    document.body.style.overflow = '';
  }

  return { start, stop };
}
