// Unit tests for canvas utilities
import {
  getCenterOffsets,
  gridToCenter,
  centerToGrid,
  calculateCanvasSize,
  mouseToGrid,
  gridToPixel,
  isWithinBounds,
  calculateOptimalCellSize
} from '../../src/utils/canvasUtils.js';

describe('Canvas Utils', () => {
  describe('getCenterOffsets', () => {
    test('should calculate center offsets for grid array', () => {
      const grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ];

      const result = getCenterOffsets(grid);
      expect(result.centerOffsetX).toBe(2); // floor(5/2)
      expect(result.centerOffsetY).toBe(1); // floor(3/2)
    });

    test('should calculate center offsets for grid dimensions object', () => {
      const gridSize = { width: 10, height: 8 };

      const result = getCenterOffsets(gridSize);
      expect(result.centerOffsetX).toBe(5);
      expect(result.centerOffsetY).toBe(4);
    });

    test('should handle single number input', () => {
      const result = getCenterOffsets(6);
      expect(result.centerOffsetX).toBe(3);
      expect(result.centerOffsetY).toBe(3);
    });

    test('should handle edge cases', () => {
      // Odd dimensions
      const odd = getCenterOffsets({ width: 7, height: 5 });
      expect(odd.centerOffsetX).toBe(3);
      expect(odd.centerOffsetY).toBe(2);

      // Even dimensions
      const even = getCenterOffsets({ width: 6, height: 4 });
      expect(even.centerOffsetX).toBe(3);
      expect(even.centerOffsetY).toBe(2);
    });
  });

  describe('gridToCenter', () => {
    test('should convert grid coordinates to center-based', () => {
      const grid = { width: 5, height: 5 };

      const result = gridToCenter(3, 4, grid);
      expect(result.centerX).toBe(1); // 3 - 2
      expect(result.centerY).toBe(2); // 4 - 2
    });

    test('should handle grid center correctly', () => {
      const grid = { width: 5, height: 5 };

      const result = gridToCenter(2, 2, grid); // Grid center
      expect(result.centerX).toBe(0);
      expect(result.centerY).toBe(0);
    });
  });

  describe('centerToGrid', () => {
    test('should convert center coordinates to grid-based', () => {
      const grid = { width: 5, height: 5 };

      const result = centerToGrid(1, 2, grid);
      expect(result.gridX).toBe(3); // 2 + 1
      expect(result.gridY).toBe(4); // 2 + 2
    });

    test('should handle negative center coordinates', () => {
      const grid = { width: 5, height: 5 };

      const result = centerToGrid(-1, -2, grid);
      expect(result.gridX).toBe(1); // 2 - 1
      expect(result.gridY).toBe(0); // 2 - 2
    });

    test('should be inverse of gridToCenter', () => {
      const grid = { width: 7, height: 7 };
      const originalGrid = { x: 4, y: 5 };

      const center = gridToCenter(originalGrid.x, originalGrid.y, grid);
      const backToGrid = centerToGrid(center.centerX, center.centerY, grid);

      expect(backToGrid.gridX).toBe(originalGrid.x);
      expect(backToGrid.gridY).toBe(originalGrid.y);
    });
  });

  describe('calculateCanvasSize', () => {
    // Mock window for testing
    const originalWindow = global.window;
    beforeAll(() => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080
      };
    });

    afterAll(() => {
      global.window = originalWindow;
    });

    test('should calculate size for specific challenge dimensions', () => {
      const challenge = { width: 50, height: 40 };

      const result = calculateCanvasSize(challenge);
      expect(result.width).toBe(400); // 50 * 8
      expect(result.height).toBe(320); // 40 * 8
    });

    test('should determine if scrolling is needed', () => {
      const largeChallenge = { width: 200, height: 200 };

      const result = calculateCanvasSize(largeChallenge);
      expect(result.needsScrolling).toBe(true);
      expect(result.width).toBe(1600); // 200 * 8
      expect(result.height).toBe(1600);
    });

    test('should fallback to container sizing without challenge', () => {
      const result = calculateCanvasSize();
      expect(result.width).toBeGreaterThan(300);
      expect(result.height).toBeGreaterThan(300);
      expect(result.needsScrolling).toBe(false);
    });

    test('should respect minimum canvas size', () => {
      // Mock small window
      global.window.innerWidth = 500;
      global.window.innerHeight = 400;

      const result = calculateCanvasSize();
      expect(result.width).toBeGreaterThanOrEqual(300);
      expect(result.height).toBeGreaterThanOrEqual(300);

      // Restore window size
      global.window.innerWidth = 1920;
      global.window.innerHeight = 1080;
    });
  });

  describe('mouseToGrid', () => {
    test('should convert mouse coordinates to grid coordinates', () => {
      const result = mouseToGrid(24, 16); // 3 cells right, 2 cells down
      expect(result.gridX).toBe(3);
      expect(result.gridY).toBe(2);
    });

    test('should handle exact cell boundaries', () => {
      const result = mouseToGrid(8, 8); // Exactly on cell boundary
      expect(result.gridX).toBe(1);
      expect(result.gridY).toBe(1);
    });

    test('should handle zero coordinates', () => {
      const result = mouseToGrid(0, 0);
      expect(result.gridX).toBe(0);
      expect(result.gridY).toBe(0);
    });

    test('should handle fractional pixels', () => {
      const result = mouseToGrid(12.7, 19.3);
      expect(result.gridX).toBe(1); // floor(12.7 / 8)
      expect(result.gridY).toBe(2); // floor(19.3 / 8)
    });
  });

  describe('gridToPixel', () => {
    test('should convert grid coordinates to pixel coordinates', () => {
      const result = gridToPixel(3, 2);
      expect(result.pixelX).toBe(24); // 3 * 8
      expect(result.pixelY).toBe(16); // 2 * 8
    });

    test('should handle zero coordinates', () => {
      const result = gridToPixel(0, 0);
      expect(result.pixelX).toBe(0);
      expect(result.pixelY).toBe(0);
    });

    test('should be inverse of mouseToGrid for exact boundaries', () => {
      const gridCoord = { x: 5, y: 7 };
      const pixel = gridToPixel(gridCoord.x, gridCoord.y);
      const backToGrid = mouseToGrid(pixel.pixelX, pixel.pixelY);

      expect(backToGrid.gridX).toBe(gridCoord.x);
      expect(backToGrid.gridY).toBe(gridCoord.y);
    });
  });

  describe('isWithinBounds', () => {
    test('should check bounds for object gridSize', () => {
      const gridSize = { width: 5, height: 3 };

      expect(isWithinBounds(0, 0, gridSize)).toBe(true);
      expect(isWithinBounds(4, 2, gridSize)).toBe(true); // Max valid coords
      expect(isWithinBounds(5, 2, gridSize)).toBe(false); // Out of bounds
      expect(isWithinBounds(4, 3, gridSize)).toBe(false); // Out of bounds
      expect(isWithinBounds(-1, 0, gridSize)).toBe(false); // Negative
    });

    test('should check bounds for number gridSize (square)', () => {
      const gridSize = 4;

      expect(isWithinBounds(0, 0, gridSize)).toBe(true);
      expect(isWithinBounds(3, 3, gridSize)).toBe(true);
      expect(isWithinBounds(4, 3, gridSize)).toBe(false);
      expect(isWithinBounds(3, 4, gridSize)).toBe(false);
    });

    test('should handle edge coordinates', () => {
      const gridSize = { width: 10, height: 10 };

      expect(isWithinBounds(0, 0, gridSize)).toBe(true);    // Top-left
      expect(isWithinBounds(9, 0, gridSize)).toBe(true);    // Top-right
      expect(isWithinBounds(0, 9, gridSize)).toBe(true);    // Bottom-left
      expect(isWithinBounds(9, 9, gridSize)).toBe(true);    // Bottom-right
      expect(isWithinBounds(10, 5, gridSize)).toBe(false);  // Just outside
      expect(isWithinBounds(5, 10, gridSize)).toBe(false);  // Just outside
    });
  });

  describe('calculateOptimalCellSize', () => {
    test('should calculate optimal cell size for canvas dimensions', () => {
      const result = calculateOptimalCellSize(800, 600, 100, 75);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(8); // Should not exceed default cell size
    });

    test('should handle small grids efficiently', () => {
      const result = calculateOptimalCellSize(400, 300, 10, 10);
      expect(result).toBeGreaterThan(0);
    });

    test('should handle very large grids', () => {
      const result = calculateOptimalCellSize(800, 600, 200, 200);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(8);
    });

    test('should handle rectangular canvases', () => {
      const result = calculateOptimalCellSize(1000, 400, 50, 50);
      expect(result).toBeGreaterThan(0);
    });
  });
});
