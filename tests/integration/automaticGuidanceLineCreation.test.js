/**
 * Integration test for automatic guidance line creation from brush patterns
 */

import { parseRLEFile } from '../../src/utils/rleUtils.js';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Automatic Guidance Line Creation Integration', () => {
  test('should create guidance line objects from brush patterns with guidance specifications', () => {
    // Sample RLE content with guidance line specification
    const rleContent = `#N Test Pattern with Guidance
#P SE/5/3/*/4
x = 3, y = 3, rule = B3/S23
bo$2bo$3o!`;

    // Parse the RLE file to get pattern with guidance line spec
    const brushPattern = parseRLEFile(rleContent);

    // Verify the pattern was parsed correctly with guidance line
    expect(brushPattern.name).toBe('Test Pattern with Guidance');
    expect(brushPattern.guidanceLine).toEqual({
      direction: 'SE',
      startX: 5,
      startY: 3,
      length: 'infinite',
      speed: 4
    });

    // Simulate placing the brush at generation 7, position (10, 15)
    const generation = 7;
    const placementX = 10;
    const placementY = 15;

    const guidanceLineObject = createGuidanceLineFromBrush(
      brushPattern.guidanceLine,
      generation,
      placementX,
      placementY
    );

    // Verify the guidance line object was created correctly
    expect(guidanceLineObject).toMatchObject({
      type: 'guidanceLine',
      generation: 7,
      originX: 15, // placementX (10) + startX (5)
      originY: 18, // placementY (15) + startY (3)
      direction: 'SE',
      length: 'infinite',
      speed: 4
    });

    expect(guidanceLineObject.id).toBeDefined();
    expect(guidanceLineObject.createdAt).toBeDefined();
  });

  test('should handle brush patterns without guidance lines', () => {
    const rleContent = `#N Simple Pattern
x = 3, y = 3, rule = B3/S23
bo$2bo$3o!`;

    const brushPattern = parseRLEFile(rleContent);

    // Should not have a guidance line
    expect(brushPattern.guidanceLine).toBeNull();

    // Should return null when trying to create guidance line object
    const guidanceLineObject = createGuidanceLineFromBrush(
      brushPattern.guidanceLine,
      0,
      0,
      0
    );

    expect(guidanceLineObject).toBeNull();
  });

  test('should work with all direction types', () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

    for (const direction of directions) {
      const rleContent = `#N Pattern ${direction}
#P ${direction}/0/0/10/2
x = 1, y = 1, rule = B3/S23
o!`;

      const brushPattern = parseRLEFile(rleContent);

      expect(brushPattern.guidanceLine.direction).toBe(direction);

      const guidanceLineObject = createGuidanceLineFromBrush(
        brushPattern.guidanceLine,
        0,
        5,
        5
      );

      expect(guidanceLineObject.direction).toBe(direction);
      expect(guidanceLineObject.originX).toBe(5); // placementX + startX (0)
      expect(guidanceLineObject.originY).toBe(5); // placementY + startY (0)
    }
  });

  test('should handle numeric length specifications', () => {
    const rleContent = `#N Pattern with Numeric Length
#P E/2/1/15/3
x = 2, y = 2, rule = B3/S23
bo$ob!`;

    const brushPattern = parseRLEFile(rleContent);

    expect(brushPattern.guidanceLine).toEqual({
      direction: 'E',
      startX: 2,
      startY: 1,
      length: 15,
      speed: 3
    });

    const guidanceLineObject = createGuidanceLineFromBrush(
      brushPattern.guidanceLine,
      2,
      8,
      12
    );

    expect(guidanceLineObject).toMatchObject({
      generation: 2,
      originX: 10, // 8 + 2
      originY: 13, // 12 + 1
      direction: 'E',
      length: 15,
      speed: 3
    });
  });

  test('should create multiple guidance lines from different brushes at different generations', () => {
    // First brush at generation 0
    const brush1 = {
      guidanceLine: {
        direction: 'E',
        startX: 0,
        startY: 0,
        length: 'infinite',
        speed: 2
      }
    };

    // Second brush at generation 5
    const brush2 = {
      guidanceLine: {
        direction: 'N',
        startX: 1,
        startY: 1,
        length: 10,
        speed: 1
      }
    };

    const line1 = createGuidanceLineFromBrush(brush1.guidanceLine, 0, 0, 0);
    const line2 = createGuidanceLineFromBrush(brush2.guidanceLine, 5, 10, 10);

    expect(line1.generation).toBe(0);
    expect(line2.generation).toBe(5);

    // Different IDs
    expect(line1.id).not.toBe(line2.id);

    // Different origins
    expect(line1.originX).toBe(0);
    expect(line1.originY).toBe(0);
    expect(line2.originX).toBe(11); // 10 + 1
    expect(line2.originY).toBe(11); // 10 + 1
  });
});
