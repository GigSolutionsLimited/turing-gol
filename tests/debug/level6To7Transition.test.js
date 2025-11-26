/**
 * Test for level 6 to level 7 transition guidance line clearing
 */

import {
  generateAllGuidanceLinePixels,
  createGuidanceLineObject
} from '../../src/utils/guidanceLineObjects';

describe('Level 6 to 7 Transition', () => {
  test('should clear guidance lines when switching from level with setup to level without setup', () => {
    // Simulate level 6 with guidance lines (p30GliderGunG brush has guidance lines)
    const level6GuidanceLines = [
      createGuidanceLineObject(0, 21, 7, 'SE', 'infinite', 3) // From p30GliderGunG
    ];

    // Generate pixels for level 6
    const level6Pixels = generateAllGuidanceLinePixels(level6GuidanceLines, 0, 101, 101);
    expect(level6Pixels.length).toBeGreaterThan(0); // Should have guidance line pixels

    // Simulate level 7 with no guidance lines (empty setup)
    const level7GuidanceLines = [];

    // Generate pixels for level 7
    const level7Pixels = generateAllGuidanceLinePixels(level7GuidanceLines, 0, 201, 201);
    expect(level7Pixels.length).toBe(0); // Should have no guidance line pixels
  });

  test('should handle different grid sizes between levels', () => {
    // Level 6: 101x101 grid with guidance lines
    const level6GuidanceLines = [
      createGuidanceLineObject(0, 21, 7, 'SE', 10, 3)
    ];

    const level6Pixels = generateAllGuidanceLinePixels(level6GuidanceLines, 0, 101, 101);
    expect(level6Pixels.length).toBeGreaterThan(0);

    // Level 7: 201x201 grid with no guidance lines
    const level7GuidanceLines = [];

    const level7Pixels = generateAllGuidanceLinePixels(level7GuidanceLines, 0, 201, 201);
    expect(level7Pixels.length).toBe(0);

    // Verify that the same guidance line would work on the larger grid if it existed
    const testGuidanceLines = [
      createGuidanceLineObject(0, 21, 7, 'SE', 10, 3)
    ];
    const testPixels = generateAllGuidanceLinePixels(testGuidanceLines, 0, 201, 201);
    expect(testPixels.length).toBeGreaterThan(0); // Should work on larger grid
  });
});
