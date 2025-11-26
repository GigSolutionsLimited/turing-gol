/**
 * Integration test for level 9 setup pattern rotation
 * Tests the specific case from 9.json where eater1G is rotated 270 degrees
 */

describe('Level 9 Setup Pattern Rotation Integration', () => {
  test('should correctly apply 270 degree rotation to eater1G brush in level 9', () => {
    // This test simulates the exact setup from 9.json
    const level9Setup = [
      {
        "x": -100,
        "y": -50,
        "brush": "p60GliderGunG"
      },
      {
        "x": 24,
        "y": -44,
        "brush": "eater1G",
        "rotate": 270
      }
    ];

    // Mock brushes (simplified for testing)
    const mockBrushes = {
      p60GliderGunG: {
        name: 'P60 Glider Gun with Guidance',
        pattern: [[0, 0], [0, 1], [1, 0]], // Simplified pattern
        guidanceLines: [{
          direction: 'SE',
          startX: 5,
          startY: 0,
          length: 20,
          speed: 3
        }]
      },
      eater1G: {
        name: 'Eater 1 with Guidance',
        pattern: [[0, 0], [0, 1], [1, 1], [2, 0]], // Simplified eater pattern
        guidanceLines: [{
          direction: 'W',
          startX: -2,
          startY: 1,
          length: 10,
          speed: 2
        }]
      }
    };

    const BrushService = require('../../src/services/brushService.js').BrushService;

    // Test the rotation logic for the eater1G brush
    const setupItem = level9Setup[1]; // The eater1G with 270° rotation
    const baseBrush = mockBrushes[setupItem.brush];

    let brush = baseBrush;
    if (setupItem.rotate && setupItem.rotate !== 0) {
      const rotations = Math.floor(setupItem.rotate / 90) % 4;
      expect(rotations).toBe(3); // 270° = 3 clockwise rotations

      // Apply the rotations
      for (let i = 0; i < rotations; i++) {
        brush = BrushService.transformPattern(brush, 'rotateClockwise');
      }
    }

    // Verify the pattern was rotated (we can't predict exact coordinates without the full transform logic,
    // but we can verify it's different from the original)
    expect(brush.pattern).not.toEqual(baseBrush.pattern);

    // Verify guidance line was rotated
    expect(brush.guidanceLines[0].direction).not.toBe('W'); // Should be rotated from original 'W'

    // The guidance line direction should have been rotated 270° clockwise
    // W -> N -> E -> S (3 steps clockwise) = S
    expect(brush.guidanceLines[0].direction).toBe('S');

    // Test that the first setup item (without rotation) remains unchanged
    const firstSetupItem = level9Setup[0];
    const firstBrush = mockBrushes[firstSetupItem.brush];

    let unrotatedBrush = firstBrush;
    if (firstSetupItem.rotate && firstSetupItem.rotate !== 0) {
      // Should not execute since no rotation specified
      unrotatedBrush = BrushService.transformPattern(unrotatedBrush, 'rotateClockwise');
    }

    // First brush should remain unchanged
    expect(unrotatedBrush).toBe(firstBrush);
    expect(unrotatedBrush.guidanceLines[0].direction).toBe('SE'); // Original direction
  });

  test('should handle grid placement with rotated coordinates', () => {
    // Test that rotated patterns are placed correctly on the grid
    const mockGrid = Array.from({ length: 10 }, () => Array(10).fill(0));
    const centerOffsetX = 5;
    const centerOffsetY = 5;

    // Original L-shaped pattern
    const originalPattern = [[0, 0], [0, 1], [1, 0]];

    const BrushService = require('../../src/services/brushService.js').BrushService;

    // Create a brush and rotate it 90 degrees
    let brush = { pattern: originalPattern };
    brush = BrushService.transformPattern(brush, 'rotateClockwise');

    // Simulate grid placement
    const setupItem = { x: 0, y: 0 }; // Place at center
    const newGrid = mockGrid.map(arr => [...arr]);

    for (const [dy, dx] of brush.pattern) {
      const gridY = centerOffsetY + setupItem.y + dy;
      const gridX = centerOffsetX + setupItem.x + dx;
      if (gridY >= 0 && gridY < newGrid.length && gridX >= 0 && gridX < newGrid[0].length) {
        newGrid[gridY][gridX] = 1;
      }
    }

    // Verify that some cells were set (pattern was placed)
    const totalCells = newGrid.flat().reduce((sum, cell) => sum + cell, 0);
    expect(totalCells).toBeGreaterThan(0);
    expect(totalCells).toBeLessThanOrEqual(brush.pattern.length);

    // Verify the pattern is different from the original placement
    const originalGrid = Array.from({ length: 10 }, () => Array(10).fill(0));
    for (const [dy, dx] of originalPattern) {
      const gridY = centerOffsetY + setupItem.y + dy;
      const gridX = centerOffsetX + setupItem.x + dx;
      if (gridY >= 0 && gridY < originalGrid.length && gridX >= 0 && gridX < originalGrid[0].length) {
        originalGrid[gridY][gridX] = 1;
      }
    }

    // The grids should be different due to rotation
    expect(newGrid).not.toEqual(originalGrid);
  });
});
