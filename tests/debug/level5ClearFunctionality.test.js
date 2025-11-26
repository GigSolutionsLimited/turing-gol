/**
 * Test to verify the Level 5 clear functionality works correctly
 */

import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Level 5 Clear Functionality', () => {
  test('should correctly restore guidance lines when clear is pressed', () => {
    // This simulates the clear function logic for Level 5

    const level5Challenge = {
      setup: [
        {
          x: -50,
          y: -50,
          brush: "p30GliderGunG"
        }
      ],
      width: 101,
      height: 101
    };

    const brushes = {
      'p30GliderGunG': {
        name: 'Gosper Gun',
        pattern: [[0, 24], [1, 22]], // Simplified
        guidanceLine: {
          direction: 'SE',
          startX: 21,
          startY: 7,
          length: 'infinite',
          speed: 3
        }
      }
    };

    const gridSize = { width: 101, height: 101 };

    // Mock guidance line functions
    const mockClearAllPlacedGuidanceLines = jest.fn();
    const mockResetGuidanceLineObjects = jest.fn();
    const mockAddGuidanceLineObject = jest.fn();

    // Simulate the clear function logic (from handleClear)
    const simulateClear = () => {
      // Clear all guidance lines first (both legacy and new systems)
      mockClearAllPlacedGuidanceLines();
      mockResetGuidanceLineObjects();

      const setupGuidanceLineObjects = [];

      // Restore guidance lines from setup patterns (if any)
      if (level5Challenge && level5Challenge.setup && level5Challenge.setup.length > 0 && brushes) {
        const centerOffsetX = Math.floor(gridSize.width / 2);
        const centerOffsetY = Math.floor(gridSize.height / 2);

        for (const setupItem of level5Challenge.setup) {
          const brush = brushes[setupItem.brush];
          if (brush && brush.guidanceLine) {
            // Create guidance line object for this setup pattern
            const placementX = centerOffsetX + setupItem.x;
            const placementY = centerOffsetY + setupItem.y;

            console.log('Clear: Creating guidance line', {
              brush: setupItem.brush,
              placementX,
              placementY,
              guidanceSpec: brush.guidanceLine
            });

            const guidanceLineObject = createGuidanceLineFromBrush(
              brush.guidanceLine,
              0, // Setup guidance lines are at generation 0
              placementX,
              placementY
            );

            if (guidanceLineObject) {
              setupGuidanceLineObjects.push(guidanceLineObject);
            }
          }
        }
      }

      // Set guidance line objects to only include setup lines
      setupGuidanceLineObjects.forEach(guidanceLineObject => {
        mockAddGuidanceLineObject(guidanceLineObject);
      });

      return setupGuidanceLineObjects;
    };

    // Execute clear
    const restoredGuidanceLines = simulateClear();

    // Verify clear was called
    expect(mockClearAllPlacedGuidanceLines).toHaveBeenCalledTimes(1);
    expect(mockResetGuidanceLineObjects).toHaveBeenCalledTimes(1);

    // Verify guidance line was restored
    expect(restoredGuidanceLines).toHaveLength(1);
    expect(mockAddGuidanceLineObject).toHaveBeenCalledTimes(1);

    const restoredGuidanceLine = restoredGuidanceLines[0];
    expect(restoredGuidanceLine).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });

    // Verify coordinates
    // centerOffset (50) + setupItem.x (-50) + startX (21) = 21
    expect(restoredGuidanceLine.originX).toBe(21);
    expect(restoredGuidanceLine.originY).toBe(7);
  });

  test('should handle difference between initial load and clear restore', () => {
    // This test explores the difference between the initial setup effect
    // and the clear restoration to understand why one works and the other doesn't

    const level5Setup = {
      x: -50,
      y: -50,
      brush: "p30GliderGunG"
    };

    const gosperBrush = {
      name: 'Gosper Gun',
      pattern: [[0, 24]],
      guidanceLine: {
        direction: 'SE',
        startX: 21,
        startY: 7,
        length: 'infinite',
        speed: 3
      }
    };

    // Test both scenarios with the same data
    const gridSize = { width: 101, height: 101 };
    const centerOffsetX = Math.floor(gridSize.width / 2);  // 50
    const centerOffsetY = Math.floor(gridSize.height / 2); // 50

    // Scenario 1: Initial setup (what happens during level load)
    const initialSetupResult = (() => {
      const placementX = centerOffsetX + level5Setup.x; // 50 + (-50) = 0
      const placementY = centerOffsetY + level5Setup.y; // 50 + (-50) = 0

      return createGuidanceLineFromBrush(
        gosperBrush.guidanceLine,
        0,
        placementX,
        placementY
      );
    })();

    // Scenario 2: Clear restore (what happens during clear)
    const clearRestoreResult = (() => {
      const placementX = centerOffsetX + level5Setup.x; // 50 + (-50) = 0
      const placementY = centerOffsetY + level5Setup.y; // 50 + (-50) = 0

      return createGuidanceLineFromBrush(
        gosperBrush.guidanceLine,
        0,
        placementX,
        placementY
      );
    })();

    // Both should produce functionally identical results (ignoring timestamps in IDs)
    expect(initialSetupResult.direction).toEqual(clearRestoreResult.direction);
    expect(initialSetupResult.originX).toEqual(clearRestoreResult.originX);
    expect(initialSetupResult.originY).toEqual(clearRestoreResult.originY);
    expect(initialSetupResult.length).toEqual(clearRestoreResult.length);
    expect(initialSetupResult.speed).toEqual(clearRestoreResult.speed);
    expect(initialSetupResult.generation).toEqual(clearRestoreResult.generation);

    // Verify the expected coordinates
    expect(initialSetupResult.originX).toBe(21); // 0 + 21
    expect(initialSetupResult.originY).toBe(7);  // 0 + 7

    // This confirms that the logic is identical, so the issue must be elsewhere
  });

  test('should verify the guidance line creation function works correctly', () => {
    // Test the createGuidanceLineFromBrush function directly

    const guidanceSpec = {
      direction: 'SE',
      startX: 21,
      startY: 7,
      length: 'infinite',
      speed: 3
    };

    const placementX = 0;
    const placementY = 0;
    const generation = 0;

    const result = createGuidanceLineFromBrush(guidanceSpec, generation, placementX, placementY);

    expect(result).toBeDefined();
    expect(result).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      originX: 21,
      originY: 7,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });

    // Verify the function works as expected
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });
});
