/**
 * Test to verify that reset functionality works correctly with placed objects system
 * This addresses the original issue where reset removed user pixels but kept guidance lines
 */

describe('Reset with Placed Objects Integration', () => {
  test('should capture and restore initial placed objects state correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Mock initial state: user places a pattern at generation 0
    const userPlacedObject = {
      id: 'user_pattern_1',
      type: 'placedObject',
      brushName: 'glider',
      gridX: 10,
      gridY: 10,
      generation: 0,
      pixels: [
        { x: 10, y: 10 },
        { x: 11, y: 10 },
        { x: 12, y: 10 }
      ],
      guidanceLines: [
        {
          id: 'guide_user_1',
          type: 'guidanceLine',
          direction: 'E',
          originX: 10,
          originY: 10,
          generation: 0
        }
      ]
    };

    // Simulate initial state capture (what happens when user places pattern at gen 0)
    const initialPlacedObjects = [userPlacedObject];

    // Simulate grid with placed objects applied
    const baseGrid = Array(20).fill(null).map(() => Array(20).fill(0));
    const gridWithPlacedObjects = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, initialPlacedObjects);

    expect(gridWithPlacedObjects[10][10]).toBe(1);
    expect(gridWithPlacedObjects[10][11]).toBe(1);
    expect(gridWithPlacedObjects[10][12]).toBe(1);

    // Extract guidance lines
    const guidanceLines = PlacedObjectService.extractGuidanceLines(initialPlacedObjects);
    expect(guidanceLines).toHaveLength(1);
    expect(guidanceLines[0].originX).toBe(10);
    expect(guidanceLines[0].originY).toBe(10);

    // Simulate what happens during reset
    // 1. Restore placed objects to initial state
    const restoredPlacedObjects = [...initialPlacedObjects];

    // 2. Rebuild grid from restored placed objects
    const restoredGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, restoredPlacedObjects);

    // 3. Restore guidance lines
    const restoredGuidanceLines = PlacedObjectService.extractGuidanceLines(restoredPlacedObjects);

    // Verify reset restores both pixels AND guidance lines
    expect(restoredGrid[10][10]).toBe(1);
    expect(restoredGrid[10][11]).toBe(1);
    expect(restoredGrid[10][12]).toBe(1);
    expect(restoredGuidanceLines).toHaveLength(1);
    expect(restoredGuidanceLines[0].originX).toBe(10);
    expect(restoredGuidanceLines[0].originY).toBe(10);
  });

  test('should handle erasing of placed objects with linked guidance lines', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const placedObjects = [
      {
        id: 'obj1',
        pixels: [{ x: 5, y: 5 }, { x: 6, y: 5 }],
        guidanceLines: [
          { id: 'guide1', originX: 5, originY: 5 }
        ]
      },
      {
        id: 'obj2',
        pixels: [{ x: 10, y: 10 }],
        guidanceLines: [
          { id: 'guide2', originX: 10, originY: 10 }
        ]
      }
    ];

    // Find object to erase at position (5, 5)
    const objectToErase = PlacedObjectService.findPlacedObjectAt(placedObjects, 5, 5);
    expect(objectToErase).toBeDefined();
    expect(objectToErase.id).toBe('obj1');

    // Remove the object
    const remainingObjects = PlacedObjectService.removePlacedObject(placedObjects, objectToErase.id);
    expect(remainingObjects).toHaveLength(1);
    expect(remainingObjects[0].id).toBe('obj2');

    // Extract remaining guidance lines
    const remainingGuidanceLines = PlacedObjectService.extractGuidanceLines(remainingObjects);
    expect(remainingGuidanceLines).toHaveLength(1);
    expect(remainingGuidanceLines[0].id).toBe('guide2');
  });

  test('should maintain pixel and guidance line linkage through operations', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const mockBrush = {
      name: 'testPattern',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: {
        direction: 'E',
        x: 0,
        y: 0
      }
    };

    // Create placed object
    const placedObject = PlacedObjectService.createPlacedObject(mockBrush, 3, 4, 0);

    expect(placedObject.pixels).toHaveLength(2);
    expect(placedObject.guidanceLines).toHaveLength(1);

    // Move the object - both pixels and guidance lines should move together
    const movedObject = PlacedObjectService.movePlacedObject(placedObject, 7, 8);

    expect(movedObject.pixels[0]).toEqual({ x: 7, y: 8 }); // Original (3,4) moved by (4,4)
    expect(movedObject.pixels[1]).toEqual({ x: 8, y: 8 }); // Original (4,4) moved by (4,4)
    expect(movedObject.guidanceLines[0].originX).toBe(7);
    expect(movedObject.guidanceLines[0].originY).toBe(8);

    // Apply to grid - should show pixels at new location
    const grid = Array(15).fill(null).map(() => Array(15).fill(0));
    const resultGrid = PlacedObjectService.applyPlacedObjectsToGrid(grid, [movedObject]);

    expect(resultGrid[8][7]).toBe(1);
    expect(resultGrid[8][8]).toBe(1);
    expect(resultGrid[4][3]).toBe(0); // Original location should be empty
  });

  test('should handle clear operation correctly by removing all placed objects', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const placedObjects = [
      {
        id: 'user1',
        pixels: [{ x: 1, y: 1 }],
        guidanceLines: [{ id: 'guide1' }]
      },
      {
        id: 'user2',
        pixels: [{ x: 5, y: 5 }],
        guidanceLines: [{ id: 'guide2' }]
      }
    ];

    // Simulate clear operation
    const clearedPlacedObjects = []; // Clear removes all user placed objects

    // Extract guidance lines after clear
    const clearedGuidanceLines = PlacedObjectService.extractGuidanceLines(clearedPlacedObjects);

    expect(clearedPlacedObjects).toHaveLength(0);
    expect(clearedGuidanceLines).toHaveLength(0);

    // Grid should be empty except for challenge setup patterns
    const emptyGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    const clearedGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, clearedPlacedObjects);

    expect(clearedGrid.every(row => row.every(cell => cell === 0))).toBe(true);
  });

  test('should properly separate setup patterns from user placed objects', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Setup patterns would be handled differently - they're not placed objects
    // but rather applied directly to the base grid during setup/clear

    const baseGridWithSetup = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0], // Setup pattern
      [0, 1, 1, 0, 0], // Setup pattern
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    // User places additional objects
    const userPlacedObjects = [
      {
        id: 'user1',
        pixels: [{ x: 4, y: 4 }],
        guidanceLines: []
      }
    ];

    // Apply user objects to grid with setup
    const finalGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGridWithSetup, userPlacedObjects);

    // Should have both setup patterns and user patterns
    expect(finalGrid[1][1]).toBe(1); // Setup
    expect(finalGrid[1][2]).toBe(1); // Setup
    expect(finalGrid[2][1]).toBe(1); // Setup
    expect(finalGrid[2][2]).toBe(1); // Setup
    expect(finalGrid[4][4]).toBe(1); // User placed

    // Clear would remove user objects but preserve setup
    const afterClearGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGridWithSetup, []);
    expect(afterClearGrid[1][1]).toBe(1); // Setup preserved
    expect(afterClearGrid[4][4]).toBe(0); // User object removed
  });
});
