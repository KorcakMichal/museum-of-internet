import React, { useEffect, useRef, useState } from 'react';
import { initMuseumGame } from './game';

export default function App() {
  const audioRef = useRef(null);
  const musicMutedRef = useRef(false);
  const musicVolumeRef = useRef(35);
  const [musicMuted, setMusicMuted] = useState(false);
  const [musicVolume, setMusicVolume] = useState(35);

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
    const cleanup = initMuseumGame();

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

    const handleMusicHotkey = (event) => {
      if ((event.key || '').toLowerCase() === 'm') {
        setMusicMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleMusicHotkey);

    return () => {
      disposed = true;
      stopFade();
      stopLoopWatch();
      window.removeEventListener('pointerdown', startMusicOnInteraction);
      window.removeEventListener('keydown', startMusicOnInteraction);
      window.removeEventListener('touchstart', startMusicOnInteraction);
      window.removeEventListener('keydown', handleMusicHotkey);
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      if (audioRef.current === backgroundMusic) {
        audioRef.current = null;
      }
      cleanup();
    };
  }, []);

  const handleVolumeChange = (event) => {
    setMusicVolume(Number(event.target.value));
  };

  const toggleMusicMute = () => {
    setMusicMuted((prev) => !prev);
  };

  return (
    <main className="app-shell">
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

          <section className="music-dock panel" aria-label="Music controls">
            <p className="panel-label">Music</p>
            <div className="music-dock-controls">
              <button className="button button-secondary" type="button" onClick={toggleMusicMute}>
                {musicMuted ? 'Unmute (M)' : 'Mute (M)'}
              </button>
              <label className="music-volume" htmlFor="musicVolumeRange">
                Volume {musicMuted ? 0 : musicVolume}%
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
    </main>
  );
}
