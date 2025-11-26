/**
 * End-to-end integration test for the placed objects system
 * Demonstrates the complete solution to the reset functionality issue
 */

describe('Placed Objects System - End-to-End Integration', () => {
  test('should solve the original reset issue: pixels and guidance lines stay linked', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // === SETUP: User starts at generation 0 ===

    // Initial empty grid (like challenge setup or empty level)
    const baseGrid = GameService.createEmptyGrid(10, 10);
    let currentGrid = baseGrid.map(row => [...row]);
    let generation = 0;
    let placedObjects = [];

    // Verify initial state is empty
    expect(placedObjects).toHaveLength(0);
    expect(currentGrid.every(row => row.every(cell => cell === 0))).toBe(true);

    // === ACTION 1: User places a pattern with guidance line ===

    const mockBrushWithGuidance = {
      name: 'glider',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shaped pattern
      guidanceLine: {
        direction: 'E',
        speed: 1,
        length: 'infinite',
        x: 0,
        y: 0
      }
    };

    // Create placed object (simulates user clicking to place pattern)
    const userPlacedObject = PlacedObjectService.createPlacedObject(
      mockBrushWithGuidance,
      5, 5, // Position (5,5)
      generation // Generation 0
    );

    placedObjects = [...placedObjects, userPlacedObject];
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // Verify pattern and guidance line are created together
    expect(placedObjects).toHaveLength(1);
    expect(placedObjects[0].pixels).toHaveLength(3);
    expect(placedObjects[0].guidanceLines).toHaveLength(1);
    expect(currentGrid[5][5]).toBe(1); // Pattern pixel
    expect(currentGrid[5][6]).toBe(1); // Pattern pixel
    expect(currentGrid[6][5]).toBe(1); // Pattern pixel

    // Extract guidance lines for UI system
    const guidanceLines = PlacedObjectService.extractGuidanceLines(placedObjects);
    expect(guidanceLines).toHaveLength(1);
    expect(guidanceLines[0].originX).toBe(5);
    expect(guidanceLines[0].originY).toBe(5);

    // === STATE CAPTURE: System captures initial state for reset ===

    const initialPlacedObjects = [...placedObjects]; // Captured when ready to play
    const initialGrid = currentGrid.map(row => [...row]);

    // === ACTION 2: User starts simulation (press play) ===

    generation = 1;
    // During simulation, grid evolves but placed objects remain unchanged
    currentGrid = GameService.nextGeneration(currentGrid);

    // Pattern may have evolved, but placed objects tracking remains the same
    expect(placedObjects).toEqual(initialPlacedObjects); // Placed objects unchanged during sim

    // === ACTION 3: User presses RESET button ===

    // This is the crucial test - reset should restore BOTH pixels AND guidance lines

    // 1. Restore placed objects to initial state
    placedObjects = [...initialPlacedObjects];

    // 2. Rebuild grid from initial placed objects
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // 3. Extract guidance lines from restored placed objects
    const restoredGuidanceLines = PlacedObjectService.extractGuidanceLines(placedObjects);

    // 4. Reset other state
    generation = 0;

    // === VERIFICATION: Both pixels and guidance lines are restored ===

    expect(generation).toBe(0);
    expect(placedObjects).toHaveLength(1);
    expect(currentGrid[5][5]).toBe(1); // ✅ User pixels restored
    expect(currentGrid[5][6]).toBe(1); // ✅ User pixels restored
    expect(currentGrid[6][5]).toBe(1); // ✅ User pixels restored
    expect(restoredGuidanceLines).toHaveLength(1); // ✅ Guidance lines restored
    expect(restoredGuidanceLines[0].originX).toBe(5); // ✅ Guidance line position correct
    expect(restoredGuidanceLines[0].originY).toBe(5);

    // Grid should match exactly what it was before play
    expect(currentGrid).toEqual(initialGrid);

    // This proves the original issue is SOLVED:
    // - Before: Reset removed pixels but kept guidance lines (inconsistent)
    // - After: Reset restores both pixels AND guidance lines together (consistent)
  });

  test('should handle erasing patterns correctly (remove both pixels and guidance lines)', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // Setup: User places two patterns
    const baseGrid = GameService.createEmptyGrid(10, 10);

    const pattern1 = {
      name: 'pattern1',
      pattern: [[0, 0]],
      guidanceLine: { direction: 'E', x: 0, y: 0 }
    };

    const pattern2 = {
      name: 'pattern2',
      pattern: [[0, 0]],
      guidanceLine: { direction: 'N', x: 0, y: 0 }
    };

    let placedObjects = [
      PlacedObjectService.createPlacedObject(pattern1, 2, 2, 0),
      PlacedObjectService.createPlacedObject(pattern2, 7, 7, 0)
    ];

    let currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // Verify both patterns are placed
    expect(currentGrid[2][2]).toBe(1);
    expect(currentGrid[7][7]).toBe(1);
    expect(placedObjects).toHaveLength(2);

    const guidanceLinesBefore = PlacedObjectService.extractGuidanceLines(placedObjects);
    expect(guidanceLinesBefore).toHaveLength(2);

    // === ACTION: User erases pattern at (2,2) ===

    const objectToErase = PlacedObjectService.findPlacedObjectAt(placedObjects, 2, 2);
    expect(objectToErase).toBeDefined();

    // Remove the placed object
    placedObjects = PlacedObjectService.removePlacedObject(placedObjects, objectToErase.id);
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, placedObjects);

    // === VERIFICATION: Both pixel and guidance line are removed ===

    expect(currentGrid[2][2]).toBe(0); // ✅ Pixel erased
    expect(currentGrid[7][7]).toBe(1); // ✅ Other pixel remains
    expect(placedObjects).toHaveLength(1); // ✅ Object removed

    const guidanceLinesAfter = PlacedObjectService.extractGuidanceLines(placedObjects);
    expect(guidanceLinesAfter).toHaveLength(1); // ✅ Associated guidance line removed
    expect(guidanceLinesAfter[0].originX).toBe(7); // ✅ Remaining guidance line is correct one
    expect(guidanceLinesAfter[0].originY).toBe(7);
  });

  test('should handle clear operation correctly (remove all user objects, keep setup)', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // Setup: Challenge has setup patterns (these aren't placed objects)
    const gridWithSetup = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0], // Challenge setup pattern
      [0, 1, 1, 0, 0], // Challenge setup pattern
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    // User places additional patterns
    const userPattern = {
      name: 'userPattern',
      pattern: [[0, 0]],
      guidanceLine: { direction: 'S', x: 0, y: 0 }
    };

    let placedObjects = [
      PlacedObjectService.createPlacedObject(userPattern, 4, 4, 0)
    ];

    let currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(gridWithSetup, placedObjects);

    // Verify setup + user patterns
    expect(currentGrid[1][1]).toBe(1); // Setup
    expect(currentGrid[4][4]).toBe(1); // User placed

    const guidanceLinesBefore = PlacedObjectService.extractGuidanceLines(placedObjects);
    expect(guidanceLinesBefore).toHaveLength(1);

    // === ACTION: User presses CLEAR button ===

    // Clear removes all user placed objects but preserves challenge setup
    placedObjects = []; // Clear all user placed objects
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(gridWithSetup, placedObjects);

    // === VERIFICATION: User objects removed, setup preserved ===

    expect(currentGrid[1][1]).toBe(1); // ✅ Setup preserved
    expect(currentGrid[1][2]).toBe(1); // ✅ Setup preserved
    expect(currentGrid[2][1]).toBe(1); // ✅ Setup preserved
    expect(currentGrid[2][2]).toBe(1); // ✅ Setup preserved
    expect(currentGrid[4][4]).toBe(0); // ✅ User pattern cleared

    const guidanceLinesAfter = PlacedObjectService.extractGuidanceLines(placedObjects);
    expect(guidanceLinesAfter).toHaveLength(0); // ✅ User guidance lines cleared

    // Challenge setup guidance lines would be handled separately
    // (they're not part of placed objects system)
  });

  test('should support future movement functionality', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // This test demonstrates how the system enables future features

    const pattern = {
      name: 'movablePattern',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: { direction: 'W', x: 0, y: 0 }
    };

    let placedObject = PlacedObjectService.createPlacedObject(pattern, 3, 3, 0);

    // Verify initial state
    expect(placedObject.pixels).toContainEqual({ x: 3, y: 3 });
    expect(placedObject.pixels).toContainEqual({ x: 4, y: 3 });
    expect(placedObject.guidanceLines[0].originX).toBe(3);
    expect(placedObject.guidanceLines[0].originY).toBe(3);

    // === FUTURE FEATURE: Move pattern ===

    const movedObject = PlacedObjectService.movePlacedObject(placedObject, 6, 8);

    // Verify everything moved together
    expect(movedObject.pixels).toContainEqual({ x: 6, y: 8 });
    expect(movedObject.pixels).toContainEqual({ x: 7, y: 8 });
    expect(movedObject.guidanceLines[0].originX).toBe(6);
    expect(movedObject.guidanceLines[0].originY).toBe(8);

    // === FUTURE FEATURE: Rotate pattern ===

    const rotatedObject = PlacedObjectService.rotatePlacedObject(movedObject, 90);

    // Verify rotation affects both pixels and guidance lines
    expect(rotatedObject.rotation).toBe(90);
    expect(rotatedObject.guidanceLines[0].direction).toBe('N'); // W -> N after 90° rotation

    // This proves the system is extensible for future editing features
  });
});
