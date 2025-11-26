// Test for multiple guidance lines functionality
import { parseRLEFile } from '../../src/utils/rleUtils.js';
import { createGuidanceLineFromBrush } from '../../src/utils/guidanceLineObjects.js';

describe('Multiple Guidance Lines Support', () => {
  test('should parse multiple #P lines from RLE content', () => {
    const rleContent = `#N Multi Guidance Test Pattern
#P SE/35/21/*/4
#P NW/5/5/10/2
#P NE/40/10/*/3
x = 5, y = 3, rule = B3/S23
3o$b2o$2bo!`;

    const result = parseRLEFile(rleContent);

    expect(result.name).toBe('Multi Guidance Test Pattern');
    expect(result.guidanceLines).toHaveLength(3);

    // Check first guidance line
    expect(result.guidanceLines[0]).toEqual({
      direction: 'SE',
      startX: 35,
      startY: 21,
      length: 'infinite',
      speed: 4
    });

    // Check second guidance line
    expect(result.guidanceLines[1]).toEqual({
      direction: 'NW',
      startX: 5,
      startY: 5,
      length: 10,
      speed: 2
    });

    // Check third guidance line
    expect(result.guidanceLines[2]).toEqual({
      direction: 'NE',
      startX: 40,
      startY: 10,
      length: 'infinite',
      speed: 3
    });

    // For backward compatibility, single guidanceLine should be undefined when multiple exist
    expect(result.guidanceLine).toBeUndefined();
  });

  test('should maintain backward compatibility with single guidance line', () => {
    const rleContent = `#N Single Guidance Test
#P SE/35/21/*/4
x = 5, y = 3, rule = B3/S23
3o$b2o$2bo!`;

    const result = parseRLEFile(rleContent);

    expect(result.guidanceLines).toHaveLength(1);
    expect(result.guidanceLines[0]).toEqual({
      direction: 'SE',
      startX: 35,
      startY: 21,
      length: 'infinite',
      speed: 4
    });

    // For backward compatibility, single guidanceLine should be set when there's only one
    expect(result.guidanceLine).toEqual({
      direction: 'SE',
      startX: 35,
      startY: 21,
      length: 'infinite',
      speed: 4
    });
  });

  test('should handle patterns with no guidance lines', () => {
    const rleContent = `#N No Guidance Pattern
x = 5, y = 3, rule = B3/S23
3o$b2o$2bo!`;

    const result = parseRLEFile(rleContent);

    expect(result.guidanceLines).toHaveLength(0);
    expect(result.guidanceLine).toBeNull();
  });

  test('should create multiple guidance line objects from brush with multiple guidance lines', () => {
    const brush = {
      name: 'Multi Guidance Test',
      pattern: [[0, 0], [0, 1], [0, 2]],
      guidanceLines: [
        { direction: 'SE', startX: 35, startY: 21, length: 'infinite', speed: 4 },
        { direction: 'NW', startX: 5, startY: 5, length: 10, speed: 2 },
        { direction: 'NE', startX: 40, startY: 10, length: 'infinite', speed: 3 }
      ]
    };

    const generation = 0;
    const placementX = 50;
    const placementY = 50;

    const guidanceLineObjects = [];
    const guidanceLines = brush.guidanceLines || (brush.guidanceLine ? [brush.guidanceLine] : []);

    for (const guidanceLine of guidanceLines) {
      const guidanceLineObject = createGuidanceLineFromBrush(
        guidanceLine,
        generation,
        placementX,
        placementY
      );

      if (guidanceLineObject) {
        guidanceLineObjects.push(guidanceLineObject);
      }
    }

    expect(guidanceLineObjects).toHaveLength(3);

    // Check that each guidance line object has the correct properties
    expect(guidanceLineObjects[0]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      originX: 50 + 35, // placementX + startX
      originY: 50 + 21, // placementY + startY
      direction: 'SE',
      length: 'infinite',
      speed: 4
    });

    expect(guidanceLineObjects[1]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      originX: 50 + 5, // placementX + startX
      originY: 50 + 5, // placementY + startY
      direction: 'NW',
      length: 10,
      speed: 2
    });

    expect(guidanceLineObjects[2]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      originX: 50 + 40, // placementX + startX
      originY: 50 + 10, // placementY + startY
      direction: 'NE',
      length: 'infinite',
      speed: 3
    });
  });

  test('should handle backward compatibility with single guidanceLine property', () => {
    const brushWithSingleGuidance = {
      name: 'Single Guidance Test',
      pattern: [[0, 0], [0, 1], [0, 2]],
      guidanceLine: { direction: 'SE', startX: 35, startY: 21, length: 'infinite', speed: 4 }
    };

    const generation = 0;
    const placementX = 50;
    const placementY = 50;

    const guidanceLineObjects = [];
    const guidanceLines = brushWithSingleGuidance.guidanceLines ||
                          (brushWithSingleGuidance.guidanceLine ? [brushWithSingleGuidance.guidanceLine] : []);

    for (const guidanceLine of guidanceLines) {
      const guidanceLineObject = createGuidanceLineFromBrush(
        guidanceLine,
        generation,
        placementX,
        placementY
      );

      if (guidanceLineObject) {
        guidanceLineObjects.push(guidanceLineObject);
      }
    }

    expect(guidanceLineObjects).toHaveLength(1);
    expect(guidanceLineObjects[0]).toMatchObject({
      type: 'guidanceLine',
      generation: 0,
      originX: 50 + 35, // placementX + startX
      originY: 50 + 21, // placementY + startY
      direction: 'SE',
      length: 'infinite',
      speed: 4
    });
  });
});
