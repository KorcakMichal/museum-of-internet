(function () {
  const ROOM_WIDTH = 700;
  const ROOM_HEIGHT = 320;
  const PLAYER_WIDTH = 34;
  const PLAYER_HEIGHT = 46;
  const PLAYER_SPEED = 220;
  const TARGET_SCORE = 6;

  let state = null;

  function getSiteHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  }

  function isWebsiteShortcutHouse(house) {
    return house?.interactionType === "website-shortcut";
  }

  function getIndoorMeta(house) {
    if (!house) {
      return {
        label: "Inside Website House",
        title: "Web Room",
        description: "Enter a house to interact with the website from inside the game.",
        status: "Choose a prompt below or type into the room.",
      };
    }

    if (isWebsiteShortcutHouse(house)) {
      const host = getSiteHost(house.url) || house.url || house.name;
      return {
        label: house.roomMode || "Website Shortcut Room",
        title: house.name,
        description: `You are inside a shortcut room for ${host}. Stabilize the portal by collecting signals, then use the room to open the site, search within it, or inspect its archive history.`,
        status: `Inside ${host}. Clear the indoor route, then use the website tools below.`,
      };
    }

    return {
      label: house.roomMode || "Inside Website House",
      title: house.name,
      description: `${house.roomIntro || "Enter a house to interact with the website from inside the game."} This interior now contains a playable network run.`,
      status: `Inside ${house.name}. Collect the signals and avoid glitches.`,
    };
  }

  function hashSeed(input) {
    return Array.from(input || "museum").reduce((value, char) => value + char.charCodeAt(0), 0);
  }

  function createRng(seed) {
    let value = seed % 2147483647;
    if (value <= 0) {
      value += 2147483646;
    }

    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

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

  function getTheme(house) {
    const host = getSiteHost(house?.url) || house?.id || "museum";
    const seed = hashSeed(host);
    const hue = seed % 360;

    return {
      room: `linear-gradient(135deg, hsla(${hue}, 70%, 88%, 0.95), hsla(${(hue + 45) % 360}, 70%, 72%, 0.96))`,
      lane: `hsla(${(hue + 14) % 360}, 75%, 38%, 0.34)`,
      orb: `hsl(${(hue + 180) % 360}, 90%, 58%)`,
      badge: `hsla(${hue}, 85%, 96%, 0.95)`,
      badgeBorder: `hsla(${hue}, 42%, 36%, 0.12)`,
    };
  }

  function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (typeof text === "string") {
      element.textContent = text;
    }
    return element;
  }

  function placeEntity(element, entity) {
    element.style.left = `${entity.x}px`;
    element.style.top = `${entity.y}px`;
  }

  function resetPlayer() {
    if (!state) {
      return;
    }

    state.player.x = 24;
    state.player.y = ROOM_HEIGHT / 2 - PLAYER_HEIGHT / 2;
  }

  function updateStatDisplays() {
    if (!state) {
      return;
    }

    state.refs.score.textContent = `${state.score}/${TARGET_SCORE}`;
    state.refs.timer.textContent = `${Math.max(0, Math.ceil(state.remainingTime))}s`;
    state.refs.health.textContent = `${Math.max(0, 3 - state.hits)}`;
  }

  function setStageMessage(title, body) {
    if (!state) {
      return;
    }

    state.refs.messageTitle.textContent = title;
    state.refs.messageBody.textContent = body;
  }

  function restartGame() {
    if (!state) {
      return;
    }

    const seedBase = hashSeed(`${state.house.id}:${state.runCount}`);
    state.runCount += 1;
    const random = createRng(seedBase || 1);

    state.score = 0;
    state.hits = 0;
    state.completed = false;
    state.remainingTime = 35;
    state.lastTimestamp = 0;
    state.glitchCooldown = 0;
    state.keys.clear();

    resetPlayer();

    state.orbs = Array.from({ length: TARGET_SCORE }, (_, index) => ({
      id: `orb-${index}`,
      x: 90 + random() * 560,
      y: 34 + random() * 240,
      width: 22,
      height: 22,
      collected: false,
      element: state.refs.orbs[index],
    }));

    state.glitches = [
      {
        x: 150 + random() * 420,
        y: 50 + random() * 200,
        width: 42,
        height: 42,
        vx: (random() > 0.5 ? 1 : -1) * (80 + random() * 80),
        vy: (random() > 0.5 ? 1 : -1) * (70 + random() * 70),
        element: state.refs.glitches[0],
      },
      {
        x: 240 + random() * 360,
        y: 40 + random() * 220,
        width: 42,
        height: 42,
        vx: (random() > 0.5 ? 1 : -1) * (95 + random() * 90),
        vy: (random() > 0.5 ? 1 : -1) * (60 + random() * 80),
        element: state.refs.glitches[1],
      },
      {
        x: 330 + random() * 260,
        y: 60 + random() * 180,
        width: 42,
        height: 42,
        vx: (random() > 0.5 ? 1 : -1) * (90 + random() * 90),
        vy: (random() > 0.5 ? 1 : -1) * (85 + random() * 60),
        element: state.refs.glitches[2],
      },
    ];

    state.orbs.forEach((orb) => {
      orb.element.hidden = false;
      placeEntity(orb.element, orb);
    });

    state.glitches.forEach((glitch) => {
      placeEntity(glitch.element, glitch);
    });

    placeEntity(state.refs.player, state.player);
    setStageMessage("Collect all signals", "Use WASD or arrow keys in this room. Avoid the moving glitches.");
    updateStatDisplays();
    focusGame();
  }

  function completeGame() {
    if (!state || state.completed) {
      return;
    }

    state.completed = true;
    setStageMessage("Portal stabilized", "The room is clear. You can now browse the website routes below or restart the run.");
  }

  function failGame() {
    if (!state) {
      return;
    }

    state.remainingTime = 0;
    state.completed = true;
    setStageMessage("Signal lost", "The glitches overran the room. Restart to try again.");
    updateStatDisplays();
  }

  function tick(timestamp) {
    if (!state) {
      return;
    }

    const delta = state.lastTimestamp ? (timestamp - state.lastTimestamp) / 1000 : 0;
    state.lastTimestamp = timestamp;

    if (!state.completed) {
      state.remainingTime = Math.max(0, state.remainingTime - delta);
      if (state.remainingTime <= 0) {
        failGame();
      }

      if (!state.completed) {
        let dx = 0;
        let dy = 0;

        if (state.keys.has("arrowup") || state.keys.has("w")) {
          dy -= 1;
        }
        if (state.keys.has("arrowdown") || state.keys.has("s")) {
          dy += 1;
        }
        if (state.keys.has("arrowleft") || state.keys.has("a")) {
          dx -= 1;
        }
        if (state.keys.has("arrowright") || state.keys.has("d")) {
          dx += 1;
        }

        const magnitude = Math.hypot(dx, dy) || 1;
        state.player.x = clamp(state.player.x + (dx / magnitude) * PLAYER_SPEED * delta, 0, ROOM_WIDTH - PLAYER_WIDTH);
        state.player.y = clamp(state.player.y + (dy / magnitude) * PLAYER_SPEED * delta, 0, ROOM_HEIGHT - PLAYER_HEIGHT);
        state.refs.player.classList.toggle("walking", dx !== 0 || dy !== 0);

        state.glitches.forEach((glitch) => {
          glitch.x += glitch.vx * delta;
          glitch.y += glitch.vy * delta;

          if (glitch.x <= 0 || glitch.x + glitch.width >= ROOM_WIDTH) {
            glitch.x = clamp(glitch.x, 0, ROOM_WIDTH - glitch.width);
            glitch.vx *= -1;
          }
          if (glitch.y <= 0 || glitch.y + glitch.height >= ROOM_HEIGHT) {
            glitch.y = clamp(glitch.y, 0, ROOM_HEIGHT - glitch.height);
            glitch.vy *= -1;
          }
        });

        const playerHitbox = {
          x: state.player.x,
          y: state.player.y,
          width: PLAYER_WIDTH,
          height: PLAYER_HEIGHT,
        };

        state.orbs.forEach((orb) => {
          if (orb.collected) {
            return;
          }

          if (intersects(playerHitbox, orb)) {
            orb.collected = true;
            orb.element.hidden = true;
            state.score += 1;
            setStageMessage("Signal captured", `${TARGET_SCORE - state.score} remaining before the portal is stable.`);
          }
        });

        if (state.score >= TARGET_SCORE) {
          completeGame();
        }

        if (state.glitchCooldown > 0) {
          state.glitchCooldown = Math.max(0, state.glitchCooldown - delta);
        } else {
          const touchingGlitch = state.glitches.some((glitch) => intersects(playerHitbox, glitch));
          if (touchingGlitch) {
            state.hits += 1;
            state.glitchCooldown = 1.1;
            resetPlayer();
            setStageMessage("Glitch collision", "You were pushed back to the entrance. Get around the moving blocks.");
            if (state.hits >= 3) {
              failGame();
            }
          }
        }
      }
    }

    placeEntity(state.refs.player, state.player);
    state.glitches.forEach((glitch) => placeEntity(glitch.element, glitch));
    updateStatDisplays();
    state.frame = requestAnimationFrame(tick);
  }

  function focusGame() {
    state?.refs.stage.focus();
  }

  function handleKeyDown(event) {
    if (!state) {
      return false;
    }

    const key = event.key.toLowerCase();
    const tagName = event.target instanceof HTMLElement ? event.target.tagName : "";
    const typingTarget = tagName === "INPUT" || tagName === "TEXTAREA";

    if (typingTarget) {
      return false;
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      state.keys.add(key);
      return true;
    }

    if (key === "r") {
      restartGame();
      return true;
    }

    return false;
  }

  function handleKeyUp(event) {
    if (!state) {
      return false;
    }

    const key = event.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
      state.keys.delete(key);
      return true;
    }

    return false;
  }

  function unmountGame() {
    if (!state) {
      return;
    }

    cancelAnimationFrame(state.frame);
    state.container.innerHTML = "";
    state = null;
  }

  function mountGame(container, house) {
    unmountGame();

    if (!container || !house) {
      return;
    }

    const theme = getTheme(house);
    const shell = makeElement("section", "indoor-game-shell");
    const topbar = makeElement("div", "indoor-game-topbar");
    const titleWrap = makeElement("div");
    const title = makeElement("h3", null, "Indoor Packet Run");
    const copy = makeElement(
      "p",
      "indoor-game-copy",
      "Collect every signal orb before the room timer ends. Glitches knock you back to the entrance."
    );
    const badge = makeElement("div", "indoor-game-badge", house.roomMode || "Indoor Room");
    const stats = makeElement("div", "indoor-game-stats");
    const stage = makeElement("div", "indoor-stage");
    const lanes = [makeElement("div", "indoor-lane"), makeElement("div", "indoor-lane"), makeElement("div", "indoor-lane")];
    const player = makeElement("div", "indoor-avatar");
    const playerShadow = makeElement("div", "player-shadow");
    const playerSprite = makeElement("div", "player-sprite");
    const playerHead = makeElement("span", "head");
    const playerBody = makeElement("span", "body");
    const glitches = [makeElement("div", "indoor-glitch"), makeElement("div", "indoor-glitch"), makeElement("div", "indoor-glitch")];
    const orbs = Array.from({ length: TARGET_SCORE }, () => makeElement("div", "indoor-orb"));
    const stageMessage = makeElement("div", "indoor-stage-message");
    const messageTitle = makeElement("strong");
    const messageBody = makeElement("span");
    const actions = makeElement("div", "indoor-game-actions");
    const hint = makeElement("p", "indoor-game-hint", "Move with WASD or arrow keys. Press R to restart the indoor run.");

    stage.tabIndex = 0;
    stage.style.background = theme.room;
    badge.style.background = theme.badge;
    badge.style.border = `1px solid ${theme.badgeBorder}`;

    lanes[0].style.cssText = `left: 24px; top: 44px; width: 650px; height: 18px; background: ${theme.lane};`;
    lanes[1].style.cssText = `left: 60px; top: 146px; width: 560px; height: 18px; background: ${theme.lane};`;
    lanes[2].style.cssText = `left: 100px; top: 252px; width: 520px; height: 18px; background: ${theme.lane};`;

    playerSprite.appendChild(playerHead);
    playerSprite.appendChild(playerBody);
    player.appendChild(playerShadow);
    player.appendChild(playerSprite);

    orbs.forEach((orb) => {
      orb.style.color = theme.orb;
    });

    [
      { label: "Signals", key: "score" },
      { label: "Time Left", key: "timer" },
      { label: "Integrity", key: "health" },
    ].forEach((item) => {
      const card = makeElement("div", "indoor-stat");
      const label = makeElement("span", "indoor-stat-label", item.label);
      const value = makeElement("span", "indoor-stat-value", "-");
      value.dataset.statKey = item.key;
      card.appendChild(label);
      card.appendChild(value);
      stats.appendChild(card);
    });

    titleWrap.appendChild(title);
    titleWrap.appendChild(copy);
    topbar.appendChild(titleWrap);
    topbar.appendChild(badge);
    shell.appendChild(topbar);
    shell.appendChild(stats);
    shell.appendChild(stage);

    lanes.forEach((lane) => stage.appendChild(lane));
    orbs.forEach((orb) => stage.appendChild(orb));
    glitches.forEach((glitch) => stage.appendChild(glitch));
    stage.appendChild(player);
    stageMessage.appendChild(messageTitle);
    stageMessage.appendChild(messageBody);
    stage.appendChild(stageMessage);

    const restartButton = makeElement("button", "button button-primary", "Restart Run");
    restartButton.type = "button";
    restartButton.addEventListener("click", restartGame);

    const focusButton = makeElement("button", "button button-secondary", "Focus Game");
    focusButton.type = "button";
    focusButton.addEventListener("click", focusGame);

    actions.appendChild(restartButton);
    actions.appendChild(focusButton);
    shell.appendChild(actions);
    shell.appendChild(hint);

    container.appendChild(shell);

    state = {
      container,
      house,
      score: 0,
      hits: 0,
      completed: false,
      remainingTime: 35,
      lastTimestamp: 0,
      glitchCooldown: 0,
      frame: 0,
      runCount: 1,
      keys: new Set(),
      player: { x: 24, y: ROOM_HEIGHT / 2 - PLAYER_HEIGHT / 2, width: PLAYER_WIDTH, height: PLAYER_HEIGHT },
      refs: {
        stage,
        player,
        glitches,
        orbs,
        score: stats.querySelector('[data-stat-key="score"]'),
        timer: stats.querySelector('[data-stat-key="timer"]'),
        health: stats.querySelector('[data-stat-key="health"]'),
        messageTitle,
        messageBody,
      },
      orbs: [],
      glitches: [],
    };

    restartGame();
    state.frame = requestAnimationFrame(tick);
  }

  window.houseIndoor = {
    getIndoorMeta,
    mountGame,
    unmountGame,
    handleKeyDown,
    handleKeyUp,
    focusGame,
  };
})();