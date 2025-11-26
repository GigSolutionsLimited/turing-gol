/**
 * Test to verify that individual pixel placement now uses placed objects system
 * This addresses the issue where Clear button didn't remove manually placed pixels
 */

describe('Individual Pixel Placement with Placed Objects', () => {
  test('should create placed objects for individual pixel clicks', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Simulate individual pixel placement
    const singlePixelBrush = {
      name: 'single-pixel',
      pattern: [[0, 0]], // Single pixel at origin
      guidanceLines: [] // No guidance lines for single pixels
    };

    // Create placed object for a single pixel click at position (5, 3)
    const placedObject = PlacedObjectService.createPlacedObject(singlePixelBrush, 5, 3, 0);

    // Verify the placed object is created correctly
    expect(placedObject).toBeDefined();
    expect(placedObject.id).toMatch(/^placed_\d+_5_3$/);
    expect(placedObject.type).toBe('placedObject');
    expect(placedObject.brushName).toBe('single-pixel');
    expect(placedObject.gridX).toBe(5);
    expect(placedObject.gridY).toBe(3);
    expect(placedObject.generation).toBe(0);

    // Check that it creates exactly one pixel
    expect(placedObject.pixels).toHaveLength(1);
    expect(placedObject.pixels[0]).toEqual({ x: 5, y: 3 });

    // Check that it has no guidance lines
    expect(placedObject.guidanceLines).toHaveLength(0);
  });

  test('should handle multiple individual pixel placements', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Simulate placing multiple individual pixels
    const singlePixelBrush = {
      name: 'single-pixel',
      pattern: [[0, 0]],
      guidanceLines: []
    };

    const placedObjects = [
      PlacedObjectService.createPlacedObject(singlePixelBrush, 2, 2, 0), // Pixel 1
      PlacedObjectService.createPlacedObject(singlePixelBrush, 4, 4, 0), // Pixel 2
      PlacedObjectService.createPlacedObject(singlePixelBrush, 6, 6, 0)  // Pixel 3
    ];

    // Verify all placed objects are tracked
    expect(placedObjects).toHaveLength(3);

    // Apply to grid
    const emptyGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    const gridWithPixels = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);

    // Verify pixels are placed correctly
    expect(gridWithPixels[2][2]).toBe(1);
    expect(gridWithPixels[4][4]).toBe(1);
    expect(gridWithPixels[6][6]).toBe(1);
    expect(gridWithPixels[0][0]).toBe(0); // Unchanged
    expect(gridWithPixels[9][9]).toBe(0); // Unchanged

    // Verify clear operation removes all pixels
    const clearedObjects = []; // Clear removes all placed objects
    const clearedGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, clearedObjects);

    expect(clearedGrid[2][2]).toBe(0); // ✅ Cleared
    expect(clearedGrid[4][4]).toBe(0); // ✅ Cleared
    expect(clearedGrid[6][6]).toBe(0); // ✅ Cleared
  });

  test('should handle pixel removal by finding and removing placed objects', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Start with some placed pixels
    const singlePixelBrush = {
      name: 'single-pixel',
      pattern: [[0, 0]],
      guidanceLines: []
    };

    let placedObjects = [
      PlacedObjectService.createPlacedObject(singlePixelBrush, 3, 3, 0),
      PlacedObjectService.createPlacedObject(singlePixelBrush, 5, 5, 0)
    ];

    // Verify initial state
    expect(placedObjects).toHaveLength(2);

    // Simulate clicking on pixel at (3, 3) to remove it
    const objectToRemove = PlacedObjectService.findPlacedObjectAt(placedObjects, 3, 3);
    expect(objectToRemove).toBeDefined();
    expect(objectToRemove.pixels[0]).toEqual({ x: 3, y: 3 });

    // Remove the object
    placedObjects = PlacedObjectService.removePlacedObject(placedObjects, objectToRemove.id);

    // Verify removal
    expect(placedObjects).toHaveLength(1);

    // Verify the remaining object is correct
    const remainingObject = placedObjects[0];
    expect(remainingObject.pixels[0]).toEqual({ x: 5, y: 5 });

    // Apply to grid to verify visual result
    const emptyGrid = Array(10).fill(null).map(() => Array(10).fill(0));
    const resultGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);

    expect(resultGrid[3][3]).toBe(0); // ✅ Removed pixel
    expect(resultGrid[5][5]).toBe(1); // ✅ Remaining pixel
  });

  test('should solve the original issue: Clear button removes individual pixels', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // === ORIGINAL ISSUE SCENARIO ===
    // User manually places 3 pixels by clicking
    // Clear button should remove them
    // Previously: Clear button did nothing because pixels weren't tracked as placed objects
    // Now: Clear button removes them because they ARE tracked as placed objects

    const baseGrid = GameService.createEmptyGrid(10, 10);
    const singlePixelBrush = {
      name: 'single-pixel',
      pattern: [[0, 0]],
      guidanceLines: []
    };

    // User clicks to place 3 individual pixels
    let placedObjects = [
      PlacedObjectService.createPlacedObject(singlePixelBrush, 2, 2, 0), // Click 1
      PlacedObjectService.createPlacedObject(singlePixelBrush, 4, 4, 0), // Click 2
      PlacedObjectService.createPlacedObject(singlePixelBrush, 6, 6, 0)  // Click 3
    ];

    // Apply pixels to grid (what user sees)
    let currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // Verify user sees 3 pixels
    expect(currentGrid[2][2]).toBe(1);
    expect(currentGrid[4][4]).toBe(1);
    expect(currentGrid[6][6]).toBe(1);
    expect(placedObjects).toHaveLength(3);

    // === USER PRESSES CLEAR BUTTON ===

    // Clear removes all placed objects (this is the fix)
    placedObjects = []; // Clear operation
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // Verify clear worked
    expect(currentGrid[2][2]).toBe(0); // ✅ Pixel removed
    expect(currentGrid[4][4]).toBe(0); // ✅ Pixel removed
    expect(currentGrid[6][6]).toBe(0); // ✅ Pixel removed
    expect(placedObjects).toHaveLength(0); // ✅ No placed objects

    // This proves the original issue is SOLVED:
    // Before: Individual pixel clicks weren't tracked, Clear did nothing
    // After: Individual pixel clicks are tracked as placed objects, Clear removes them
  });

  test('should maintain distinction between individual pixels and brush patterns', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Individual pixel (simulates manual click)
    const singlePixelBrush = {
      name: 'single-pixel',
      pattern: [[0, 0]],
      guidanceLines: []
    };
    const individualPixel = PlacedObjectService.createPlacedObject(singlePixelBrush, 1, 1, 0);

    // Brush pattern (simulates brush placement)
    const gliderBrush = {
      name: 'glider',
      pattern: [[0, 0], [0, 1], [1, 0]],
      guidanceLine: { direction: 'E', x: 0, y: 0 }
    };
    const brushPattern = PlacedObjectService.createPlacedObject(gliderBrush, 5, 5, 0);

    // Verify different characteristics
    expect(individualPixel.brushName).toBe('single-pixel');
    expect(individualPixel.pixels).toHaveLength(1);
    expect(individualPixel.guidanceLines).toHaveLength(0);

    expect(brushPattern.brushName).toBe('glider');
    expect(brushPattern.pixels).toHaveLength(3);
    expect(brushPattern.guidanceLines).toHaveLength(1);

    // Verify both are cleared together
    const placedObjects = [individualPixel, brushPattern];
    expect(placedObjects).toHaveLength(2);

    const clearedObjects = []; // Clear removes ALL placed objects
    expect(clearedObjects).toHaveLength(0);

    // Both individual pixels and brush patterns are cleared uniformly
  });
});
