/**
 * Test for the new placed objects system that unifies pixels and guidance lines
 */

describe('Placed Objects System', () => {
  test('should create placed object with pixels and guidance lines', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const mockBrush = {
      name: 'testBrush',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shape
      guidanceLine: {
        direction: 'E',
        speed: 1,
        length: 'infinite',
        x: 0,
        y: 0
      }
    };

    const placedObject = PlacedObjectService.createPlacedObject(mockBrush, 5, 5, 0);

    expect(placedObject).toBeDefined();
    expect(placedObject.id).toMatch(/^placed_\d+_5_5$/);
    expect(placedObject.type).toBe('placedObject');
    expect(placedObject.brushName).toBe('testBrush');
    expect(placedObject.gridX).toBe(5);
    expect(placedObject.gridY).toBe(5);
    expect(placedObject.generation).toBe(0);

    // Check pixels
    expect(placedObject.pixels).toHaveLength(3);
    expect(placedObject.pixels).toContainEqual({ x: 5, y: 5 }); // [0,0] -> gridX+0, gridY+0
    expect(placedObject.pixels).toContainEqual({ x: 6, y: 5 }); // [0,1] -> gridX+1, gridY+0
    expect(placedObject.pixels).toContainEqual({ x: 5, y: 6 }); // [1,0] -> gridX+0, gridY+1

    // Check guidance lines
    expect(placedObject.guidanceLines).toHaveLength(1);
    const guidanceLine = placedObject.guidanceLines[0];
    expect(guidanceLine.direction).toBe('E');
    expect(guidanceLine.originX).toBe(5);
    expect(guidanceLine.originY).toBe(5);
  });

  test('should apply placed objects to grid correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const emptyGrid = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    const placedObjects = [
      {
        id: 'test1',
        pixels: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
        guidanceLines: []
      },
      {
        id: 'test2',
        pixels: [{ x: 3, y: 3 }],
        guidanceLines: []
      }
    ];

    const resultGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);

    expect(resultGrid[1][1]).toBe(1);
    expect(resultGrid[1][2]).toBe(1);
    expect(resultGrid[3][3]).toBe(1);
    expect(resultGrid[0][0]).toBe(0); // Unchanged
    expect(resultGrid[4][4]).toBe(0); // Unchanged
  });

  test('should move placed object and its guidance lines together', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const originalObject = {
      id: 'test',
      gridX: 2,
      gridY: 3,
      pixels: [{ x: 2, y: 3 }, { x: 3, y: 3 }],
      guidanceLines: [
        {
          id: 'guide1',
          originX: 2,
          originY: 3,
          direction: 'E'
        }
      ]
    };

    const movedObject = PlacedObjectService.movePlacedObject(originalObject, 5, 7);

    expect(movedObject.gridX).toBe(5);
    expect(movedObject.gridY).toBe(7);

    // Check pixels moved correctly (delta: +3, +4)
    expect(movedObject.pixels).toContainEqual({ x: 5, y: 7 }); // 2+3, 3+4
    expect(movedObject.pixels).toContainEqual({ x: 6, y: 7 }); // 3+3, 3+4

    // Check guidance lines moved
    expect(movedObject.guidanceLines[0].originX).toBe(5);
    expect(movedObject.guidanceLines[0].originY).toBe(7);
  });

  test('should rotate placed object correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const originalObject = {
      id: 'test',
      gridX: 0,
      gridY: 0,
      rotation: 0,
      pixels: [{ x: 0, y: 0 }, { x: 1, y: 0 }], // Horizontal line
      guidanceLines: [
        {
          id: 'guide1',
          direction: 'E'
        }
      ]
    };

    const rotatedObject = PlacedObjectService.rotatePlacedObject(originalObject, 90);

    expect(rotatedObject.rotation).toBe(90);

    // After 90° clockwise: (1,0) should become (0,-1) relative to center
    // Since center is (0,0): (1,0) -> (0,-1) -> (0,0) + (0,-1) = (0,-1)
    expect(rotatedObject.pixels).toContainEqual({ x: 0, y: 0 }); // Center stays
    expect(rotatedObject.pixels).toContainEqual({ x: 0, y: -1 }); // Rotated point

    // Direction should rotate from E to S
    expect(rotatedObject.guidanceLines[0].direction).toBe('S');
  });

  test('should extract guidance lines from placed objects', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const placedObjects = [
      {
        id: 'obj1',
        guidanceLines: [
          { id: 'guide1', direction: 'E' },
          { id: 'guide2', direction: 'N' }
        ]
      },
      {
        id: 'obj2',
        guidanceLines: [
          { id: 'guide3', direction: 'S' }
        ]
      },
      {
        id: 'obj3',
        guidanceLines: [] // No guidance lines
      }
    ];

    const guidanceLines = PlacedObjectService.extractGuidanceLines(placedObjects);

    expect(guidanceLines).toHaveLength(3);
    expect(guidanceLines).toContainEqual({ id: 'guide1', direction: 'E' });
    expect(guidanceLines).toContainEqual({ id: 'guide2', direction: 'N' });
    expect(guidanceLines).toContainEqual({ id: 'guide3', direction: 'S' });
  });

  test('should find placed object at specific position', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const placedObjects = [
      {
        id: 'obj1',
        pixels: [{ x: 1, y: 1 }, { x: 2, y: 1 }]
      },
      {
        id: 'obj2',
        pixels: [{ x: 5, y: 5 }]
      }
    ];

    const foundObject1 = PlacedObjectService.findPlacedObjectAt(placedObjects, 1, 1);
    expect(foundObject1).toBeDefined();
    expect(foundObject1.id).toBe('obj1');

    const foundObject2 = PlacedObjectService.findPlacedObjectAt(placedObjects, 2, 1);
    expect(foundObject2).toBeDefined();
    expect(foundObject2.id).toBe('obj1'); // Same object, different pixel

    const foundObject3 = PlacedObjectService.findPlacedObjectAt(placedObjects, 5, 5);
    expect(foundObject3).toBeDefined();
    expect(foundObject3.id).toBe('obj2');

    const notFound = PlacedObjectService.findPlacedObjectAt(placedObjects, 10, 10);
    expect(notFound).toBeNull();
  });

  test('should remove placed object correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const placedObjects = [
      { id: 'obj1', pixels: [] },
      { id: 'obj2', pixels: [] },
      { id: 'obj3', pixels: [] }
    ];

    const result = PlacedObjectService.removePlacedObject(placedObjects, 'obj2');

    expect(result).toHaveLength(2);
    expect(result.find(obj => obj.id === 'obj1')).toBeDefined();
    expect(result.find(obj => obj.id === 'obj2')).toBeUndefined();
    expect(result.find(obj => obj.id === 'obj3')).toBeDefined();
  });
});
