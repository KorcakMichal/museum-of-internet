export const worldBounds = {
  width: 4000,
  height: 2500,
};

export const gridConfig = {
  startX: 300,
  startY: 150,
  cellWidth: 250,
  cellHeight: 220,
  columns: 10,
  rows: 8,
  roadY: 150 + (220 * 2.5) - (116 / 2), // Exactly centered in the middle of cell row 3
  roadHeight: 116,
};

function generateSlots() {
  const slots = [];
  const { startX, startY, cellWidth, cellHeight, columns, rows, roadY, roadHeight } = gridConfig;

  // Road definitions
  const hRoadTop = roadY;
  const hRoadBottom = roadY + roadHeight;
  
  // Vertical road centered in column 6 (zero-indexed 5)
  const vRoadCenter = startX + (5.5 * cellWidth);
  const vRoadWidth = 126;
  const vRoadLeft = vRoadCenter - (vRoadWidth / 2);
  const vRoadRight = vRoadCenter + (vRoadWidth / 2);

  for (let row = 0; row < rows; row++) {
    const y = startY + row * cellHeight;
    const cellCenterY = y + (cellHeight / 2);

    // Skip row if its center is inside the horizontal road
    if (cellCenterY > hRoadTop && cellCenterY < hRoadBottom) {
      continue;
    }

    for (let col = 0; col < columns; col++) {
      const x = startX + col * cellWidth;
      const cellCenterX = x + (cellWidth / 2);

      // Skip cell if its center is inside the vertical road
      if (cellCenterX > vRoadLeft && cellCenterX < vRoadRight) {
        continue;
      }

      slots.push({ x, y, width: cellWidth, height: cellHeight });
    }
  }
  return slots;
}

export const generatedLotSlots = generateSlots();

export const generatedHousePalettes = [
  { roof: '#2b4f7f', body: '#deecff' },
  { roof: '#7d4322', body: '#ffe4cf' },
  { roof: '#3f6e3e', body: '#d9f4d8' },
  { roof: '#6b3c76', body: '#f3dffd' },
];

export const movementKeys = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'];
