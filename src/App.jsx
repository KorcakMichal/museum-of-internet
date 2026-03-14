import React, { useEffect, useRef, useState } from 'react';
import { initMuseumGame } from './game';

const welcomeTranslations = {
  en: {
    welcomeAria: 'Welcome page',
    museumLabel: 'Museum of Internet',
    title: 'Website Shortcut Room',
    intro:
      'Step into a vintage town where each house opens a piece of the web. Wander the streets, summon new sites, and explore internet places as pixel rooms.',
    enterMuseum: 'Enter Museum',
    languageLabel: 'Language',
    howToPlayLabel: 'How To Play',
    walkTownTitle: 'Walk The Town',
    walkTownText: 'Move with WASD or arrow keys and approach houses to discover websites placed around the square.',
    discoverLabel: 'Discover',
    openWebRoomsTitle: 'Open Web Rooms',
    openWebRoomsText:
      'Press E near a house to enter. Custom website houses become stylized interiors inspired by the linked website, while base town houses are not interactable.',
    createLabel: 'Create',
    summonTitle: 'Summon New Houses',
    summonText: 'Use the browser house to add more sites to the map and let their interiors generate in the background.',
    summonImageAlt: 'Preview of summoning a new website house',
    mapAria: 'Town map overview',
    worldAria: 'Town map',
    playerAria: 'Player character',
    grandmaNpcAria: 'DNS Grandma NPC',
    miniMapAria: 'Overview map with houses and player position',
    houseBrowserAria: 'House browser',
    roomSceneAria: 'Room scene decoration',
    roomWalkAreaAria: 'Walkable room area',
    mapTitle: 'Town Navigator',
    close: 'Close',
    summonMapLabel: 'Summon New House',
    summonPlaceholder: 'Type a URL or search query...',
    summonButton: 'Summon',
    nearbyLabel: 'Nearby',
    panelTitle: 'Town Square',
    panelDescription: 'Walk up to a house and press E. Each building represents a real place on the internet.',
    openWebRoom: 'Open Web Room',
    visitWebsite: 'Visit Website',
    showMap: 'Show Map',
    houseBrowser: 'House Browser',
    browserFact: 'Browser House: a general web navigator room.',
    webRoomLabel: 'Inside Website House',
    webRoomTitle: 'Web Room',
    webRoomDescription: 'Enter a house to interact with the website from inside the game.',
    webRoomVisitSite: 'Visit Real Site',
    npcChatLabel: 'NPC Chat',
    grandmaTitle: 'DNS Grandma',
    grandmaDescription: 'Ask anything about moving around town, opening houses, and using map controls.',
    grandmaPlaceholder: 'Ask DNS Grandma what to do next...',
    send: 'Send',
    openSettings: 'Open settings',
    settingsTitle: 'Settings',
    gameSettingsTitle: 'Game Settings',
    audioLabel: 'Audio',
    muteMusic: 'Mute Music',
    unmuteMusic: 'Unmute Music',
    backgroundMusicVolume: 'Background Music Volume',
    backgroundMusicVolumeAria: 'Background music volume',
    fullscreenEnter: 'Enter fullscreen',
    fullscreenExit: 'Exit fullscreen',
    mapToggleTitle: 'Toggle map',
  },
  cs: {
    welcomeAria: 'Uvítací stránka',
    museumLabel: 'Muzeum Internetu',
    title: 'Místnost Webových Zkratek',
    intro:
      'Vstup do retro městečka, kde každý dům otevírá část webu. Procházej ulicemi, vyvolej nové weby a objevuj internetová místa jako pixelové místnosti.',
    enterMuseum: 'Vstoupit do muzea',
    languageLabel: 'Jazyk',
    howToPlayLabel: 'Jak Hrát',
    walkTownTitle: 'Projdi Město',
    walkTownText: 'Pohybuj se pomocí WASD nebo šipek a přibliž se k domům, abys objevil weby rozmístěné po náměstí.',
    discoverLabel: 'Objevuj',
    openWebRoomsTitle: 'Otevírej Webové Místnosti',
    openWebRoomsText:
      'Stiskni E u domu pro vstup. Vlastní webové domy se mění na stylizované interiéry inspirované odkazovaným webem, zatímco základní městské domy nejsou interaktivní.',
    createLabel: 'Tvoř',
    summonTitle: 'Vyvolej Nové Domy',
    summonText: 'Použij browser house pro přidání dalších webů na mapu a nech jejich interiéry vygenerovat na pozadí.',
    summonImageAlt: 'Náhled vyvolání nového webového domu',
    mapAria: 'Přehled mapy města',
    worldAria: 'Mapa města',
    playerAria: 'Postava hráče',
    grandmaNpcAria: 'DNS Babička NPC',
    miniMapAria: 'Přehled mapy s domy a pozicí hráče',
    houseBrowserAria: 'Prohlížeč domů',
    roomSceneAria: 'Dekorace místnosti',
    roomWalkAreaAria: 'Průchozí část místnosti',
    mapTitle: 'Navigátor Města',
    close: 'Zavřít',
    summonMapLabel: 'Vyvolej Nový Dům',
    summonPlaceholder: 'Napiš URL nebo hledaný dotaz...',
    summonButton: 'Vyvolat',
    nearbyLabel: 'Nablízku',
    panelTitle: 'Náměstí',
    panelDescription: 'Přijdi k domu a stiskni E. Každá budova představuje skutečné místo na internetu.',
    openWebRoom: 'Otevřít Webovou Místnost',
    visitWebsite: 'Navštívit Web',
    showMap: 'Zobrazit Mapu',
    houseBrowser: 'Prohlížeč Domů',
    browserFact: 'Browser House: obecná navigační místnost webu.',
    webRoomLabel: 'Uvnitř Webového Domu',
    webRoomTitle: 'Webová Místnost',
    webRoomDescription: 'Vstup do domu a interaguj s webem přímo ve hře.',
    webRoomVisitSite: 'Navštívit Skutečný Web',
    npcChatLabel: 'Chat s NPC',
    grandmaTitle: 'DNS Babička',
    grandmaDescription: 'Ptej se na pohyb po městě, otevírání domů a ovládání mapy.',
    grandmaPlaceholder: 'Zeptej se DNS Babičky, co dělat dál...',
    send: 'Odeslat',
    openSettings: 'Otevřít nastavení',
    settingsTitle: 'Nastavení',
    gameSettingsTitle: 'Nastavení hry',
    audioLabel: 'Zvuk',
    muteMusic: 'Vypnout hudbu',
    unmuteMusic: 'Zapnout hudbu',
    backgroundMusicVolume: 'Hlasitost hudby na pozadí',
    backgroundMusicVolumeAria: 'Hlasitost hudby na pozadí',
    fullscreenEnter: 'Zapnout celou obrazovku',
    fullscreenExit: 'Vypnout celou obrazovku',
    mapToggleTitle: 'Přepnout mapu',
  },
};

