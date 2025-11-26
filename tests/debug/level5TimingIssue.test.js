/**
 * Test to reproduce the exact Level 5 timing issue
 */

import React, { useEffect, useState } from 'react';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Level 5 Setup Timing Issue', () => {
  test('should reproduce the exact sequence that causes missing guidance lines', () => {
    // This test simulates the exact React lifecycle for Level 5

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

    // Mock the progression of state changes
    let challengeLoaded = false;
    let brushesLoaded = false;
    let brushes = {};
    let setupEffectRuns = [];

    // Mock guidance line functions
    const mockResetGuidanceLineObjects = jest.fn();
    const mockAddGuidanceLineObject = jest.fn();

    // This simulates the setup effect exactly as it appears in GameOfLife.jsx
    const simulateSetupEffect = (challenge, brushes, brushesLoaded) => {
      setupEffectRuns.push({
        timestamp: Date.now(),
        challengeExists: !!challenge,
        challengeHasSetup: !!(challenge && challenge.setup && challenge.setup.length > 0),
        brushesLoaded,
        brushCount: Object.keys(brushes).length,
        targetBrushExists: !!brushes['p30GliderGunG'],
        targetBrushHasGuidance: !!(brushes['p30GliderGunG'] && brushes['p30GliderGunG'].guidanceLine)
      });

      console.log('Setup effect run:', setupEffectRuns[setupEffectRuns.length - 1]);

      if (!challenge || !challenge.setup || !brushesLoaded || challenge.setup.length === 0) {
        console.log('Setup effect returning early');
        return { guidanceLinesCreated: 0 };
      }

      // Simulate the exact logic from GameOfLife.jsx
      let currentGridForGuidance = Array(challenge.height).fill().map(() => Array(challenge.width).fill(0));

      // Place setup patterns on grid (simplified)
      const { centerOffsetX, centerOffsetY } = {
        centerOffsetX: Math.floor(challenge.width / 2),
        centerOffsetY: Math.floor(challenge.height / 2)
      };

      const setupGuidanceLineObjects = [];

      for (const setupItem of challenge.setup) {
        const brush = brushes[setupItem.brush];
        console.log(`Processing setup item: ${setupItem.brush}`, {
          brushExists: !!brush,
          hasGuidanceLine: !!(brush && brush.guidanceLine)
        });

        if (brush && brush.guidanceLine) {
          const placementX = centerOffsetX + setupItem.x;
          const placementY = centerOffsetY + setupItem.y;

          console.log(`Creating guidance line for ${setupItem.brush} at (${placementX}, ${placementY})`);

          const guidanceLineObject = createGuidanceLineFromBrush(
            brush.guidanceLine,
            0,
            placementX,
            placementY
          );

          if (guidanceLineObject) {
            setupGuidanceLineObjects.push(guidanceLineObject);
            console.log('Created guidance line object:', guidanceLineObject);
          }
        }
      }

      // Set guidance line objects
      if (setupGuidanceLineObjects.length > 0) {
        mockResetGuidanceLineObjects();
        setupGuidanceLineObjects.forEach(guidanceLineObject => {
          mockAddGuidanceLineObject(guidanceLineObject);
        });
      }

      console.log(`Setup effect complete: ${setupGuidanceLineObjects.length} guidance lines created`);
      return { guidanceLinesCreated: setupGuidanceLineObjects.length };
    };

    // Simulate React lifecycle sequence for Level 5 loading

    // 1. Component mounts, useBrushes starts loading but hasn't completed
    console.log('=== Step 1: Component mount, brushes loading ===');
    challengeLoaded = true;
    const result1 = simulateSetupEffect(level5Challenge, {}, false);
    expect(result1.guidanceLinesCreated).toBe(0);

    // 2. Brushes finish loading
    console.log('=== Step 2: Brushes loaded ===');
    brushes = {
      'p30GliderGunG': {
        name: 'Gosper Gun',
        pattern: [[0, 24], [1, 22], [1, 23]], // Simplified pattern
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

    // This should trigger the setup effect again
    const result2 = simulateSetupEffect(level5Challenge, brushes, brushesLoaded);
    expect(result2.guidanceLinesCreated).toBe(1);

    // 3. Verify the guidance line functions were called
    expect(mockResetGuidanceLineObjects).toHaveBeenCalledTimes(1);
    expect(mockAddGuidanceLineObject).toHaveBeenCalledTimes(1);

    // 4. Verify the guidance line object was created correctly
    const guidanceLineCall = mockAddGuidanceLineObject.mock.calls[0][0];
    expect(guidanceLineCall).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 3
    });

    // Expected coordinates: centerOffset (50) + setupItem.x (-50) + startX (21) = 21
    expect(guidanceLineCall.originX).toBe(21);
    expect(guidanceLineCall.originY).toBe(7);

    // Verify the sequence of events
    expect(setupEffectRuns).toHaveLength(2);
    expect(setupEffectRuns[0].brushesLoaded).toBe(false);
    expect(setupEffectRuns[1].brushesLoaded).toBe(true);
    expect(setupEffectRuns[1].targetBrushHasGuidance).toBe(true);
  });

  test('should identify potential issues with dependency timing', () => {
    // This test checks if there might be an issue with the dependency array

    const dependencies = {
      challenge: { setup: [{ x: -50, y: -50, brush: "p30GliderGunG" }] },
      brushes: {},
      brushesLoaded: false,
      onAddGuidanceLineObject: jest.fn(),
      onResetGuidanceLineObjects: jest.fn()
    };

    // Simulate what happens when only some dependencies change
    const checkEffectShouldRun = (previousDeps, currentDeps) => {
      const depKeys = Object.keys(currentDeps);
      for (const key of depKeys) {
        if (previousDeps[key] !== currentDeps[key]) {
          return true;
        }
      }
      return false;
    };

    // Scenario 1: Brushes object changes but brushesLoaded is still false
    const deps1 = { ...dependencies };
    const deps2 = {
      ...dependencies,
      brushes: { 'p30GliderGunG': { name: 'Test' } }
    };

    expect(checkEffectShouldRun(deps1, deps2)).toBe(true);

    // Scenario 2: brushesLoaded changes from false to true
    const deps3 = {
      ...deps2,
      brushesLoaded: true
    };

    expect(checkEffectShouldRun(deps2, deps3)).toBe(true);

    // This confirms that the effect should run when brushes finish loading
  });
});
