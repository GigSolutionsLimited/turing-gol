/**
 * Test guidance line initialization on challenge loading
 */

import { GameService } from '../../src/services/gameService.js';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Guidance Line Challenge Loading', () => {
  test('should clear all guidance lines when exercise changes', () => {
    // Mock the clearing functions
    const mockClearAllPlacedGuidanceLines = jest.fn();
    const mockResetGuidanceLineObjects = jest.fn();

    // Simulate the exercise change logic from GameOfLife
    const simulateExerciseChange = (exerciseChanged, onClearAllPlacedGuidanceLines, onResetGuidanceLineObjects) => {
      if (exerciseChanged) {
        // Reset guidance line objects to only generation 0 lines
        if (onResetGuidanceLineObjects) {
          onResetGuidanceLineObjects();
        }

        // Clear all legacy placed guidance lines
        if (onClearAllPlacedGuidanceLines) {
          onClearAllPlacedGuidanceLines();
        }
      }
    };

    // Test that both clearing functions are called when exercise changes
    simulateExerciseChange(true, mockClearAllPlacedGuidanceLines, mockResetGuidanceLineObjects);

    expect(mockClearAllPlacedGuidanceLines).toHaveBeenCalled();
    expect(mockResetGuidanceLineObjects).toHaveBeenCalled();

    // Test that functions are not called when exercise doesn't change
    mockClearAllPlacedGuidanceLines.mockClear();
    mockResetGuidanceLineObjects.mockClear();

    simulateExerciseChange(false, mockClearAllPlacedGuidanceLines, mockResetGuidanceLineObjects);

    expect(mockClearAllPlacedGuidanceLines).not.toHaveBeenCalled();
    expect(mockResetGuidanceLineObjects).not.toHaveBeenCalled();
  });

  test('should initialize setup guidance lines when challenge and brushes load', () => {
    // Mock a challenge with setup patterns containing guidance lines
    const challenge = {
      setup: [
        {
          x: -5,
          y: 0,
          brush: 'test-pattern-1'
        },
        {
          x: 5,
          y: 5,
          brush: 'test-pattern-2'
        },
        {
          x: 0,
          y: -5,
          brush: 'pattern-without-guidance'
        }
      ]
    };

    // Mock brushes - some with guidance lines, some without
    const brushes = {
      'test-pattern-1': {
        name: 'Test Pattern 1',
        pattern: [[0, 0], [0, 1]],
        guidanceLine: {
          direction: 'E',
          startX: 2,
          startY: 1,
          length: 10,
          speed: 2
        }
      },
      'test-pattern-2': {
        name: 'Test Pattern 2',
        pattern: [[0, 0]],
        guidanceLine: {
          direction: 'N',
          startX: 0,
          startY: 0,
          length: 'infinite',
          speed: 1
        }
      },
      'pattern-without-guidance': {
        name: 'Pattern Without Guidance',
        pattern: [[0, 0], [1, 0]]
        // No guidanceLine property
      }
    };

    const grid = GameService.createEmptyGrid(61, 61);

    // Mock the guidance line management functions
    const mockResetGuidanceLineObjects = jest.fn();
    const mockAddGuidanceLineObject = jest.fn();

    // Simulate the setup guidance line initialization logic
    const setupGuidanceLineObjects = [];
    const centerOffsetX = Math.floor(grid[0].length / 2);
    const centerOffsetY = Math.floor(grid.length / 2);

    for (const setupItem of challenge.setup) {
      const brush = brushes[setupItem.brush];
      if (brush && brush.guidanceLine) {
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

    // Reset and add setup guidance line objects
    mockResetGuidanceLineObjects();
    setupGuidanceLineObjects.forEach(guidanceLineObject => {
      mockAddGuidanceLineObject(guidanceLineObject);
    });

    // Verify that 2 guidance lines were created (from test-pattern-1 and test-pattern-2)
    expect(setupGuidanceLineObjects).toHaveLength(2);

    // Verify the guidance line objects have correct properties
    expect(setupGuidanceLineObjects[0]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'E',
      length: 10,
      speed: 2
    });

    expect(setupGuidanceLineObjects[1]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'N',
      length: 'infinite',
      speed: 1
    });

    // Verify management functions were called correctly
    expect(mockResetGuidanceLineObjects).toHaveBeenCalledTimes(1);
    expect(mockAddGuidanceLineObject).toHaveBeenCalledTimes(2);
  });

  test('should handle challenge without setup patterns gracefully', () => {
    const challenge = {
      // No setup property
    };

    const brushes = {};

    // This should not create any guidance lines and not throw errors
    const setupGuidanceLineObjects = [];

    // Simulate the logic that checks for setup patterns
    if (challenge && challenge.setup && challenge.setup.length > 0) {
      // This block should not execute
      for (const setupItem of challenge.setup) {
        setupGuidanceLineObjects.push({});
      }
    }

    expect(setupGuidanceLineObjects).toHaveLength(0);
  });

  test('should handle challenge with setup patterns but no brushes loaded', () => {
    const challenge = {
      setup: [
        {
          x: 0,
          y: 0,
          brush: 'non-existent-brush'
        }
      ]
    };

    const brushes = {}; // Empty brushes object

    const setupGuidanceLineObjects = [];
    const grid = GameService.createEmptyGrid(61, 61);
    const centerOffsetX = Math.floor(grid[0].length / 2);
    const centerOffsetY = Math.floor(grid.length / 2);

    for (const setupItem of challenge.setup) {
      const brush = brushes[setupItem.brush];
      if (brush && brush.guidanceLine) {
        // This should not execute because brush doesn't exist
        const guidanceLineObject = createGuidanceLineFromBrush(
          brush.guidanceLine,
          0,
          centerOffsetX + setupItem.x,
          centerOffsetY + setupItem.y
        );

        if (guidanceLineObject) {
          setupGuidanceLineObjects.push(guidanceLineObject);
        }
      }
    }

    // Should have no guidance lines since the brush doesn't exist
    expect(setupGuidanceLineObjects).toHaveLength(0);
  });

  test('should calculate correct placement coordinates for setup guidance lines', () => {
    const challenge = {
      setup: [
        {
          x: -10, // Negative X offset
          y: 5,   // Positive Y offset
          brush: 'test-pattern'
        }
      ]
    };

    const brushes = {
      'test-pattern': {
        pattern: [[0, 0]],
        guidanceLine: {
          direction: 'SE',
          startX: 3,  // Relative to pattern
          startY: -2, // Relative to pattern
          length: 15,
          speed: 4
        }
      }
    };

    const grid = GameService.createEmptyGrid(61, 61);
    const centerOffsetX = Math.floor(grid[0].length / 2); // 30
    const centerOffsetY = Math.floor(grid.length / 2);    // 30

    const setupItem = challenge.setup[0];
    const brush = brushes[setupItem.brush];

    // Calculate placement coordinates
    const placementX = centerOffsetX + setupItem.x; // 30 + (-10) = 20
    const placementY = centerOffsetY + setupItem.y; // 30 + 5 = 35

    const guidanceLineObject = createGuidanceLineFromBrush(
      brush.guidanceLine,
      0,
      placementX,
      placementY
    );

    // Verify the final origin coordinates
    // originX = placementX + startX = 20 + 3 = 23
    // originY = placementY + startY = 35 + (-2) = 33
    expect(guidanceLineObject.originX).toBe(23);
    expect(guidanceLineObject.originY).toBe(33);
    expect(guidanceLineObject.direction).toBe('SE');
    expect(guidanceLineObject.length).toBe(15);
    expect(guidanceLineObject.speed).toBe(4);
    expect(guidanceLineObject.generation).toBe(0);
  });
});
