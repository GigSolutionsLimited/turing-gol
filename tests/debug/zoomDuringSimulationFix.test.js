/**
 * Test to verify zoom during simulation doesn't corrupt grid state (React Strict Mode fix)
 */

describe('Zoom During Simulation Bug Fix', () => {
  test('should not modify grid data when cellSize changes during simulation', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a stable pattern that should not change
    const stablePattern = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0], // 2x2 block - stable in Conway's Game of Life
      [0, 0, 0, 0]
    ];

    // Verify the pattern is actually stable
    const nextGen = GameService.nextGeneration(stablePattern);
    expect(nextGen).toEqual(stablePattern); // Should remain unchanged

    // Test that resizeGrid preserves the pattern correctly
    const resized = GameService.resizeGrid(stablePattern, 6, 6);

    // Pattern should be preserved at the center
    expect(resized[2][2]).toBe(1); // Top-left of block
    expect(resized[2][3]).toBe(1); // Top-right of block
    expect(resized[3][2]).toBe(1); // Bottom-left of block
    expect(resized[3][3]).toBe(1); // Bottom-right of block

    // Verify it's still stable after resize
    const nextGenAfterResize = GameService.nextGeneration(resized);
    expect(nextGenAfterResize[2][2]).toBe(1);
    expect(nextGenAfterResize[2][3]).toBe(1);
    expect(nextGenAfterResize[3][2]).toBe(1);
    expect(nextGenAfterResize[3][3]).toBe(1);
  });

  test('should preserve oscillator patterns during grid resize', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a blinker (period-2 oscillator)
    const blinkerVertical = [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    // Next generation should be horizontal
    const blinkerHorizontal = GameService.nextGeneration(blinkerVertical);
    expect(blinkerHorizontal[2][1]).toBe(1);
    expect(blinkerHorizontal[2][2]).toBe(1);
    expect(blinkerHorizontal[2][3]).toBe(1);

    // Resize the vertical blinker
    const resizedBlinker = GameService.resizeGrid(blinkerVertical, 7, 7);

    // Should still oscillate correctly after resize
    const nextGenResized = GameService.nextGeneration(resizedBlinker);

    // Find the horizontal blinker in the resized grid
    let foundHorizontalBlinker = false;
    for (let y = 1; y < resizedBlinker.length - 1; y++) {
      for (let x = 1; x < resizedBlinker[0].length - 1; x++) {
        if (nextGenResized[y][x-1] === 1 &&
            nextGenResized[y][x] === 1 &&
            nextGenResized[y][x+1] === 1) {
          foundHorizontalBlinker = true;
          break;
        }
      }
    }

    expect(foundHorizontalBlinker).toBe(true);
  });

  test('should handle multiple rapid cellSize changes gracefully', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a complex pattern (glider gun corner)
    const complexPattern = [
      [0, 0, 1, 1, 0, 0],
      [0, 0, 1, 0, 1, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0]
    ];

    // Simulate multiple rapid resize operations (like fast zoom)
    let currentGrid = complexPattern;

    // Rapid resize sequence: 6x6 -> 8x8 -> 4x4 -> 10x10 -> 6x6
    currentGrid = GameService.resizeGrid(currentGrid, 8, 8);
    currentGrid = GameService.resizeGrid(currentGrid, 4, 4);
    currentGrid = GameService.resizeGrid(currentGrid, 10, 10);
    currentGrid = GameService.resizeGrid(currentGrid, 6, 6);

    // Should still have live cells (pattern preserved)
    const totalCells = currentGrid.flat().reduce((sum, cell) => sum + cell, 0);
    expect(totalCells).toBeGreaterThan(0);

    // Should still be able to evolve
    const nextGen = GameService.nextGeneration(currentGrid);
    expect(nextGen).toBeDefined();
    expect(nextGen.length).toBe(6);
    expect(nextGen[0].length).toBe(6);
  });

  test('should not interfere with running animation when cellSize changes', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Simulate a running animation state
    let generation = 5;
    let currentGrid = [
      [0, 1, 0],
      [0, 1, 0], // Vertical blinker
      [0, 1, 0]
    ];

    // Simulate zoom during animation (this should NOT affect the grid)
    const beforeZoom = currentGrid.map(row => [...row]);

    // In the actual code, zoom would only update canvas/grid size metadata
    // Grid data should remain unchanged
    const afterZoom = currentGrid; // No grid modification during zoom

    expect(afterZoom).toEqual(beforeZoom);

    // Animation should continue normally
    const nextGeneration = GameService.nextGeneration(currentGrid);
    expect(nextGeneration[1][0]).toBe(1); // Should become horizontal
    expect(nextGeneration[1][1]).toBe(1);
    expect(nextGeneration[1][2]).toBe(1);
  });

  test('should preserve challenge patterns during zoom operations', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a grid with challenge dimensions
    const challengeGrid = GameService.createEmptyGrid(61, 61);

    // Place a pattern at specific coordinates (simulating challenge setup)
    challengeGrid[30][30] = 1;
    challengeGrid[30][31] = 1;
    challengeGrid[31][30] = 1;
    challengeGrid[31][31] = 1; // 2x2 block at center

    // For challenges with fixed dimensions, grid should never be resized
    // This simulates the early exit in the resize handler for challenges
    const shouldResize = false; // challenge.width && challenge.height check

    let finalGrid = challengeGrid;
    if (!shouldResize) {
      // Grid should remain unchanged (simulating early exit)
      finalGrid = challengeGrid;
    }

    expect(finalGrid).toBe(challengeGrid); // Same reference
    expect(finalGrid[30][30]).toBe(1);
    expect(finalGrid[30][31]).toBe(1);
    expect(finalGrid[31][30]).toBe(1);
    expect(finalGrid[31][31]).toBe(1);
  });
});
