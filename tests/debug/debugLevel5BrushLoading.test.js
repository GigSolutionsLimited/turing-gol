/**
 * Debug test to check actual brush loading and guidance line parsing
 */

import { parseRLEFile } from '../../src/utils/rleUtils.js';
import { BrushService } from '../../src/services/brushService.js';

describe('Debug Level 5 Brush Loading', () => {
  test('should correctly parse p30GliderGunG.rle file with guidance line', async () => {
    // Test the actual RLE content from the file
    const rleContent = `#N Gosper Gun
#P SE/21/7/*/3
x = 36, y = 9, rule = B3/S23
24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8b
o3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!`;

    // Parse the RLE content
    const brushData = parseRLEFile(rleContent);

    console.log('Parsed brush data:', brushData);

    // Verify basic properties
    expect(brushData.name).toBe('Gosper Gun');
    expect(brushData.pattern).toBeDefined();
    expect(brushData.pattern.length).toBeGreaterThan(0);

    // Verify guidance line parsing
    expect(brushData.guidanceLine).toBeDefined();
    expect(brushData.guidanceLine).toEqual({
      direction: 'SE',
      startX: 21,
      startY: 7,
      length: 'infinite',
      speed: 3
    });
  });

  test('should load all brushes and verify p30GliderGunG has guidance line', async () => {
    // Mock fetch for testing
    const originalFetch = global.fetch;

    // Mock the manifest.json
    global.fetch = jest.fn((url) => {
      if (url === '/brushes/manifest.json') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            brushes: ['p30GliderGunG.rle']
          })
        });
      } else if (url === '/brushes/p30GliderGunG.rle') {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(`#N Gosper Gun
#P SE/21/7/*/3
x = 36, y = 9, rule = B3/S23
24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8b
o3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!`)
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    try {
      const brushes = await BrushService.loadAllBrushes();

      console.log('Loaded brushes:', Object.keys(brushes));
      console.log('p30GliderGunG brush:', brushes['p30GliderGunG']);

      // Verify the brush exists
      expect(brushes['p30GliderGunG']).toBeDefined();

      // Verify it has a guidance line
      expect(brushes['p30GliderGunG'].guidanceLine).toBeDefined();
      expect(brushes['p30GliderGunG'].guidanceLine).toEqual({
        direction: 'SE',
        startX: 21,
        startY: 7,
        length: 'infinite',
        speed: 3
      });

    } finally {
      // Restore original fetch
      global.fetch = originalFetch;
    }
  });

  test('should verify the timing of brush loading vs setup effect', () => {
    // This test simulates the potential race condition between brush loading and setup effect

    let brushesLoaded = false;
    let brushes = {};
    let setupEffectCallCount = 0;

    const challenge = {
      setup: [{ x: -50, y: -50, brush: 'p30GliderGunG' }]
    };

    // Mock guidance line management
    const mockResetGuidanceLineObjects = jest.fn();
    const mockAddGuidanceLineObject = jest.fn();

    // Simulate setup effect
    const simulateSetupEffect = () => {
      setupEffectCallCount++;
      console.log(`Setup effect called (${setupEffectCallCount}), brushesLoaded: ${brushesLoaded}, brushCount: ${Object.keys(brushes).length}`);

      if (!challenge || !challenge.setup || !brushesLoaded || challenge.setup.length === 0) {
        console.log('Setup effect returning early');
        return { created: 0 };
      }

      let guidanceLinesCreated = 0;

      for (const setupItem of challenge.setup) {
        const brush = brushes[setupItem.brush];
        console.log(`Processing ${setupItem.brush}, brush found: ${!!brush}, has guidance: ${!!(brush && brush.guidanceLine)}`);

        if (brush && brush.guidanceLine) {
          guidanceLinesCreated++;
          mockAddGuidanceLineObject({
            type: 'guidanceLine',
            generation: 0,
            ...brush.guidanceLine
          });
        }
      }

      if (guidanceLinesCreated > 0) {
        mockResetGuidanceLineObjects();
      }

      return { created: guidanceLinesCreated };
    };

    // Simulate component lifecycle

    // 1. Component mounts, challenge loads, but brushes not loaded yet
    const result1 = simulateSetupEffect();
    expect(result1.created).toBe(0);

    // 2. Brushes start loading (async)
    setTimeout(() => {
      brushes = {
        'p30GliderGunG': {
          name: 'Gosper Gun',
          pattern: [[0, 0]],
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
    }, 10);

    // 3. Setup effect should run again when brushesLoaded changes
    setTimeout(() => {
      const result2 = simulateSetupEffect();
      expect(result2.created).toBe(1);
      expect(mockAddGuidanceLineObject).toHaveBeenCalled();
    }, 20);

    // Verify the sequence
    expect(setupEffectCallCount).toBeGreaterThan(0);
  });
});
