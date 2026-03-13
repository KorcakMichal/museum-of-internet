import { toMapPercent } from './helpers';

export function updateMapPlayerMarker(state, refs) {
  const centerX = state.player.x + state.player.width / 2;
  const centerY = state.player.y + state.player.height / 2;
  const point = toMapPercent(centerX, centerY);
  refs.mapPlayerMarker.style.left = `${point.x}%`;
  refs.mapPlayerMarker.style.top = `${point.y}%`;
}

export function setMapOpen(state, refs, open) {
  state.isMapOpen = open;
  refs.mapOverlay.classList.toggle('hidden', !open);
  refs.mapOverlay.setAttribute('aria-hidden', open ? 'false' : 'true');
  refs.toggleMapButton.textContent = open ? 'Hide Map' : 'Show Map';

  if (open) {
    updateMapPlayerMarker(state, refs);
    refs.navigatorSearchInput.focus();
    state.keys.clear(); // Stop player movement immediately when map opens
  }
}

export function renderMapHouseMarkers(state, refs, onMarkerClick) {
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
      onMarkerClick(house);
      setMapOpen(state, refs, false);
    });

    refs.mapHouseMarkers.appendChild(marker);
  });
}
