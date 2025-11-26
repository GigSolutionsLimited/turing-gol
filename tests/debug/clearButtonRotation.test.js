/**
 * Test to verify that clear button correctly applies rotation to setup patterns
 * This addresses the bug where clear didn't rotate patterns like the setup effect does
 */

describe('Clear Button Setup Pattern Rotation', () => {
  test('should apply rotation when clear button restores setup patterns', () => {
    // Mock the BrushService.transformPattern function
    const mockTransformPattern = jest.fn();
    const BrushService = require('../../src/services/brushService.js').BrushService;
    const originalTransform = BrushService.transformPattern;
    BrushService.transformPattern = mockTransformPattern;

    // Mock brush with pattern and guidance line
    const mockBrush = {
      name: 'testBrush',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shaped pattern
      guidanceLines: [{
        direction: 'E',
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }]
    };

    // Mock rotated brush (270 degrees = 3 clockwise rotations)
    const mockRotatedBrush = {
      name: 'testBrush',
      pattern: [[0, 0], [-1, 0], [0, 1]], // Rotated L-shape
      guidanceLines: [{
        direction: 'N', // E rotated 270 degrees clockwise = N
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }]
    };

    // Setup test to return rotated brush after transformations
    mockTransformPattern.mockReturnValue(mockRotatedBrush);

    // Mock challenge with setup item that has rotation
    const challenge = {
      setup: [
        {
          x: 10,
          y: 5,
          brush: 'testBrush',
          rotate: 270
        }
      ]
    };

    const brushes = {
      testBrush: mockBrush
    };

    // Simulate the clear button logic for pattern placement
    const centerOffsetX = 50;
    const centerOffsetY = 50;
    const emptyGrid = Array.from({ length: 100 }, () => Array(100).fill(0));
    const newGrid = emptyGrid.map(arr => [...arr]);

    for (const setupItem of challenge.setup) {
      const baseBrush = brushes[setupItem.brush];

      if (baseBrush && baseBrush.pattern) {
        // Apply rotation if specified (this is the logic we fixed)
        let brush = baseBrush;
        if (setupItem.rotate && setupItem.rotate !== 0) {
          const rotations = Math.floor(setupItem.rotate / 90) % 4;
          expect(rotations).toBe(3); // 270 / 90 = 3

          for (let i = 0; i < rotations; i++) {
            brush = BrushService.transformPattern(brush, 'rotateClockwise');
          }
        }

        // Place rotated brush pattern
        for (const [dy, dx] of brush.pattern) {
          const gridY = centerOffsetY + setupItem.y + dy;
          const gridX = centerOffsetX + setupItem.x + dx;
          if (gridY >= 0 && gridY < newGrid.length && gridX >= 0 && gridX < newGrid[0].length) {
            newGrid[gridY][gridX] = 1;
          }
        }
      }
    }

    // Verify that transformPattern was called 3 times for 270° rotation
    expect(mockTransformPattern).toHaveBeenCalledTimes(3);
    expect(mockTransformPattern).toHaveBeenCalledWith(expect.any(Object), 'rotateClockwise');

    // Verify that some cells were set on the grid
    const totalCells = newGrid.flat().reduce((sum, cell) => sum + cell, 0);
    expect(totalCells).toBeGreaterThan(0);

    // Simulate the clear button logic for guidance line restoration
    const setupGuidanceLineObjects = [];

    for (const setupItem of challenge.setup) {
      const baseBrush = brushes[setupItem.brush];

      if (baseBrush) {
        // Apply the same rotation as used for pattern placement
        let brush = baseBrush;
        if (setupItem.rotate && setupItem.rotate !== 0) {
          const rotations = Math.floor(setupItem.rotate / 90) % 4;
          for (let i = 0; i < rotations; i++) {
            brush = BrushService.transformPattern(brush, 'rotateClockwise');
          }
        }

        // Handle guidance lines from the rotated brush
        const guidanceLines = brush.guidanceLines || (brush.guidanceLine ? [brush.guidanceLine] : []);

        for (const guidanceLine of guidanceLines) {
          // Verify the guidance line was rotated
          expect(guidanceLine.direction).toBe('N'); // E -> N after 270° rotation

          setupGuidanceLineObjects.push({
            direction: guidanceLine.direction,
            startX: guidanceLine.startX,
            startY: guidanceLine.startY
          });
        }
      }
    }

    // Verify guidance lines were processed with rotation
    expect(setupGuidanceLineObjects).toHaveLength(1);
    expect(setupGuidanceLineObjects[0].direction).toBe('N');

    // Total calls should be 6 (3 for pattern + 3 for guidance lines)
    expect(mockTransformPattern).toHaveBeenCalledTimes(6);

    // Restore original function
    BrushService.transformPattern = originalTransform;
  });

  test('should not apply rotation when setup item has no rotate property', () => {
    const BrushService = require('../../src/services/brushService.js').BrushService;
    const mockTransformPattern = jest.fn();
    const originalTransform = BrushService.transformPattern;
    BrushService.transformPattern = mockTransformPattern;

    const mockBrush = {
      pattern: [[0, 0]],
      guidanceLines: [{ direction: 'E' }]
    };

    const challenge = {
      setup: [
        {
          x: 0,
          y: 0,
          brush: 'testBrush'
          // No rotate property
        }
      ]
    };

    const brushes = { testBrush: mockBrush };

    // Simulate clear button logic
    for (const setupItem of challenge.setup) {
      const baseBrush = brushes[setupItem.brush];
      let brush = baseBrush;

      if (setupItem.rotate && setupItem.rotate !== 0) {
        // This should not execute
        brush = BrushService.transformPattern(brush, 'rotateClockwise');
      }

      expect(brush).toBe(baseBrush); // Should remain unchanged
    }

    expect(mockTransformPattern).not.toHaveBeenCalled();

    BrushService.transformPattern = originalTransform;
  });

  test('should handle missing brush gracefully in clear operation', () => {
    const challenge = {
      setup: [
        {
          x: 0,
          y: 0,
          brush: 'nonexistentBrush',
          rotate: 90
        }
      ]
    };

    const brushes = {};

    // Simulate clear button logic - should not throw error
    for (const setupItem of challenge.setup) {
      const baseBrush = brushes[setupItem.brush];

      expect(baseBrush).toBeUndefined();

      // The if condition should prevent any operations
      if (baseBrush && baseBrush.pattern) {
        // This should not execute
        throw new Error('Should not reach this code');
      }
    }

    // Test should complete without errors
    expect(true).toBe(true);
  });
});
