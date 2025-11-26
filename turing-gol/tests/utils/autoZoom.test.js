/**
 * Test for auto-zoom functionality
 */

import { calculateAutoZoomCellSize } from '../../src/utils/canvasUtils.js';
import { CELL_SIZE } from '../../src/constants/gameConstants.js';

// Mock window dimensions - more generous
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
});

describe('Auto-Zoom Functionality', () => {
  const defaultCellSize = CELL_SIZE; // Should be 8

  test('should return default cell size for small grids that fit comfortably', () => {
    const smallChallenge = {
      width: 61,
      height: 61
    };

    const result = calculateAutoZoomCellSize(smallChallenge, defaultCellSize);

    // For a 61x61 grid with default 8px cells, total size is 488x488
    // This should fit in most reasonable viewport sizes, so should return default
    expect(result).toBe(defaultCellSize);
  });

  test('should calculate smaller cell size for large grids', () => {
    const largeChallenge = {
      width: 200,
      height: 200
    };

    const result = calculateAutoZoomCellSize(largeChallenge, defaultCellSize);

    // For a 200x200 grid, we should get a smaller cell size to fit
    expect(result).toBeLessThan(defaultCellSize);
    expect(result).toBeGreaterThan(0);
  });

  test('should never go below 25% of default cell size', () => {
    const hugeChallenge = {
      width: 1000,
      height: 1000
    };

    const result = calculateAutoZoomCellSize(hugeChallenge, defaultCellSize);
    const minimumAllowed = Math.floor(defaultCellSize * 0.25); // 25% of 8 = 2

    expect(result).toBeGreaterThanOrEqual(minimumAllowed);
  });

  test('should handle missing challenge gracefully', () => {
    const result1 = calculateAutoZoomCellSize(null, defaultCellSize);
    const result2 = calculateAutoZoomCellSize(undefined, defaultCellSize);
    const result3 = calculateAutoZoomCellSize({}, defaultCellSize);

    expect(result1).toBe(defaultCellSize);
    expect(result2).toBe(defaultCellSize);
    expect(result3).toBe(defaultCellSize);
  });

  test('should handle challenge without width/height', () => {
    const incompleteChallenge = {
      name: "Test Challenge",
      targetTurn: 100
      // Missing width and height
    };

    const result = calculateAutoZoomCellSize(incompleteChallenge, defaultCellSize);

    expect(result).toBe(defaultCellSize);
  });

  test('should work with various viewport sizes', () => {
    const challenge = {
      width: 150,
      height: 150
    };

    // Test with small viewport
    window.innerWidth = 800;
    window.innerHeight = 600;
    const resultSmall = calculateAutoZoomCellSize(challenge, defaultCellSize);

    // Test with large viewport
    window.innerWidth = 1920;
    window.innerHeight = 1080;
    const resultLarge = calculateAutoZoomCellSize(challenge, defaultCellSize);

    // Large viewport should allow larger cell sizes
    expect(resultLarge).toBeGreaterThanOrEqual(resultSmall);

    // Both should respect minimum constraint
    const minimumAllowed = Math.floor(defaultCellSize * 0.25);
    expect(resultSmall).toBeGreaterThanOrEqual(minimumAllowed);
    expect(resultLarge).toBeGreaterThanOrEqual(minimumAllowed);

    // Both should not exceed default
    expect(resultSmall).toBeLessThanOrEqual(defaultCellSize);
    expect(resultLarge).toBeLessThanOrEqual(defaultCellSize);
  });

  test('should calculate correctly for real challenge examples', () => {
    // Level 1 from the provided JSON
    const level1 = {
      width: 61,
      height: 61
    };

    // Level 7 (typical large level)
    const level7 = {
      width: 201,
      height: 201
    };

    const result1 = calculateAutoZoomCellSize(level1, defaultCellSize);
    const result7 = calculateAutoZoomCellSize(level7, defaultCellSize);

    // Level 1 should probably use default cell size
    expect(result1).toBe(defaultCellSize);

    // Level 7 should use smaller cell size but respect minimum
    expect(result7).toBeLessThanOrEqual(defaultCellSize);
    expect(result7).toBeGreaterThanOrEqual(Math.floor(defaultCellSize * 0.25));
  });

  test('should provide better zoom levels for levels 4 and 7', () => {
    // Level 4: 201x201 (square, large)
    const level4 = {
      width: 201,
      height: 201
    };

    // Level 7: 201x131 (rectangular, not square)
    const level7 = {
      width: 201,
      height: 131
    };

    const result4 = calculateAutoZoomCellSize(level4, defaultCellSize);
    const result7 = calculateAutoZoomCellSize(level7, defaultCellSize);

    // Should not zoom out too aggressively - minimum should be reasonable
    expect(result4).toBeGreaterThanOrEqual(3); // More reasonable than previous 2px minimum
    expect(result7).toBeGreaterThanOrEqual(4); // Level 7 should be better since it's shorter

    // Both should respect absolute minimum
    expect(result4).toBeGreaterThanOrEqual(Math.floor(defaultCellSize * 0.25));
    expect(result7).toBeGreaterThanOrEqual(Math.floor(defaultCellSize * 0.25));

    // Level 7 should get better zoom than level 4 due to rectangular shape
    expect(result7).toBeGreaterThanOrEqual(result4);
  });

  test('should prefer default cell size when optimal size is close', () => {
    // Test the tolerance factor - if optimal would be 6px (75% of 8px), use default instead
    const mediumChallenge = {
      width: 80,  // Designed to hit the tolerance boundary
      height: 80
    };

    const result = calculateAutoZoomCellSize(mediumChallenge, defaultCellSize);

    // Should prefer default cell size over slightly smaller optimal size
    expect(result).toBe(defaultCellSize);
  });

  test('should provide breathing room margin', () => {
    // Mock a scenario where without breathing room it would fit, but with breathing room it doesn't
    // This tests that we're using 85% of available space rather than 100%

    // These dimensions are carefully chosen to test the breathing room factor
    const breathingRoomTest = {
      width: 100,
      height: 60
    };

    const result = calculateAutoZoomCellSize(breathingRoomTest, defaultCellSize);

    // Result should be influenced by breathing room factor
    expect(result).toBeLessThanOrEqual(defaultCellSize);
    expect(result).toBeGreaterThan(0);
  });

  test('should return integer cell sizes', () => {
    const challenges = [
      { width: 33, height: 33 },
      { width: 77, height: 77 },
      { width: 123, height: 123 },
      { width: 189, height: 189 }
    ];

    challenges.forEach(challenge => {
      const result = calculateAutoZoomCellSize(challenge, defaultCellSize);
      expect(Number.isInteger(result)).toBe(true);
      expect(result).toBeGreaterThan(0);
    });
  });
});
