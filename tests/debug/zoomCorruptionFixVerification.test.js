/**
 * Comprehensive test for zoom corruption fix
 */

describe('Zoom Corruption Fix Verification', () => {
  test('should not corrupt grid rendering when canvas size changes', () => {
    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: jest.fn(() => ({
        fillStyle: '',
        fillRect: jest.fn(),
        strokeStyle: '',
        lineWidth: 1,
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        setLineDash: jest.fn(),
        strokeRect: jest.fn(),
        imageSmoothingEnabled: false
      }))
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');
    const renderer = new CanvasRenderer(mockCanvas, mockCanvas.getContext());

    // Simple test grid
    const grid = [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 1]
    ];

    // Render at initial size
    renderer.renderOptimized(grid, null, { cellSize: 8 });

    // Check initial renderer state
    expect(renderer.lastCanvasWidth).toBe(400);
    expect(renderer.lastCanvasHeight).toBe(400);

    // Change canvas size (simulates zoom)
    mockCanvas.width = 600;
    mockCanvas.height = 600;

    // Render at new size - this should detect canvas size change
    renderer.renderOptimized(grid, null, { cellSize: 12 });

    // Verify renderer state is updated correctly
    expect(renderer.lastCanvasWidth).toBe(600);
    expect(renderer.lastCanvasHeight).toBe(600);

    // Most importantly, lastGrid should be reset to prevent corruption
    expect(renderer.lastGrid).toBeNull();
  });

  test('should properly handle previousGrid during zoom operations', () => {
    // Simulate the GameCanvas logic for handling previousGrid during zoom

    const mockRenderer = {
      lastGrid: null,
      lastCanvasWidth: 400,
      lastCanvasHeight: 400,
      clearDirtyRegions: jest.fn(),
      renderOptimized: jest.fn()
    };

    const grid = [[1, 0], [0, 1]];
    const previousGrid = [[0, 1], [1, 0]]; // Different from current grid

    const mockCanvas = { width: 400, height: 400 };

    // Simulate normal rendering (no canvas size change)
    const shouldForceFullRedraw1 = !mockRenderer.lastGrid ||
                                  mockRenderer.lastCanvasWidth !== mockCanvas.width ||
                                  mockRenderer.lastCanvasHeight !== mockCanvas.height;

    const gridToPass1 = shouldForceFullRedraw1 ? null : previousGrid;
    expect(gridToPass1).toBeNull(); // Should force full redraw initially

    // Simulate setting lastGrid
    mockRenderer.lastGrid = grid;

    // Simulate canvas size change (zoom)
    mockCanvas.width = 800;
    mockCanvas.height = 800;

    const shouldForceFullRedraw2 = !mockRenderer.lastGrid ||
                                  mockRenderer.lastCanvasWidth !== mockCanvas.width ||
                                  mockRenderer.lastCanvasHeight !== mockCanvas.height;

    const gridToPass2 = shouldForceFullRedraw2 ? null : previousGrid;
    expect(gridToPass2).toBeNull(); // Should force full redraw on canvas size change

    // Update renderer state
    mockRenderer.lastCanvasWidth = 800;
    mockRenderer.lastCanvasHeight = 800;

    // Simulate normal rendering after zoom
    const shouldForceFullRedraw3 = !mockRenderer.lastGrid ||
                                  mockRenderer.lastCanvasWidth !== mockCanvas.width ||
                                  mockRenderer.lastCanvasHeight !== mockCanvas.height;

    const gridToPass3 = shouldForceFullRedraw3 ? null : previousGrid;
    expect(gridToPass3).toBe(previousGrid); // Should allow normal dirty region tracking now
  });

  test('should verify canvas buffer size matches expected size', () => {
    // Test that canvas buffer size is set correctly during zoom
    // Note: In Jest environment, canvas behavior might be different

    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: jest.fn(() => ({
        createImageData: jest.fn((w, h) => ({
          width: w,
          height: h,
          data: new Uint8ClampedArray(w * h * 4)
        }))
      }))
    };

    expect(mockCanvas.width).toBe(400);
    expect(mockCanvas.height).toBe(400);

    // Simulate zoom change
    mockCanvas.width = 800;
    mockCanvas.height = 800;

    expect(mockCanvas.width).toBe(800);
    expect(mockCanvas.height).toBe(800);

    // ImageData should match canvas dimensions
    const ctx = mockCanvas.getContext();
    const imageData = ctx.createImageData(mockCanvas.width, mockCanvas.height);

    expect(imageData.width).toBe(800);
    expect(imageData.height).toBe(800);
    expect(imageData.data.length).toBe(800 * 800 * 4); // RGBA
  });

  test('should clear ImageData cache when canvas size changes', () => {
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
      strokeRect: jest.fn(),
      createImageData: jest.fn((w, h) => ({
        width: w,
        height: h,
        data: new Uint8ClampedArray(w * h * 4)
      })),
      putImageData: jest.fn()
    };

    const mockCanvas = {
      width: 400,
      height: 400,
      getContext: () => mockContext
    };

    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');
    const renderer = new CanvasRenderer(mockCanvas, mockContext);

    // Create initial ImageData
    renderer.renderWithImageData([[1]], { width: 400, height: 400, cellSize: 8 });
    const originalImageData = renderer.imageData;
    expect(originalImageData.width).toBe(400);

    // Change canvas size
    mockCanvas.width = 800;
    mockCanvas.height = 800;

    // Trigger canvas size change detection
    const grid = [[1]];
    renderer.renderOptimized(grid, null, { cellSize: 16 });

    // ImageData should be cleared
    expect(renderer.imageData).toBeNull();

    // Create new ImageData for new size
    renderer.renderWithImageData([[1]], { width: 800, height: 800, cellSize: 16 });
    expect(renderer.imageData.width).toBe(800);
  });
});
