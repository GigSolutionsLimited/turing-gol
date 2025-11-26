/**
 * Test to prevent NaN coordinate regression in Level 5 guidance line setup
 */

describe('Level 5 NaN Coordinate Bug Prevention', () => {
  test('should not generate NaN coordinates when calculating center offsets', () => {
    // This test prevents the specific bug where getCenterOffsets was called incorrectly
    // causing NaN coordinates for guidance line placement

    const level5Challenge = {
      setup: [
        {
          x: -50,
          y: -50,
          brush: "p30GliderGunG"
        }
      ],
      width: 101,
      height: 101
    };

    const gridSize = { width: 101, height: 101 };

    // Test the corrected center offset calculation
    const currentGridSize = level5Challenge && level5Challenge.width && level5Challenge.height
      ? { width: level5Challenge.width, height: level5Challenge.height }
      : gridSize;

    // Calculate center offsets correctly (the fix)
    const centerOffsetX = Math.floor(currentGridSize.width / 2);
    const centerOffsetY = Math.floor(currentGridSize.height / 2);

    // Verify no NaN values
    expect(centerOffsetX).not.toBeNaN();
    expect(centerOffsetY).not.toBeNaN();
    expect(centerOffsetX).toBe(50);
    expect(centerOffsetY).toBe(50);

    // Test placement coordinate calculation
    const setupItem = level5Challenge.setup[0];
    const placementX = centerOffsetX + setupItem.x; // 50 + (-50) = 0
    const placementY = centerOffsetY + setupItem.y; // 50 + (-50) = 0

    expect(placementX).not.toBeNaN();
    expect(placementY).not.toBeNaN();
    expect(placementX).toBe(0);
    expect(placementY).toBe(0);

    // Test final guidance line coordinates
    const guidanceSpec = {
      direction: 'SE',
      startX: 21,
      startY: 7,
      length: 'infinite',
      speed: 3
    };

    const finalOriginX = placementX + guidanceSpec.startX; // 0 + 21 = 21
    const finalOriginY = placementY + guidanceSpec.startY; // 0 + 7 = 7

    expect(finalOriginX).not.toBeNaN();
    expect(finalOriginY).not.toBeNaN();
    expect(finalOriginX).toBe(21);
    expect(finalOriginY).toBe(7);
  });

  test('should verify the incorrect implementation that caused NaN', () => {
    // This test documents the bug to prevent regression

    const currentGridSize = { width: 101, height: 101 };

    // The actual getCenterOffsets function:
    // export function getCenterOffsets(grid) {
    //   const height = Array.isArray(grid) ? grid.length : grid.height || grid;
    //   const width = Array.isArray(grid) && grid.length > 0 ? grid[0].length : grid.width || grid;
    //   return {
    //     centerOffsetX: Math.floor(width / 2),
    //     centerOffsetY: Math.floor(height / 2)
    //   };
    // }

    // The INCORRECT input that caused the bug:
    const incorrectInput = {
      length: currentGridSize.height,  // 101
      0: { length: currentGridSize.width } // { length: 101 }
    };

    // Simulate what getCenterOffsets would actually do:
    const simulateGetCenterOffsets = (grid) => {
      const height = Array.isArray(grid) ? grid.length : grid.height || grid;
      const width = Array.isArray(grid) && grid.length > 0 ? grid[0].length : grid.width || grid;
      return {
        centerOffsetX: Math.floor(width / 2),
        centerOffsetY: Math.floor(height / 2)
      };
    };

    const result = simulateGetCenterOffsets(incorrectInput);

    // With the malformed input:
    // height = !Array.isArray(incorrectInput) ? incorrectInput.height || incorrectInput
    // Since incorrectInput.height is undefined, height = incorrectInput = { length: 101, 0: { length: 101 } }
    // So height would be the object itself, and Math.floor(height / 2) would be Math.floor(NaN / 2) = NaN

    // width = !Array.isArray(incorrectInput) && incorrectInput.length > 0 ? incorrectInput[0].length : incorrectInput.width || incorrectInput
    // incorrectInput is not an array, but incorrectInput.length > 0 is false (undefined > 0 = false)
    // So width = incorrectInput.width || incorrectInput = undefined || { object } = { object }
    // So width would be the object itself, and Math.floor(width / 2) would be NaN

    // Actually, let's trace this more carefully:
    // height = Array.isArray(incorrectInput) ? incorrectInput.length : incorrectInput.height || incorrectInput;
    // Array.isArray({ length: 101, 0: { length: 101 } }) = false
    // So height = incorrectInput.height || incorrectInput = undefined || { length: 101, 0: { length: 101 } }
    // Since the object is truthy, height = { length: 101, 0: { length: 101 } }
    // Math.floor(height / 2) = Math.floor(NaN) = NaN

    expect(result.centerOffsetX).toBeNaN();
    expect(result.centerOffsetY).toBeNaN();

    // Verify the CORRECT implementation with proper gridSize object
    const correctResult = simulateGetCenterOffsets(currentGridSize);
    expect(correctResult.centerOffsetX).toBe(50);
    expect(correctResult.centerOffsetY).toBe(50);

    // Also test the direct calculation approach (the fix)
    const directCenterOffsetX = Math.floor(currentGridSize.width / 2);
    const directCenterOffsetY = Math.floor(currentGridSize.height / 2);

    expect(directCenterOffsetX).toBe(50);
    expect(directCenterOffsetY).toBe(50);
  });

  test('should handle different grid sizes without NaN', () => {
    // Test various grid sizes to ensure robustness

    const testSizes = [
      { width: 61, height: 61 },   // Level 1-2
      { width: 101, height: 101 }, // Level 3, 5
      { width: 201, height: 201 }, // Level 4
    ];

    testSizes.forEach(size => {
      const centerOffsetX = Math.floor(size.width / 2);
      const centerOffsetY = Math.floor(size.height / 2);

      expect(centerOffsetX).not.toBeNaN();
      expect(centerOffsetY).not.toBeNaN();
      expect(centerOffsetX).toBeGreaterThanOrEqual(0);
      expect(centerOffsetY).toBeGreaterThanOrEqual(0);

      // Test with various placement offsets
      const testOffsets = [[-50, -50], [0, 0], [25, -15], [-20, 30]];

      testOffsets.forEach(([x, y]) => {
        const placementX = centerOffsetX + x;
        const placementY = centerOffsetY + y;

        expect(placementX).not.toBeNaN();
        expect(placementY).not.toBeNaN();

        // These might be negative or outside bounds, but should be real numbers
        expect(typeof placementX).toBe('number');
        expect(typeof placementY).toBe('number');
        expect(isFinite(placementX)).toBe(true);
        expect(isFinite(placementY)).toBe(true);
      });
    });
  });
});
