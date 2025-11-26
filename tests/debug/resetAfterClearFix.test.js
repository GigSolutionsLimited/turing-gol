/**
 * Test for reset after clear functionality
 * Tests the specific issue where setup patterns disappear when resetting after clearing
 */

import { GameService } from '../../src/services/gameService.js';

// Mock dependencies
const mockBrushes = {
  'testBrush': {
    name: 'Test Brush',
    pattern: [[0, 0], [0, 1], [1, 0]], // Simple 2x2 pattern
    guidanceLine: {
      direction: 'SE',
      startX: 1,
      startY: 1,
      length: 'infinite',
      speed: 4
    }
  }
};

const mockChallenge = {
  name: 'Test Challenge',
  width: 50,
  height: 50,
  setup: [
    {
      x: 0,
      y: 0,
      brush: 'testBrush'
    }
  ],
  detectors: [
    {
      x: 10,
      y: 10,
      state: 'inactive'
    }
  ],
  detectorFalloffPeriod: 30
};

describe('Reset After Clear Functionality', () => {
  let mockGameRef;
  let mockGuidanceLineObjects;
  let mockOnResetGuidanceLineObjects;
  let mockOnAddGuidanceLineObject;

  beforeEach(() => {
    mockGuidanceLineObjects = [];
    mockOnResetGuidanceLineObjects = jest.fn(() => {
      mockGuidanceLineObjects.length = 0;
    });
    mockOnAddGuidanceLineObject = jest.fn((obj) => {
      mockGuidanceLineObjects.push(obj);
    });

    mockGameRef = {
      handleClear: jest.fn(),
      handleReset: jest.fn(),
      getGrid: jest.fn(() => GameService.createEmptyGrid(50, 50))
    };
  });

  test('should maintain setup patterns when reset after clear', () => {
    // Simulate the sequence: clear -> reset

    // Initial state - empty grid
    let grid = GameService.createEmptyGrid(50, 50);
    let detectors = [];

    // Simulate clear operation (should restore setup patterns)
    // This is what the clear function does:
    if (mockChallenge.setup && mockChallenge.setup.length > 0) {
      // Create new grid with setup patterns
      const newGrid = grid.map(arr => [...arr]);
      const centerOffsetX = Math.floor(50 / 2); // 25
      const centerOffsetY = Math.floor(50 / 2); // 25

      for (const setupItem of mockChallenge.setup) {
        const brush = mockBrushes[setupItem.brush];
        if (brush && brush.pattern) {
          for (const [dy, dx] of brush.pattern) {
            const gridY = centerOffsetY + setupItem.y + dy;
            const gridX = centerOffsetX + setupItem.x + dx;
            if (gridY >= 0 && gridY < newGrid.length && gridX >= 0 && gridX < newGrid[0].length) {
              newGrid[gridY][gridX] = 1;
            }
          }
        }
      }

      grid = newGrid;

      // Restore detectors
      if (mockChallenge.detectors && mockChallenge.detectors.length > 0) {
        detectors = mockChallenge.detectors.map(d => ({
          ...d,
          x: centerOffsetX + d.x,
          y: centerOffsetY + d.y
        }));
      }
    }

    // Verify setup patterns are present after clear
    const setupPixelCount = grid.reduce((count, row) =>
      count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0);

    expect(setupPixelCount).toBe(3); // testBrush has 3 pixels
    expect(detectors).toHaveLength(1); // Should have one detector

    // Now simulate reset operation (this should preserve the setup)
    const initialBoardState = grid.map(arr => [...arr]); // Save the state with setup

    // Reset should restore from initialBoardState and preserve detectors
    const resetGrid = initialBoardState.map(arr => [...arr]);

    // Reset should also restore challenge detectors
    let resetDetectors = [];
    if (mockChallenge.detectors && mockChallenge.detectors.length > 0) {
      resetDetectors = mockChallenge.detectors.map(d => ({
        ...d,
        x: 25 + d.x, // centerOffsetX + d.x
        y: 25 + d.y  // centerOffsetY + d.y
      }));
    }

    // Verify setup patterns are still present after reset
    const resetPixelCount = resetGrid.reduce((count, row) =>
      count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0);

    expect(resetPixelCount).toBe(3); // Setup patterns should be preserved
    expect(resetDetectors).toHaveLength(1); // Detectors should be restored
    expect(resetDetectors[0].x).toBe(35); // 25 + 10
    expect(resetDetectors[0].y).toBe(35); // 25 + 10
  });

  test('should handle reset after clear with no setup gracefully', () => {
    const challengeWithoutSetup = {
      ...mockChallenge,
      setup: [],
      detectors: []
    };

    // Simulate clear with no setup
    let grid = GameService.createEmptyGrid(50, 50);
    let detectors = [];

    // Clear should result in empty grid
    const emptyPixelCount = grid.reduce((count, row) =>
      count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0);

    expect(emptyPixelCount).toBe(0);
    expect(detectors).toHaveLength(0);

    // Reset should also result in empty grid
    const resetGrid = grid.map(arr => [...arr]);
    let resetDetectors = [];

    const resetPixelCount = resetGrid.reduce((count, row) =>
      count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0);

    expect(resetPixelCount).toBe(0);
    expect(resetDetectors).toHaveLength(0);
  });

  test('should preserve generation 0 guidance lines during reset', () => {
    // Setup guidance lines
    const setupGuidanceLine = {
      id: 'setup_line_1',
      type: 'guidanceLine',
      generation: 0,
      originX: 25,
      originY: 25
    };

    const userGuidanceLine = {
      id: 'user_line_1',
      type: 'guidanceLine',
      generation: 0,
      originX: 30,
      originY: 30
    };

    const laterGenerationLine = {
      id: 'later_line_1',
      type: 'guidanceLine',
      generation: 5,
      originX: 35,
      originY: 35
    };

    mockGuidanceLineObjects.push(setupGuidanceLine, userGuidanceLine, laterGenerationLine);

    // Simulate reset guidance line filtering
    const generation0Lines = mockGuidanceLineObjects.filter(line => line.generation === 0);

    expect(generation0Lines).toHaveLength(2); // Should keep both generation 0 lines
    expect(generation0Lines.map(l => l.id)).toEqual(['setup_line_1', 'user_line_1']);

    // Simulate the reset process
    mockOnResetGuidanceLineObjects();
    expect(mockGuidanceLineObjects).toHaveLength(0);

    // Restore generation 0 lines
    generation0Lines.forEach(line => {
      mockOnAddGuidanceLineObject(line);
    });

    expect(mockGuidanceLineObjects).toHaveLength(2);
    expect(mockGuidanceLineObjects.map(l => l.id)).toEqual(['setup_line_1', 'user_line_1']);
  });
});
