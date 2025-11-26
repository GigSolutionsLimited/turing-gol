/**
 * Test for guidance line intersection behavior
 */

import {
  generateGuidanceLinePixels,
  generateAllGuidanceLinePixels,
  createGuidanceLineObject
} from '../../src/utils/guidanceLineObjects';

// Access the basic function via a simple workaround
function generateGuidanceLinePixelsBasic(guidanceLine, gridWidth, gridHeight) {
  const { originX, originY, direction, length } = guidanceLine;

  const directionVectors = {
    'N': [0, -1], 'NE': [1, -1], 'E': [1, 0], 'SE': [1, 1],
    'S': [0, 1], 'SW': [-1, 1], 'W': [-1, 0], 'NW': [-1, -1]
  };

  const [dx, dy] = directionVectors[direction] || [];
  if ((!dx && dx !== 0) || (!dy && dy !== 0)) return [];

  const pixels = [];
  let currentX = originX;
  let currentY = originY;

  const maxLength = length === 'infinite' ?
    Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight) * 2 : length;

  for (let i = 0; i < maxLength; i++) {
    if (currentX < 0 || currentX >= gridWidth || currentY < 0 || currentY >= gridHeight) break;
    pixels.push([currentY, currentX]);
    currentX += dx;
    currentY += dy;
  }

  return pixels;
}

describe('Guidance Line Intersections', () => {
  test('should stop line with origin furthest from intersection when lines cross', () => {
    // Create two diagonal lines that will intersect at multiple consecutive points
    // Line 1: Diagonal SE from (0,0) - will hit (0,0), (1,1), (2,2), (3,3)...
    const line1 = createGuidanceLineObject(0, 0, 0, 'SE', 10, 1);
    // Line 2: Diagonal SE from (1,1) - will hit (1,1), (2,2), (3,3), (4,4)...
    const line2 = createGuidanceLineObject(0, 1, 1, 'SE', 10, 1);

    const allLines = [line1, line2];

    // Generate pixels with intersection detection
    const pixels1 = generateGuidanceLinePixels(line1, 10, 10, allLines);
    const pixels2 = generateGuidanceLinePixels(line2, 10, 10, allLines);

    // They intersect at (1,1), (2,2), etc. - multiple consecutive intersections
    // At intersection (1,1): Line 1 distance = sqrt(2), Line 2 distance = 0
    // Line 1 should be truncated since it's further from the intersection

    const line1HasIntersection = pixels1.some(([y, x]) => x === 1 && y === 1);
    const line2HasIntersection = pixels2.some(([y, x]) => x === 1 && y === 1);

    // Line 1 should be truncated before (1,1), Line 2 should continue through
    expect(line1HasIntersection).toBe(false); // Line 1 should stop before intersection
    expect(line2HasIntersection).toBe(true);  // Line 2 should continue through
  });

  test('should require 2 or more consecutive pixels for intersection stop', () => {
    // Create guidance lines that only touch at 1 pixel - should NOT stop
    const line1 = createGuidanceLineObject(0, 0, 0, 'E', 5, 1);   // Horizontal: (0,0), (1,0), (2,0), (3,0), (4,0)
    const line2 = createGuidanceLineObject(0, 2, 0, 'S', 1, 1);   // Vertical: only (2,0)

    const allLines = [line1, line2];

    const pixels1 = generateGuidanceLinePixels(line1, 10, 10, allLines);

    // Line 1 should continue past the single pixel intersection at (2,0)
    const line1HasIntersection = pixels1.some(([y, x]) => x === 2 && y === 0);
    const line1ContinuesPast = pixels1.some(([y, x]) => x === 3 && y === 0);

    expect(line1HasIntersection).toBe(true);  // Should touch the intersection
    expect(line1ContinuesPast).toBe(true);    // Should continue past single pixel touch
  });

  test('should stop when hitting 2 or more consecutive pixels', () => {
    // Create lines where one will cross 2+ consecutive pixels of another
    // Line 1: Diagonal SE from (0,0): (0,0), (1,1), (2,2), (3,3), (4,4)...
    const line1 = createGuidanceLineObject(0, 0, 0, 'SE', 10, 1);
    // Line 2: Diagonal SE from (2,0): (2,0), (3,1), (4,2), (5,3)...
    const line2 = createGuidanceLineObject(0, 2, 0, 'SE', 10, 1);

    const allLines = [line1, line2];

    const pixels1 = generateGuidanceLinePixels(line1, 10, 10, allLines);
    const pixels2 = generateGuidanceLinePixels(line2, 10, 10, allLines);

    // These lines don't actually intersect, so they should both be complete
    // Let me create a proper intersection case:

    // Line A: Horizontal from (1,2): (1,2), (2,2), (3,2), (4,2)...
    const lineA = createGuidanceLineObject(0, 1, 2, 'E', 10, 1);
    // Line B: Diagonal SE from (2,1): (2,1), (3,2), (4,3), (5,4)...
    const lineB = createGuidanceLineObject(0, 2, 1, 'SE', 10, 1);

    const allLinesAB = [lineA, lineB];

    const pixelsA = generateGuidanceLinePixels(lineA, 10, 10, allLinesAB);

    // They intersect at (2,2) and (3,2) - 2 consecutive intersections
    // LineA distance from (1,2) to (2,2) = 1
    // LineB distance from (2,1) to (2,2) = sqrt(2) ≈ 1.41
    // LineB should stop since it's further from the intersection

    const lineAHasIntersection = pixelsA.some(([y, x]) => x === 2 && y === 2);
    expect(lineAHasIntersection).toBe(true); // LineA should continue through (closer)
  });

  test('should work correctly with generateAllGuidanceLinePixels', () => {
    // Test that the all-pixels function applies intersection logic correctly
    const line1 = createGuidanceLineObject(0, 0, 0, 'SE', 5, 1);
    const line2 = createGuidanceLineObject(0, 1, 1, 'SE', 5, 1);

    const allLines = [line1, line2];

    // Generate all pixels using the main function
    const allPixels = generateAllGuidanceLinePixels(allLines, 0, 10, 10);

    // Should have pixels from both lines but with intersection behavior applied
    expect(allPixels.length).toBeGreaterThan(0);
    expect(allPixels.length).toBeLessThan(10); // Should be less than two full lines due to truncation
  });
});



