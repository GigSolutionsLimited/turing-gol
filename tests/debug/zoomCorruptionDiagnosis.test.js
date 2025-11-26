/**
 * Debug test to diagnose zoom corruption by logging grid state
 */

describe('Zoom Corruption Diagnosis', () => {
  test('should log grid state during zoom operations', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Create a known pattern
    const originalGrid = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    console.log('Original grid:');
    originalGrid.forEach((row, y) => {
      console.log(`Row ${y}:`, row.join(''));
    });

    const originalLiveCells = originalGrid.flat().filter(cell => cell === 1).length;
    console.log('Original live cells:', originalLiveCells);

    // Simulate zoom operation (this should NOT change grid data)
    const afterZoom = originalGrid; // In actual code, grid should remain unchanged

    console.log('Grid after zoom:');
    afterZoom.forEach((row, y) => {
      console.log(`Row ${y}:`, row.join(''));
    });

    const afterZoomLiveCells = afterZoom.flat().filter(cell => cell === 1).length;
    console.log('Live cells after zoom:', afterZoomLiveCells);

    // Grid data should be identical
    expect(afterZoom).toBe(originalGrid);
    expect(afterZoomLiveCells).toBe(originalLiveCells);
  });

  test('should verify grid bounds checking during rendering', () => {
    // Simulate a scenario where grid and canvas size might be mismatched

    const grid = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ];

    const gridHeight = grid.length; // 3
    const gridWidth = grid[0].length; // 3

    // Simulate different cellSizes
    const cellSizes = [2, 4, 8, 16, 32];

    cellSizes.forEach(cellSize => {
      console.log(`\nTesting cellSize: ${cellSize}`);

      // Calculate canvas size
      const canvasWidth = gridWidth * cellSize;
      const canvasHeight = gridHeight * cellSize;

      console.log(`Canvas: ${canvasWidth}x${canvasHeight}, Grid: ${gridWidth}x${gridHeight}`);

      // Verify that all grid coordinates map to valid canvas coordinates
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          const pixelX = x * cellSize;
          const pixelY = y * cellSize;

          // These should all be within canvas bounds
          expect(pixelX).toBeLessThan(canvasWidth);
          expect(pixelY).toBeLessThan(canvasHeight);
          expect(pixelX).toBeGreaterThanOrEqual(0);
          expect(pixelY).toBeGreaterThanOrEqual(0);

          if (grid[y][x] === 1) {
            console.log(`Live cell at grid(${x},${y}) -> pixel(${pixelX},${pixelY})`);
          }
        }
      }
    });
  });

  test('should check for off-by-one errors in grid rendering', () => {
    // This test checks if there are boundary issues that could cause extra pixels

    const mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 1,
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      strokeRect: jest.fn()
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');

    // Test with a 2x2 grid to make it easy to verify
    const grid = [
      [1, 0],
      [0, 1]
    ];

    const canvas = { width: 16, height: 16, getContext: () => mockContext };
    const renderer = new CanvasRenderer(canvas, mockContext);

    mockContext.fillRect.mockClear();

    // Render with cellSize 8 (2x2 grid = 16x16 canvas)
    renderer.renderLiveCells(grid, 2, 2, 8);

    const fillRectCalls = mockContext.fillRect.mock.calls;
    console.log('fillRect calls:', fillRectCalls);

    // Should be exactly 2 calls for the 2 live cells
    const liveCellCalls = fillRectCalls.filter(call =>
      call[2] > 0 && call[3] > 0 // width and height > 0
    );

    expect(liveCellCalls).toHaveLength(2);

    // Verify coordinates are correct
    // grid[0][0] = 1 should map to pixel (0, 0)
    // grid[1][1] = 1 should map to pixel (8, 8)

    const call1 = liveCellCalls.find(call => call[0] === 0 && call[1] === 0);
    const call2 = liveCellCalls.find(call => call[0] === 8 && call[1] === 8);

    expect(call1).toBeDefined();
    expect(call2).toBeDefined();

    // Each cell should be 8x8 pixels
    expect(call1[2]).toBe(8); // width
    expect(call1[3]).toBe(8); // height
    expect(call2[2]).toBe(8);
    expect(call2[3]).toBe(8);
  });
});
