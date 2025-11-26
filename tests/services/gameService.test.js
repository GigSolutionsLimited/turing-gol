// Unit tests for GameService - Conway's Game of Life logic
import { GameService } from '../../src/services/gameService.js';

/**
 * Test Conway's Game of Life rules implementation
 */
describe('GameService', () => {
  describe('nextGeneration', () => {
    test('should handle empty grid', () => {
      const emptyGrid = [];
      const result = GameService.nextGeneration(emptyGrid);
      expect(result).toEqual([]);
    });

    test('should handle null/undefined input', () => {
      expect(GameService.nextGeneration(null)).toBe(null);
      expect(GameService.nextGeneration(undefined)).toBe(undefined);
    });

    test('should implement Conway rules correctly for blinker pattern', () => {
      // Blinker pattern (oscillates between horizontal and vertical)
      const blinkerVertical = [
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 0]
      ];

      const generation1 = GameService.nextGeneration(blinkerVertical);
      const expectedHorizontal = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ];

      expect(generation1).toEqual(expectedHorizontal);

      // Should oscillate back to vertical
      const generation2 = GameService.nextGeneration(generation1);
      expect(generation2).toEqual(blinkerVertical);
    });

    test('should keep block pattern stable', () => {
      // Block pattern (should remain unchanged)
      const blockPattern = [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]
      ];

      const nextGen = GameService.nextGeneration(blockPattern);
      expect(nextGen).toEqual(blockPattern);
    });

    test('should handle glider pattern correctly', () => {
      // Glider pattern - first few generations
      const gliderGen0 = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ];

      const gliderGen1 = [
        [0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0],
        [0, 1, 0, 1, 0, 0],
        [0, 0, 1, 1, 0, 0],
        [0, 0, 1, 0, 0, 0],
        [0, 0, 0, 0, 0, 0]
      ];

      const result = GameService.nextGeneration(gliderGen0);
      expect(result).toEqual(gliderGen1);
    });

    test('should handle single cell death (underpopulation)', () => {
      const singleCell = [
        [0, 0, 0],
        [0, 1, 0],
        [0, 0, 0]
      ];

      const result = GameService.nextGeneration(singleCell);
      const expectedDead = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      expect(result).toEqual(expectedDead);
    });

    test('should handle cell birth (exactly 3 neighbors)', () => {
      const birthPattern = [
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 0]
      ];

      const result = GameService.nextGeneration(birthPattern);

      // Cell at [1,1] should be born (3 neighbors)
      expect(result[1][1]).toBe(1);
    });

    test('should handle overpopulation (more than 3 neighbors)', () => {
      const overpopulation = [
        [1, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
      ];

      const result = GameService.nextGeneration(overpopulation);

      // Center cell should die due to overpopulation
      expect(result[1][1]).toBe(0);
    });

    test('should preserve grid dimensions', () => {
      const grid = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
      ];

      const result = GameService.nextGeneration(grid);
      expect(result.length).toBe(3);
      expect(result[0].length).toBe(3);
      expect(result[1].length).toBe(3);
      expect(result[2].length).toBe(3);
    });

    test('should handle rectangular grids', () => {
      const rectangular = [
        [1, 1, 1, 0],
        [0, 0, 0, 0]
      ];

      const result = GameService.nextGeneration(rectangular);
      expect(result.length).toBe(2);
      expect(result[0].length).toBe(4);
      expect(result[1].length).toBe(4);
    });
  });

  describe('createEmptyGrid', () => {
    test('should create square grid when only width provided', () => {
      const grid = GameService.createEmptyGrid(3);
      expect(grid.length).toBe(3);
      expect(grid[0].length).toBe(3);
      expect(grid.every(row => row.every(cell => cell === 0))).toBe(true);
    });

    test('should create rectangular grid when width and height provided', () => {
      const grid = GameService.createEmptyGrid(4, 2);
      expect(grid.length).toBe(2);
      expect(grid[0].length).toBe(4);
      expect(grid.every(row => row.every(cell => cell === 0))).toBe(true);
    });
  });

  describe('countAliveCells', () => {
    test('should count alive cells correctly', () => {
      const grid = [
        [1, 0, 1],
        [0, 1, 0],
        [1, 0, 1]
      ];

      expect(GameService.countAliveCells(grid)).toBe(5);
    });

    test('should return 0 for empty grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      expect(GameService.countAliveCells(grid)).toBe(0);
    });

    test('should handle null/undefined input', () => {
      expect(GameService.countAliveCells(null)).toBe(0);
      expect(GameService.countAliveCells(undefined)).toBe(0);
      expect(GameService.countAliveCells([])).toBe(0);
    });
  });

  describe('calculateAnimationSpeed', () => {
    test('should calculate correct speed from multiplier', () => {
      expect(GameService.calculateAnimationSpeed(1)).toBe(640);
      expect(GameService.calculateAnimationSpeed(2)).toBe(320);
      expect(GameService.calculateAnimationSpeed(4)).toBe(160);
      expect(GameService.calculateAnimationSpeed(8)).toBe(80);
    });

    test('should use default multiplier when none provided', () => {
      expect(GameService.calculateAnimationSpeed()).toBe(160); // 640 / 4
    });
  });

  describe('copyGrid', () => {
    test('should create deep copy of grid', () => {
      const original = [
        [1, 0, 1],
        [0, 1, 0]
      ];

      const copy = GameService.copyGrid(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original); // Different object reference
      expect(copy[0]).not.toBe(original[0]); // Different row references
    });

    test('should handle null/undefined input', () => {
      expect(GameService.copyGrid(null)).toBe(null);
      expect(GameService.copyGrid(undefined)).toBe(undefined);
    });
  });

  describe('getGridBounds', () => {
    test('should find bounds of alive cells', () => {
      const grid = [
        [0, 1, 0, 0],
        [1, 0, 1, 0],
        [0, 0, 0, 0]
      ];

      const bounds = GameService.getGridBounds(grid);
      expect(bounds.minX).toBe(0);
      expect(bounds.maxX).toBe(2);
      expect(bounds.minY).toBe(0);
      expect(bounds.maxY).toBe(1);
    });

    test('should handle empty grid', () => {
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const bounds = GameService.getGridBounds(grid);
      expect(bounds).toEqual({ minX: 0, maxX: 0, minY: 0, maxY: 0 });
    });
  });

  describe('isEditableCell', () => {
    test('should allow all cells in admin mode', () => {
      const challenge = {
        editableSpace: { minX: -10, maxX: 10, minY: -10, maxY: 10 }
      };
      const gridSize = { width: 50, height: 50 };

      // Admin mode allows editing anywhere
      expect(GameService.isEditableCell(0, 0, challenge, gridSize, true)).toBe(true);
      expect(GameService.isEditableCell(40, 40, challenge, gridSize, true)).toBe(true);
    });

    test('should allow all cells when no challenge or editableSpace', () => {
      const gridSize = { width: 50, height: 50 };

      // No challenge
      expect(GameService.isEditableCell(10, 10, null, gridSize, false)).toBe(true);

      // Challenge without editableSpace
      const challenge = { width: 50, height: 50 };
      expect(GameService.isEditableCell(10, 10, challenge, gridSize, false)).toBe(true);
    });

    test('should restrict cells based on editableSpace bounds', () => {
      const challenge = {
        editableSpace: { minX: -5, maxX: 5, minY: -3, maxY: 3 }
      };
      const gridSize = { width: 20, height: 20 };

      // Center is at (10, 10) for a 20x20 grid
      // editableSpace bounds: x=[5,15], y=[7,13] in grid coordinates

      // Inside bounds
      expect(GameService.isEditableCell(10, 10, challenge, gridSize, false)).toBe(true); // center (0,0)
      expect(GameService.isEditableCell(15, 13, challenge, gridSize, false)).toBe(true); // (5,3)
      expect(GameService.isEditableCell(5, 7, challenge, gridSize, false)).toBe(true);   // (-5,-3)

      // Outside bounds
      expect(GameService.isEditableCell(16, 10, challenge, gridSize, false)).toBe(false); // x > maxX
      expect(GameService.isEditableCell(4, 10, challenge, gridSize, false)).toBe(false);  // x < minX
      expect(GameService.isEditableCell(10, 14, challenge, gridSize, false)).toBe(false); // y > maxY
      expect(GameService.isEditableCell(10, 6, challenge, gridSize, false)).toBe(false);  // y < minY
    });

    test('should handle edge coordinates correctly', () => {
      const challenge = {
        editableSpace: { minX: 0, maxX: 0, minY: 0, maxY: 0 }
      };
      const gridSize = { width: 10, height: 10 };

      // Only center cell should be editable
      expect(GameService.isEditableCell(5, 5, challenge, gridSize, false)).toBe(true);  // center (0,0)
      expect(GameService.isEditableCell(4, 5, challenge, gridSize, false)).toBe(false); // (-1,0)
      expect(GameService.isEditableCell(6, 5, challenge, gridSize, false)).toBe(false); // (1,0)
    });
  });
});
