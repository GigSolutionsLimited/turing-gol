/**
 * Test guidance line objects system
 */

import {
  createGuidanceLineObject,
  createGuidanceLineFromBrush,
  generateGuidanceLinePixels,
  getVisibleGuidanceLines,
  resetGuidanceLines,
  generateAllGuidanceLinePixels
} from '../../src/utils/guidanceLineObjects.js';

describe('Guidance Line Objects', () => {
  test('should create guidance line object with correct properties', () => {
    const guidanceLine = createGuidanceLineObject(5, 10, 15, 'E', 20, 3);

    expect(guidanceLine).toMatchObject({
      type: 'guidanceLine',
      generation: 5,
      originX: 10,
      originY: 15,
      direction: 'E',
      length: 20,
      speed: 3
    });

    expect(guidanceLine.id).toBeDefined();
    expect(guidanceLine.createdAt).toBeDefined();
  });

  test('should generate guidance line pixels correctly', () => {
    const guidanceLine = {
      originX: 2,
      originY: 1,
      direction: 'E',
      length: 5,
      speed: 2
    };

    const pixels = generateGuidanceLinePixels(guidanceLine, 10, 10);

    // Should have 5 pixels going east from (2, 1)
    expect(pixels).toHaveLength(5);
    expect(pixels[0]).toEqual([1, 2, 'guidanceColor1']); // [y, x, color]
    expect(pixels[1]).toEqual([1, 3, 'guidanceColor1']);
    expect(pixels[2]).toEqual([1, 4, 'guidanceColor2']); // Color changes after speed interval
    expect(pixels[3]).toEqual([1, 5, 'guidanceColor2']);
    expect(pixels[4]).toEqual([1, 6, 'guidanceColor1']); // Color changes again
  });

  test('should handle infinite length guidance lines', () => {
    const guidanceLine = {
      originX: 0,
      originY: 0,
      direction: 'SE',
      length: 'infinite',
      speed: 1
    };

    const pixels = generateGuidanceLinePixels(guidanceLine, 5, 5);

    // Should generate pixels until hitting grid boundary
    expect(pixels.length).toBeGreaterThan(0);
    expect(pixels.length).toBeLessThanOrEqual(5); // Limited by grid size

    // First pixel should be at origin
    expect(pixels[0]).toEqual([0, 0, 'guidanceColor1']);

    // Should follow SE direction [dx=1, dy=1]
    if (pixels.length > 1) {
      expect(pixels[1]).toEqual([1, 1, 'guidanceColor2']);
    }
  });

  test('should stop at grid boundaries', () => {
    const guidanceLine = {
      originX: 8,
      originY: 8,
      direction: 'E',
      length: 10,
      speed: 1
    };

    const pixels = generateGuidanceLinePixels(guidanceLine, 10, 10);

    // Should only generate 2 pixels: (8,8) and (8,9) before hitting boundary at x=10
    expect(pixels).toHaveLength(2);
    expect(pixels[0]).toEqual([8, 8, 'guidanceColor1']);
    expect(pixels[1]).toEqual([8, 9, 'guidanceColor2']);
  });

  test('should filter visible guidance lines by generation', () => {
    const lines = [
      { id: '1', generation: 0 },
      { id: '2', generation: 3 },
      { id: '3', generation: 7 },
      { id: '4', generation: 10 }
    ];

    const visible = getVisibleGuidanceLines(lines, 5);

    expect(visible).toHaveLength(2);
    expect(visible).toEqual([
      { id: '1', generation: 0 },
      { id: '2', generation: 3 }
    ]);
  });

  test('should reset guidance lines to only generation 0', () => {
    const lines = [
      { id: '1', generation: 0 },
      { id: '2', generation: 3 },
      { id: '3', generation: 0 },
      { id: '4', generation: 7 }
    ];

    const remaining = resetGuidanceLines(lines);

    expect(remaining).toHaveLength(2);
    expect(remaining).toEqual([
      { id: '1', generation: 0 },
      { id: '3', generation: 0 }
    ]);
  });

  test('should generate all guidance line pixels for current generation', () => {
    const lines = [
      {
        generation: 0,
        originX: 0,
        originY: 0,
        direction: 'E',
        length: 2,
        speed: 1
      },
      {
        generation: 2,
        originX: 2,
        originY: 2,
        direction: 'N',
        length: 2,
        speed: 1
      },
      {
        generation: 5,
        originX: 4,
        originY: 4,
        direction: 'S',
        length: 2,
        speed: 1
      }
    ];

    // At generation 3, only first two lines should be visible
    const pixels = generateAllGuidanceLinePixels(lines, 3, 10, 10);

    expect(pixels).toHaveLength(4); // 2 pixels from each of 2 visible lines

    // First line pixels (E from 0,0)
    expect(pixels).toContainEqual([0, 0, 'guidanceColor1']);
    expect(pixels).toContainEqual([0, 1, 'guidanceColor2']);

    // Second line pixels (N from 2,2)
    expect(pixels).toContainEqual([2, 2, 'guidanceColor1']);
    expect(pixels).toContainEqual([1, 2, 'guidanceColor2']);
  });

  test('should handle direction vectors correctly', () => {
    const directions = [
      { dir: 'N', expected: [[0, 0, 'guidanceColor1'], [-1, 0, 'guidanceColor2']] },
      { dir: 'S', expected: [[0, 0, 'guidanceColor1'], [1, 0, 'guidanceColor2']] },
      { dir: 'E', expected: [[0, 0, 'guidanceColor1'], [0, 1, 'guidanceColor2']] },
      { dir: 'W', expected: [[0, 0, 'guidanceColor1'], [0, -1, 'guidanceColor2']] },
      { dir: 'NE', expected: [[0, 0, 'guidanceColor1'], [-1, 1, 'guidanceColor2']] },
      { dir: 'NW', expected: [[0, 0, 'guidanceColor1'], [-1, -1, 'guidanceColor2']] },
      { dir: 'SE', expected: [[0, 0, 'guidanceColor1'], [1, 1, 'guidanceColor2']] },
      { dir: 'SW', expected: [[0, 0, 'guidanceColor1'], [1, -1, 'guidanceColor2']] }
    ];

    for (const { dir, expected } of directions) {
      const guidanceLine = {
        originX: 2,
        originY: 2,
        direction: dir,
        length: 2,
        speed: 1
      };

      const pixels = generateGuidanceLinePixels(guidanceLine, 10, 10);

      // Transform expected coordinates to absolute coordinates (add origin offset)
      const expectedAbsolute = expected.map(([y, x, color]) => [y + 2, x + 2, color]);

      expect(pixels).toEqual(expectedAbsolute);
    }
  });

  test('should handle invalid directions gracefully', () => {
    const guidanceLine = {
      originX: 0,
      originY: 0,
      direction: 'INVALID',
      length: 5,
      speed: 1
    };

    const pixels = generateGuidanceLinePixels(guidanceLine, 10, 10);

    expect(pixels).toEqual([]);
  });

  test('should create guidance line object from brush pattern', () => {
    const guidanceSpec = {
      direction: 'SE',
      startX: 5,
      startY: 3,
      length: 'infinite',
      speed: 4
    };

    const guidanceLineObject = createGuidanceLineFromBrush(guidanceSpec, 2, 10, 15);

    expect(guidanceLineObject).toMatchObject({
      type: 'guidanceLine',
      generation: 2,
      originX: 15, // placementX (10) + startX (5)
      originY: 18, // placementY (15) + startY (3)
      direction: 'SE',
      length: 'infinite',
      speed: 4
    });

    expect(guidanceLineObject.id).toBeDefined();
    expect(guidanceLineObject.createdAt).toBeDefined();
  });

  test('should handle missing startX/startY in guidance spec', () => {
    const guidanceSpec = {
      direction: 'N',
      length: 10,
      speed: 2
    };

    const guidanceLineObject = createGuidanceLineFromBrush(guidanceSpec, 0, 5, 7);

    expect(guidanceLineObject).toMatchObject({
      generation: 0,
      originX: 5, // placementX (5) + startX (0 - default)
      originY: 7, // placementY (7) + startY (0 - default)
      direction: 'N'
    });
  });

  test('should return null for invalid guidance spec', () => {
    expect(createGuidanceLineFromBrush(null, 0, 0, 0)).toBeNull();
    expect(createGuidanceLineFromBrush({}, 0, 0, 0)).toBeNull();
    expect(createGuidanceLineFromBrush({ startX: 5 }, 0, 0, 0)).toBeNull();
  });
});