export default function App() {
  const audioRef = useRef(null);
  const musicMutedRef = useRef(false);
  const musicVolumeRef = useRef(35);
  const gameApiRef = useRef(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(35);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [locale, setLocale] = useState(() => {
    if (typeof window === 'undefined') {
      return 'en';
    }

    try {
      const stored = window.localStorage.getItem('museum-locale');
      return stored === 'cs' ? 'cs' : 'en';
    } catch {
      return 'en';
    }
  });
  const welcomeText = welcomeTranslations[locale] || welcomeTranslations.en;

  useEffect(() => {
    try {
      window.localStorage.setItem('museum-locale', locale);
    } catch {
      // Ignore storage errors.
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const noHover = window.matchMedia('(hover: none)');

    const updateTouchControls = () => {
      const isNarrowViewport = window.innerWidth <= 1024;
      const touchCapable = window.navigator.maxTouchPoints > 0;
      setShowTouchControls(isNarrowViewport && touchCapable && (coarsePointer.matches || noHover.matches));
    };

    updateTouchControls();
    window.addEventListener('resize', updateTouchControls);
    coarsePointer.addEventListener('change', updateTouchControls);
    noHover.addEventListener('change', updateTouchControls);

    return () => {
      window.removeEventListener('resize', updateTouchControls);
      coarsePointer.removeEventListener('change', updateTouchControls);
      noHover.removeEventListener('change', updateTouchControls);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    musicMutedRef.current = musicMuted;
    musicVolumeRef.current = musicVolume;
    audio.muted = musicMuted;
    audio.volume = Math.max(0, Math.min(1, musicVolume / 100));
  }, [musicMuted, musicVolume]);

  useEffect(() => {
    if (!isSettingsOpen) {
      return;
    }

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isSettingsOpen]);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const gameApi = initMuseumGame(document, { locale });
    gameApiRef.current = gameApi;

    const backgroundMusic = new Audio('/sounds/background_sound.mp3');
    backgroundMusic.loop = false;
    backgroundMusic.volume = 0;
    backgroundMusic.muted = musicMutedRef.current;
    audioRef.current = backgroundMusic;

    let disposed = false;
    let fadeRaf = null;
    let loopWatchRaf = null;
    let inLoopTransition = false;
    const loopFadeSeconds = 0.14;
    const loopTriggerSeconds = 0.22;

    const stopFade = () => {
      if (fadeRaf !== null) {
        cancelAnimationFrame(fadeRaf);
        fadeRaf = null;
      }
    };

    const stopLoopWatch = () => {
      if (loopWatchRaf !== null) {
        cancelAnimationFrame(loopWatchRaf);
        loopWatchRaf = null;
      }
    };

    const getTargetVolume = () => Math.max(0, Math.min(1, musicVolumeRef.current / 100));

    const fadeInMusic = () => {
      stopFade();

      const target = getTargetVolume();
      const step = () => {
        if (disposed || !audioRef.current || audioRef.current !== backgroundMusic) {
          return;
        }

        const current = backgroundMusic.volume;
        if (current >= target || target === 0 || backgroundMusic.muted) {
          backgroundMusic.volume = target;
          fadeRaf = null;
          return;
        }

        backgroundMusic.volume = Math.min(target, current + 0.02);
        fadeRaf = requestAnimationFrame(step);
      };

      fadeRaf = requestAnimationFrame(step);
    };

    const loopTransition = () => {
      if (disposed || inLoopTransition || backgroundMusic.paused) {
        return;
      }

      inLoopTransition = true;
      const originalTarget = getTargetVolume();
      const startVolume = backgroundMusic.muted ? 0 : backgroundMusic.volume;
      const fadeSteps = Math.max(1, Math.round(loopFadeSeconds * 60));
      let stepCount = 0;

      const fadeOutStep = () => {
        if (disposed || backgroundMusic.paused) {
          inLoopTransition = false;
          return;
        }

        stepCount += 1;
        const t = stepCount / fadeSteps;
        const eased = t * t;
        backgroundMusic.volume = Math.max(0, startVolume * (1 - eased));

        if (stepCount < fadeSteps) {
          requestAnimationFrame(fadeOutStep);
          return;
        }

        backgroundMusic.currentTime = 0;
        const replayPromise = backgroundMusic.play();
        if (replayPromise && typeof replayPromise.catch === 'function') {
          replayPromise.catch(() => {
            inLoopTransition = false;
          });
        }

        if (!backgroundMusic.muted) {
          backgroundMusic.volume = 0;
          const fadeInSteps = Math.max(1, Math.round(loopFadeSeconds * 60));
          let fadeInCount = 0;

          const fadeInStep = () => {
            if (disposed || backgroundMusic.paused || backgroundMusic.muted) {
              inLoopTransition = false;
              return;
            }

            fadeInCount += 1;
            const p = fadeInCount / fadeInSteps;
            const easedIn = p * (2 - p);
            backgroundMusic.volume = Math.min(originalTarget, originalTarget * easedIn);

            if (fadeInCount < fadeInSteps) {
              requestAnimationFrame(fadeInStep);
              return;
            }

            backgroundMusic.volume = originalTarget;
            inLoopTransition = false;
          };

          requestAnimationFrame(fadeInStep);
        } else {
          inLoopTransition = false;
        }
      };

      requestAnimationFrame(fadeOutStep);
    };

    const watchLoopPoint = () => {
      if (disposed || !audioRef.current || audioRef.current !== backgroundMusic) {
        return;
      }

      if (!backgroundMusic.paused && Number.isFinite(backgroundMusic.duration) && backgroundMusic.duration > 0) {
        const timeLeft = backgroundMusic.duration - backgroundMusic.currentTime;
        if (timeLeft <= loopTriggerSeconds) {
          loopTransition();
        }
      }

      loopWatchRaf = requestAnimationFrame(watchLoopPoint);
    };

    const tryPlayMusic = () => {
      if (disposed) {
        return;
      }

      const playPromise = backgroundMusic.play();
      if (!playPromise) {
        fadeInMusic();
        return;
      }

      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {
          // Autoplay can be blocked until a user interaction.
        });
        playPromise.then(() => {
          fadeInMusic();
        });
      }
    };

    const startMusicOnInteraction = () => {
      tryPlayMusic();
      window.removeEventListener('pointerdown', startMusicOnInteraction);
      window.removeEventListener('keydown', startMusicOnInteraction);
      window.removeEventListener('touchstart', startMusicOnInteraction);
    };

    tryPlayMusic();
    watchLoopPoint();
    window.addEventListener('pointerdown', startMusicOnInteraction, { once: true });
    window.addEventListener('keydown', startMusicOnInteraction, { once: true });
    window.addEventListener('touchstart', startMusicOnInteraction, { once: true });

    return () => {
      disposed = true;
      stopFade();
      stopLoopWatch();
      window.removeEventListener('pointerdown', startMusicOnInteraction);
      window.removeEventListener('keydown', startMusicOnInteraction);
      window.removeEventListener('touchstart', startMusicOnInteraction);
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      if (audioRef.current === backgroundMusic) {
        audioRef.current = null;
      }
      gameApiRef.current?.cleanup();
      gameApiRef.current = null;
    };
  }, [hasStarted, locale]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleVolumeChange = (event) => {
    setMusicVolume(Number(event.target.value));
  };

  const toggleMusicMute = () => {
    setMusicMuted((prev) => !prev);
  };

  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  const startGame = () => {
    setHasStarted(true);
  };

  return (
    <main className="app-shell">
      {hasStarted ? (
        <>
          <section className="game-layout">
            <div className="world-frame">
              <div id="world" className="world" aria-label={welcomeText.worldAria}>
                <div className="road road-horizontal"></div>
                <div className="road road-vertical"></div>
                <div className="square"></div>

                <div className="trees trees-top"></div>
                <div className="trees trees-bottom"></div>

                <div id="player" className="player" aria-label={welcomeText.playerAria}>
                  <div className="player-shadow"></div>
                  <div className="player-sprite"></div>
                </div>

                <div id="dnsGrandma" className="npc dns-grandma" aria-label={welcomeText.grandmaNpcAria}>
                  <div className="player-shadow"></div>
                  <div className="player-sprite"></div>
                </div>
              </div>
              <div id="interactionPrompt" className="interaction-prompt hidden" aria-live="polite"></div>

              <section id="mapOverlay" className="map-overlay hidden" aria-hidden="true" aria-label={welcomeText.mapAria}>
                <header className="map-overlay-header">
                  <div>
                    <p className="panel-label">{welcomeText.museumLabel}</p>
                    <h3>{welcomeText.mapTitle}</h3>
                  </div>
                  <button id="closeMapButton" className="button button-secondary" type="button">
                    {welcomeText.close}
                  </button>
                </header>

                <div className="map-overlay-content">
                  <div id="miniMap" className="mini-map" role="img" aria-label={welcomeText.miniMapAria}>
                    <div id="mapHouseMarkers" className="map-house-markers"></div>
                    <div id="mapPlayerMarker" className="map-player-marker" aria-hidden="true"></div>
                  </div>

                  <aside className="navigator-form">
                    <p className="panel-label">{welcomeText.summonMapLabel}</p>
                    <form id="navigatorSearchForm" className="browser-search">
                      <input
                        id="navigatorSearchInput"
                        type="text"
                        name="query"
                        autoComplete="off"
                        placeholder={welcomeText.summonPlaceholder}
                      />
                      <button className="button button-primary" type="submit">
                        {welcomeText.summonButton}
                      </button>
                    </form>
                    <div id="navigatorStatus" className="status-text tiny"></div>
                    <div id="navigatorResults" className="navigator-results"></div>
                  </aside>
                </div>
              </section>
            </div>

            <aside className="panel" id="infoPanel">
              <p className="panel-label">{welcomeText.nearbyLabel}</p>
              <h2 id="panelTitle">{welcomeText.panelTitle}</h2>
              <p id="panelDescription">{welcomeText.panelDescription}</p>
              <div className="panel-actions">
                <button id="enterRoomButton" className="button button-primary disabled" type="button">
                  {welcomeText.openWebRoom}
                </button>
                <a id="visitLink" className="button button-primary disabled" href="#" target="_blank" rel="noreferrer">
                  {welcomeText.visitWebsite}
                </a>
                <button id="toggleMapButton" className="button button-secondary" type="button">
                  {welcomeText.showMap}
                </button>
              </div>

              <section className="house-browser-panel" aria-label={welcomeText.houseBrowserAria}>
                <p className="panel-label">{welcomeText.houseBrowser}</p>
                <div id="houseBrowserList" className="house-browser-list"></div>
              </section>

              <ul id="panelFacts" className="facts-list">
                <li>{welcomeText.browserFact}</li>
              </ul>
            </aside>
          </section>

          <div id="webRoom" className="web-room hidden" aria-hidden="true">
            <div className="web-room-backdrop" data-close-web-room="true"></div>
            <section className="web-room-shell" role="dialog" aria-modal="true" aria-labelledby="webRoomTitle">
              <header className="web-room-header">
                <div>
                  <p id="webRoomLabel" className="panel-label">{welcomeText.webRoomLabel}</p>
                  <h2 id="webRoomTitle">{welcomeText.webRoomTitle}</h2>
                </div>
              </header>

              <p id="webRoomDescription" className="web-room-description">
                {welcomeText.webRoomDescription}
              </p>

              <section id="roomScene" className="room-scene" aria-label={welcomeText.roomSceneAria}>
                <div id="roomIndoorBackdrop" className="room-indoor-backdrop hidden" aria-hidden="true"></div>
                <div id="roomWalkArea" className="room-walk-area" aria-label={welcomeText.roomWalkAreaAria}>
                  <div id="roomAvatar" className="room-avatar" aria-hidden="true">
                    <div className="player-shadow"></div>
                    <div className="player-sprite"></div>
                  </div>

                  <div id="roomNpc" className="room-npc room-object hidden" aria-hidden="true">
                    <div className="player-shadow"></div>
                    <div className="player-sprite"></div>
                  </div>

                  <div id="roomNewspapers" className="room-newspapers room-object hidden" aria-hidden="true">
                    <span className="paper p1"></span>
                    <span className="paper p2"></span>
                    <span className="paper p3"></span>
                  </div>

                  <p id="roomInteractionHint" className="room-interaction-hint hidden" aria-live="polite"></p>
                </div>
              </section>

              <div className="web-room-actions">
                <button id="webRoomOpenButton" className="button button-primary" type="button">
                  {welcomeText.webRoomVisitSite}
                </button>
              </div>

              <div id="webRoomStatus" className="web-room-status" aria-live="polite"></div>
              <section id="webRoomResults" className="web-room-results"></section>
            </section>
          </div>

          <div id="grandmaChat" className="web-room hidden" aria-hidden="true">
            <div className="web-room-backdrop" data-close-grandma-chat="true"></div>
            <section className="web-room-shell grandma-chat-shell" role="dialog" aria-modal="true" aria-labelledby="grandmaChatTitle">
              <header className="web-room-header">
                <div>
                  <p className="panel-label">{welcomeText.npcChatLabel}</p>
                  <h2 id="grandmaChatTitle">{welcomeText.grandmaTitle}</h2>
                </div>
                <button id="grandmaChatCloseButton" className="button button-secondary" type="button">
                  {welcomeText.close}
                </button>
              </header>

              <p className="web-room-description">
                {welcomeText.grandmaDescription}
              </p>

              <section id="grandmaChatMessages" className="grandma-chat-messages" aria-live="polite"></section>

              <form id="grandmaChatForm" className="browser-search grandma-chat-form">
                <input
                  id="grandmaChatInput"
                  type="text"
                  name="grandmaQuestion"
                  autoComplete="off"
                  placeholder={welcomeText.grandmaPlaceholder}
                />
                <button id="grandmaChatSendButton" className="button button-primary" type="submit">
                  {welcomeText.send}
                </button>
              </form>
            </section>
          </div>
        </>
      ) : (
        <section className="welcome-shell" aria-label={welcomeText.welcomeAria}>
          <div className="welcome-backdrop"></div>
          <section className="welcome-card panel">
            <div className="welcome-locale-row">
              <p className="panel-label">{welcomeText.museumLabel}</p>
              <div className="welcome-locale-switch" role="group" aria-label={welcomeText.languageLabel}>
                <button
                  className={`button button-secondary welcome-locale-btn ${locale === 'en' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setLocale('en')}
                  aria-pressed={locale === 'en'}
                >
                  EN
                </button>
                <button
                  className={`button button-secondary welcome-locale-btn ${locale === 'cs' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setLocale('cs')}
                  aria-pressed={locale === 'cs'}
                >
                  CZ
                </button>
              </div>
            </div>
            <h1>{welcomeText.title}</h1>
            <p className="welcome-intro">{welcomeText.intro}</p>

            <div className="welcome-actions">
              <button className="button button-primary welcome-start" type="button" onClick={startGame}>
                {welcomeText.enterMuseum}
              </button>
            </div>

            <div className="welcome-guide-grid">
              <article className="welcome-guide-card">
                <p className="panel-label">{welcomeText.howToPlayLabel}</p>
                <h3>{welcomeText.walkTownTitle}</h3>
                <p>{welcomeText.walkTownText}</p>
              </article>

              <article className="welcome-guide-card">
                <p className="panel-label">{welcomeText.discoverLabel}</p>
                <h3>{welcomeText.openWebRoomsTitle}</h3>
                <p>{welcomeText.openWebRoomsText}</p>
              </article>

              <article className="welcome-guide-card">
                <p className="panel-label">{welcomeText.createLabel}</p>
                <h3>{welcomeText.summonTitle}</h3>
                <img
                  className="welcome-guide-image"
                  src="/assets/walkthrough-preview.png"
                  alt={welcomeText.summonImageAlt}
                />
                <p>{welcomeText.summonText}</p>
              </article>
            </div>
          </section>
        </section>
      )}

      <button
        className="button button-secondary settings-trigger"
        type="button"
        onClick={openSettings}
        aria-label={welcomeText.openSettings}
        title={welcomeText.openSettings}
      >
        <span className="settings-icon" aria-hidden="true"></span>
      </button>

      {hasStarted && showTouchControls && (
        <div className="mobile-controls" aria-hidden="true">
          <div className="mobile-dpad">
            <button
              className="mobile-dpad-btn mobile-dpad-up"
              type="button"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); gameApiRef.current?.pressKey('arrowup'); }}
              onPointerUp={() => gameApiRef.current?.releaseKey('arrowup')}
              onPointerLeave={() => gameApiRef.current?.releaseKey('arrowup')}
            >▲</button>
            <button
              className="mobile-dpad-btn mobile-dpad-left"
              type="button"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); gameApiRef.current?.pressKey('arrowleft'); }}
              onPointerUp={() => gameApiRef.current?.releaseKey('arrowleft')}
              onPointerLeave={() => gameApiRef.current?.releaseKey('arrowleft')}
            >◄</button>
            <button
              className="mobile-dpad-btn mobile-dpad-right"
              type="button"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); gameApiRef.current?.pressKey('arrowright'); }}
              onPointerUp={() => gameApiRef.current?.releaseKey('arrowright')}
              onPointerLeave={() => gameApiRef.current?.releaseKey('arrowright')}
            >►</button>
            <button
              className="mobile-dpad-btn mobile-dpad-down"
              type="button"
              onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); gameApiRef.current?.pressKey('arrowdown'); }}
              onPointerUp={() => gameApiRef.current?.releaseKey('arrowdown')}
              onPointerLeave={() => gameApiRef.current?.releaseKey('arrowdown')}
            >▼</button>
          </div>

          <div className="mobile-actions">
            <button
              className="mobile-btn mobile-fullscreen-btn"
              type="button"
              onClick={toggleFullscreen}
              title={isFullscreen ? welcomeText.fullscreenExit : welcomeText.fullscreenEnter}
            >{isFullscreen ? '⛶' : '⛶'}</button>
            <button
              className="mobile-btn mobile-map-btn"
              type="button"
              onPointerDown={() => gameApiRef.current?.triggerMap()}
              title={welcomeText.mapToggleTitle}
            >M</button>
            <button
              className="mobile-btn mobile-action-btn"
              type="button"
              onPointerDown={() => gameApiRef.current?.triggerAction()}
            >E</button>
          </div>
        </div>
      )}

      <section
        className={`settings-overlay panel ${isSettingsOpen ? '' : 'hidden'}`}
        aria-hidden={!isSettingsOpen}
        aria-label={welcomeText.settingsTitle}
      >
        <header className="settings-overlay-header">
          <div>
            <p className="panel-label">{welcomeText.settingsTitle}</p>
            <h3>{welcomeText.gameSettingsTitle}</h3>
          </div>
          <button className="button button-secondary" type="button" onClick={closeSettings}>
            {welcomeText.close}
          </button>
        </header>

        <div className="settings-overlay-content">
          <p className="panel-label">{welcomeText.audioLabel}</p>
          <button className="button button-secondary" type="button" onClick={toggleMusicMute}>
            {musicMuted ? welcomeText.unmuteMusic : welcomeText.muteMusic}
          </button>
          <label className="music-volume" htmlFor="musicVolumeRange">
            {welcomeText.backgroundMusicVolume} {musicMuted ? 0 : musicVolume}%
          </label>
          <input
            id="musicVolumeRange"
            type="range"
            min="0"
            max="100"
            step="1"
            value={musicVolume}
            onChange={handleVolumeChange}
            aria-label={welcomeText.backgroundMusicVolumeAria}
          />
        </div>
      </section>

    </main>
  );
}
