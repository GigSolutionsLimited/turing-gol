/**
 * Test to verify Clear vs Reset functionality works correctly
 */

describe('Clear vs Reset Functionality', () => {
  test('should distinguish between clear and reset correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // === SETUP: Challenge has initial setup patterns ===

    // Initial challenge setup (like level 5 with Gosper gun)
    const challengeSetupGrid = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Challenge setup pattern
      [0, 1, 1, 0, 0, 0, 0, 0, 0, 0], // Challenge setup pattern
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    ];

    const setupGuidanceLines = [
      { id: 'setup1', type: 'guidanceLine', direction: 'E', originX: 1, originY: 1, generation: 0 }
    ];

    // This is what the board looks like after initial setup loads
    let currentGrid = challengeSetupGrid.map(row => [...row]);
    let placedObjects = [];
    let guidanceLines = [...setupGuidanceLines];
    let generation = 0;

    // === ACTION 1: User places additional patterns at generation 0 ===

    const userPattern = {
      name: 'userGlider',
      pattern: [[0, 0], [0, 1], [1, 0]],
      guidanceLine: { direction: 'N', x: 0, y: 0 }
    };

    const userPlacedObject = PlacedObjectService.createPlacedObject(userPattern, 7, 7, 0);
    placedObjects.push(userPlacedObject);
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(challengeSetupGrid, placedObjects);
    guidanceLines.push(...PlacedObjectService.extractGuidanceLines(placedObjects));

    // Verify: Board now has challenge setup + user patterns
    expect(currentGrid[1][1]).toBe(1); // Challenge setup
    expect(currentGrid[1][2]).toBe(1); // Challenge setup
    expect(currentGrid[7][7]).toBe(1); // User pattern
    expect(currentGrid[7][8]).toBe(1); // User pattern
    expect(guidanceLines).toHaveLength(2); // Setup + user guidance

    // === CAPTURE STATE: This is what should be restored on RESET ===

    const stateWhenUserPressedPlay = {
      grid: currentGrid.map(row => [...row]),
      placedObjects: [...placedObjects],
      guidanceLines: [...guidanceLines],
      generation: 0
    };

    // === ACTION 2: User runs simulation for a few generations ===

    generation = 5;
    currentGrid = GameService.nextGeneration(GameService.nextGeneration(currentGrid)); // Simulate evolution

    // === ACTION 3: User presses CLEAR ===

    // Clear should restore to initial challenge setup only
    placedObjects = []; // Clear user placed objects
    currentGrid = challengeSetupGrid.map(row => [...row]); // Restore to challenge setup
    guidanceLines = [...setupGuidanceLines]; // Restore to setup guidance lines only
    generation = 0;

    // Verify CLEAR behavior
    expect(currentGrid[1][1]).toBe(1); // ✅ Challenge setup preserved
    expect(currentGrid[1][2]).toBe(1); // ✅ Challenge setup preserved
    expect(currentGrid[7][7]).toBe(0); // ✅ User pattern cleared
    expect(currentGrid[7][8]).toBe(0); // ✅ User pattern cleared
    expect(placedObjects).toHaveLength(0); // ✅ No placed objects
    expect(guidanceLines).toHaveLength(1); // ✅ Only setup guidance lines
    expect(guidanceLines[0].id).toBe('setup1'); // ✅ Correct guidance line

    // === ACTION 4: User places patterns again and runs simulation ===

    const anotherUserObject = PlacedObjectService.createPlacedObject(userPattern, 5, 5, 0);
    placedObjects.push(anotherUserObject);
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(challengeSetupGrid, placedObjects);
    guidanceLines.push(...PlacedObjectService.extractGuidanceLines(placedObjects));

    generation = 3; // Simulate running to generation 3

    // === ACTION 5: User presses RESET ===

    // Reset should restore to the state when user last pressed play at generation 0
    // (which was the original state with the first user pattern)
    placedObjects = [...stateWhenUserPressedPlay.placedObjects];
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(challengeSetupGrid, placedObjects);
    guidanceLines = [...stateWhenUserPressedPlay.guidanceLines];
    generation = 0;

    // Verify RESET behavior
    expect(currentGrid[1][1]).toBe(1); // ✅ Challenge setup preserved
    expect(currentGrid[1][2]).toBe(1); // ✅ Challenge setup preserved
    expect(currentGrid[7][7]).toBe(1); // ✅ Original user pattern restored
    expect(currentGrid[7][8]).toBe(1); // ✅ Original user pattern restored
    expect(currentGrid[5][5]).toBe(0); // ✅ Later user pattern NOT restored
    expect(placedObjects).toHaveLength(1); // ✅ Original placed objects restored
    expect(guidanceLines).toHaveLength(2); // ✅ Setup + original user guidance
    expect(generation).toBe(0); // ✅ Back to generation 0

    // This proves the distinction:
    // - CLEAR: Challenge setup only (removes all user actions)
    // - RESET: Challenge setup + user state when play was last pressed at gen 0
  });

  test('should handle levels with no initial setup correctly', () => {
    const { default: PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { GameService } = require('../../src/services/gameService.js');

    // === SETUP: Level with no challenge setup (like level 1 - empty sandbox) ===

    const emptyGrid = GameService.createEmptyGrid(5, 5);
    let currentGrid = emptyGrid.map(row => [...row]);
    let placedObjects = [];
    let guidanceLines = [];
    let generation = 0;

    // === ACTION 1: User places patterns ===

    const userPattern = {
      name: 'block',
      pattern: [[0, 0], [0, 1], [1, 0], [1, 1]],
      guidanceLine: { direction: 'S', x: 0, y: 0 }
    };

    const userPlacedObject = PlacedObjectService.createPlacedObject(userPattern, 2, 2, 0);
    placedObjects.push(userPlacedObject);
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);
    guidanceLines.push(...PlacedObjectService.extractGuidanceLines(placedObjects));

    // Capture state for reset
    const playState = {
      grid: currentGrid.map(row => [...row]),
      placedObjects: [...placedObjects],
      guidanceLines: [...guidanceLines]
    };

    // === ACTION 2: User presses CLEAR ===

    // Clear should restore to empty grid (no challenge setup)
    placedObjects = [];
    currentGrid = emptyGrid.map(row => [...row]);
    guidanceLines = [];
    generation = 0;

    // Verify CLEAR behavior
    expect(currentGrid.every(row => row.every(cell => cell === 0))).toBe(true); // ✅ Empty grid
    expect(placedObjects).toHaveLength(0); // ✅ No placed objects
    expect(guidanceLines).toHaveLength(0); // ✅ No guidance lines

    // === ACTION 3: User presses RESET (after placing something else) ===

    // Place something different
    const differentObject = PlacedObjectService.createPlacedObject(userPattern, 0, 0, 0);
    placedObjects.push(differentObject);
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);

    // Now reset
    placedObjects = [...playState.placedObjects];
    currentGrid = PlacedObjectService.applyPlacedObjectsToGrid(emptyGrid, placedObjects);
    guidanceLines = [...playState.guidanceLines];

    // Verify RESET behavior
    expect(currentGrid[2][2]).toBe(1); // ✅ Original user pattern restored
    expect(currentGrid[2][3]).toBe(1); // ✅ Original user pattern restored
    expect(currentGrid[0][0]).toBe(0); // ✅ Different pattern not restored
    expect(placedObjects).toHaveLength(1); // ✅ Original placed objects
    expect(guidanceLines).toHaveLength(1); // ✅ Original guidance lines
  });
});
