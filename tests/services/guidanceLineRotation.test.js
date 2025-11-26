/**
 * Test guidance line rotation when patterns are transformed
 */

import { BrushService } from '../../src/services/brushService.js';

describe('Guidance Line Rotation', () => {
  test('should rotate guidance line direction clockwise when pattern is rotated clockwise', () => {
    // Test pattern with guidance line pointing East
    const pattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: {
        direction: 'E',
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // After clockwise rotation, East should become South
    expect(rotatedPattern.guidanceLine.direction).toBe('S');
    // Coordinates should be transformed: [0, 0] -> [0, 0] (no change at origin)
    expect(rotatedPattern.guidanceLine.startX).toBe(0);
    expect(rotatedPattern.guidanceLine.startY).toBe(0);
    expect(rotatedPattern.guidanceLine.length).toBe(5); // Other properties unchanged
    expect(rotatedPattern.guidanceLine.speed).toBe(2);
  });

  test('should rotate guidance line direction counterclockwise when pattern is rotated counterclockwise', () => {
    const pattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: {
        direction: 'SE',
        startX: 2,
        startY: 1,
        length: '*',
        speed: 3
      }
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateCounterclockwise');

    // After counterclockwise rotation, SE should become NE
    expect(rotatedPattern.guidanceLine.direction).toBe('NE');
    // Coordinates are transformed and then normalized to start pattern from (0,0)
    expect(rotatedPattern.guidanceLine.startX).toBe(1); // Adjusted for normalization
    expect(rotatedPattern.guidanceLine.startY).toBe(-1); // Adjusted for normalization
    expect(rotatedPattern.guidanceLine.length).toBe('*');
    expect(rotatedPattern.guidanceLine.speed).toBe(3);
  });

  test('should test all direction rotations clockwise', () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const expectedClockwise = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

    for (let i = 0; i < directions.length; i++) {
      const guidanceLine = { direction: directions[i] };
      const rotatedGuidanceLine = BrushService.transformGuidanceLine(guidanceLine, 'rotateClockwise');
      expect(rotatedGuidanceLine.direction).toBe(expectedClockwise[i]);
    }
  });

  test('should test all direction rotations counterclockwise', () => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const expectedCounterclockwise = ['W', 'NW', 'N', 'NE', 'E', 'SE', 'S', 'SW'];

    for (let i = 0; i < directions.length; i++) {
      const guidanceLine = { direction: directions[i] };
      const rotatedGuidanceLine = BrushService.transformGuidanceLine(guidanceLine, 'rotateCounterclockwise');
      expect(rotatedGuidanceLine.direction).toBe(expectedCounterclockwise[i]);
    }
  });

  test('should correctly transform guidance lines for flip operations', () => {
    const pattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: {
        direction: 'NW',
        startX: 1,
        startY: 2,
        length: 10,
        speed: 4
      }
    };

    const flippedX = BrushService.transformPattern(pattern, 'flipX');
    const flippedY = BrushService.transformPattern(pattern, 'flipY');

    // Guidance line should be correctly transformed for flip operations
    // flipX: NW -> SW, y -> -y
    expect(flippedX.guidanceLine.direction).toBe('SW');
    expect(flippedX.guidanceLine.startX).toBe(1);
    expect(flippedX.guidanceLine.startY).toBe(-2);
    expect(flippedX.guidanceLine.length).toBe(10);
    expect(flippedX.guidanceLine.speed).toBe(4);

    // flipY: NW -> NE, x -> -x
    expect(flippedY.guidanceLine.direction).toBe('NE');
    expect(flippedY.guidanceLine.startX).toBe(-1);
    expect(flippedY.guidanceLine.startY).toBe(2);
    expect(flippedY.guidanceLine.length).toBe(10);
    expect(flippedY.guidanceLine.speed).toBe(4);
  });

  test('should handle pattern without guidance line', () => {
    const pattern = {
      name: 'test-pattern',
      pattern: [[0, 0], [0, 1]]
      // No guidanceLine property
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // Should not create a guidance line if one didn't exist
    expect(rotatedPattern.guidanceLine).toBeUndefined();
  });

  test('should handle invalid guidance line direction', () => {
    const guidanceLine = { direction: 'INVALID' };

    const rotatedClockwise = BrushService.transformGuidanceLine(guidanceLine, 'rotateClockwise');
    const rotatedCounterclockwise = BrushService.transformGuidanceLine(guidanceLine, 'rotateCounterclockwise');

    // Should return unchanged for invalid directions
    expect(rotatedClockwise).toEqual(guidanceLine);
    expect(rotatedCounterclockwise).toEqual(guidanceLine);
  });

  test('should handle case insensitive direction input', () => {
    const guidanceLine = { direction: 'se' }; // lowercase

    const rotatedGuidanceLine = BrushService.transformGuidanceLine(guidanceLine, 'rotateClockwise');

    // Should handle lowercase input and return uppercase result
    expect(rotatedGuidanceLine.direction).toBe('SW');
  });

  test('should maintain pattern coordinate transformation along with guidance line', () => {
    const pattern = {
      name: 'L-shaped',
      pattern: [[0, 0], [1, 0], [1, 1]], // L-shape
      guidanceLine: {
        direction: 'N',
        startX: 0,
        startY: 0,
        length: 3,
        speed: 1
      }
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // Pattern coordinates should be rotated and normalized to start from (0,0)
    expect(rotatedPattern.pattern).toEqual([[0, 1], [0, 0], [1, 0]]);

    // Guidance line direction should be rotated
    expect(rotatedPattern.guidanceLine.direction).toBe('E');

    // Other properties should be preserved
    expect(rotatedPattern.name).toBe('L-shaped');
  });

  test('should correctly transform guidance line coordinates during rotation', () => {
    const guidanceLine = {
      direction: 'E',
      startX: 4,
      startY: 2,
      length: 5,
      speed: 1
    };

    // Test clockwise rotation: [x, y] -> [-y, x] for Y-down coordinate system
    const clockwiseRotated = BrushService.transformGuidanceLine(guidanceLine, 'rotateClockwise');
    expect(clockwiseRotated.direction).toBe('S');
    expect(clockwiseRotated.startX).toBe(-2);  // -startY = -2
    expect(clockwiseRotated.startY).toBe(4);   // startX = 4

    // Test counterclockwise rotation: [x, y] -> [y, -x] for Y-down coordinate system
    const counterClockwiseRotated = BrushService.transformGuidanceLine(guidanceLine, 'rotateCounterclockwise');
    expect(counterClockwiseRotated.direction).toBe('N');
    expect(counterClockwiseRotated.startX).toBe(2);  // startY = 2
    expect(counterClockwiseRotated.startY).toBe(-4); // -startX = -4

    // Test that multiple rotations work correctly
    let multiRotated = guidanceLine;
    for (let i = 0; i < 4; i++) {
      multiRotated = BrushService.transformGuidanceLine(multiRotated, 'rotateClockwise');
    }
    // After 4 clockwise rotations, should be back to original direction and position
    expect(multiRotated.direction).toBe('E');
    expect(multiRotated.startX).toBe(4);
    expect(multiRotated.startY).toBe(2);
  });
});
