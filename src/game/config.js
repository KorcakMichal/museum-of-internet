export const worldBounds = {
  width: 2560,
  height: 1440,
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
