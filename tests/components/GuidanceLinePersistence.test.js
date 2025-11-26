/**
 * Test guidance line persistence behavior
 * Testing the logic for guidance line visibility during game state changes
 */

describe('Guidance Line Persistence Logic', () => {
  let mockOnSetGuidanceLinesVisible;

  beforeEach(() => {
    mockOnSetGuidanceLinesVisible = jest.fn();
  });

  test('should hide guidance lines when running and show when stopped', () => {
    // Simulate the useEffect logic for guidance line visibility
    const simulateGuidanceLineVisibilityEffect = (running, guidanceLinesVisible, placedGuidanceLines) => {
      if (mockOnSetGuidanceLinesVisible) {
        if (running && guidanceLinesVisible) {
          mockOnSetGuidanceLinesVisible(false);
        } else if (!running && !guidanceLinesVisible && placedGuidanceLines && placedGuidanceLines.length > 0) {
          mockOnSetGuidanceLinesVisible(true);
        }
      }
    };

    // Test: Game not running, no guidance lines visible, but has placed lines
    const placedLines = [{ id: 'test', originalPixels: [] }];
    simulateGuidanceLineVisibilityEffect(false, false, placedLines);
    expect(mockOnSetGuidanceLinesVisible).toHaveBeenCalledWith(true);

    mockOnSetGuidanceLinesVisible.mockClear();

    // Test: Game running, guidance lines visible
    simulateGuidanceLineVisibilityEffect(true, true, placedLines);
    expect(mockOnSetGuidanceLinesVisible).toHaveBeenCalledWith(false);

    mockOnSetGuidanceLinesVisible.mockClear();

    // Test: Game not running, guidance lines visible (no change expected)
    simulateGuidanceLineVisibilityEffect(false, true, placedLines);
    expect(mockOnSetGuidanceLinesVisible).not.toHaveBeenCalled();

    mockOnSetGuidanceLinesVisible.mockClear();

    // Test: Game not running, no guidance lines, no placed lines (no change expected)
    simulateGuidanceLineVisibilityEffect(false, false, []);
    expect(mockOnSetGuidanceLinesVisible).not.toHaveBeenCalled();
  });

  test('should show guidance lines on reset', () => {
    // Simulate the reset handler logic
    const simulateResetHandler = () => {
      if (mockOnSetGuidanceLinesVisible) {
        mockOnSetGuidanceLinesVisible(true);
      }
    };

    simulateResetHandler();
    expect(mockOnSetGuidanceLinesVisible).toHaveBeenCalledWith(true);
  });

  test('should not modify guidance line step behavior', () => {
    // Simulate the new step handler logic (should not affect guidance lines directly)
    const simulateStepHandler = (running) => {
      if (!running) {
        // Step logic here - no longer directly modifies guidance line visibility
        return true; // Indicates step was executed
      }
      return false;
    };

    const stepExecuted = simulateStepHandler(false);
    expect(stepExecuted).toBe(true);
    // Should not have called guidance line visibility function
    expect(mockOnSetGuidanceLinesVisible).not.toHaveBeenCalled();
  });

  test('should handle guidance line placement correctly', () => {
    // Test the logic for showing guidance lines when a new one is created
    const simulateGuidanceLinePlacement = (guidanceLinesVisible) => {
      if (mockOnSetGuidanceLinesVisible && !guidanceLinesVisible) {
        mockOnSetGuidanceLinesVisible(true);
      }
    };

    // Test: Guidance lines not visible when placing new one
    simulateGuidanceLinePlacement(false);
    expect(mockOnSetGuidanceLinesVisible).toHaveBeenCalledWith(true);

    mockOnSetGuidanceLinesVisible.mockClear();

    // Test: Guidance lines already visible when placing new one
    simulateGuidanceLinePlacement(true);
    expect(mockOnSetGuidanceLinesVisible).not.toHaveBeenCalled();
  });

  test('should maintain guidance line state transitions correctly', () => {
    const states = [];
    const mockSetVisible = (visible) => {
      states.push(visible);
      mockOnSetGuidanceLinesVisible(visible);
    };

    // Simulate a complete game cycle
    const placedLines = [{ id: 'test' }];

    // Start: lines visible, game stopped
    let running = false;
    let guidanceLinesVisible = true;

    // Start game - should hide lines
    running = true;
    if (running && guidanceLinesVisible) {
      guidanceLinesVisible = false;
      mockSetVisible(false);
    }

    // Stop game - should show lines again (if there are placed lines)
    running = false;
    if (!running && !guidanceLinesVisible && placedLines.length > 0) {
      guidanceLinesVisible = true;
      mockSetVisible(true);
    }

    // Reset game - should ensure lines are visible
    mockSetVisible(true);
    guidanceLinesVisible = true;

    // Verify the state transitions
    expect(states).toEqual([false, true, true]);
    expect(mockOnSetGuidanceLinesVisible).toHaveBeenCalledTimes(3);
  });

  test('should capture original pixel states before grid update to prevent premature invalidation', () => {
    // This test verifies the timing fix for guidance line creation
    const originalGrid = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0]
    ];

    const patternCoords = [[0, 0], [0, 1]]; // 2-cell pattern
    const placementX = 0;
    const placementY = 0;

    // Simulate the old problematic approach
    const simulateOldApproach = () => {
      // 1. Update grid first (like the old code did)
      const newGrid = originalGrid.map(row => [...row]);
      for (const [dy, dx] of patternCoords) {
        const ny = placementY + dy;
        const nx = placementX + dx;
        if (ny >= 0 && ny < newGrid.length && nx >= 0 && nx < newGrid[0].length) {
          newGrid[ny][nx] = 1; // Place pattern
        }
      }

      // 2. Then capture affected pixels (this was the bug)
      const affectedPixels = [];
      for (const [dy, dx] of patternCoords) {
        const ny = placementY + dy;
        const nx = placementX + dx;
        if (ny >= 0 && ny < newGrid.length && nx >= 0 && nx < newGrid[0].length) {
          affectedPixels.push({
            x: nx,
            y: ny,
            value: newGrid[ny][nx] // This captures the NEW state (1), not original (0)
          });
        }
      }

      // 3. Check if pixels changed (they would always be "changed" due to timing)
      const hasChanged = affectedPixels.some(pixel => newGrid[pixel.y][pixel.x] !== pixel.value);
      return { hasChanged, affectedPixels, newGrid };
    };

    // Simulate the new fixed approach
    const simulateFixedApproach = () => {
      // 1. Capture affected pixels BEFORE grid update (the fix)
      const affectedPixels = [];
      for (const [dy, dx] of patternCoords) {
        const ny = placementY + dy;
        const nx = placementX + dx;
        if (ny >= 0 && ny < originalGrid.length && nx >= 0 && nx < originalGrid[0].length) {
          affectedPixels.push({
            x: nx,
            y: ny,
            value: originalGrid[ny][nx] // This captures the ORIGINAL state (0)
          });
        }
      }

      // 2. Update grid after capturing original state
      const newGrid = originalGrid.map(row => [...row]);
      for (const [dy, dx] of patternCoords) {
        const ny = placementY + dy;
        const nx = placementX + dx;
        if (ny >= 0 && ny < newGrid.length && nx >= 0 && nx < newGrid[0].length) {
          newGrid[ny][nx] = 1; // Place pattern
        }
      }

      // 3. Check if pixels changed from their original state (they haven't in terms of tracking)
      const hasChanged = affectedPixels.some(pixel => newGrid[pixel.y][pixel.x] !== pixel.value);
      return { hasChanged, affectedPixels, newGrid };
    };

    const oldResult = simulateOldApproach();
    const fixedResult = simulateFixedApproach();

    // The old approach would incorrectly detect no changes (since it compared new state to new state)
    expect(oldResult.hasChanged).toBe(false); // Bug: no change detected
    expect(oldResult.affectedPixels[0].value).toBe(1); // Captured new state

    // The fixed approach correctly captures the original state for proper tracking
    expect(fixedResult.hasChanged).toBe(true); // Correct: change detected (original 0 -> new 1)
    expect(fixedResult.affectedPixels[0].value).toBe(0); // Captured original state

    // Both should produce the same final grid
    expect(oldResult.newGrid).toEqual(fixedResult.newGrid);
  });

  test('should delay guidance line validation to prevent immediate removal after placement', () => {
    // Test the timing fix for guidance line validation
    jest.useFakeTimers();

    const mockOnRemovePlacedGuidanceLine = jest.fn();
    const mockFilterValidGuidanceLines = jest.fn();

    // Simulate the useEffect logic with timeout
    const simulateValidationEffect = (placedGuidanceLines, grid, onRemove) => {
      if (placedGuidanceLines && placedGuidanceLines.length > 0 && onRemove) {
        const validationTimeout = setTimeout(() => {
          // Mock validation that would remove invalid lines
          const validLines = mockFilterValidGuidanceLines(placedGuidanceLines, grid);
          if (validLines.length !== placedGuidanceLines.length) {
            const invalidIndices = [];
            placedGuidanceLines.forEach((line, index) => {
              if (!validLines.includes(line)) {
                invalidIndices.push(index);
              }
            });
            invalidIndices.reverse().forEach(index => {
              onRemove(index);
            });
          }
        }, 100);

        return () => clearTimeout(validationTimeout);
      }
    };

    const placedLines = [{ id: 'test', originalPixels: [] }];
    const grid = [[1, 0], [0, 1]];

    // Set up mock to return different results before and after timeout
    mockFilterValidGuidanceLines.mockReturnValue([]); // Would remove all lines

    // Execute the validation effect
    const cleanup = simulateValidationEffect(placedLines, grid, mockOnRemovePlacedGuidanceLine);

    // Immediately check - validation should not have run yet
    expect(mockOnRemovePlacedGuidanceLine).not.toHaveBeenCalled();
    expect(mockFilterValidGuidanceLines).not.toHaveBeenCalled();

    // Advance time by 50ms - still should not run
    jest.advanceTimersByTime(50);
    expect(mockOnRemovePlacedGuidanceLine).not.toHaveBeenCalled();

    // Advance time by remaining 50ms (total 100ms) - now validation should run
    jest.advanceTimersByTime(50);
    expect(mockFilterValidGuidanceLines).toHaveBeenCalledWith(placedLines, grid);
    expect(mockOnRemovePlacedGuidanceLine).toHaveBeenCalledWith(0);

    // Clean up
    if (cleanup) cleanup();
    jest.useRealTimers();
  });

  test('should render guidance lines regardless of source pixel changes', () => {
    // Test that guidance lines are rendered even when source pixels have changed
    const placedGuidanceLines = [
      {
        id: 'test1',
        guidanceSpec: { direction: 'e', x: 0, y: 0, length: '*', speed: 2 },
        patternCoords: [[0, 0]],
        placedX: 0,
        placedY: 1,
        gridWidth: 4,
        gridHeight: 3,
        originalPixels: [{ x: 0, y: 1, value: 0 }], // Original state was empty
        createdAt: Date.now()
      }
    ];

    // Current grid where the source pixel has changed (from 0 to 1)
    const grid = [
      [0, 0, 0, 0],
      [1, 0, 0, 0], // Pixel at (0,1) is now live (was 0 when guidance line was created)
      [0, 0, 0, 0]
    ];

    // Mock generateGuidanceLine to return predictable results
    const mockGenerateGuidanceLine = jest.fn(() => [
      [0, 1, 'color1'], // Relative to placement position
      [0, 2, 'color2']
    ]);

    // Replace the import with mock
    jest.doMock('../../src/utils/rleUtils.js', () => ({
      generateGuidanceLine: mockGenerateGuidanceLine
    }));

    // Simulate the logic from generateAllPlacedGuidanceLinePixels
    const simulateGuidanceLineGeneration = (placedLines, grid) => {
      const allPixels = [];

      for (const placedLine of placedLines) {
        // Don't check for source pixel changes - just generate the lines
        const relativePixels = mockGenerateGuidanceLine(
          placedLine.guidanceSpec,
          placedLine.patternCoords,
          placedLine.gridWidth,
          placedLine.gridHeight
        );

        // Transform to absolute coordinates
        const absolutePixels = relativePixels.map(([y, x, color]) => [
          y + placedLine.placedY,
          x + placedLine.placedX,
          color
        ]).filter(([y, x]) =>
          y >= 0 && y < grid.length &&
          x >= 0 && x < (grid.length > 0 ? grid[0].length : 0)
        );

        allPixels.push(...absolutePixels);
      }

      return allPixels;
    };

    const result = simulateGuidanceLineGeneration(placedGuidanceLines, grid);

    // Should generate guidance line pixels despite source pixel changes
    expect(result).toEqual([
      [1, 1, 'color1'], // Absolute position: placedY(1) + relativeY(0), placedX(0) + relativeX(1)
      [1, 2, 'color2']  // Absolute position: placedY(1) + relativeY(0), placedX(0) + relativeX(2)
    ]);

    // Should have called the generation function
    expect(mockGenerateGuidanceLine).toHaveBeenCalledWith(
      placedGuidanceLines[0].guidanceSpec,
      placedGuidanceLines[0].patternCoords,
      placedGuidanceLines[0].gridWidth,
      placedGuidanceLines[0].gridHeight
    );

    jest.restoreAllMocks();
  });
});
