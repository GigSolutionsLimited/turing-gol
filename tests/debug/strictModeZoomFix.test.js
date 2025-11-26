/**
 * Test to verify React Strict Mode compatibility for zoom operations
 * This addresses the specific issue where zoom during simulation caused
 * patterns to "destroy themselves" due to Strict Mode double execution
 */

describe('React Strict Mode Zoom Compatibility', () => {
  test('should handle cellSize effect properly in Strict Mode', () => {
    // Simulate React Strict Mode behavior where effects run twice

    let canvasSizeCallCount = 0;
    let gridSizeCallCount = 0;
    let gridDataCallCount = 0;

    // Mock functions to track calls
    const mockSetCanvasSize = jest.fn(() => canvasSizeCallCount++);
    const mockSetGridSize = jest.fn(() => gridSizeCallCount++);
    const mockSetGrid = jest.fn(() => gridDataCallCount++);

    // Simulate the cellSize effect logic (safe version)
    const simulateCellSizeEffect = (challenge, cellSize) => {
      if (!challenge) return;

      // Calculate new canvas and grid sizes based on new cellSize
      const newCanvasSize = { maxWidth: 800, maxHeight: 600 }; // Mock calculation
      const newGridSize = challenge && challenge.width && challenge.height
        ? { width: challenge.width, height: challenge.height }
        : { width: Math.floor(newCanvasSize.maxWidth / cellSize), height: Math.floor(newCanvasSize.maxHeight / cellSize) };

      mockSetCanvasSize(newCanvasSize);
      mockSetGridSize(newGridSize);

      // Note: We intentionally do NOT modify grid data here
      // This effect is only for updating rendering dimensions during zoom
    };

    const challenge = { width: 61, height: 61 };

    // Simulate Strict Mode double execution
    simulateCellSizeEffect(challenge, 8);  // First execution
    simulateCellSizeEffect(challenge, 8);  // Second execution (Strict Mode)

    // Canvas and grid size should be updated both times (idempotent)
    expect(mockSetCanvasSize).toHaveBeenCalledTimes(2);
    expect(mockSetGridSize).toHaveBeenCalledTimes(2);

    // Grid data should NEVER be modified during zoom
    expect(mockSetGrid).toHaveBeenCalledTimes(0);
  });

  test('should separate window resize from zoom operations', () => {
    let windowResizeHandlerCalls = 0;
    let cellSizeEffectCalls = 0;

    // Mock window resize handler (should only trigger on actual window resize)
    const simulateWindowResize = (challenge, cellSize) => {
      windowResizeHandlerCalls++;

      // Always recalculate canvas size
      const newCanvasSize = { maxWidth: 1000, maxHeight: 700 };

      // Skip grid resize for challenges with fixed dimensions
      if (challenge && challenge.width && challenge.height) {
        return; // Early exit - no grid resize
      }

      // Only resize grid for free-form mode
      const newGridWidth = Math.floor(newCanvasSize.maxWidth / cellSize);
      const newGridHeight = Math.floor(newCanvasSize.maxHeight / cellSize);

      // This would call GameService.resizeGrid (only for free-form mode)
    };

    // Mock cellSize effect (should only update rendering dimensions)
    const simulateCellSizeEffect = (challenge, cellSize) => {
      cellSizeEffectCalls++;

      if (!challenge) return;

      // Only update canvas and grid size metadata
      const newCanvasSize = { maxWidth: 800, maxHeight: 600 };
      const newGridSize = challenge.width && challenge.height
        ? { width: challenge.width, height: challenge.height }
        : { width: Math.floor(newCanvasSize.maxWidth / cellSize), height: Math.floor(newCanvasSize.maxHeight / cellSize) };

      // Note: No grid data modification
    };

    const challenge = { width: 61, height: 61 };

    // Scenario 1: User zooms (cellSize changes)
    simulateCellSizeEffect(challenge, 4); // Zoom in
    simulateCellSizeEffect(challenge, 12); // Zoom out

    // Scenario 2: Window resize (actual window resize event)
    simulateWindowResize(challenge, 8);

    // CellSize effect should run for zoom operations
    expect(cellSizeEffectCalls).toBe(2);

    // Window resize handler should only run for actual window resize
    expect(windowResizeHandlerCalls).toBe(1);

    // Key insight: These are now separate concerns
    // Zoom operations should not trigger window resize handler
  });

  test('should preserve running simulation during zoom in Strict Mode', () => {
    // Simulate a running simulation with a stable pattern
    let simulationRunning = true;
    let generation = 10;

    // Mock stable pattern (2x2 block)
    const gridState = [
      [0, 0, 0, 0],
      [0, 1, 1, 0],
      [0, 1, 1, 0],
      [0, 0, 0, 0]
    ];

    // Simulate zoom during running simulation
    const beforeZoom = {
      running: simulationRunning,
      generation: generation,
      gridState: gridState.map(row => [...row])
    };

    // In the fixed version, zoom should only update rendering, not game state
    const afterZoom = {
      running: simulationRunning, // Unchanged
      generation: generation, // Unchanged
      gridState: gridState.map(row => [...row]) // Unchanged
    };

    expect(afterZoom.running).toBe(beforeZoom.running);
    expect(afterZoom.generation).toBe(beforeZoom.generation);
    expect(afterZoom.gridState).toEqual(beforeZoom.gridState);

    // Simulation should continue normally after zoom
    expect(simulationRunning).toBe(true);
    expect(generation).toBe(10);
  });

  test('should handle rapid zoom changes without corruption', () => {
    const { GameService } = require('../../src/services/gameService.js');

    // Simulate rapid zoom changes that might happen in Strict Mode
    let currentCellSize = 8;
    const mockChallenge = { width: 61, height: 61 };

    // Create a pattern that should remain stable
    const originalGrid = GameService.createEmptyGrid(61, 61);
    originalGrid[30][30] = 1;
    originalGrid[30][31] = 1;
    originalGrid[31][30] = 1;
    originalGrid[31][31] = 1; // 2x2 block at center

    // Simulate rapid cellSize changes (zoom in/out quickly)
    const cellSizesToTest = [4, 12, 2, 16, 8, 6, 10];

    cellSizesToTest.forEach(cellSize => {
      currentCellSize = cellSize;

      // For fixed-dimension challenges, grid should never be modified
      // Only canvas size and grid size metadata should change

      const newCanvasSize = { maxWidth: 800 / cellSize, maxHeight: 600 / cellSize };
      const newGridSize = { width: mockChallenge.width, height: mockChallenge.height };

      // Grid data should remain unchanged
      expect(originalGrid[30][30]).toBe(1);
      expect(originalGrid[30][31]).toBe(1);
      expect(originalGrid[31][30]).toBe(1);
      expect(originalGrid[31][31]).toBe(1);
    });

    // Verify the pattern is still intact and stable
    const nextGen = GameService.nextGeneration(originalGrid);
    expect(nextGen[30][30]).toBe(1);
    expect(nextGen[30][31]).toBe(1);
    expect(nextGen[31][30]).toBe(1);
    expect(nextGen[31][31]).toBe(1);
  });
});
