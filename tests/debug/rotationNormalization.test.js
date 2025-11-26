/**
 * Test to verify that rotation normalization works correctly
 * Brushes should always "hang" from top-left (0,0) regardless of rotation
 */

describe('Rotation Normalization', () => {
  test('should normalize rotated pattern to start from (0,0)', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    // Create a simple L-shaped pattern
    const originalPattern = {
      name: 'L-shape',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shape in top-left
      guidanceLines: [{
        direction: 'E',
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }]
    };

    // Rotate clockwise 90 degrees
    const rotated90 = BrushService.transformPattern(originalPattern, 'rotateClockwise');

    // After rotation and normalization, the pattern should start from (0,0)
    const minY = Math.min(...rotated90.pattern.map(([y]) => y));
    const minX = Math.min(...rotated90.pattern.map(([, x]) => x));

    expect(minY).toBe(0);
    expect(minX).toBe(0);

    // Verify pattern is not empty
    expect(rotated90.pattern).toHaveLength(3);

    // Verify guidance line was also normalized
    expect(rotated90.guidanceLines[0].direction).toBe('S'); // E -> S after 90° clockwise
    expect(rotated90.guidanceLines[0].startX).toBeGreaterThanOrEqual(0);
    expect(rotated90.guidanceLines[0].startY).toBeGreaterThanOrEqual(0);
  });

  test('should normalize 180-degree rotation correctly', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    // Create a pattern that extends into negative coordinates after 180° rotation
    const originalPattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [1, 1], [2, 2]], // Diagonal pattern
      guidanceLines: [{
        direction: 'SE',
        startX: 0,
        startY: 0
      }]
    };

    // Rotate 180 degrees (2 clockwise rotations)
    let rotated = originalPattern;
    rotated = BrushService.transformPattern(rotated, 'rotateClockwise');
    rotated = BrushService.transformPattern(rotated, 'rotateClockwise');

    // Pattern should be normalized to start from (0,0)
    const minY = Math.min(...rotated.pattern.map(([y]) => y));
    const minX = Math.min(...rotated.pattern.map(([, x]) => x));

    expect(minY).toBe(0);
    expect(minX).toBe(0);

    // Verify the pattern is different from original but normalized
    expect(rotated.pattern).not.toEqual(originalPattern.pattern);
    expect(rotated.pattern).toHaveLength(3);

    // Verify guidance line direction is rotated 180°
    expect(rotated.guidanceLines[0].direction).toBe('NW'); // SE -> NW after 180°
  });

  test('should normalize 270-degree rotation correctly', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    const originalPattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shape
      guidanceLines: [{
        direction: 'E',
        startX: 1,
        startY: 0
      }]
    };

    // Rotate 270 degrees (3 clockwise rotations)
    let rotated = originalPattern;
    for (let i = 0; i < 3; i++) {
      rotated = BrushService.transformPattern(rotated, 'rotateClockwise');
    }

    // Pattern should be normalized to start from (0,0)
    const minY = Math.min(...rotated.pattern.map(([y]) => y));
    const minX = Math.min(...rotated.pattern.map(([, x]) => x));

    expect(minY).toBe(0);
    expect(minX).toBe(0);

    // Verify pattern maintains its size
    expect(rotated.pattern).toHaveLength(3);

    // Verify guidance line direction is rotated 270° (same as 90° counterclockwise)
    expect(rotated.guidanceLines[0].direction).toBe('N'); // E -> N after 270°
  });

  test('should handle counterclockwise rotation with normalization', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    const originalPattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [1, 0], [0, 1]], // Different L-shape
      guidanceLines: [{
        direction: 'S',
        startX: 0,
        startY: 1
      }]
    };

    // Rotate counterclockwise 90 degrees
    const rotated = BrushService.transformPattern(originalPattern, 'rotateCounterclockwise');

    // Pattern should be normalized to start from (0,0)
    const minY = Math.min(...rotated.pattern.map(([y]) => y));
    const minX = Math.min(...rotated.pattern.map(([, x]) => x));

    expect(minY).toBe(0);
    expect(minX).toBe(0);

    // Verify guidance line direction
    expect(rotated.guidanceLines[0].direction).toBe('E'); // S -> E after 90° counterclockwise
    expect(rotated.guidanceLines[0].startX).toBeGreaterThanOrEqual(0);
    expect(rotated.guidanceLines[0].startY).toBeGreaterThanOrEqual(0);
  });

  test('should handle pattern with negative coordinates in original', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    // Pattern that already has negative coordinates
    const originalPattern = {
      name: 'offset-pattern',
      pattern: [[-1, -1], [-1, 0], [0, -1]], // Pattern in negative quadrant
      guidanceLines: [{
        direction: 'NW',
        startX: -1,
        startY: -1
      }]
    };

    // Rotate clockwise - this should still normalize to (0,0)
    const rotated = BrushService.transformPattern(originalPattern, 'rotateClockwise');

    // Even with negative input, result should be normalized to start from (0,0)
    const minY = Math.min(...rotated.pattern.map(([y]) => y));
    const minX = Math.min(...rotated.pattern.map(([, x]) => x));

    expect(minY).toBe(0);
    expect(minX).toBe(0);

    // Verify pattern maintains size
    expect(rotated.pattern).toHaveLength(3);

    // Verify guidance line was normalized too
    expect(rotated.guidanceLines[0].startX).toBeGreaterThanOrEqual(0);
    expect(rotated.guidanceLines[0].startY).toBeGreaterThanOrEqual(0);
  });

  test('should not affect flip transformations with normalization', () => {
    const { BrushService } = require('../../src/services/brushService.js');

    // Pattern for flip testing
    const originalPattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1], [1, 0]]
    };

    // Flip operations should not trigger normalization (only rotations do)
    const flippedX = BrushService.transformPattern(originalPattern, 'flipX');
    const flippedY = BrushService.transformPattern(originalPattern, 'flipY');

    // For flips, the original center-based transformation should be preserved
    expect(flippedX.pattern).not.toEqual(originalPattern.pattern);
    expect(flippedY.pattern).not.toEqual(originalPattern.pattern);

    // Patterns should still be valid
    expect(flippedX.pattern).toHaveLength(3);
    expect(flippedY.pattern).toHaveLength(3);
  });
});
