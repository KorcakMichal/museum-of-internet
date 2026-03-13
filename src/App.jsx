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

            <div className="lot lot-browser" style={{ left: '300px', top: '800px' }}>
              <div className="house house-browser" data-house-id="browser">
                <div className="roof"></div>
                <div className="body">
                  <div className="sign">Browser</div>
                  <div className="door"></div>
                  <div className="window left"></div>
                  <div className="window right"></div>
                </div>
              </div>
            </div>

            <div className="trees trees-top"></div>
            <div className="trees trees-bottom"></div>

            <div id="player" className="player" aria-label="Player character">
              <div className="player-shadow"></div>
              <div className="player-sprite">
                <span className="head"></span>
                <span className="body"></span>
              </div>
            </div>
          </div>
          <div id="interactionPrompt" className="interaction-prompt hidden" aria-live="polite"></div>

          <section id="mapOverlay" className="map-overlay hidden" aria-hidden="true" aria-label="Town map overview">
            <header className="map-overlay-header">
              <div>
                <p className="panel-label">Town Navigator</p>
                <h3>Map Overview</h3>
              </div>
              <button id="closeMapButton" className="button button-secondary" type="button">
                Close Map
              </button>
            </header>

            <div id="miniMap" className="mini-map" role="img" aria-label="Overview map with houses and player position">
              <div id="mapHouseMarkers" className="map-house-markers"></div>
              <div id="mapPlayerMarker" className="map-player-marker" aria-hidden="true"></div>
            </div>

            <p className="map-overlay-hint">Press M to toggle this view while walking around.</p>
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
            <div className="room-scene-grid" aria-hidden="true"></div>
            <div id="roomWalkArea" className="room-walk-area" aria-label="Walkable room area">
              <div id="roomAvatar" className="room-avatar" aria-hidden="true">
                <div className="player-shadow"></div>
                <div className="player-sprite">
                  <span className="head"></span>
                  <span className="body"></span>
                </div>
              </div>

              <div id="roomNpc" className="room-npc room-object" aria-hidden="true">
                <div className="player-shadow"></div>
                <div className="player-sprite">
                  <span className="head"></span>
                  <span className="body"></span>
                </div>
              </div>

              <div id="roomNewspapers" className="room-newspapers room-object" aria-hidden="true">
                <span className="paper p1"></span>
                <span className="paper p2"></span>
                <span className="paper p3"></span>
              </div>

              <p id="roomInteractionHint" className="room-interaction-hint hidden" aria-live="polite"></p>
            </div>
            <div className="room-scene-stool" aria-hidden="true">
              <span className="seat"></span>
              <span className="leg one"></span>
              <span className="leg two"></span>
              <span className="leg three"></span>
            </div>
            <div className="room-scene-desks" aria-hidden="true">
              <div className="desk"></div>
              <div className="desk"></div>
              <div className="desk desk-with-papers">
                <span className="paper p1"></span>
                <span className="paper p2"></span>
              </div>
            </div>
          </section>

          <form id="webRoomSearchForm" className="browser-search">
            <input
              id="webRoomSearchInput"
              type="text"
              name="query"
              autoComplete="off"
              placeholder="Type a search or URL"
            />
            <button className="button button-primary" type="submit">
              Use
            </button>
          </form>

          <div className="web-room-actions">
            <a id="webRoomExternalLink" className="button button-secondary" href="#" target="_blank" rel="noreferrer">
              Open Real Site
            </a>
          </div>

          <div id="webRoomStatus" className="web-room-status" aria-live="polite"></div>
          <section id="webRoomResults" className="web-room-results"></section>
        </section>
      </div>
    </main>
  );
}
