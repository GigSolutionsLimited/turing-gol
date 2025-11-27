/**
 * Integration test for pattern integrity with guidance lines
 * Tests the complete workflow from pattern placement to modification to restoration
 */
import { PlacedObjectService } from '../../src/services/placedObjectService.js';
import { BrushService } from '../../src/services/brushService.js';

describe('Pattern Integrity Integration', () => {
  test('should demonstrate complete pattern integrity workflow', () => {

    // Mock a brush with guidance lines
    const gliderBrush = {
      name: 'glider',
      pattern: [[0, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // Glider pattern
      guidanceLines: [
        {
          direction: 'SE',
          startX: 0,
          startY: 0,
          length: 'infinite',
          speed: 3
        }
      ]
    };

    const brushes = { 'glider': gliderBrush };

    // Step 1: Create a placed object (simulating user placing a glider)
    const placedObject = PlacedObjectService.createPlacedObject(
      gliderBrush,
      10, // gridX
      10, // gridY
      0,  // generation
      0   // rotation
    );

    // Verify placed object is created with intact flag
    expect(placedObject.intact).toBe(true);
    expect(placedObject.guidanceLines).toHaveLength(1);
    expect(placedObject.pixels).toHaveLength(5); // Glider has 5 pixels

    // Step 2: Create grid with intact pattern
    const gridSize = 25;
    const intactGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));

    // Place glider pattern on grid
    placedObject.pixels.forEach(pixel => {
      if (pixel.y >= 0 && pixel.y < gridSize && pixel.x >= 0 && pixel.x < gridSize) {
        intactGrid[pixel.y][pixel.x] = 1;
      }
    });

    // Step 3: Check integrity with intact pattern
    let placedObjects = [placedObject];
    let updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(placedObjects, intactGrid, brushes);

    expect(updatedObjects[0].intact).toBe(true);

    // Step 4: Get visible guidance lines (should include the glider's guidance line)
    let visibleGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(updatedObjects);
    expect(visibleGuidanceLines).toHaveLength(1);
    expect(visibleGuidanceLines[0].id).toContain('guidance');

    // Step 5: Simulate user removing a pixel (breaking the pattern)
    const brokenGrid = intactGrid.map(row => [...row]);
    const firstPixel = placedObject.pixels[0];
    brokenGrid[firstPixel.y][firstPixel.x] = 0; // Remove first pixel

    // Step 6: Check integrity with broken pattern
    updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(updatedObjects, brokenGrid, brushes);

    expect(updatedObjects[0].intact).toBe(false);

    // Step 7: Get visible guidance lines (should be empty now)
    visibleGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(updatedObjects);
    expect(visibleGuidanceLines).toHaveLength(0);

    // Step 8: Simulate user restoring the missing pixel
    const restoredGrid = brokenGrid.map(row => [...row]);
    restoredGrid[firstPixel.y][firstPixel.x] = 1; // Restore first pixel

    // Step 9: Check integrity with restored pattern
    updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(updatedObjects, restoredGrid, brushes);

    expect(updatedObjects[0].intact).toBe(true);

    // Step 10: Get visible guidance lines (should reappear)
    visibleGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(updatedObjects);
    expect(visibleGuidanceLines).toHaveLength(1);
    expect(visibleGuidanceLines[0].id).toContain('guidance');
  });

  test('should handle multiple patterns with mixed integrity states', () => {
    const { PlacedObjectService } = require('../../src/services/placedObjectService.js');

    // Mock brushes
    const blockBrush = {
      name: 'block',
      pattern: [[0, 0], [0, 1], [1, 0], [1, 1]],
      guidanceLines: [{ direction: 'N', startX: 0, startY: 0, length: 5, speed: 2 }]
    };

    const blinkerBrush = {
      name: 'blinker',
      pattern: [[0, 0], [0, 1], [0, 2]],
      guidanceLines: [{ direction: 'E', startX: 0, startY: 0, length: 10, speed: 1 }]
    };

    const brushes = { 'block': blockBrush, 'blinker': blinkerBrush };

    // Create two placed objects
    const blockObject = PlacedObjectService.createPlacedObject(blockBrush, 5, 5, 0, 0);
    const blinkerObject = PlacedObjectService.createPlacedObject(blinkerBrush, 10, 10, 0, 0);

    // Create grid with only block intact, blinker broken
    const grid = Array(20).fill(null).map(() => Array(20).fill(0));

    // Place complete block pattern
    blockObject.pixels.forEach(pixel => {
      grid[pixel.y][pixel.x] = 1;
    });

    // Place incomplete blinker pattern (missing one pixel)
    blinkerObject.pixels.slice(0, 2).forEach(pixel => { // Only first 2 pixels
      grid[pixel.y][pixel.x] = 1;
    });

    const placedObjects = [blockObject, blinkerObject];
    const updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(placedObjects, grid, brushes);

    // Block should be intact, blinker should be broken
    expect(updatedObjects[0].intact).toBe(true);  // block
    expect(updatedObjects[1].intact).toBe(false); // blinker

    // Only block's guidance line should be visible
    const visibleGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(updatedObjects);
    expect(visibleGuidanceLines).toHaveLength(1);
    // Check that the guidance line originates from the block position
    expect(visibleGuidanceLines[0].originX).toBe(5);
    expect(visibleGuidanceLines[0].originY).toBe(5);
    expect(visibleGuidanceLines[0].direction).toBe('N');
  });

  test('should work with rotated patterns', () => {
    const { PlacedObjectService } = require('../../src/services/placedObjectService.js');
    const { BrushService } = require('../../src/services/brushService.js');

    // Mock L-shaped brush
    const lShapeBrush = {
      name: 'L-shape',
      pattern: [[0, 0], [1, 0], [2, 0], [2, 1]], // Vertical L
      guidanceLines: [{ direction: 'E', startX: 0, startY: 0, length: 5, speed: 1 }]
    };

    const brushes = { 'L-shape': lShapeBrush };

    // Create placed object with 90-degree rotation
    const placedObject = PlacedObjectService.createPlacedObject(lShapeBrush, 10, 10, 0, 90);

    // Mock the rotation transformation
    const originalTransformPattern = BrushService.transformPattern;
    const rotatedPattern = [[0, 0], [0, 1], [0, 2], [1, 2]]; // Horizontal L

    BrushService.transformPattern = jest.fn((brush, transformation) => {
      if (transformation === 'rotateClockwise') {
        return { ...brush, pattern: rotatedPattern };
      }
      return brush;
    });

    // Create grid with rotated pattern
    const grid = Array(20).fill(null).map(() => Array(20).fill(0));
    rotatedPattern.forEach(([dy, dx]) => {
      grid[10 + dy][10 + dx] = 1; // Place at rotation point (10, 10)
    });

    const updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity([placedObject], grid, brushes);
    expect(updatedObjects[0].intact).toBe(true);

    // Break the rotated pattern
    const brokenGrid = grid.map(row => [...row]);
    brokenGrid[10 + rotatedPattern[0][0]][10 + rotatedPattern[0][1]] = 0;

    const brokenObjects = PlacedObjectService.updatePlacedObjectsIntegrity(updatedObjects, brokenGrid, brushes);
    expect(brokenObjects[0].intact).toBe(false);

    // Restore original method
    BrushService.transformPattern = originalTransformPattern;
  });

  test('should handle rapid integrity changes efficiently', () => {
    const { PlacedObjectService } = require('../../src/services/placedObjectService.js');

    const simpleBrush = {
      name: 'dot',
      pattern: [[0, 0]],
      guidanceLines: [{ direction: 'N', startX: 0, startY: 0, length: 3, speed: 1 }]
    };

    const brushes = { 'dot': simpleBrush };
    const placedObject = PlacedObjectService.createPlacedObject(simpleBrush, 5, 5, 0, 0);

    // Create grids for testing
    const gridWithPixel = Array(10).fill(null).map(() => Array(10).fill(0));
    gridWithPixel[5][5] = 1;

    const gridWithoutPixel = Array(10).fill(null).map(() => Array(10).fill(0));

    // Test multiple rapid integrity changes
    let objects = [placedObject];

    // Intact -> broken -> intact -> broken
    objects = PlacedObjectService.updatePlacedObjectsIntegrity(objects, gridWithPixel, brushes);
    expect(objects[0].intact).toBe(true);

    objects = PlacedObjectService.updatePlacedObjectsIntegrity(objects, gridWithoutPixel, brushes);
    expect(objects[0].intact).toBe(false);

    objects = PlacedObjectService.updatePlacedObjectsIntegrity(objects, gridWithPixel, brushes);
    expect(objects[0].intact).toBe(true);

    objects = PlacedObjectService.updatePlacedObjectsIntegrity(objects, gridWithoutPixel, brushes);
    expect(objects[0].intact).toBe(false);

    // Verify guidance lines respond correctly
    let visibleLines = PlacedObjectService.getVisibleGuidanceLines(objects);
    expect(visibleLines).toHaveLength(0); // Broken, so no guidance lines

    // Restore and check again
    objects = PlacedObjectService.updatePlacedObjectsIntegrity(objects, gridWithPixel, brushes);
    visibleLines = PlacedObjectService.getVisibleGuidanceLines(objects);
    expect(visibleLines).toHaveLength(1); // Intact, so guidance line appears
  });
});
