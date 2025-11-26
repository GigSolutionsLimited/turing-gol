// Unit tests for canvas renderer
import { CanvasRenderer } from '../../src/utils/canvasRenderer.js';

// Mock canvas and context
const createMockCanvas = () => ({
  width: 400,
  height: 400,
  getContext: jest.fn(() => ({
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    imageSmoothingEnabled: false,
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    setLineDash: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    createImageData: jest.fn(() => ({
      width: 400,
      height: 400,
      data: new Uint8ClampedArray(400 * 400 * 4)
    })),
    putImageData: jest.fn()
  }))
});

describe('CanvasRenderer', () => {
  let canvas, ctx, renderer;

  beforeEach(() => {
    canvas = createMockCanvas();
    ctx = canvas.getContext('2d');
    renderer = new CanvasRenderer(canvas, ctx);
  });

  describe('renderEditorOverlays', () => {
    test('should render editable area when not in admin mode', () => {
      const mockIsEditableCell = jest.fn((x, y) => {
        // Mock editable area: 2x2 square at top-left
        return x < 2 && y < 2;
      });

      renderer.renderEditorOverlays(
        null,        // selectedPattern
        null,        // hoverCell
        false,       // pasting
        mockIsEditableCell,
        false,       // adminMode
        10,          // gridWidth
        10           // gridHeight
      );

      // Should call isEditableCell for each grid position twice (area + border detection)
      expect(mockIsEditableCell).toHaveBeenCalledTimes(200); // 10x10 grid x2

      // Should draw editable area background
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 8, 8); // First cell
      expect(ctx.fillRect).toHaveBeenCalledWith(8, 0, 8, 8); // Second cell
      expect(ctx.fillRect).toHaveBeenCalledWith(0, 8, 8, 8); // Third cell
      expect(ctx.fillRect).toHaveBeenCalledWith(8, 8, 8, 8); // Fourth cell

      // Should draw border
      expect(ctx.strokeRect).toHaveBeenCalledWith(1, 1, 14, 14); // Border around 2x2 area
    });

    test('should not render editable area in admin mode', () => {
      const mockIsEditableCell = jest.fn((x, y) => true);

      renderer.renderEditorOverlays(
        null,        // selectedPattern
        null,        // hoverCell
        false,       // pasting
        mockIsEditableCell,
        true,        // adminMode
        5,           // gridWidth
        5            // gridHeight
      );

      // Should not call isEditableCell in admin mode
      expect(mockIsEditableCell).not.toHaveBeenCalled();

      // Should not draw any editable area background
      expect(ctx.fillStyle).not.toBe('rgba(0, 100, 200, 0.1)');
    });

    test('should render paste preview when pasting', () => {
      const selectedPattern = {
        name: 'testPattern',
        pattern: [[0, 0], [0, 1], [1, 0]]
      };

      const hoverCell = { x: 5, y: 5 };
      const mockIsEditableCell = jest.fn(() => true);

      renderer.renderEditorOverlays(
        selectedPattern,
        hoverCell,
        true,        // pasting
        mockIsEditableCell,
        false,       // adminMode
        10,          // gridWidth
        10           // gridHeight
      );

      // Should render pattern preview at hover position
      expect(ctx.fillRect).toHaveBeenCalledWith(40, 40, 8, 8); // (5,5)
      expect(ctx.fillRect).toHaveBeenCalledWith(48, 40, 8, 8); // (6,5)
      expect(ctx.fillRect).toHaveBeenCalledWith(40, 48, 8, 8); // (5,6)
    });

    test('should render eraser preview with different color', () => {
      const eraserPattern = {
        name: 'eraser3x3',
        pattern: [[0, 0]]
      };

      const hoverCell = { x: 3, y: 3 };
      const mockIsEditableCell = jest.fn(() => true);

      renderer.renderEditorOverlays(
        eraserPattern,
        hoverCell,
        true,        // pasting
        mockIsEditableCell,
        false,       // adminMode
        10,          // gridWidth
        10           // gridHeight
      );

      // Should use red color for eraser
      expect(ctx.fillStyle).toBe('rgba(255, 100, 100, 0.7)');
    });

    test('should respect editable area when pasting', () => {
      const pattern = {
        name: 'testPattern',
        pattern: [[0, 0], [0, 1], [0, 2]]
      };

      const hoverCell = { x: 8, y: 5 };
      const mockIsEditableCell = jest.fn((x, y) => x < 9); // Only left 9 columns editable

      renderer.renderEditorOverlays(
        pattern,
        hoverCell,
        true,        // pasting
        mockIsEditableCell,
        false,       // adminMode
        10,          // gridWidth
        10           // gridHeight
      );

      // Should render only editable cells
      expect(ctx.fillRect).toHaveBeenCalledWith(64, 40, 8, 8); // (8,5) - editable
      expect(ctx.fillRect).not.toHaveBeenCalledWith(80, 40, 8, 8); // (10,5) - would be out of bounds
    });
  });

  describe('markDirty and getDirtyRegions', () => {
    test('should track dirty regions', () => {
      renderer.markDirty(1, 2, 2, 3);
      renderer.markDirty(5, 6);

      const regions = renderer.getDirtyRegions();

      expect(regions).toHaveLength(2);
      expect(regions[0]).toEqual({
        gridX: 1, gridY: 2, gridWidth: 2, gridHeight: 3,
        pixelX: 8, pixelY: 16, pixelWidth: 16, pixelHeight: 24
      });
      expect(regions[1]).toEqual({
        gridX: 5, gridY: 6, gridWidth: 1, gridHeight: 1,
        pixelX: 40, pixelY: 48, pixelWidth: 8, pixelHeight: 8
      });
    });

    test('should clear dirty regions', () => {
      renderer.markDirty(1, 1);
      expect(renderer.getDirtyRegions()).toHaveLength(1);

      renderer.clearDirtyRegions();
      expect(renderer.getDirtyRegions()).toHaveLength(0);
    });
  });

  describe('renderOptimized', () => {
    test('should detect grid changes and mark dirty regions', () => {
      const grid = [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0]
      ];

      const previousGrid = [
        [0, 0, 0],
        [1, 0, 1],
        [0, 1, 0]
      ];

      const renderOptions = {
        challenge: null,
        selectedPattern: null,
        hoverCell: null,
        pasting: false,
        isEditableCell: () => true,
        adminMode: true
      };

      // Spy on markDirty to verify it's called
      const markDirtySpy = jest.spyOn(renderer, 'markDirty');

      renderer.renderOptimized(grid, previousGrid, renderOptions);

      // Should have called markDirty for changed cell at (1,0)
      expect(markDirtySpy).toHaveBeenCalledWith(1, 0);

      markDirtySpy.mockRestore();
    });

    test('should force full redraw when showing editable area', () => {
      const grid = [
        [0, 1],
        [1, 0]
      ];

      const previousGrid = [
        [0, 0],
        [1, 0]
      ]; // Different from grid to trigger changes

      const renderOptions = {
        challenge: null,
        selectedPattern: null,
        hoverCell: null,
        pasting: false,
        isEditableCell: () => true,
        adminMode: false // Non-admin mode should trigger editable area
      };

      const spy = jest.spyOn(ctx, 'fillRect');
      renderer.renderOptimized(grid, previousGrid, renderOptions);

      // Should clear entire canvas (simplified clearing logic always clears full canvas)
      expect(spy).toHaveBeenCalledWith(0, 0, 400, 400); // Full canvas clear (canvas.width x canvas.height)
    });
  });
});
