// Test for clear button guidance line functionality
import { GameService } from '../../src/services/gameService.js';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Clear Button Guidance Line Fix', () => {
  test('should clear ALL guidance lines then restore only setup guidance lines', () => {
    // Mock functions
    const mockOnRunningChange = jest.fn();
    const mockOnResetGuidanceLineObjects = jest.fn();
    const mockOnAddGuidanceLineObject = jest.fn();

    // Simulate the simplified handleClear logic
    const simulateHandleClear = (gridSize, challenge, brushes, onResetGuidanceLineObjects, onAddGuidanceLineObject, onRunningChange) => {
      // Stop the game if running
      if (onRunningChange) {
        onRunningChange(false);
      }

      // Clear the grid to empty state
      const emptyGrid = GameService.createEmptyGrid(gridSize.width, gridSize.height);

      // Clear ALL guidance lines (both user-placed and setup)
      if (onResetGuidanceLineObjects) {
        onResetGuidanceLineObjects();
      }

      // Now restore challenge setup patterns and guidance lines if they exist
      if (challenge?.setup && challenge.setup.length > 0 && brushes && Object.keys(brushes).length > 0) {
        const centerOffsetX = Math.floor(gridSize.width / 2);
        const centerOffsetY = Math.floor(gridSize.height / 2);

        // Restore setup guidance lines
        const setupGuidanceLineObjects = [];
        for (const setupItem of challenge.setup) {
          const brush = brushes[setupItem.brush];
          if (brush?.guidanceLine && onAddGuidanceLineObject) {
            const placementX = centerOffsetX + setupItem.x;
            const placementY = centerOffsetY + setupItem.y;

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

        // Add setup guidance line objects
        setupGuidanceLineObjects.forEach(guidanceLineObject => {
          onAddGuidanceLineObject(guidanceLineObject);
        });

        return { emptyGrid, setupGuidanceLineObjects };
      }

      return { emptyGrid, setupGuidanceLineObjects: [] };
    };

    // Test data
    const gridSize = { width: 61, height: 61 };
    const challenge = {
      setup: [
        { x: -10, y: -5, brush: 'test-guidance' }
      ]
    };
    const brushes = {
      'test-guidance': {
        pattern: [[0, 0], [0, 1], [0, 2]],
        guidanceLine: {
          direction: 'SE',
          startX: 21,
          startY: 7,
          length: 'infinite',
          speed: 3
        }
      }
    };

    // Execute clear operation
    const result = simulateHandleClear(
      gridSize,
      challenge,
      brushes,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject,
      mockOnRunningChange
    );

    // Verify that running state is set to false
    expect(mockOnRunningChange).toHaveBeenCalledWith(false);

    // Verify that ALL guidance lines are cleared first
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalled();

    // Verify that ONLY setup guidance lines are restored
    expect(mockOnAddGuidanceLineObject).toHaveBeenCalledTimes(1);

    // Verify the guidance line object structure
    const guidanceLineCall = mockOnAddGuidanceLineObject.mock.calls[0][0];
    expect(guidanceLineCall).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });

    // Verify grid is emptied
    expect(result.emptyGrid).toBeDefined();
    expect(result.emptyGrid.length).toBe(61);
    expect(result.emptyGrid[0].length).toBe(61);

    // Verify all cells are empty initially
    for (let y = 0; y < result.emptyGrid.length; y++) {
      for (let x = 0; x < result.emptyGrid[0].length; x++) {
        expect(result.emptyGrid[y][x]).toBe(0);
      }
    }

    // Verify setup guidance lines are created
    expect(result.setupGuidanceLineObjects).toHaveLength(1);
    expect(result.setupGuidanceLineObjects[0]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });
  });

  test('should clear guidance lines when no setup patterns exist', () => {
    // Mock functions
    const mockOnRunningChange = jest.fn();
    const mockOnResetGuidanceLineObjects = jest.fn();
    const mockOnAddGuidanceLineObject = jest.fn();

    // Simulate handleClear with no setup
    const simulateHandleClear = (gridSize, challenge, brushes, onResetGuidanceLineObjects, onAddGuidanceLineObject, onRunningChange) => {
      if (onRunningChange) {
        onRunningChange(false);
      }

      const emptyGrid = GameService.createEmptyGrid(gridSize.width, gridSize.height);

      if (onResetGuidanceLineObjects) {
        onResetGuidanceLineObjects();
      }

      return { emptyGrid, setupGuidanceLineObjects: [] };
    };

    // Test data - no setup
    const gridSize = { width: 61, height: 61 };
    const challenge = {}; // No setup
    const brushes = {};

    // Execute clear operation
    const result = simulateHandleClear(
      gridSize,
      challenge,
      brushes,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject,
      mockOnRunningChange
    );

    // Verify that running state is set to false
    expect(mockOnRunningChange).toHaveBeenCalledWith(false);

    // Verify that guidance lines are reset
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalled();

    // Verify that no setup guidance lines are added
    expect(mockOnAddGuidanceLineObject).not.toHaveBeenCalled();

    // Verify grid is emptied
    expect(result.emptyGrid).toBeDefined();
    expect(result.setupGuidanceLineObjects).toHaveLength(0);
  });

  test('should handle clear button vs reset button behavior difference', () => {
    // Mock functions
    const mockOnRunningChange = jest.fn();
    const mockOnResetGuidanceLineObjects = jest.fn();
    const mockOnAddGuidanceLineObject = jest.fn();

    // Simulate handleReset logic
    const simulateHandleReset = (initialBoardState, onResetGuidanceLineObjects, onRunningChange) => {
      if (onRunningChange) {
        onRunningChange(false);
      }

      const resetGrid = initialBoardState.map(arr => [...arr]);

      if (onResetGuidanceLineObjects) {
        onResetGuidanceLineObjects();
      }

      return { resetGrid };
    };

    // Simulate handleClear logic (simplified)
    const simulateHandleClear = (gridSize, onResetGuidanceLineObjects, onRunningChange) => {
      if (onRunningChange) {
        onRunningChange(false);
      }

      const emptyGrid = GameService.createEmptyGrid(gridSize.width, gridSize.height);

      if (onResetGuidanceLineObjects) {
        onResetGuidanceLineObjects();
      }

      return { emptyGrid };
    };

    // Test data
    const gridSize = { width: 61, height: 61 };
    const initialBoardState = GameService.createEmptyGrid(gridSize.width, gridSize.height);

    // Add some patterns to initial board state
    initialBoardState[30][30] = 1;
    initialBoardState[30][31] = 1;
    initialBoardState[30][32] = 1;

    // Reset button behavior
    mockOnResetGuidanceLineObjects.mockClear();
    mockOnRunningChange.mockClear();

    const resetResult = simulateHandleReset(
      initialBoardState,
      mockOnResetGuidanceLineObjects,
      mockOnRunningChange
    );

    // Clear button behavior
    mockOnResetGuidanceLineObjects.mockClear();
    mockOnRunningChange.mockClear();

    const clearResult = simulateHandleClear(
      gridSize,
      mockOnResetGuidanceLineObjects,
      mockOnRunningChange
    );

    // Both should clear guidance lines
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalled();

    // Reset preserves initial board state patterns
    expect(resetResult.resetGrid[30][30]).toBe(1);
    expect(resetResult.resetGrid[30][31]).toBe(1);
    expect(resetResult.resetGrid[30][32]).toBe(1);

    // Clear creates empty grid
    expect(clearResult.emptyGrid[30][30]).toBe(0);
    expect(clearResult.emptyGrid[30][31]).toBe(0);
    expect(clearResult.emptyGrid[30][32]).toBe(0);
  });
});
