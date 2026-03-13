export const worldBounds = {
  width: 2560,
  height: 1440,
};

export const baseHouse = {
  id: 'browser',
  name: 'Browser House',
  url: 'https://duckduckgo.com/',
  description:
    'A flexible navigator house for quick web jumps. Use it when you want one generic browser-style room.',
  facts: [
    'Central hub for creating custom website houses.',
    'Best for general queries and direct URLs.',
    'Acts as a utility browser inside the town.',
  ],
  roomMode: 'Navigator Room',
  roomAddress: 'museum://browser-house/navigator',
  roomIntro:
    'Type a URL or a search query. This room prepares direct routes to open the web quickly.',
  searchPlaceholder: 'Type a URL like example.com or a search query',
  townFact: 'Browser House: a general web navigator room.',
  chips: ['open source browsers', 'web standards', 'example.com', 'internet history'],
  roomTip:
    'Paste a direct URL to open it immediately, or use a query to get multiple search routes.',
  lot: { x: 300, y: 800, width: 210, height: 180 },
  collision: { x: 336, y: 856, width: 138, height: 118 },
  interactZone: { x: 322, y: 914, width: 166, height: 84 },
};

export const generatedLotSlots = [
  // Top Row (Above the road at y=662)
  { x: 300, y: 200, width: 210, height: 180 },
  { x: 700, y: 200, width: 210, height: 180 },
  { x: 1650, y: 200, width: 210, height: 180 },
  { x: 2050, y: 200, width: 210, height: 180 },
  
  // Middle Row (Above the road)
  { x: 300, y: 440, width: 210, height: 180 },
  { x: 700, y: 440, width: 210, height: 180 },
  { x: 1650, y: 440, width: 210, height: 180 },
  { x: 2050, y: 440, width: 210, height: 180 },

  // Bottom Row (Below the road)
  { x: 700, y: 800, width: 210, height: 180 },
  { x: 1650, y: 800, width: 210, height: 180 },
  { x: 2050, y: 800, width: 210, height: 180 },
  
  // Far Bottom Row
  { x: 300, y: 1040, width: 210, height: 180 },
  { x: 700, y: 1040, width: 210, height: 180 },
  { x: 1650, y: 1040, width: 210, height: 180 },
  { x: 2050, y: 1040, width: 210, height: 180 },
];

export const generatedHousePalettes = [
  { roof: '#2b4f7f', body: '#deecff' },
  { roof: '#7d4322', body: '#ffe4cf' },
  { roof: '#3f6e3e', body: '#d9f4d8' },
  { roof: '#6b3c76', body: '#f3dffd' },
];

export const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
