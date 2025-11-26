/**
 * Test to verify zoom operation bug fixes
 * This addresses the specific issue where zooming during game simulation
 * caused patterns like p30 glider gun to "destroy itself"
 */

describe('Zoom Operation Bug Fix', () => {
  test('should not corrupt grid state when zooming during simulation', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a simple stable pattern (3x3 block)
    const originalGrid = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    // Test resizing to larger grid (simulating zoom out)
    const resizedGrid = GameService.resizeGrid(originalGrid, 7, 7);

    // The pattern should be preserved in the center of the larger grid
    expect(resizedGrid).toHaveLength(7);
    expect(resizedGrid[0]).toHaveLength(7);

    // Check that the 2x2 block is still intact in the center
    expect(resizedGrid[2][2]).toBe(1); // Top-left of block
    expect(resizedGrid[2][3]).toBe(1); // Top-right of block
    expect(resizedGrid[3][2]).toBe(1); // Bottom-left of block
    expect(resizedGrid[3][3]).toBe(1); // Bottom-right of block

    // Check that surrounding cells are empty
    expect(resizedGrid[1][2]).toBe(0);
    expect(resizedGrid[4][2]).toBe(0);
  });

  test('should preserve complex patterns when resizing grid', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a more complex pattern (glider)
    const gliderGrid = [
      [0, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0]
    ];

    // Test resizing to smaller grid (simulating zoom in)
    const smallerGrid = GameService.resizeGrid(gliderGrid, 3, 3);

    // The center part of the glider should be preserved
    expect(smallerGrid).toHaveLength(3);
    expect(smallerGrid[0]).toHaveLength(3);

    // At least some part of the pattern should remain
    const totalCells = smallerGrid.flat().reduce((sum, cell) => sum + cell, 0);
    expect(totalCells).toBeGreaterThan(0);
  });

  test('should handle grid resize with same dimensions', () => {
    const { GameService } = require('../../src/services/gameService.js');

    const originalGrid = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1]
    ];

    // Resize to same dimensions should return identical grid content
    const unchangedGrid = GameService.resizeGrid(originalGrid, 3, 3);

    expect(unchangedGrid).toEqual(originalGrid);
    // Content should be identical even if reference might be different
    expect(unchangedGrid[1][1]).toBe(1);
    expect(unchangedGrid[0][0]).toBe(1);
  });

  test('should create empty grid when resizing null or empty grid', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Test null grid
    const nullResult = GameService.resizeGrid(null, 3, 3);
    expect(nullResult).toHaveLength(3);
    expect(nullResult[0]).toHaveLength(3);
    expect(nullResult.flat().every(cell => cell === 0)).toBe(true);

    // Test empty grid
    const emptyResult = GameService.resizeGrid([], 3, 3);
    expect(emptyResult).toHaveLength(3);
    expect(emptyResult[0]).toHaveLength(3);
    expect(emptyResult.flat().every(cell => cell === 0)).toBe(true);
  });

  test('should preserve center alignment when resizing', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a single cell at center of 3x3 grid
    const singleCellGrid = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];

    // Resize to 5x5 - cell should remain centered
    const enlargedGrid = GameService.resizeGrid(singleCellGrid, 5, 5);

    // Check that the cell is at the center of the new grid
    expect(enlargedGrid[2][2]).toBe(1); // Center of 5x5 grid

    // Check that all other cells are empty
    const totalCells = enlargedGrid.flat().reduce((sum, cell) => sum + cell, 0);
    expect(totalCells).toBe(1);
  });
});
