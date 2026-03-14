import React, { useEffect, useRef, useState } from 'react';
import { initMuseumGame } from './game';

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

    const gameApi = initMuseumGame();
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
  }, [hasStarted]);

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
              <div id="world" className="world" aria-label="Town map">
                <div className="skyline"></div>
                <div className="road road-horizontal"></div>
                <div className="road road-vertical"></div>
                <div className="square"></div>

                <div className="trees trees-top"></div>
                <div className="trees trees-bottom"></div>

                <div id="player" className="player" aria-label="Player character">
                  <div className="player-shadow"></div>
                  <div className="player-sprite"></div>
                </div>

                <div id="dnsGrandma" className="npc dns-grandma" aria-label="DNS Grandma NPC">
                  <div className="player-shadow"></div>
                  <div className="player-sprite"></div>
                </div>
              </div>
              <div id="interactionPrompt" className="interaction-prompt hidden" aria-live="polite"></div>

              <section id="mapOverlay" className="map-overlay hidden" aria-hidden="true" aria-label="Town map overview">
                <header className="map-overlay-header">
                  <div>
                    <p className="panel-label">Museum of Internet</p>
                    <h3>Town Navigator</h3>
                  </div>
                  <button id="closeMapButton" className="button button-secondary" type="button">
                    Close
                  </button>
                </header>

                <div className="map-overlay-content">
                  <div id="miniMap" className="mini-map" role="img" aria-label="Overview map with houses and player position">
                    <div id="mapHouseMarkers" className="map-house-markers"></div>
                    <div id="mapPlayerMarker" className="map-player-marker" aria-hidden="true"></div>
                  </div>

                  <aside className="navigator-form">
                    <p className="panel-label">Summon New House</p>
                    <form id="navigatorSearchForm" className="browser-search">
                      <input
                        id="navigatorSearchInput"
                        type="text"
                        name="query"
                        autoComplete="off"
                        placeholder="Type a URL or search query..."
                      />
                      <button className="button button-primary" type="submit">
                        Summon
                      </button>
                    </form>
                    <div id="navigatorStatus" className="status-text tiny"></div>
                    <div id="navigatorResults" className="navigator-results"></div>
                  </aside>
                </div>
              </section>
            </div>

            <aside className="panel" id="infoPanel">
              <p className="panel-label">Nearby</p>
              <h2 id="panelTitle">Town Square</h2>
              <p id="panelDescription">Walk up to a house and press E. Each building represents a real place on the internet.</p>
              <div className="panel-actions">
                <button id="enterRoomButton" className="button button-primary disabled" type="button">
                  Open Web Room
                </button>
                <a id="visitLink" className="button button-primary disabled" href="#" target="_blank" rel="noreferrer">
                  Visit Website
                </a>
                <button id="toggleMapButton" className="button button-secondary" type="button">
                  Show Map
                </button>
              </div>

              <section className="house-browser-panel" aria-label="House browser">
                <p className="panel-label">House Browser</p>
                <div id="houseBrowserList" className="house-browser-list"></div>
              </section>

              <ul id="panelFacts" className="facts-list">
                <li>Browser House: a general web navigator room.</li>
              </ul>
            </aside>
          </section>

          <div id="webRoom" className="web-room hidden" aria-hidden="true">
            <div className="web-room-backdrop" data-close-web-room="true"></div>
            <section className="web-room-shell" role="dialog" aria-modal="true" aria-labelledby="webRoomTitle">
              <header className="web-room-header">
                <div>
                  <p id="webRoomLabel" className="panel-label">Inside Website House</p>
                  <h2 id="webRoomTitle">Web Room</h2>
                </div>
              </header>

              <p id="webRoomDescription" className="web-room-description">
                Enter a house to interact with the website from inside the game.
              </p>

              <section id="roomScene" className="room-scene" aria-label="Room scene decoration">
                <div id="roomIndoorBackdrop" className="room-indoor-backdrop hidden" aria-hidden="true"></div>
                <div id="roomWalkArea" className="room-walk-area" aria-label="Walkable room area">
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
                  Visit Real Site
                </button>
              </div>

              <div id="webRoomStatus" className="web-room-status" aria-live="polite"></div>
              <section id="webRoomResults" className="web-room-results"></section>
            </section>
          </div>
        </>
      ) : (
        <section className="welcome-shell" aria-label="Welcome page">
          <div className="welcome-backdrop"></div>
          <section className="welcome-card panel">
            <p className="panel-label">Museum of Internet</p>
            <h1>Website Shortcut Room</h1>
            <p className="welcome-intro">
              Step into a vintage town where each house opens a piece of the web. Wander the streets, summon new sites,
              and explore internet places as pixel rooms.
            </p>

            <div className="welcome-actions">
              <button className="button button-primary welcome-start" type="button" onClick={startGame}>
                Enter Museum
              </button>
            </div>

            <div className="welcome-guide-grid">
              <article className="welcome-guide-card">
                <p className="panel-label">How To Play</p>
                <h3>Walk The Town</h3>
                <p>Move with WASD or arrow keys and approach houses to discover websites placed around the square.</p>
              </article>

              <article className="welcome-guide-card">
                <p className="panel-label">Discover</p>
                <h3>Open Web Rooms</h3>
                <p>Press E near a house to enter. Custom website houses become stylized interiors inspired by the linked website, while base town houses are not interactable.</p>
              </article>

              <article className="welcome-guide-card">
                <p className="panel-label">Create</p>
                <h3>Summon New Houses</h3>
                <img
                  className="welcome-guide-image"
                  src="/assets/walkthrough-preview.png"
                  alt="Preview of summoning a new website house"
                />
                <p>Use the browser house to add more sites to the map and let their interiors generate in the background.</p>
              </article>
            </div>
          </section>
        </section>
      )}

      <button
        className="button button-secondary settings-trigger"
        type="button"
        onClick={openSettings}
        aria-label="Open settings"
        title="Open settings"
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
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >{isFullscreen ? '⛶' : '⛶'}</button>
            <button
              className="mobile-btn mobile-map-btn"
              type="button"
              onPointerDown={() => gameApiRef.current?.triggerMap()}
              title="Toggle map"
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
        aria-label="Settings"
      >
        <header className="settings-overlay-header">
          <div>
            <p className="panel-label">Settings</p>
            <h3>Game Settings</h3>
          </div>
          <button className="button button-secondary" type="button" onClick={closeSettings}>
            Close
          </button>
        </header>

        <div className="settings-overlay-content">
          <p className="panel-label">Audio</p>
          <button className="button button-secondary" type="button" onClick={toggleMusicMute}>
            {musicMuted ? 'Unmute Music' : 'Mute Music'}
          </button>
          <label className="music-volume" htmlFor="musicVolumeRange">
            Background Music Volume {musicMuted ? 0 : musicVolume}%
          </label>
          <input
            id="musicVolumeRange"
            type="range"
            min="0"
            max="100"
            step="1"
            value={musicVolume}
            onChange={handleVolumeChange}
            aria-label="Background music volume"
          />
        </div>
      </section>

    </main>
  );
}
