import React, { useEffect } from 'react';
import { initMuseumGame } from './game';

export default function App() {
  useEffect(() => {
    const cleanup = initMuseumGame();
    return cleanup;
  }, []);

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
