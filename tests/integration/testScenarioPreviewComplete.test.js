/**
 * End-to-End Test for Test Scenario Preview Functionality
 * Tests the complete integration of test scenario preview patterns from logic to rendering
 */

import { CanvasRenderer } from '../../src/utils/canvasRenderer';

describe('Test Scenario Preview End-to-End', () => {
  let canvas, context, renderer;

  beforeEach(() => {
    // Create a mock canvas
    canvas = {
      width: 400,
      height: 400,
      getContext: jest.fn()
    };

    // Create a mock context
    context = {
      fillStyle: '',
      fillRect: jest.fn(),
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setLineDash: jest.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    };

    canvas.getContext.mockReturnValue(context);

    // Create renderer
    renderer = new CanvasRenderer(canvas, context);
  });

  test('should render test scenario preview patterns as gold pixels', () => {
    const testScenarioPreviewPatterns = [
      { x: 10, y: 5, scenario: 'Test 1', brush: 'pattern1' },
      { x: 15, y: 8, scenario: 'Test 1', brush: 'pattern1' },
      { x: 20, y: 12, scenario: 'Test 2', brush: 'pattern2' }
    ];

    const cellSize = 8;

    // Call the render method
    renderer.renderTestScenarioPreviewPatterns(testScenarioPreviewPatterns, cellSize);

    // Verify that fillStyle was set to gold
    expect(context.fillStyle).toBe('#FFD700');

    // Verify that fillRect was called for each pattern
    expect(context.fillRect).toHaveBeenCalledTimes(3);

    // Verify the coordinates are correct (pixel coordinates = grid coordinates * cellSize)
    expect(context.fillRect).toHaveBeenCalledWith(80, 40, 8, 8);   // 10*8, 5*8
    expect(context.fillRect).toHaveBeenCalledWith(120, 64, 8, 8);  // 15*8, 8*8
    expect(context.fillRect).toHaveBeenCalledWith(160, 96, 8, 8);  // 20*8, 12*8
  });

  test('should handle small cell sizes with pixel-perfect rendering', () => {
    const testScenarioPreviewPatterns = [
      { x: 5, y: 3, scenario: 'Test', brush: 'pattern' }
    ];

    const smallCellSize = 2;

    renderer.renderTestScenarioPreviewPatterns(testScenarioPreviewPatterns, smallCellSize);

    expect(context.fillStyle).toBe('#FFD700');
    expect(context.fillRect).toHaveBeenCalledWith(10, 6, 2, 2); // 5*2, 3*2, cellSize, cellSize
  });

  test('should handle very small cell sizes with minimum 1px rendering', () => {
    const testScenarioPreviewPatterns = [
      { x: 7, y: 4, scenario: 'Test', brush: 'pattern' }
    ];

    const verySmallCellSize = 0.5;

    renderer.renderTestScenarioPreviewPatterns(testScenarioPreviewPatterns, verySmallCellSize);

    expect(context.fillStyle).toBe('#FFD700');

    // For very small cells, should use Math.round and Math.max(1, ...)
    // Math.round(7 * 0.5) = Math.round(3.5) = 4
    // Math.round(4 * 0.5) = Math.round(2) = 2
    // Math.max(1, Math.round(0.5)) = Math.max(1, 1) = 1
    expect(context.fillRect).toHaveBeenCalledWith(4, 2, 1, 1);
  });

  test('should handle empty pattern array gracefully', () => {
    const emptyPatterns = [];

    renderer.renderTestScenarioPreviewPatterns(emptyPatterns, 8);

    // Should not call fillRect if there are no patterns
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  test('should handle undefined pattern array gracefully', () => {
    renderer.renderTestScenarioPreviewPatterns(undefined, 8);

    // Should not call fillRect if patterns is undefined
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  test('should handle null pattern array gracefully', () => {
    renderer.renderTestScenarioPreviewPatterns(null, 8);

    // Should not call fillRect if patterns is null
    expect(context.fillRect).not.toHaveBeenCalled();
  });

  test('should integrate with main rendering pipeline', () => {
    const grid = [[0, 0], [0, 0]];
    const testScenarioPreviewPatterns = [
      { x: 0, y: 0, scenario: 'Test', brush: 'pattern' }
    ];

    const renderOptions = {
      cellSize: 8,
      testScenarioPreviewPatterns,
      guidanceLinePixels: [],
      detectorRenderData: [],
      challenge: null,
      selectedPattern: null,
      hoverCell: null,
      pasting: false,
      isEditableCell: () => true,
      adminMode: false
    };

    // Mock the canvas methods that would be called in optimized rendering
    context.clearRect = jest.fn();

    // Spy on our specific render method to verify it's called
    const renderSpy = jest.spyOn(renderer, 'renderTestScenarioPreviewPatterns');

    // Call the main render method
    renderer.renderOptimized(grid, null, renderOptions);

    // Verify that our render method was called with the correct parameters
    expect(renderSpy).toHaveBeenCalledWith(testScenarioPreviewPatterns, 8);

    // Verify that the method was called once
    expect(renderSpy).toHaveBeenCalledTimes(1);
  });
});
