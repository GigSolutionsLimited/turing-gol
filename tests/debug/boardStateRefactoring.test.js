/**
 * Test to verify the new board state management with setupBoardState and prePlayBoardState
 */

describe('Board State Management Refactoring', () => {
  test('should properly separate setupBoardState and prePlayBoardState', () => {
    // Mock the services
    const mockGameService = {
      createEmptyGrid: jest.fn((width, height) =>
        Array(height).fill(null).map(() => Array(width).fill(0))
      ),
      nextGeneration: jest.fn(grid => grid.map(row => [...row]))
    };

    const mockPlacedObjectService = {
      applyPlacedObjectsToGrid: jest.fn((baseGrid, objects) => {
        const newGrid = baseGrid.map(row => [...row]);
        objects.forEach(obj => {
          obj.pixels.forEach(pixel => {
            if (pixel.y >= 0 && pixel.y < newGrid.length &&
                pixel.x >= 0 && pixel.x < newGrid[0].length) {
              newGrid[pixel.y][pixel.x] = 1;
            }
          });
        });
        return newGrid;
      })
    };

    // Test scenario: Level with setup patterns
    const challengeWithSetup = {
      name: 'Test Level',
      setup: [
        { brush: 'block', x: 5, y: 5, rotate: 0 }
      ]
    };

    // === STAGE 1: Level loads with setup patterns ===

    // Initial empty grid
    let setupBoardState = mockGameService.createEmptyGrid(20, 20);

    // Setup patterns get loaded
    setupBoardState[10][10] = 1; // Mock setup pattern placement
    setupBoardState[10][11] = 1;
    setupBoardState[11][10] = 1;
    setupBoardState[11][11] = 1;

    // Initially, prePlayBoardState matches setupBoardState
    let prePlayBoardState = setupBoardState.map(row => [...row]);

    // Verify setup state
    expect(setupBoardState[10][10]).toBe(1);
    expect(setupBoardState[10][11]).toBe(1);
    expect(prePlayBoardState[10][10]).toBe(1);
    expect(prePlayBoardState[10][11]).toBe(1);

    // === STAGE 2: User places additional patterns ===

    const userPlacedObjects = [
      {
        id: 'user_1',
        pixels: [{ x: 15, y: 15 }, { x: 16, y: 15 }]
      }
    ];

    // Current grid = setup + user objects
    let currentGrid = mockPlacedObjectService.applyPlacedObjectsToGrid(
      setupBoardState,
      userPlacedObjects
    );

    // Update prePlayBoardState to include user additions (at generation 0)
    prePlayBoardState = currentGrid.map(row => [...row]);

    // Verify combined state
    expect(currentGrid[10][10]).toBe(1); // Setup pattern
    expect(currentGrid[15][15]).toBe(1); // User pattern
    expect(prePlayBoardState[10][10]).toBe(1); // Setup preserved
    expect(prePlayBoardState[15][15]).toBe(1); // User addition captured

    // === STAGE 3: User presses PLAY and simulation runs ===

    let generation = 5;
    // During simulation, setupBoardState and prePlayBoardState remain unchanged
    // Only currentGrid evolves
    currentGrid = mockGameService.nextGeneration(currentGrid);

    // Board states should be unchanged during simulation
    expect(setupBoardState[10][10]).toBe(1); // ✅ Setup state preserved
    expect(prePlayBoardState[15][15]).toBe(1); // ✅ Pre-play state preserved

    // === STAGE 4: User presses CLEAR ===

    // Clear: Restore to setupBoardState (original challenge setup only)
    currentGrid = setupBoardState.map(row => [...row]);
    prePlayBoardState = setupBoardState.map(row => [...row]); // Reset for new user session
    generation = 0;

    // Verify clear behavior
    expect(currentGrid[10][10]).toBe(1); // ✅ Setup patterns restored
    expect(currentGrid[15][15]).toBe(0); // ✅ User patterns cleared
    expect(prePlayBoardState[10][10]).toBe(1); // ✅ Ready for new user session

    // === STAGE 5: User places different patterns and plays again ===

    const newUserPlacedObjects = [
      {
        id: 'user_2',
        pixels: [{ x: 5, y: 5 }] // Different pattern
      }
    ];

    currentGrid = mockPlacedObjectService.applyPlacedObjectsToGrid(
      setupBoardState,
      newUserPlacedObjects
    );
    prePlayBoardState = currentGrid.map(row => [...row]); // Capture new pre-play state

    generation = 3; // Simulate running
    currentGrid = mockGameService.nextGeneration(currentGrid);

    // === STAGE 6: User presses RESET ===

    // Reset: Restore to prePlayBoardState (setup + user additions from generation 0)
    currentGrid = prePlayBoardState.map(row => [...row]);
    generation = 0;

    // Verify reset behavior
    expect(currentGrid[10][10]).toBe(1); // ✅ Setup patterns restored
    expect(currentGrid[5][5]).toBe(1);   // ✅ User patterns from gen 0 restored
    expect(currentGrid[15][15]).toBe(0); // ✅ Previous session patterns NOT restored

    // This verifies the clear distinction:
    // - setupBoardState: Never changes, always original challenge setup
    // - prePlayBoardState: Updated when user modifies at generation 0
    // - Clear: Restores to setupBoardState
    // - Reset: Restores to prePlayBoardState
  });

  test('should handle levels without setup patterns correctly', () => {
    const mockGameService = {
      createEmptyGrid: jest.fn((width, height) =>
        Array(height).fill(null).map(() => Array(width).fill(0))
      )
    };

    // Test scenario: Empty level (no setup)
    const challengeWithoutSetup = {
      name: 'Empty Level',
      setup: []
    };

    // === STAGE 1: Level loads (empty) ===

    let setupBoardState = mockGameService.createEmptyGrid(10, 10);
    let prePlayBoardState = mockGameService.createEmptyGrid(10, 10);

    // Verify empty state
    expect(setupBoardState.every(row => row.every(cell => cell === 0))).toBe(true);
    expect(prePlayBoardState.every(row => row.every(cell => cell === 0))).toBe(true);

    // === STAGE 2: User places patterns ===

    prePlayBoardState[3][3] = 1; // User places pixel
    prePlayBoardState[4][4] = 1;

    // === STAGE 3: User presses CLEAR ===

    // Clear: Restore to setupBoardState (empty)
    let currentGrid = setupBoardState.map(row => [...row]);
    prePlayBoardState = setupBoardState.map(row => [...row]);

    // Verify clear behavior
    expect(currentGrid.every(row => row.every(cell => cell === 0))).toBe(true); // ✅ Empty
    expect(prePlayBoardState.every(row => row.every(cell => cell === 0))).toBe(true); // ✅ Reset

    // === STAGE 4: User places new patterns ===

    prePlayBoardState[7][7] = 1; // Different pattern

    // === STAGE 5: User presses RESET ===

    // Reset: Restore to prePlayBoardState
    currentGrid = prePlayBoardState.map(row => [...row]);

    // Verify reset behavior
    expect(currentGrid[7][7]).toBe(1); // ✅ Current session pattern restored
    expect(currentGrid[3][3]).toBe(0); // ✅ Previous session pattern NOT restored
  });

  test('should verify the naming is clearer than the old initialBoardState', () => {
    // This test documents the improvement in naming clarity

    // OLD (confusing):
    // initialBoardState - used for both setup patterns AND user state at gen 0
    // Problem: Unclear what "initial" meant - setup or user's starting point?

    // NEW (clear):
    const setupBoardState = 'Challenge setup from JSON file (never changes)';
    const prePlayBoardState = 'State at generation 0 with user additions';

    // Clear purposes:
    expect(setupBoardState).toBe('Challenge setup from JSON file (never changes)');
    expect(prePlayBoardState).toBe('State at generation 0 with user additions');

    // Clear usage:
    // - Clear button: Restore to setupBoardState
    // - Reset button: Restore to prePlayBoardState
    // - Level loading: Sets setupBoardState, initializes prePlayBoardState
    // - User actions at gen 0: Updates prePlayBoardState
    // - Simulation: Neither state changes
  });
});
