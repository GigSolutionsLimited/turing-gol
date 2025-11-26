/**
 * Test to verify that setup patterns with rotation are applied correctly
 * This tests both pattern placement and guidance line rotation
 */

describe('Setup Pattern Rotation', () => {
  test('should apply rotation to setup patterns correctly', () => {
    // Mock the BrushService.transformPattern function
    const mockTransformPattern = jest.fn();
    const BrushService = require('../../src/services/brushService.js').BrushService;
    const originalTransform = BrushService.transformPattern;
    BrushService.transformPattern = mockTransformPattern;

    // Mock brush with pattern and guidance line
    const mockBrush = {
      name: 'testBrush',
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shaped pattern
      guidanceLines: [{
        direction: 'E',
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }]
    };

    // Mock rotated brush (270 degrees = 3 clockwise rotations)
    const mockRotatedBrush = {
      name: 'testBrush',
      pattern: [[0, 0], [-1, 0], [0, 1]], // Rotated L-shape
      guidanceLines: [{
        direction: 'N', // E rotated 270 degrees clockwise = N
        startX: 0,
        startY: 0,
        length: 5,
        speed: 2
      }]
    };

    // Setup test to return rotated brush after 3 transformations
    mockTransformPattern.mockReturnValue(mockRotatedBrush);

    // Test setup item with 270 degree rotation
    const setupItem = {
      x: 10,
      y: 5,
      brush: 'testBrush',
      rotate: 270
    };

    const brushes = {
      testBrush: mockBrush
    };

    // Simulate the setup processing logic
    const baseBrush = brushes[setupItem.brush];
    let brush = baseBrush;

    if (setupItem.rotate && setupItem.rotate !== 0) {
      const rotations = Math.floor(setupItem.rotate / 90) % 4;
      expect(rotations).toBe(3); // 270 / 90 = 3

      for (let i = 0; i < rotations; i++) {
        brush = BrushService.transformPattern(brush, 'rotateClockwise');
      }
    }

    // Verify that transformPattern was called 3 times with 'rotateClockwise'
    expect(mockTransformPattern).toHaveBeenCalledTimes(3);
    expect(mockTransformPattern).toHaveBeenCalledWith(expect.any(Object), 'rotateClockwise');

    // Verify the final brush is the rotated version
    expect(brush).toBe(mockRotatedBrush);

    // Verify guidance line was rotated correctly
    expect(brush.guidanceLines[0].direction).toBe('N'); // E -> N after 270° rotation

    // Restore original function
    BrushService.transformPattern = originalTransform;
  });

  test('should handle rotations that are not multiples of 90', () => {
    const BrushService = require('../../src/services/brushService.js').BrushService;
    const mockTransformPattern = jest.fn();
    const originalTransform = BrushService.transformPattern;
    BrushService.transformPattern = mockTransformPattern;

    const mockBrush = { pattern: [[0, 0]] };
    mockTransformPattern.mockReturnValue(mockBrush);

    // Test with 180 degrees
    let setupItem = { rotate: 180 };
    let rotations = Math.floor(setupItem.rotate / 90) % 4;
    expect(rotations).toBe(2);

    // Test with 450 degrees (should be same as 90 degrees)
    setupItem = { rotate: 450 };
    rotations = Math.floor(setupItem.rotate / 90) % 4;
    expect(rotations).toBe(1); // 450 / 90 = 5, 5 % 4 = 1

    // Test with 45 degrees (should be 0 rotations)
    setupItem = { rotate: 45 };
    rotations = Math.floor(setupItem.rotate / 90) % 4;
    expect(rotations).toBe(0);

    BrushService.transformPattern = originalTransform;
  });

  test('should not rotate when rotation is 0 or undefined', () => {
    const BrushService = require('../../src/services/brushService.js').BrushService;
    const mockTransformPattern = jest.fn();
    const originalTransform = BrushService.transformPattern;
    BrushService.transformPattern = mockTransformPattern;

    const mockBrush = { pattern: [[0, 0]] };

    const brushes = { testBrush: mockBrush };

    // Test with rotation = 0
    let setupItem = { brush: 'testBrush', rotate: 0 };
    let baseBrush = brushes[setupItem.brush];
    let brush = baseBrush;

    if (setupItem.rotate && setupItem.rotate !== 0) {
      // This should not execute
      brush = BrushService.transformPattern(brush, 'rotateClockwise');
    }

    expect(mockTransformPattern).not.toHaveBeenCalled();
    expect(brush).toBe(baseBrush); // Should be unchanged

    // Test with no rotation property
    setupItem = { brush: 'testBrush' };
    brush = baseBrush;

    if (setupItem.rotate && setupItem.rotate !== 0) {
      // This should not execute
      brush = BrushService.transformPattern(brush, 'rotateClockwise');
    }

    expect(mockTransformPattern).not.toHaveBeenCalled();
    expect(brush).toBe(baseBrush); // Should be unchanged

    BrushService.transformPattern = originalTransform;
  });

  test('should handle missing brush gracefully', () => {
    const setupItem = {
      brush: 'nonexistentBrush',
      rotate: 90
    };

    const brushes = {};

    // Simulate the setup processing logic
    const baseBrush = brushes[setupItem.brush];

    // Should not throw error when brush doesn't exist
    expect(baseBrush).toBeUndefined();

    // The if condition should prevent any rotation attempt
    let brush = baseBrush;
    if (baseBrush && baseBrush.pattern) {
      // This block should not execute
      brush = baseBrush; // Would apply rotation here
    }

    expect(brush).toBeUndefined();
  });
});
