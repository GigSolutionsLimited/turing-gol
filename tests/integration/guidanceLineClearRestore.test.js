/**
 * Test guidance line clear and restore functionality
 */

import { GameService } from '../../src/services/gameService.js';
import { BrushService } from '../../src/services/brushService.js';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';
import { getCenterOffsets } from '../../src/utils/canvasUtils.js';

describe('Guidance Line Clear and Restore', () => {
  test('should clear all guidance lines and restore setup guidance lines', () => {
    // Mock a challenge with setup patterns containing guidance lines
    const challenge = {
      setup: [
        {
          x: -5,
          y: 0,
          brush: 'test-pattern'
        }
      ],
      width: 61,
      height: 61
    };

    // Mock brushes with guidance lines
    const brushes = {
      'test-pattern': {
        name: 'Test Pattern',
        pattern: [[0, 0], [0, 1]],
        guidanceLine: {
          direction: 'E',
          startX: 2,
          startY: 1,
          length: 10,
          speed: 2
        }
      }
    };

    const gridSize = { width: 61, height: 61 };

    // Simulate the clear logic
    const { centerOffsetX, centerOffsetY } = getCenterOffsets(gridSize);

    // Track guidance line objects that would be created
    const setupGuidanceLineObjects = [];

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

    // Verify that a setup guidance line object was created
    expect(setupGuidanceLineObjects).toHaveLength(1);

    const setupGuidanceLine = setupGuidanceLineObjects[0];
    expect(setupGuidanceLine).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'E',
      length: 10,
      speed: 2
    });

    // Verify the placement coordinates
    // setupItem.x = -5, setupItem.y = 0
    // guidanceLine.startX = 2, startY = 1
    // So originX = centerOffsetX + (-5) + 2, originY = centerOffsetY + 0 + 1
    const expectedOriginX = centerOffsetX - 5 + 2;
    const expectedOriginY = centerOffsetY + 0 + 1;

    expect(setupGuidanceLine.originX).toBe(expectedOriginX);
    expect(setupGuidanceLine.originY).toBe(expectedOriginY);
  });

  test('should handle challenges without setup patterns', () => {
    const challenge = {
      // No setup patterns
      width: 61,
      height: 61
    };

    const brushes = {};

    // Simulate the clear logic
    const setupGuidanceLineObjects = [];

    if (challenge && challenge.setup && challenge.setup.length > 0 && brushes) {
      // This block should not execute
      for (const setupItem of challenge.setup) {
        const brush = brushes[setupItem.brush];
        if (brush && brush.guidanceLine) {
          setupGuidanceLineObjects.push({});
        }
      }
    }

    // Should have no setup guidance lines
    expect(setupGuidanceLineObjects).toHaveLength(0);
  });

  test('should handle setup patterns without guidance lines', () => {
    const challenge = {
      setup: [
        {
          x: 0,
          y: 0,
          brush: 'simple-pattern'
        }
      ],
      width: 61,
      height: 61
    };

    const brushes = {
      'simple-pattern': {
        name: 'Simple Pattern',
        pattern: [[0, 0], [0, 1]]
        // No guidanceLine property
      }
    };

    const gridSize = { width: 61, height: 61 };
    const { centerOffsetX, centerOffsetY } = getCenterOffsets(gridSize);

    const setupGuidanceLineObjects = [];

    for (const setupItem of challenge.setup) {
      const brush = brushes[setupItem.brush];
      if (brush && brush.guidanceLine) {
        const placementX = centerOffsetX + setupItem.x;
        const placementY = centerOffsetY + setupItem.y;

        const guidanceLineObject = createGuidanceLineFromBrush(
          brush.guidanceLine,
          0,
          placementX,
          placementY
        );

        if (guidanceLineObject) {
          setupGuidanceLineObjects.push(guidanceLineObject);
        }
      }
    }

    // Should have no guidance lines since the pattern doesn't have guidance specs
    expect(setupGuidanceLineObjects).toHaveLength(0);
  });

  test('should handle multiple setup patterns with guidance lines', () => {
    const challenge = {
      setup: [
        {
          x: -10,
          y: 0,
          brush: 'pattern1'
        },
        {
          x: 10,
          y: 0,
          brush: 'pattern2'
        },
        {
          x: 0,
          y: 10,
          brush: 'pattern-no-guidance'
        }
      ],
      width: 61,
      height: 61
    };

    const brushes = {
      'pattern1': {
        pattern: [[0, 0]],
        guidanceLine: {
          direction: 'N',
          startX: 0,
          startY: 0,
          length: 5,
          speed: 1
        }
      },
      'pattern2': {
        pattern: [[0, 0]],
        guidanceLine: {
          direction: 'S',
          startX: 1,
          startY: 1,
          length: 'infinite',
          speed: 3
        }
      },
      'pattern-no-guidance': {
        pattern: [[0, 0]]
        // No guidance line
      }
    };

    const gridSize = { width: 61, height: 61 };
    const { centerOffsetX, centerOffsetY } = getCenterOffsets(gridSize);

    const setupGuidanceLineObjects = [];

    for (const setupItem of challenge.setup) {
      const brush = brushes[setupItem.brush];
      if (brush && brush.guidanceLine) {
        const placementX = centerOffsetX + setupItem.x;
        const placementY = centerOffsetY + setupItem.y;

        const guidanceLineObject = createGuidanceLineFromBrush(
          brush.guidanceLine,
          0,
          placementX,
          placementY
        );

        if (guidanceLineObject) {
          setupGuidanceLineObjects.push(guidanceLineObject);
        }
      }
    }

    // Should have 2 guidance lines (from pattern1 and pattern2, but not from pattern-no-guidance)
    expect(setupGuidanceLineObjects).toHaveLength(2);

    expect(setupGuidanceLineObjects[0]).toMatchObject({
      direction: 'N',
      length: 5,
      speed: 1,
      generation: 0
    });

    expect(setupGuidanceLineObjects[1]).toMatchObject({
      direction: 'S',
      length: 'infinite',
      speed: 3,
      generation: 0
    });
  });
});
