import { generatedHousePalettes, generatedLotSlots, movementKeys, worldBounds } from "./config";
import { createGameState } from "./state";
import {
  clamp,
  getSiteHost,
  getWebsiteDisplayName,
  intersects,
  normalizeWebsiteInput,
} from "./utils";

import { makeButton, makeLink, makeCard, clearElement } from "./ui/helpers";
import { setMapOpen, renderMapHouseMarkers } from "./ui/map";
import { movePlayer, updatePlayerRender } from "./logic/movement";
import { isWebsiteShortcutHouse, runBrowserSearch } from "./logic/search";
import { getRoomAvatarBox, getRoomObjectBox, moveRoomAvatar } from "./logic/rooms";
import { generatePixfluxImage } from "./services/pixellab";

export function createGameEngine(refs) {
  const state = createGameState();
  const indoorBackdropCache = new Map();
  let activeIndoorRequestController = null;

  // --- Internal UI Helpers ---

  function getDefaultPanelFacts() {
    return state.houses.map((house) => house.townFact);
  }

  function getNextGeneratedLot() {
    return generatedLotSlots.find(
      (slot) => !state.houses.some((house) => house.lot.x === slot.x && house.lot.y === slot.y),
    );
  }

  function renderFacts(items) {
    refs.panelFacts.innerHTML = "";
    items.forEach((item) => {
      const fact = document.createElement("li");
      fact.textContent = item;
      refs.panelFacts.appendChild(fact);
    });
  }

  function setStatus(message = "") {
    refs.webRoomStatus.textContent = message;
    refs.navigatorStatus.textContent = message;
  }

  function setWebRoomResultsVisible(visible) {
    refs.webRoomResults.classList.toggle("hidden", !visible);
    refs.navigatorResults.classList.toggle("hidden", !visible);
  }

  function getActiveResultsContainer() {
    return state.isMapOpen ? refs.navigatorResults : refs.webRoomResults;
  }

  function setPanelContent(house) {
    state.selectedHouse = house;

    if (!house) {
      refs.panelTitle.textContent = "Town Square";
      refs.panelDescription.textContent =
        "Walk up to a house and press E. Each building represents a real place on the internet.";
      renderFacts(getDefaultPanelFacts());
      refs.enterRoomButton.classList.add("disabled");
      refs.visitLink.classList.add("disabled");
      refs.visitLink.href = "#";
      updateHouseBrowserState();
      return;
    }

    refs.panelTitle.textContent = house.name;
    refs.panelDescription.textContent = house.description;
    renderFacts(house.facts);
    refs.enterRoomButton.classList.remove("disabled");
    refs.visitLink.href = house.url;
    refs.visitLink.classList.remove("disabled");
    updateHouseBrowserState();
  }

  // --- World & House Management ---

  function renderHouseInWorld(house, palette) {
    const existing = refs.world.querySelector(`[data-house-id="${house.id}"]`);
    if (existing) {
      if (house.placeholder) {
        return;
      }
      existing.remove(); // Replace placeholder with real house
    }

    const lot = document.createElement("div");
    lot.className = "lot";
    lot.style.left = `${house.lot.x}px`;
    lot.style.top = `${house.lot.y}px`;
    // Depth sorting anchored to the visual base of the building (collision bottom)
    lot.style.zIndex = Math.floor(house.lot.y + house.lot.height - 70);

    const houseElement = document.createElement("div");
    houseElement.className = "house house-browser";
    if (house.placeholder) {
      houseElement.classList.add("placeholder-house");
    }
    houseElement.dataset.houseId = house.id;

    if (house.asset) {
      houseElement.classList.add("asset-house");
      houseElement.style.backgroundImage = `url(${house.asset})`;
    } else {
      houseElement.style.setProperty("--house-roof", palette.roof);
      houseElement.style.setProperty("--house-body", palette.body);
    }

    const bodyName = house.name.replace(" House", "");
    if (!house.asset) {
      houseElement.innerHTML = `
        <div class="roof"></div>
        <div class="body">
          ${house.placeholder ? "" : `<div class="sign">${bodyName}</div>`}
          <div class="door"></div>
          <div class="window left"></div>
          <div class="window right"></div>
        </div>
      `;
    } else {
      houseElement.innerHTML = house.placeholder ? "" : `<div class="sign asset-sign">${bodyName}</div>`;
    }

    lot.appendChild(houseElement);

    const firstTree = refs.world.querySelector(".trees");
    if (firstTree) {
      refs.world.insertBefore(lot, firstTree);
    } else {
      refs.world.appendChild(lot);
    }
  }

  function renderPlaceholderHouses() {
    generatedLotSlots.forEach((lot, index) => {
      // Choose an asset variant for the placeholder
      const houseColors = ["cervene", "modre", "zelene"];
      const color = houseColors[index % houseColors.length];
      const assetIndex = Math.floor(index / houseColors.length) % 8;
      const assetPath = `/assets/houses/sprite_domecky${color}${assetIndex}.png`;

      const id = `placeholder-${index}`;
      const placeholderHouse = {
        id,
        name: "Vacant Lot",
        placeholder: true,
        asset: assetPath,
        lot,
        collision: {
          x: lot.x + 20,
          y: lot.y + 60,
          width: 150,
          height: 90,
        },
      };

      state.obstacles.push(placeholderHouse.collision);
      renderHouseInWorld(placeholderHouse);
    });
  }

  function createWebsiteHouse(website) {
    const existing = state.houses.find((house) => getSiteHost(house.url) === website.host);
    if (existing) {
      return { status: "exists", house: existing };
    }

    const lot = getNextGeneratedLot();
    if (!lot) {
      return { status: "full" };
    }

    state.generatedHouseCount += 1;
    const houseColors = ["cervene", "modre", "zelene"];
    const color = houseColors[(state.generatedHouseCount - 1) % houseColors.length];
    const assetIndex = Math.floor((state.generatedHouseCount - 1) / houseColors.length) % 8;
    const assetPath = `/assets/houses/sprite_domecky${color}${assetIndex}.png`;

    const palette = generatedHousePalettes[(state.generatedHouseCount - 1) % generatedHousePalettes.length];
    const displayName = getWebsiteDisplayName(website.host);
    const idSafeName = displayName.replace(/[^a-z0-9-]/g, "-");
    const id = `site-${idSafeName}-${state.generatedHouseCount}`;

    const house = {
      id,
      name: `${displayName} House`,
      url: website.url,
      interactionType: "website-shortcut",
      asset: assetPath,
      npcAsset: "/assets/npc/grandma/dnsgrandma.png",
      npcText: "DNS Grandma: Hello dear! Are you lost in the World Wide Web? I can help you find your way.",
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
        x: lot.x + 20,
        y: lot.y + 60,
        width: 150,
        height: 90,
      },
      interactZone: {
        x: lot.x + 10,
        y: lot.y + 110,
        width: 190,
        height: 70,
      },
    };

    state.houses.push(house);
    state.obstacles.push(house.collision);
    renderHouseInWorld(house, palette);
    renderMapHouseMarkers(state, refs, setPanelContent);
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

  // --- Room Interactions ---

  function setRoomInteractionHint(target) {
    if (!target) {
      refs.roomInteractionHint.textContent = "";
      refs.roomInteractionHint.classList.add("hidden");
      return;
    }

    const labels = {
      npc: "Press E to talk with the character",
      newspapers: "Press E to read newspapers",
    };

    refs.roomInteractionHint.textContent = labels[target] || "Press E to interact";
    refs.roomInteractionHint.classList.remove("hidden");
  }

  function updateRoomNearbyObject() {
    const avatar = getRoomAvatarBox(state);
    const checkArea = {
      x: avatar.x - 14,
      y: avatar.y - 14,
      width: avatar.width + 28,
      height: avatar.height + 28,
    };

    const npcBox = getRoomObjectBox(refs.roomNpc);
    const newspapersBox = getRoomObjectBox(refs.roomNewspapers);

    const npcVisible = refs.roomNpc && !refs.roomNpc.classList.contains("hidden");
    const newspapersVisible = refs.roomNewspapers && !refs.roomNewspapers.classList.contains("hidden");

    if (refs.roomNpc) refs.roomNpc.classList.toggle("nearby", Boolean(npcVisible && npcBox && intersects(checkArea, npcBox)));
    if (refs.roomNewspapers) refs.roomNewspapers.classList.toggle("nearby", Boolean(newspapersVisible && newspapersBox && intersects(checkArea, newspapersBox)));

    if (npcVisible && npcBox && intersects(checkArea, npcBox)) {
      state.nearbyRoomObject = "npc";
    } else if (newspapersVisible && newspapersBox && intersects(checkArea, newspapersBox)) {
      state.nearbyRoomObject = "newspapers";
    } else {
      state.nearbyRoomObject = null;
    }

    setRoomInteractionHint(state.nearbyRoomObject);
  }

  function updateRoomAvatarRender(moving, horizontalDirection = 0) {
    refs.roomAvatar.style.left = `${state.roomPlayer.x}px`;
    refs.roomAvatar.style.top = `${state.roomPlayer.y}px`;
    refs.roomAvatar.classList.toggle("walking", moving);

    if (horizontalDirection > 0) {
      refs.roomAvatar.classList.add("facing-right");
    } else if (horizontalDirection < 0) {
      refs.roomAvatar.classList.remove("facing-right");
    }
  }

  function resetRoomAvatar() {
    state.roomPlayer.x = 24;
    state.roomPlayer.y = 60;
    state.nearbyRoomObject = null;
    setRoomInteractionHint(null);
    if (refs.roomNpc) refs.roomNpc.classList.remove("nearby");
    if (refs.roomNewspapers) refs.roomNewspapers.classList.remove("nearby");
    updateRoomAvatarRender(false);
  }

  function interactWithRoomObject() {
    if (!state.nearbyRoomObject || !state.activeWebRoomHouse) {
      if (isCustomIndoorRoomOpen()) {
        refs.roomInteractionHint.textContent = "Move closer to the character or newspapers.";
        refs.roomInteractionHint.classList.remove("hidden");
      } else {
        setStatus("Walk close to the character or newspapers first.");
      }
      return;
    }

    if (state.nearbyRoomObject === "npc") {
      const npcText = state.activeWebRoomHouse.npcText || `Character: Welcome to ${state.activeWebRoomHouse.name}.`;
      if (isCustomIndoorRoomOpen()) {
        refs.roomInteractionHint.textContent = npcText;
        refs.roomInteractionHint.classList.remove("hidden");
      } else {
        setStatus(`${npcText} I can help you navigate this room.`);
      }
      return;
    }

    if (isCustomIndoorRoomOpen()) {
      refs.roomInteractionHint.textContent = "Newspapers: Headlines mention browsers and internet history.";
      refs.roomInteractionHint.classList.remove("hidden");
    } else {
      setStatus("Newspapers: Headlines mention browsers, open web standards, and internet history.");
    }
  }

  function isWebRoomOpen() {
    return !refs.webRoom.classList.contains("hidden");
  }

  function isCustomIndoorRoomOpen() {
    return isWebRoomOpen() && isWebsiteShortcutHouse(state.activeWebRoomHouse);
  }

  function setWebRoomContentMode(useIndoorScene) {
    refs.webRoomDescription.classList.toggle("hidden", useIndoorScene);
    refs.webRoomOpenButton?.classList.toggle("hidden", useIndoorScene);
    refs.webRoomResults.classList.toggle("hidden", useIndoorScene);
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
        refs.navigatorSearchInput.value = query;
        refs.navigatorSearchForm.requestSubmit();
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
          title: "How this house works",
          description: house.roomTip,
        }),
      );
    }
  }

  function clearGeneratedIndoorBackdrop() {
    refs.roomIndoorBackdrop.classList.add("hidden");
    refs.roomIndoorBackdrop.style.backgroundImage = "";
    refs.roomScene.classList.remove("has-generated-indoor");
  }

  function setGeneratedIndoorBackdrop(imageSource) {
    if (!imageSource) {
      clearGeneratedIndoorBackdrop();
      return;
    }

    refs.roomIndoorBackdrop.style.backgroundImage = `url(${JSON.stringify(imageSource)})`;
    refs.roomIndoorBackdrop.classList.remove("hidden");
    refs.roomScene.classList.add("has-generated-indoor");
  }

  function extractGeneratedImageSource(result) {
    const stack = [result];

    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) {
        continue;
      }

      if (typeof current === "string") {
        if (current.startsWith("http") || current.startsWith("data:image/")) {
          return current;
        }
        if (/^[A-Za-z0-9+/=\s]+$/.test(current) && current.trim().length > 128) {
          return `data:image/png;base64,${current.trim()}`;
        }
        continue;
      }

      if (Array.isArray(current)) {
        current.forEach((item) => stack.push(item));
        continue;
      }

      if (typeof current === "object") {
        const prioritizedKeys = [
          "image_url",
          "url",
          "imageUrl",
          "output_url",
          "base64",
          "image_base64",
        ];

        prioritizedKeys.forEach((key) => {
          if (key in current) {
            stack.push(current[key]);
          }
        });

        Object.values(current).forEach((value) => stack.push(value));
      }
    }

    return null;
  }

  async function generateIndoorForHouse(house) {
    if (!house || !isWebsiteShortcutHouse(house)) {
      clearGeneratedIndoorBackdrop();
      return;
    }

    const cached = indoorBackdropCache.get(house.id);
    if (cached) {
      setGeneratedIndoorBackdrop(cached);
      return;
    }

    if (activeIndoorRequestController) {
      activeIndoorRequestController.abort();
    }

    const controller = new AbortController();
    activeIndoorRequestController = controller;

    const host = getSiteHost(house.url) || house.name || "website";
    setStatus(`Generating indoor for ${host} house...`);

    try {
      const generated = await generatePixfluxImage({
        description: `Retro 16-bit pixel art platformer level.

Strict 2D side view.
No perspective depth.
No 3D rendering.

Scene:
Interior of a house representing the website "${host}".

Theme of the room should match the website type:
- hacker room
- editorial newsroom
- office workspace

Layout rules:
- LEFT SIDE: one large door (must be visible)
- CENTER: platforms, desks, computers and objects arranged like a 2D platform game level
- RIGHT SIDE: a clear stack of newspapers

The website name "${host}" must appear somewhere in the room.

Style:
retro 16-bit pixel art
classic platformer screenshot
flat colors
pixel graphics`,
        width: 128,
        height: 64,
        noBackground: false,
        signal: controller.signal,
      });

      if (activeIndoorRequestController !== controller) {
        return;
      }

      const imageSource = extractGeneratedImageSource(generated);
      if (!imageSource) {
        throw new Error("PixelLab response did not include image data.");
      }

      indoorBackdropCache.set(house.id, imageSource);

      if (state.activeWebRoomHouse?.id === house.id) {
        setGeneratedIndoorBackdrop(imageSource);
        setStatus("Indoor generated. Move around and press E near objects.");
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      if (state.activeWebRoomHouse?.id === house.id) {
        clearGeneratedIndoorBackdrop();
        const message = error instanceof Error ? error.message : "Unknown PixelLab error.";
        setStatus(`Could not generate indoor image: ${message}`);
      }
    } finally {
      if (activeIndoorRequestController === controller) {
        activeIndoorRequestController = null;
      }
    }
  }

  // --- Core Lifecycle ---

  function openWebRoom(house) {
    if (!house) {
      return;
    }

    setMapOpen(state, refs, false);
    state.activeWebRoomHouse = house;
    state.keys.clear();
    setPanelContent(house);
    refs.webRoomLabel.textContent = house.roomMode || "Inside Website House";
    refs.webRoomTitle.textContent = house.name;
    refs.webRoomDescription.textContent = house.roomIntro;

    if (house.url) {
      refs.webRoomOpenButton.classList.remove("hidden");
    } else {
      refs.webRoomOpenButton.classList.add("hidden");
    }

    const useIndoorScene = isWebsiteShortcutHouse(house);
    setWebRoomContentMode(useIndoorScene);
    refs.roomScene.classList.toggle("hidden", !useIndoorScene);

    if (useIndoorScene) {
      const npcSprite = refs.roomNpc.querySelector(".player-sprite");
      if (npcSprite) {
        npcSprite.style.backgroundImage = house.npcAsset ? `url(${house.npcAsset})` : "";
      }
    }

    refs.webRoom.classList.remove("hidden");
    refs.webRoom.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    if (useIndoorScene) {
      resetRoomAvatar();
      clearGeneratedIndoorBackdrop();
      setStatus("Preparing indoor scene...");
      generateIndoorForHouse(house);
    } else {
      state.roomKeys.clear();
      state.nearbyRoomObject = null;
      setRoomInteractionHint(null);
      clearGeneratedIndoorBackdrop();
      setStatus("Navigator room active. Use search below.");
    }

    setDefaultWebRoomContent(house);
    if (useIndoorScene) {
      updateRoomNearbyObject();
    }
  }

  function closeWebRoom() {
    if (activeIndoorRequestController) {
      activeIndoorRequestController.abort();
      activeIndoorRequestController = null;
    }

    clearGeneratedIndoorBackdrop();
    state.activeWebRoomHouse = null;
    state.keys.clear();
    state.roomKeys.clear();
    state.nearbyRoomObject = null;
    setRoomInteractionHint(null);
    refs.webRoom.classList.add("hidden");
    refs.webRoom.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function updateHouseBrowserState() {
    refs.houseBrowserList.querySelectorAll(".house-browser-item").forEach((item) => {
      const houseId = item.dataset.houseId;
      const isSelected = state.selectedHouse && state.selectedHouse.id === houseId;
      const isNearby = state.nearbyHouse && state.nearbyHouse.id === houseId;

      item.classList.toggle("active", Boolean(isSelected));
      item.classList.toggle("nearby", Boolean(isNearby));
    });
  }

  function renderHouseBrowser() {
    refs.houseBrowserList.innerHTML = "";

    state.houses.forEach((house) => {
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
        setMapOpen(state, refs, false);
      });

      const enterButton = makeButton(
        "Open",
        () => {
          openWebRoom(house);
        },
        "button-primary",
      );

      const visitButton = makeLink("Visit", house.url);

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
    
    // Check for Grandma interaction first
    const grandmaBox = { 
      x: refs.dnsGrandma.offsetLeft, 
      y: refs.dnsGrandma.offsetTop, 
      width: 64, 
      height: 64 
    };

    const interactGrandmaZone = {
      x: grandmaBox.x - 20,
      y: grandmaBox.y - 20,
      width: grandmaBox.width + 40,
      height: grandmaBox.height + 60
    };

    if (intersects(playerBox, interactGrandmaZone)) {
      state.nearbyHouse = null;
      state.isNearbyGrandma = true;
      refs.promptElement.textContent = "Press E to talk to DNS Grandma";
      refs.promptElement.classList.remove("hidden");
      updateHouseBrowserState();
      return;
    }

    state.isNearbyGrandma = false;
    state.nearbyHouse = state.houses.find((house) => intersects(playerBox, house.interactZone)) || null;

    document.querySelectorAll(".house").forEach((element) => {
      const isNearby = state.nearbyHouse && element.dataset.houseId === state.nearbyHouse.id;
      element.classList.toggle("nearby", Boolean(isNearby));
    });

    if (state.nearbyHouse) {
      refs.promptElement.textContent = `Press E to enter ${state.nearbyHouse.name}`;
      refs.promptElement.classList.remove("hidden");
    } else {
      refs.promptElement.classList.add("hidden");
    }

    updateHouseBrowserState();
  }

  function updateCamera() {
    const frame = refs.world.parentElement;
    const vpW = frame.clientWidth;
    const vpH = frame.clientHeight;
    const rawCamY = vpH / 2 - state.player.y - state.player.height / 2;
    const rawCamX = vpW / 2 - state.player.x - state.player.width / 2;
    const camX = worldBounds.width <= vpW ? (vpW - worldBounds.width) / 2 : clamp(rawCamX, vpW - worldBounds.width, 0);
    const camY = worldBounds.height <= vpH ? (vpH - worldBounds.height) / 2 : clamp(rawCamY, vpH - worldBounds.height, 0);
    refs.world.style.transform = `translate(${camX}px, ${camY}px)`;
  }

  function gameLoop(timestamp) {
    const delta = timestamp - (state.lastTimestamp || timestamp);
    state.lastTimestamp = timestamp;

    if (isCustomIndoorRoomOpen()) {
      moveRoomAvatar(state, refs, delta, updateRoomNearbyObject, updateRoomAvatarRender);
    } else {
      movePlayer(state, refs, delta);
    }

    updatePlayerRender(state, refs);
    updateNearbyHouse();
    updateCamera();

    state.rafId = requestAnimationFrame(gameLoop);
  }

  function onKeyDown(event) {
    const key = event.key.toLowerCase();
    const isTyping = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement;

    if (key === "m") {
      if (isTyping || state.isMapOpen || isWebRoomOpen()) {
        return;
      }
      event.preventDefault();
      setMapOpen(state, refs, !state.isMapOpen);
      return;
    }

    if (key === "escape") {
      if (state.isMapOpen) {
        event.preventDefault();
        setMapOpen(state, refs, false);
        return;
      }
      if (isWebRoomOpen()) {
        event.preventDefault();
        closeWebRoom();
        return;
      }
    }

    if (isTyping || state.isMapOpen) {
      return;
    }

    if (isWebRoomOpen()) {
      if (isCustomIndoorRoomOpen() && movementKeys.includes(key)) {
        event.preventDefault();
        state.roomKeys.add(key);
      }

      if (isCustomIndoorRoomOpen() && key === "e") {
        event.preventDefault();
        interactWithRoomObject();
      }
      return;
    }

    if ([...movementKeys, "e", " "].includes(key)) {
      event.preventDefault();
    }

    if (key === "e") {
      if (state.isNearbyGrandma) {
        setStatus("DNS Grandma: Welcome to the intersection of the World Wide Web, child! I'm here to make sure every name finds its home.");
        return;
      }
      if (state.nearbyHouse) {
        openWebRoom(state.nearbyHouse);
        return;
      }
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
    setMapOpen(state, refs, false);
  }

  function onWebRoomClick(event) {
    if (event.target instanceof HTMLElement && event.target.dataset.closeWebRoom === "true") {
      closeWebRoom();
    }
  }

  function onWebRoomOpenClick() {
    if (state.activeWebRoomHouse?.url) {
      window.open(state.activeWebRoomHouse.url, "_blank", "noopener,noreferrer");
    }
  }

  async function onNavigatorSubmit(event) {
    event.preventDefault();
    await handleWebRoomSearch(refs.navigatorSearchInput.value);
  }

  async function handleWebRoomSearch(query) {
    if (!query.trim()) {
      setStatus("Type something first.");
      if (state.activeWebRoomHouse) {
        setDefaultWebRoomContent(state.activeWebRoomHouse);
      }
      return;
    }

    try {
      const trimmedQuery = query.trim();
      
      const searchContext = {
        createHouseFromWebsiteUrl,
        setStatus,
        getActiveResultsContainer,
        setWebRoomResultsVisible,
        setDefaultWebRoomContent
      };

      await runBrowserSearch(state, refs, trimmedQuery, searchContext);
    } catch {
      setStatus("That interaction failed. The external site links are still available.");
      if (state.activeWebRoomHouse) {
        setDefaultWebRoomContent(state.activeWebRoomHouse);
      }
    }
  }

  function start() {
    renderGrass();
    updatePlayerRender(state, refs);
    updateRoomAvatarRender(false);
    renderPlaceholderHouses();
    renderMapHouseMarkers(state, refs, setPanelContent);
    renderHouseBrowser();
    setPanelContent(null);
    state.rafId = requestAnimationFrame(gameLoop);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    refs.enterRoomButton.addEventListener("click", onEnterRoomClick);
    refs.toggleMapButton.addEventListener("click", () => setMapOpen(state, refs, !state.isMapOpen));
    refs.closeMapButton.addEventListener("click", onCloseMapClick);
    refs.webRoom.addEventListener("click", onWebRoomClick);
    refs.webRoomOpenButton.addEventListener("click", onWebRoomOpenClick);
    refs.navigatorSearchForm.addEventListener("submit", onNavigatorSubmit);
  }

  function renderGrass() {
    const worldWidth = 4000;
    const worldHeight = 2500;
    const grassCount = 150; // Increased from 60 to 150

    for (let i = 0; i < grassCount; i++) {
      const size = 160;
      const x = Math.random() * (worldWidth - size);
      const y = Math.random() * (worldHeight - size);

      // Grass box (expanded slightly for safety)
      const gBox = { x: x + 20, y: y + 20, width: size - 40, height: size - 40 };

      // Horizontal road: top 642, height 116
      const hRoad = { x: 0, y: 642, width: worldWidth, height: 116 };
      // Vertical road: left 1675 (centered), width 126
      const vRoad = { x: 1675 - 63, y: 150, width: 126, height: worldHeight - 150 };

      if (intersects(gBox, hRoad) || intersects(gBox, vRoad)) {
        continue;
      }

      const grass = document.createElement("div");
      grass.className = "grass-tuft";
      grass.style.left = `${x}px`;
      grass.style.top = `${y}px`;
      grass.style.zIndex = Math.floor(y);
      
      // Randomly flip or scale slightly
      const scale = 0.8 + Math.random() * 0.4;
      const flip = Math.random() > 0.5 ? -1 : 1;
      grass.style.transform = `scale(${scale}, ${scale}) scaleX(${flip})`;

      refs.world.appendChild(grass);
    }
  }

  function stop() {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = null;
    }

    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    refs.enterRoomButton.removeEventListener("click", onEnterRoomClick);
    refs.toggleMapButton.removeEventListener("click", () => setMapOpen(state, refs, !state.isMapOpen));
    refs.closeMapButton.removeEventListener("click", onCloseMapClick);
    refs.webRoom.removeEventListener("click", onWebRoomClick);
    refs.webRoomOpenButton.removeEventListener("click", onWebRoomOpenClick);
    refs.navigatorSearchForm.removeEventListener("submit", onNavigatorSubmit);
    document.body.style.overflow = "";
  }

  return { start, stop };
}
