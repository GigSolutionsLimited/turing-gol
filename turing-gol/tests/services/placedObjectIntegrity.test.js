/**
 * Test for pattern integrity tracking with guidance lines
 */
import { PlacedObjectService } from '../../src/services/placedObjectService.js';
import { BrushService } from '../../src/services/brushService.js';

describe('PlacedObjectService - Pattern Integrity', () => {
  test('should check pattern integrity correctly', () => {
    // Mock a simple brush pattern
    const mockBrush = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1], [1, 0]] // L-shape
    };

    const mockBrushes = {
      'test-pattern': mockBrush
    };

    // Create a placed object
    const placedObject = {
      id: 'test_placed',
      type: 'placedObject',
      brushName: 'test-pattern',
      gridX: 5,
      gridY: 5,
      generation: 0,
      rotation: 0,
      pixels: [
        { x: 5, y: 5 }, // gridX + dx=0, gridY + dy=0
        { x: 6, y: 5 }, // gridX + dx=1, gridY + dy=0
        { x: 5, y: 6 }  // gridX + dx=0, gridY + dy=1
      ],
      guidanceLines: [],
      intact: true
    };

    // Test grid where pattern is intact
    const intactGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    intactGrid[5][5] = 1; // (gridY + dy=0, gridX + dx=0)
    intactGrid[5][6] = 1; // (gridY + dy=0, gridX + dx=1)
    intactGrid[6][5] = 1; // (gridY + dy=1, gridX + dx=0)

    // Test grid where pattern is broken (missing one pixel)
    const brokenGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    brokenGrid[5][5] = 1; // Present
    brokenGrid[5][6] = 1; // Present
    // intactGrid[6][5] = 0; // Missing - this breaks the pattern

    // Test intact pattern
    expect(PlacedObjectService.checkPatternIntegrity(placedObject, intactGrid, mockBrushes)).toBe(true);

    // Test broken pattern
    expect(PlacedObjectService.checkPatternIntegrity(placedObject, brokenGrid, mockBrushes)).toBe(false);
  });

  test('should update placed objects integrity correctly', () => {

    const mockBrush = {
      name: 'block',
      pattern: [[0, 0], [0, 1], [1, 0], [1, 1]] // 2x2 block
    };

    const mockBrushes = { 'block': mockBrush };

    const placedObjects = [
      {
        id: 'obj1',
        type: 'placedObject',
        brushName: 'block',
        gridX: 0,
        gridY: 0,
        generation: 0,
        rotation: 0,
        pixels: [
          { x: 0, y: 0 }, { x: 1, y: 0 },
          { x: 0, y: 1 }, { x: 1, y: 1 }
        ],
        guidanceLines: [],
        intact: true
      }
    ];

    // Grid where pattern is intact
    const intactGrid = Array(5).fill(null).map(() => Array(5).fill(0));
    intactGrid[0][0] = 1;
    intactGrid[0][1] = 1;
    intactGrid[1][0] = 1;
    intactGrid[1][1] = 1;

    // Grid where pattern is broken
    const brokenGrid = Array(5).fill(null).map(() => Array(5).fill(0));
    brokenGrid[0][0] = 1;
    brokenGrid[0][1] = 1;
    brokenGrid[1][0] = 1;
    // brokenGrid[1][1] = 0; // Missing pixel

    // Test with intact grid
    const intactResult = PlacedObjectService.updatePlacedObjectsIntegrity(placedObjects, intactGrid, mockBrushes);
    expect(intactResult[0].intact).toBe(true);

    // Test with broken grid
    const brokenResult = PlacedObjectService.updatePlacedObjectsIntegrity(placedObjects, brokenGrid, mockBrushes);
    expect(brokenResult[0].intact).toBe(false);
  });

  test('should only return guidance lines from intact patterns', () => {
    const placedObjects = [
      {
        id: 'intact_obj',
        intact: true,
        guidanceLines: [
          { id: 'guidance_1', type: 'guidanceLine' }
        ]
      },
      {
        id: 'broken_obj',
        intact: false,
        guidanceLines: [
          { id: 'guidance_2', type: 'guidanceLine' }
        ]
      },
      {
        id: 'another_intact_obj',
        intact: true,
        guidanceLines: [
          { id: 'guidance_3', type: 'guidanceLine' }
        ]
      }
    ];

    const visibleGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(placedObjects);

    expect(visibleGuidanceLines).toHaveLength(2);
    expect(visibleGuidanceLines.map(gl => gl.id)).toEqual(['guidance_1', 'guidance_3']);
  });

  test('should handle pattern integrity with rotation', () => {
    const mockBrush = {
      name: 'L-shape',
      pattern: [[0, 0], [0, 1], [1, 0]] // L-shape
    };

    const mockBrushes = { 'L-shape': mockBrush };

    // Create a placed object with 90-degree rotation
    const placedObject = {
      id: 'rotated_obj',
      type: 'placedObject',
      brushName: 'L-shape',
      gridX: 5,
      gridY: 5,
      generation: 0,
      rotation: 90,
      pixels: [],
      guidanceLines: [],
      intact: true
    };

    // For testing, we need to simulate what the rotated pattern should look like
    // Original: [[0,0], [0,1], [1,0]]
    // Rotated 90° clockwise: [[0,0], [1,0], [0,-1]] -> normalized: [[1,1], [1,0], [0,1]]
    const expectedRotatedPattern = [[1, 1], [1, 0], [0, 1]];

    // Grid with correctly rotated pattern
    const rotatedGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    expectedRotatedPattern.forEach(([dy, dx]) => {
      rotatedGrid[5 + dy][5 + dx] = 1;
    });

    // Mock BrushService.transformPattern for this test
    const originalTransformPattern = BrushService.transformPattern;
    BrushService.transformPattern = jest.fn((brush, transformation) => {
      if (transformation === 'rotateClockwise') {
        return {
          ...brush,
          pattern: expectedRotatedPattern
        };
      }
      return brush;
    });

    const isIntact = PlacedObjectService.checkPatternIntegrity(placedObject, rotatedGrid, mockBrushes);
    expect(isIntact).toBe(true);

    // Test with missing pixel (broken pattern)
    const brokenRotatedGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    // Only place first two pixels, not the third
    brokenRotatedGrid[5 + expectedRotatedPattern[0][0]][5 + expectedRotatedPattern[0][1]] = 1;
    brokenRotatedGrid[5 + expectedRotatedPattern[1][0]][5 + expectedRotatedPattern[1][1]] = 1;
    // Missing: brokenRotatedGrid[5 + expectedRotatedPattern[2][0]][5 + expectedRotatedPattern[2][1]]

    const isBroken = PlacedObjectService.checkPatternIntegrity(placedObject, brokenRotatedGrid, mockBrushes);
    expect(isBroken).toBe(false);

    // Restore original method
    BrushService.transformPattern = originalTransformPattern;
  });

  test('should handle edge cases gracefully', () => {

    // Test with missing brush
    const placedObject = {
      id: 'test',
      brushName: 'nonexistent-brush',
      gridX: 0,
      gridY: 0,
      rotation: 0
    };

    const grid = [[1]];
    const brushes = {};

    expect(PlacedObjectService.checkPatternIntegrity(placedObject, grid, brushes)).toBe(false);

    // Test with empty placed objects array
    expect(PlacedObjectService.getVisibleGuidanceLines([])).toEqual([]);

    // Test with placed objects that have no guidance lines
    const objectsWithoutGuidance = [
      { id: 'obj1', intact: true, guidanceLines: [] },
      { id: 'obj2', intact: false, guidanceLines: [] }
    ];

    expect(PlacedObjectService.getVisibleGuidanceLines(objectsWithoutGuidance)).toEqual([]);
  });
});
