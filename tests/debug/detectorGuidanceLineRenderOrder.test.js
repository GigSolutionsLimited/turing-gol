/**
 * Test to verify that detectors are never obscured by guidance lines
 * This addresses the user-reported issue where guidance lines were hiding detector pixels
 */

describe('Detector-Guidance Line Rendering Order Fix', () => {
  test('should render detectors last to ensure they are never obscured by guidance lines', () => {
    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');

    // Track the rendering order
    const renderCalls = [];

    const mockRenderer = {
      renderGrid: jest.fn(() => renderCalls.push('grid')),
      renderLiveCells: jest.fn(() => renderCalls.push('liveCells')),
      renderGuidanceLines: jest.fn(() => renderCalls.push('guidanceLines')),
      renderChallengePattern: jest.fn(() => renderCalls.push('challengePattern')),
      renderEditorOverlays: jest.fn(() => renderCalls.push('editorOverlays')),
      renderDetectors: jest.fn(() => renderCalls.push('detectors')),
      markDirty: jest.fn(),
      getDirtyRegions: jest.fn().mockReturnValue([]),
      clearDirtyRegions: jest.fn(),
      ctx: {
        fillStyle: '',
        fillRect: jest.fn()
      },
      canvas: { width: 500, height: 500 }
    };

    // Bind renderOptimized to our mock renderer
    const renderOptimized = CanvasRenderer.prototype.renderOptimized.bind(mockRenderer);

    const grid = [[1, 0], [0, 1]];
    const renderOptions = {
      cellSize: 8,
      detectorRenderData: [{
        positions: [{ x: 0, y: 0 }],
        currentValue: 1,
        isChallenge: false
      }],
      guidanceLinePixels: [
        [0, 0, 'guidanceColor1'] // Same position as detector
      ]
    };

    // Execute the rendering
    renderOptimized(grid, null, renderOptions);

    // Verify detectors render last
    expect(renderCalls[renderCalls.length - 1]).toBe('detectors');

    // Verify guidance lines render before detectors
    const guidanceIndex = renderCalls.indexOf('guidanceLines');
    const detectorIndex = renderCalls.indexOf('detectors');

    expect(guidanceIndex).toBeLessThan(detectorIndex);
    expect(detectorIndex).toBe(renderCalls.length - 1);

    // Verify both methods were called when data is provided
    expect(mockRenderer.renderGuidanceLines).toHaveBeenCalledWith(renderOptions.guidanceLinePixels, 8);
    expect(mockRenderer.renderDetectors).toHaveBeenCalledWith(renderOptions.detectorRenderData, 8);
  });

  test('should still render detectors when only detectors are present (no guidance lines)', () => {
    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');

    const renderCalls = [];

    const mockRenderer = {
      renderGrid: jest.fn(() => renderCalls.push('grid')),
      renderLiveCells: jest.fn(() => renderCalls.push('liveCells')),
      renderGuidanceLines: jest.fn(() => renderCalls.push('guidanceLines')),
      renderChallengePattern: jest.fn(() => renderCalls.push('challengePattern')),
      renderEditorOverlays: jest.fn(() => renderCalls.push('editorOverlays')),
      renderDetectors: jest.fn(() => renderCalls.push('detectors')),
      markDirty: jest.fn(),
      getDirtyRegions: jest.fn().mockReturnValue([]),
      clearDirtyRegions: jest.fn(),
      ctx: {
        fillStyle: '',
        fillRect: jest.fn()
      },
      canvas: { width: 500, height: 500 }
    };

    const renderOptimized = CanvasRenderer.prototype.renderOptimized.bind(mockRenderer);

    const grid = [[1, 0], [0, 1]];
    const renderOptions = {
      cellSize: 8,
      detectorRenderData: [{
        positions: [{ x: 1, y: 1 }],
        currentValue: 0,
        isChallenge: true,
        targetState: 1
      }]
      // No guidanceLinePixels provided
    };

    renderOptimized(grid, null, renderOptions);

    // Verify detectors still render last
    expect(renderCalls[renderCalls.length - 1]).toBe('detectors');

    // Verify guidance lines method was not called when no data provided
    expect(mockRenderer.renderGuidanceLines).not.toHaveBeenCalled();

    // Verify detectors method was called
    expect(mockRenderer.renderDetectors).toHaveBeenCalledWith(renderOptions.detectorRenderData, 8);
  });

  test('should handle edge case where both detectors and guidance lines exist at same coordinates', () => {
    const { CanvasRenderer } = require('../../src/utils/canvasRenderer.js');

    // This test verifies that the rendering order ensures detectors will overwrite
    // any guidance lines that might be at the same coordinates

    const renderCalls = [];

    const mockRenderer = {
      renderGrid: jest.fn(() => renderCalls.push('grid')),
      renderLiveCells: jest.fn(() => renderCalls.push('liveCells')),
      renderGuidanceLines: jest.fn(() => renderCalls.push('guidanceLines')),
      renderChallengePattern: jest.fn(() => renderCalls.push('challengePattern')),
      renderEditorOverlays: jest.fn(() => renderCalls.push('editorOverlays')),
      renderDetectors: jest.fn(() => renderCalls.push('detectors')),
      markDirty: jest.fn(),
      getDirtyRegions: jest.fn().mockReturnValue([]),
      clearDirtyRegions: jest.fn(),
      ctx: {
        fillStyle: '',
        fillRect: jest.fn()
      },
      canvas: { width: 500, height: 500 }
    };

    const renderOptimized = CanvasRenderer.prototype.renderOptimized.bind(mockRenderer);

    const grid = [[0, 0], [0, 0]]; // Empty grid

    // Create scenario where detector and guidance line are at exact same position
    const renderOptions = {
      cellSize: 8,
      detectorRenderData: [{
        positions: [{ x: 1, y: 1 }], // Position (1,1)
        currentValue: 1,
        isChallenge: false
      }],
      guidanceLinePixels: [
        [1, 1, 'guidanceColor1'] // Same position (1,1)
      ]
    };

    renderOptimized(grid, null, renderOptions);

    // The key insight: since detectors render AFTER guidance lines,
    // the detector pixel will overwrite the guidance line pixel at (1,1)

      expect(renderCalls).toEqual([
        'grid',
        'guidanceLines',    // Renders first - paints the pixel
        'liveCells',        // Renders after guidance lines
        'challengePattern',
        'editorOverlays',
        'detectors',        // Renders last - overwrites the guidance line pixel at (1,1)
      ]);

    // Both methods should have been called with their respective data
    expect(mockRenderer.renderGuidanceLines).toHaveBeenCalledWith(renderOptions.guidanceLinePixels, 8);
    expect(mockRenderer.renderDetectors).toHaveBeenCalledWith(renderOptions.detectorRenderData, 8);
  });
});
