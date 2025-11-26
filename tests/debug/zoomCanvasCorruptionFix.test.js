/**
 * Test to reproduce and fix the zoom canvas corruption bug
 * This addresses the issue where zooming causes extra pixels to appear
 */

describe('Zoom Canvas Corruption Bug Fix', () => {
  test('should not show extra pixels when canvas dimensions change during zoom', () => {
    // Simulate the issue: canvas size changes but renderer has stale state

    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: jest.fn(() => ({
        fillStyle: '',
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        strokeStyle: '',
        lineWidth: 1,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        setLineDash: jest.fn(),
        strokeRect: jest.fn(),
        imageSmoothingEnabled: false,
        createImageData: jest.fn(() => ({
          width: 400,
          height: 400,
          data: new Uint8ClampedArray(400 * 400 * 4)
        })),
        putImageData: jest.fn()
      }))
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');
    const renderer = new CanvasRenderer(mockCanvas, mockCanvas.getContext());

    // Create a simple grid with a few live cells
    const originalGrid = [
      [0, 0, 0, 0, 0],
      [0, 1, 1, 0, 0],
      [0, 1, 1, 0, 0], // 2x2 block
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0]
    ];

    // Render at original size (cellSize = 8)
    const renderOptions1 = { cellSize: 8 };
    renderer.renderOptimized(originalGrid, null, renderOptions1);

    // Simulate zoom change - canvas dimensions change
    mockCanvas.width = 200;  // Smaller canvas for zoom in
    mockCanvas.height = 200;

    // Render at new size (cellSize = 4)
    const renderOptions2 = { cellSize: 4 };
    renderer.renderOptimized(originalGrid, null, renderOptions2);

    // The renderer should handle canvas size changes correctly
    // Verify that canvas size tracking is updated
    expect(renderer.lastCanvasWidth).toBe(200);
    expect(renderer.lastCanvasHeight).toBe(200);

    // Verify that lastGrid is reset to force full redraw
    // This should prevent stale rendering artifacts
    expect(renderer.lastGrid).toBeNull();
  });

  test('should clear ImageData cache when canvas size changes', () => {
    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: jest.fn(() => ({
        fillStyle: '',
        fillRect: jest.fn(),
        createImageData: jest.fn((w, h) => ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4)
        })),
        putImageData: jest.fn()
      }))
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');
    const renderer = new CanvasRenderer(mockCanvas, mockCanvas.getContext());

    // Create ImageData for original size
    renderer.renderWithImageData([], { width: 400, height: 400, cellSize: 8 });
    const originalImageData = renderer.imageData;

    // Change canvas size and create new ImageData
    mockCanvas.width = 800;
    mockCanvas.height = 800;
    renderer.renderWithImageData([], { width: 800, height: 800, cellSize: 4 });

    // ImageData should be recreated for new dimensions
    expect(renderer.imageData).not.toBe(originalImageData);
    expect(renderer.imageData.width).toBe(800);
    expect(renderer.imageData.height).toBe(800);
  });

  test('should handle grid-to-pixel mapping correctly after zoom', () => {
    const mockContext = {
      fillStyle: '',
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 1,
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      strokeRect: jest.fn()
    };

    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: () => mockContext
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');
    const renderer = new CanvasRenderer(mockCanvas, mockContext);

    // Simple 3x3 grid with center cell alive
    const grid = [
      [0, 0, 0],
      [0, 1, 0],
      [0, 0, 0]
    ];

    // Render at cellSize 8
    mockContext.fillRect.mockClear();
    renderer.renderOptimized(grid, null, { cellSize: 8 });

    // Find calls that draw the live cell
    const liveCellCalls = mockContext.fillRect.mock.calls.filter(call => {
      // Look for calls with white color (after setting fillStyle to 'white')
      // We can't easily check fillStyle in mock, but we can check call parameters
      return call[2] > 0 && call[3] > 0; // width and height > 0
    });

    // Should have at least one call for the live cell (plus background clearing)
    expect(liveCellCalls.length).toBeGreaterThan(0);

    // Now zoom in (larger cellSize)
    mockContext.fillRect.mockClear();
    renderer.renderOptimized(grid, null, { cellSize: 16 });

    const liveCellCallsAfterZoom = mockContext.fillRect.mock.calls.filter(call => {
      return call[2] > 0 && call[3] > 0; // width and height > 0
    });

    // Should still have the same number of live cells rendered
    expect(liveCellCallsAfterZoom.length).toBeGreaterThanOrEqual(liveCellCalls.length);

    // Key insight: The number of live cells should not change due to zoom
    // Only their size and position should change
  });

  test('should properly reset renderer state during canvas recreation', () => {
    // This simulates what happens in GameCanvas when cellSize changes

    const createMockCanvas = (width, height) => ({
      width,
      height,
      getContext: jest.fn(() => ({
        fillStyle: '',
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        imageSmoothingEnabled: false
      }))
    });

    const { createOptimizedRenderer } = require('../../src/utils/canvasRenderer.js');

    // Create first renderer
    const canvas1 = createMockCanvas(400, 400);
    const renderer1 = createOptimizedRenderer(canvas1);

    // Simulate some state in the first renderer
    renderer1.markDirty(0, 0, 5, 5);
    expect(renderer1.dirtyRegions.size).toBe(1);

    // Create second renderer (simulates cellSize change)
    const canvas2 = createMockCanvas(800, 800);
    const renderer2 = createOptimizedRenderer(canvas2);

    // Second renderer should have clean state
    expect(renderer2.dirtyRegions.size).toBe(0);
    expect(renderer2.lastGrid).toBeNull();
    expect(renderer2.imageData).toBeNull();

    // Canvas dimensions should be correctly tracked
    expect(renderer2.lastCanvasWidth).toBe(800);
    expect(renderer2.lastCanvasHeight).toBe(800);
  });
});
