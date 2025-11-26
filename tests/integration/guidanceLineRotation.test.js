/**
 * Integration test for guidance line rotation with pattern transformation
 */

import { parseRLEFile } from '../../src/utils/rleUtils.js';
import { BrushService } from '../../src/services/brushService.js';

describe('Guidance Line Rotation Integration', () => {
  test('should parse and rotate a complete pattern with guidance line', () => {
    // Sample RLE content with guidance line specification
    const rleContent = `#N Test Gun with Guidance
#P E/5/3/10/2
x = 3, y = 3, rule = B3/S23
bo$2bo$3o!`;

    // Parse the RLE file
    const pattern = parseRLEFile(rleContent);

    // Verify the pattern was parsed correctly
    expect(pattern.name).toBe('Test Gun with Guidance');
    expect(pattern.pattern).toEqual([[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]]);
    expect(pattern.guidanceLine).toEqual({
      direction: 'E',
      startX: 5,
      startY: 3,
      length: 10,
      speed: 2
    });

    // Rotate the pattern clockwise
    const rotatedPattern = BrushService.transformPattern(pattern, 'rotateClockwise');

    // Verify pattern coordinates were rotated and normalized
    expect(rotatedPattern.pattern).toEqual([[1, 2], [2, 1], [0, 0], [1, 0], [2, 0]]);

    // Verify guidance line direction was rotated (E becomes S)
    expect(rotatedPattern.guidanceLine.direction).toBe('S');
    // Coordinates are transformed and normalized
    expect(rotatedPattern.guidanceLine.startX).toBe(-1); // Adjusted for normalization
    expect(rotatedPattern.guidanceLine.startY).toBe(5);  // Adjusted for normalization
    expect(rotatedPattern.guidanceLine.length).toBe(10); // Other properties unchanged
    expect(rotatedPattern.guidanceLine.speed).toBe(2);
  });

  test('should handle pattern rotation multiple times', () => {
    const pattern = {
      name: 'test',
      pattern: [[0, 0], [0, 1]],
      guidanceLine: {
        direction: 'N',
        startX: 0,
        startY: 0,
        length: 5,
        speed: 1
      }
    };

    // Rotate 4 times clockwise should return to original direction
    let rotatedPattern = pattern;
    for (let i = 0; i < 4; i++) {
      rotatedPattern = BrushService.transformPattern(rotatedPattern, 'rotateClockwise');
    }

    expect(rotatedPattern.guidanceLine.direction).toBe('N'); // Back to original

    // Test the intermediate steps
    const step1 = BrushService.transformPattern(pattern, 'rotateClockwise');
    expect(step1.guidanceLine.direction).toBe('E');

    const step2 = BrushService.transformPattern(step1, 'rotateClockwise');
    expect(step2.guidanceLine.direction).toBe('S');

    const step3 = BrushService.transformPattern(step2, 'rotateClockwise');
    expect(step3.guidanceLine.direction).toBe('W');

    const step4 = BrushService.transformPattern(step3, 'rotateClockwise');
    expect(step4.guidanceLine.direction).toBe('N'); // Full circle
  });

  test('should handle counterclockwise rotation correctly', () => {
    const pattern = {
      name: 'test',
      pattern: [[0, 0]],
      guidanceLine: { direction: 'NE' }
    };

    // Counterclockwise: NE -> NW -> SW -> SE -> NE
    const step1 = BrushService.transformPattern(pattern, 'rotateCounterclockwise');
    expect(step1.guidanceLine.direction).toBe('NW');

    const step2 = BrushService.transformPattern(step1, 'rotateCounterclockwise');
    expect(step2.guidanceLine.direction).toBe('SW');

    const step3 = BrushService.transformPattern(step2, 'rotateCounterclockwise');
    expect(step3.guidanceLine.direction).toBe('SE');

    const step4 = BrushService.transformPattern(step3, 'rotateCounterclockwise');
    expect(step4.guidanceLine.direction).toBe('NE'); // Back to start
  });
});
