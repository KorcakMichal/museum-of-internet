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
  'webRoomOpenButton',
  'webRoomStatus',
  'webRoomResults',
  'roomScene',
  'roomWalkArea',
  'roomAvatar',
  'roomNpc',
  'roomNewspapers',
  'roomInteractionHint',
  'dnsGrandma',
  'mapOverlay',
  'closeMapButton',
  'mapHouseMarkers',
  'mapPlayerMarker',
  'navigatorSearchForm',
  'navigatorSearchInput',
  'navigatorStatus',
  'navigatorResults',
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
    webRoomOpenButton: root.getElementById('webRoomOpenButton'),
    webRoomStatus: root.getElementById('webRoomStatus'),
    webRoomResults: root.getElementById('webRoomResults'),
    roomScene: root.getElementById('roomScene'),
    roomWalkArea: root.getElementById('roomWalkArea'),
    roomAvatar: root.getElementById('roomAvatar'),
    roomNpc: root.getElementById('roomNpc'),
    roomNewspapers: root.getElementById('roomNewspapers'),
    roomInteractionHint: root.getElementById('roomInteractionHint'),
    dnsGrandma: root.getElementById('dnsGrandma'),
    mapOverlay: root.getElementById('mapOverlay'),
    closeMapButton: root.getElementById('closeMapButton'),
    mapHouseMarkers: root.getElementById('mapHouseMarkers'),
    mapPlayerMarker: root.getElementById('mapPlayerMarker'),
    navigatorSearchForm: root.getElementById('navigatorSearchForm'),
    navigatorSearchInput: root.getElementById('navigatorSearchInput'),
    navigatorStatus: root.getElementById('navigatorStatus'),
    navigatorResults: root.getElementById('navigatorResults'),
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
