const requiredIds = [
  'world',
  'player',
  'interactionPrompt',
  'panelTitle',
  'panelDescription',
  'panelFacts',
  'houseBrowserList',
  'enterRoomButton',
  'visitLink',
  'toggleMapButton',
  'webRoom',
  'webRoomLabel',
  'webRoomTitle',
  'webRoomDescription',
  'webRoomSearchForm',
  'webRoomSearchInput',
  'webRoomExternalLink',
  'webRoomStatus',
  'webRoomResults',
  'roomScene',
  'roomWalkArea',
  'roomAvatar',
  'roomNpc',
  'roomNewspapers',
  'roomInteractionHint',
  'mapOverlay',
  'closeMapButton',
  'mapHouseMarkers',
  'mapPlayerMarker',
];

export function getDomRefs(root = document) {
  const refs = {
    world: root.getElementById('world'),
    playerElement: root.getElementById('player'),
    promptElement: root.getElementById('interactionPrompt'),
    panelTitle: root.getElementById('panelTitle'),
    panelDescription: root.getElementById('panelDescription'),
    panelFacts: root.getElementById('panelFacts'),
    houseBrowserList: root.getElementById('houseBrowserList'),
    enterRoomButton: root.getElementById('enterRoomButton'),
    visitLink: root.getElementById('visitLink'),
    toggleMapButton: root.getElementById('toggleMapButton'),
    webRoom: root.getElementById('webRoom'),
    webRoomLabel: root.getElementById('webRoomLabel'),
    webRoomTitle: root.getElementById('webRoomTitle'),
    webRoomDescription: root.getElementById('webRoomDescription'),
    webRoomSearchForm: root.getElementById('webRoomSearchForm'),
    webRoomSearchInput: root.getElementById('webRoomSearchInput'),
    webRoomExternalLink: root.getElementById('webRoomExternalLink'),
    webRoomStatus: root.getElementById('webRoomStatus'),
    webRoomResults: root.getElementById('webRoomResults'),
    roomScene: root.getElementById('roomScene'),
    roomWalkArea: root.getElementById('roomWalkArea'),
    roomAvatar: root.getElementById('roomAvatar'),
    roomNpc: root.getElementById('roomNpc'),
    roomNewspapers: root.getElementById('roomNewspapers'),
    roomInteractionHint: root.getElementById('roomInteractionHint'),
    mapOverlay: root.getElementById('mapOverlay'),
    closeMapButton: root.getElementById('closeMapButton'),
    mapHouseMarkers: root.getElementById('mapHouseMarkers'),
    mapPlayerMarker: root.getElementById('mapPlayerMarker'),
  };

  refs.webRoomActions = refs.webRoom?.querySelector('.web-room-actions') ?? null;

  for (const id of requiredIds) {
    const element = root.getElementById(id);
    if (!element) {
      return null;
    }
  }

  return refs;
}
