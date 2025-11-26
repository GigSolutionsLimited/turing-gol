/**
 * Test for guidance line transformation during brush rotation
 */

import { BrushService } from '../../src/services/brushService';

describe('Guidance Line Rotation', () => {
  test('should correctly transform guidance line direction when rotating clockwise', () => {
    const originalGuidanceLine = {
      direction: 'SE',
      startX: 24,
      startY: 8,
      length: 'infinite',
      speed: 6
    };

    const rotatedGuidanceLine = BrushService.transformGuidanceLine(originalGuidanceLine, 'rotateClockwise');

    // SE rotated clockwise 90° should become SW
    // Direction mapping: SE (index 3) + 2 = index 5 = SW
    expect(rotatedGuidanceLine.direction).toBe('SW');

    // For clockwise rotation in Y-down coordinates: [x, y] -> [-y, x]
    // [24, 8] -> [-8, 24]
    expect(rotatedGuidanceLine.startX).toBe(-8);
    expect(rotatedGuidanceLine.startY).toBe(24);
  });

  test('should correctly transform guidance line direction when rotating counterclockwise', () => {
    const originalGuidanceLine = {
      direction: 'SE',
      startX: 24,
      startY: 8,
      length: 'infinite',
      speed: 6
    };

    const rotatedGuidanceLine = BrushService.transformGuidanceLine(originalGuidanceLine, 'rotateCounterclockwise');

    // SE rotated counterclockwise 90° should become NE
    // Direction mapping: SE (index 3) - 2 = index 1 = NE
    expect(rotatedGuidanceLine.direction).toBe('NE');

    // For counterclockwise rotation in Y-down coordinates: [x, y] -> [y, -x]
    // [24, 8] -> [8, -24]
    expect(rotatedGuidanceLine.startX).toBe(8);
    expect(rotatedGuidanceLine.startY).toBe(-24);
  });

  test('should handle full pattern transformation with guidance lines', () => {
    const pattern = {
      name: 'TestPattern',
      pattern: [[0, 0], [0, 1], [1, 0]], // Simple L shape
      guidanceLine: {
        direction: 'E',
        startX: 2,
        startY: 0,
        length: 5,
        speed: 1
      }
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // E rotated clockwise should become S
    expect(rotatedPattern.guidanceLine.direction).toBe('S');

    // After rotation and normalization, coordinates will be adjusted
    // Original [2, 0] rotated clockwise -> [0, -2], then normalized
    // Pattern bounds changed, so guidance line coordinates are offset accordingly
    expect(rotatedPattern.guidanceLine.startX).toBe(1); // Adjusted for normalization
    expect(rotatedPattern.guidanceLine.startY).toBe(2); // Adjusted for normalization
  });

  test('should handle multiple guidance lines transformation', () => {
    const pattern = {
      name: 'TestPattern',
      pattern: [[0, 0]],
      guidanceLines: [
        {
          direction: 'N',
          startX: 0,
          startY: 0,
          length: 3,
          speed: 1
        },
        {
          direction: 'E',
          startX: 1,
          startY: 1,
          length: 3,
          speed: 1
        }
      ]
    };

    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // N rotated clockwise should become E
    expect(rotatedPattern.guidanceLines[0].direction).toBe('E');
    expect(rotatedPattern.guidanceLines[0].startX).toBe(0);
    expect(rotatedPattern.guidanceLines[0].startY).toBe(0);

    // E rotated clockwise should become S
    expect(rotatedPattern.guidanceLines[1].direction).toBe('S');
    expect(rotatedPattern.guidanceLines[1].startX).toBe(-1);
    expect(rotatedPattern.guidanceLines[1].startY).toBe(1);
  });

  test('should preserve other guidance line properties during transformation', () => {
    const originalGuidanceLine = {
      direction: 'SW',
      startX: 10,
      startY: 5,
      length: 15,
      speed: 3,
      customProperty: 'preserved'
    };

    const rotatedGuidanceLine = BrushService.transformGuidanceLine(originalGuidanceLine, 'rotateClockwise');

    expect(rotatedGuidanceLine.length).toBe(15);
    expect(rotatedGuidanceLine.speed).toBe(3);
    expect(rotatedGuidanceLine.customProperty).toBe('preserved');
  });

  test('should correctly transform guidance line when flipping vertically (flipX)', () => {
    const originalGuidanceLine = {
      direction: 'SE',
      startX: 24,
      startY: 8,
      length: 'infinite',
      speed: 6
    };

    const flippedGuidanceLine = BrushService.transformGuidanceLine(originalGuidanceLine, 'flipX');

    // SE flipped vertically should become NE
    expect(flippedGuidanceLine.direction).toBe('NE');
    expect(flippedGuidanceLine.startX).toBe(24);
    expect(flippedGuidanceLine.startY).toBe(-8);
  });

  test('should correctly transform guidance line when flipping horizontally (flipY)', () => {
    const originalGuidanceLine = {
      direction: 'SE',
      startX: 24,
      startY: 8,
      length: 'infinite',
      speed: 6
    };

    const flippedGuidanceLine = BrushService.transformGuidanceLine(originalGuidanceLine, 'flipY');

    // SE flipped horizontally should become SW
    expect(flippedGuidanceLine.direction).toBe('SW');
    expect(flippedGuidanceLine.startX).toBe(-24);
    expect(flippedGuidanceLine.startY).toBe(8);
  });

  test('should handle all direction mappings for flipX', () => {
    const testCases = [
      { input: 'N', expected: 'S' },
      { input: 'S', expected: 'N' },
      { input: 'NE', expected: 'SE' },
      { input: 'SE', expected: 'NE' },
      { input: 'NW', expected: 'SW' },
      { input: 'SW', expected: 'NW' },
      { input: 'E', expected: 'E' }, // E and W don't change
      { input: 'W', expected: 'W' }
    ];

    testCases.forEach(({ input, expected }) => {
      const guidanceLine = { direction: input, startX: 10, startY: 5 };
      // Test without pattern coordinates (should use simple negation)
      const result = BrushService.transformGuidanceLine(guidanceLine, 'flipX');
      expect(result.direction).toBe(expected);
      expect(result.startY).toBe(-5); // Y should flip with simple negation
      expect(result.startX).toBe(10); // X should not change
    });
  });

  test('should handle all direction mappings for flipY', () => {
    const testCases = [
      { input: 'E', expected: 'W' },
      { input: 'W', expected: 'E' },
      { input: 'NE', expected: 'NW' },
      { input: 'NW', expected: 'NE' },
      { input: 'SE', expected: 'SW' },
      { input: 'SW', expected: 'SE' },
      { input: 'N', expected: 'N' }, // N and S don't change
      { input: 'S', expected: 'S' }
    ];

    testCases.forEach(({ input, expected }) => {
      const guidanceLine = { direction: input, startX: 10, startY: 5 };
      // Test without pattern coordinates (should use simple negation)
      const result = BrushService.transformGuidanceLine(guidanceLine, 'flipY');
      expect(result.direction).toBe(expected);
      expect(result.startX).toBe(-10); // X should flip with simple negation
      expect(result.startY).toBe(5); // Y should not change
    });
  });

  test('should handle full pattern transformation with guidance lines for flips', () => {
    const pattern = {
      name: 'TestPattern',
      pattern: [[0, 0], [0, 1], [1, 0]], // Simple L shape
      guidanceLine: {
        direction: 'SE',
        startX: 24,
        startY: 8,
        length: 'infinite',
        speed: 6
      }
    };

    const flippedXPattern = BrushService.transformPattern(pattern, 'flipX');
    const flippedYPattern = BrushService.transformPattern(pattern, 'flipY');

    // Direction transformations
    expect(flippedXPattern.guidanceLine.direction).toBe('NE');
    expect(flippedYPattern.guidanceLine.direction).toBe('SW');

    // For this L-shaped pattern:
    // Pattern bounds: Y[0,1], X[0,1], center = (0,0)
    // flipX: startY transforms around centerY=0: 2*0 - 8 = -8
    expect(flippedXPattern.guidanceLine.startX).toBe(24);
    expect(flippedXPattern.guidanceLine.startY).toBe(-8);

    // flipY: startX transforms around centerX=0: 2*0 - 24 = -24
    expect(flippedYPattern.guidanceLine.startX).toBe(-24);
    expect(flippedYPattern.guidanceLine.startY).toBe(8);
  });
});

