/**
 * Test to reproduce the specific Level 5 Gosper Gun guidance line issue
 */

import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';
import { BrushService } from '../../src/services/brushService.js';

describe('Level 5 Gosper Gun Guidance Line Issue', () => {
  test('should properly parse and initialize guidance line from p30GliderGunG brush', () => {
    // Simulate the Level 5 challenge configuration
    const level5Challenge = {
      setup: [
        {
          x: -50,
          y: -50,
          brush: "p30GliderGunG"
        }
      ]
    };

    // Simulate the p30GliderGunG brush data (based on the RLE file)
    const brushes = {
      'p30GliderGunG': {
        name: 'Gosper Gun',
        pattern: [
          // Simplified pattern representation for testing
          [0, 24], [1, 22], [1, 23], [2, 12], [2, 13]
          // ... (full pattern would be here)
        ],
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
    const centerOffsetX = Math.floor(gridSize.width / 2);  // 50
    const centerOffsetY = Math.floor(gridSize.height / 2); // 50

    // Simulate the setup guidance line initialization logic
    const setupGuidanceLineObjects = [];

    for (const setupItem of level5Challenge.setup) {
      const brush = brushes[setupItem.brush];

      // Debug: Check if brush exists
      console.log('Brush exists:', !!brush);
      console.log('Brush has guidanceLine:', !!(brush && brush.guidanceLine));

      if (brush && brush.guidanceLine) {
        const placementX = centerOffsetX + setupItem.x; // 50 + (-50) = 0
        const placementY = centerOffsetY + setupItem.y; // 50 + (-50) = 0

        console.log('Placement coordinates:', { placementX, placementY });
        console.log('Guidance line spec:', brush.guidanceLine);

        const guidanceLineObject = createGuidanceLineFromBrush(
          brush.guidanceLine,
          0, // Setup guidance lines are at generation 0
          placementX,
          placementY
        );

        console.log('Created guidance line object:', guidanceLineObject);

        if (guidanceLineObject) {
          setupGuidanceLineObjects.push(guidanceLineObject);
        }
      }
    }

    // Verify that the guidance line was created correctly
    expect(setupGuidanceLineObjects).toHaveLength(1);

    const guidanceLineObject = setupGuidanceLineObjects[0];
    expect(guidanceLineObject).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });

    // Verify the final origin coordinates
    // originX = placementX + startX = 0 + 21 = 21
    // originY = placementY + startY = 0 + 7 = 7
    expect(guidanceLineObject.originX).toBe(21);
    expect(guidanceLineObject.originY).toBe(7);
  });

  test('should simulate Level 5 loading and verify guidance line creation', () => {
    // This test simulates the exact scenario described by the user

    const level5Config = {
      setup: [
        {
          x: -50,
          y: -50,
          brush: "p30GliderGunG"
        }
      ]
    };

    // Mock the brush loading process
    let brushesLoaded = false;
    let brushes = {};

    // Simulate brush loading completing
    const loadBrushes = () => {
      brushes = {
        'p30GliderGunG': {
          name: 'Gosper Gun',
          pattern: [[0, 0]], // Simplified for test
          guidanceLine: {
            direction: 'SE',
            startX: 21,
            startY: 7,
            length: 'infinite',
            speed: 3
          }
        }
      };
      brushesLoaded = true;
    };

    // Mock guidance line management functions
    const mockResetGuidanceLineObjects = jest.fn();
    const mockAddGuidanceLineObject = jest.fn();

    // Simulate the setup effect logic
    const simulateSetupEffect = (challenge, brushes, brushesLoaded) => {
      console.log('Setup effect running with:', {
        challengeHasSetup: !!(challenge && challenge.setup && challenge.setup.length > 0),
        brushesLoaded,
        brushCount: Object.keys(brushes).length
      });

      if (!challenge || !challenge.setup || !brushesLoaded || challenge.setup.length === 0) {
        console.log('Setup effect early return - conditions not met');
        return { setupGuidanceLines: [] };
      }

      const setupGuidanceLineObjects = [];
      const gridSize = { width: 101, height: 101 };
      const centerOffsetX = Math.floor(gridSize.width / 2);
      const centerOffsetY = Math.floor(gridSize.height / 2);

      for (const setupItem of challenge.setup) {
        const brush = brushes[setupItem.brush];
        console.log('Processing setup item:', setupItem.brush, 'brush found:', !!brush);

        if (brush && brush.guidanceLine) {
          console.log('Creating guidance line for:', setupItem.brush);

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

      // Reset and add guidance line objects
      mockResetGuidanceLineObjects();
      setupGuidanceLineObjects.forEach(guidanceLineObject => {
        mockAddGuidanceLineObject(guidanceLineObject);
      });

      return { setupGuidanceLines: setupGuidanceLineObjects };
    };

    // Test scenario 1: Level loads but brushes not yet loaded (initial state)
    const result1 = simulateSetupEffect(level5Config, {}, false);
    expect(result1.setupGuidanceLines).toHaveLength(0);
    expect(mockAddGuidanceLineObject).not.toHaveBeenCalled();

    // Test scenario 2: Brushes load (should trigger guidance line creation)
    loadBrushes();
    const result2 = simulateSetupEffect(level5Config, brushes, brushesLoaded);
    expect(result2.setupGuidanceLines).toHaveLength(1);
    expect(mockResetGuidanceLineObjects).toHaveBeenCalled();
    expect(mockAddGuidanceLineObject).toHaveBeenCalledTimes(1);

    // Verify the created guidance line
    const createdGuidanceLine = result2.setupGuidanceLines[0];
    expect(createdGuidanceLine.direction).toBe('SE');
    expect(createdGuidanceLine.length).toBe('infinite');
    expect(createdGuidanceLine.generation).toBe(0);
  });

  test('should verify brush parsing handles guidance line specifications correctly', () => {
    // Test the RLE parsing logic for guidance lines
    const rleContent = '#N Gosper Gun\n#P SE/21/7/*/3\nx = 36, y = 9, rule = B3/S23\n24bo11b$22bobo11b$12b2o6b2o12b2o$...';

    // Simulate the guidance line parsing from RLE comment
    const guidanceLineMatch = rleContent.match(/#P\s+([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)\/([^\/]+)/);

    expect(guidanceLineMatch).not.toBeNull();

    if (guidanceLineMatch) {
      const [, direction, startX, startY, length, speed] = guidanceLineMatch;

      const parsedGuidanceLine = {
        direction,
        startX: parseInt(startX, 10),
        startY: parseInt(startY, 10),
        length: length === '*' ? 'infinite' : parseInt(length, 10),
        speed: parseInt(speed, 10)
      };

      expect(parsedGuidanceLine).toEqual({
        direction: 'SE',
        startX: 21,
        startY: 7,
        length: 'infinite',
        speed: 3
      });
    }
  });
});
