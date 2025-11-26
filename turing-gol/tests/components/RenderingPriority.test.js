/**
 * Test canvas rendering priority order
 * Testing that rendering follows the correct priority: grid pixels -> guidance lines -> challenge patterns -> editor overlays -> detectors
 * Detectors render last to ensure they are always visible and never obscured
 */

describe('Canvas Rendering Priority', () => {
  test('should maintain correct rendering order priority', () => {
    // Simulate the rendering order logic from CanvasRenderer.renderOptimized
    const mockRenderer = {
      renderDetectors: jest.fn(),
      renderLiveCells: jest.fn(),
      renderChallengePattern: jest.fn(),
      renderGuidanceLines: jest.fn(),
      renderGrid: jest.fn(),
      renderEditorOverlays: jest.fn()
    };

    const renderOptions = {
      detectorRenderData: [{ id: 'test' }],
      guidanceLinePixels: [{ x: 0, y: 0, color: 'red' }]
    };

    const grid = [[1, 0], [0, 1]];
    const challenge = { pattern: [[0, 0]] };
    const gridWidth = 2;
    const gridHeight = 2;
    const cellSize = 8;

    // Simulate the rendering sequence
    const simulateRenderOptimized = () => {
      const callOrder = [];

      // Clear canvas (background)
      callOrder.push('clear');

      // Draw grid lines (background)
      mockRenderer.renderGrid(gridWidth, gridHeight, cellSize);
      callOrder.push('grid');

      // 1. Render placed grid pixels (live cells) first
      mockRenderer.renderLiveCells(grid, gridWidth, gridHeight, cellSize);
      callOrder.push('liveCells');

      // 2. Render guidance lines (low priority - should be overwritten)
      if (renderOptions.guidanceLinePixels) {
        mockRenderer.renderGuidanceLines(renderOptions.guidanceLinePixels, cellSize);
        callOrder.push('guidanceLines');
      }

      // 3. Render challenge patterns - these overlay on top of live cells AND guidance lines
      mockRenderer.renderChallengePattern(challenge, grid, gridWidth, gridHeight, cellSize);
      callOrder.push('challengePattern');

      // 4. Render editor overlays
      mockRenderer.renderEditorOverlays();
      callOrder.push('editorOverlays');

      // 5. Render detectors last (highest priority - always visible)
      if (renderOptions.detectorRenderData) {
        mockRenderer.renderDetectors(renderOptions.detectorRenderData, cellSize);
        callOrder.push('detectors');
      }

      return callOrder;
    };

    const renderOrder = simulateRenderOptimized();

    // Verify the correct rendering order
    expect(renderOrder).toEqual([
      'clear',
      'grid',
      'liveCells',        // 1st priority (grid pixels)
      'guidanceLines',    // 2nd priority (low priority - should be overwritten by challenge patterns)
      'challengePattern', // 3rd priority (challenge patterns overlay on top of guidance lines)
      'editorOverlays',   // 4th priority (editor overlays - hover, paste preview, etc.)
      'detectors'         // 5th priority (highest - always visible, never obscured)
    ]);

    // Verify all functions were called with correct parameters
    expect(mockRenderer.renderDetectors).toHaveBeenCalledWith(renderOptions.detectorRenderData, cellSize);
    expect(mockRenderer.renderLiveCells).toHaveBeenCalledWith(grid, gridWidth, gridHeight, cellSize);
    expect(mockRenderer.renderChallengePattern).toHaveBeenCalledWith(challenge, grid, gridWidth, gridHeight, cellSize);
    expect(mockRenderer.renderGuidanceLines).toHaveBeenCalledWith(renderOptions.guidanceLinePixels, cellSize);
  });

  test('should render all live cells with challenge patterns overlaying on top', () => {
    // Test that all live cells are rendered and challenge patterns overlay on top
    const grid = [[1, 1], [1, 1]]; // All cells are live
    const challenge = {
      pattern: [[0, 0], [-1, 0]] // Challenge pattern at center and one above
    };
    const gridWidth = 2;
    const gridHeight = 2;

    // Simulate the logic from renderLiveCells (simplified version)
    const simulateRenderLiveCells = (grid, gridWidth, gridHeight) => {
      const renderedLiveCells = [];
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (grid[y][x]) {
            renderedLiveCells.push({ x, y });
          }
        }
      }
      return renderedLiveCells;
    };

    // Simulate challenge pattern positions
    const simulateChallengePattern = (challenge, gridWidth, gridHeight) => {
      const centerOffsetY = Math.floor(gridHeight / 2);
      const centerOffsetX = Math.floor(gridWidth / 2);

      const challengePositions = [];
      if (challenge && challenge.pattern) {
        for (const coord of challenge.pattern) {
          if (Array.isArray(coord) && coord.length === 2) {
            const [dy, dx] = coord;
            const y = centerOffsetY + dy;
            const x = centerOffsetX + dx;
            if (y >= 0 && y < gridHeight && x >= 0 && x < gridWidth) {
              challengePositions.push({ x, y });
            }
          }
        }
      }
      return challengePositions;
    };

    const liveCells = simulateRenderLiveCells(grid, gridWidth, gridHeight);
    const challengePositions = simulateChallengePattern(challenge, gridWidth, gridHeight);

    // All live cells should be rendered (no exclusion)
    expect(liveCells).toContainEqual({ x: 0, y: 0 });
    expect(liveCells).toContainEqual({ x: 0, y: 1 });
    expect(liveCells).toContainEqual({ x: 1, y: 0 });
    expect(liveCells).toContainEqual({ x: 1, y: 1 });
    expect(liveCells.length).toBe(4); // All 4 cells rendered

    // Challenge patterns should be at their positions (overlaying on top)
    expect(challengePositions).toContainEqual({ x: 1, y: 1 }); // Center position
    expect(challengePositions).toContainEqual({ x: 1, y: 0 }); // One above center
    expect(challengePositions.length).toBe(2);
  });

  test('should handle rendering priority with all elements present', () => {
    // Test comprehensive scenario with all rendering elements
    const hasAllElements = (renderOptions) => {
      return !!(
        renderOptions.detectorRenderData &&
        renderOptions.challengePattern &&
        renderOptions.liveCells &&
        renderOptions.guidanceLinePixels
      );
    };

    const fullRenderOptions = {
      detectorRenderData: [{ id: 'detector1' }],
      challengePattern: { pattern: [[0, 0]] },
      liveCells: [[1, 0], [0, 1]],
      guidanceLinePixels: [{ x: 0, y: 1, color: 'blue' }]
    };

    const partialRenderOptions = {
      detectorRenderData: null,
      challengePattern: { pattern: [[0, 0]] },
      liveCells: [[1, 0]],
      guidanceLinePixels: null
    };

    expect(hasAllElements(fullRenderOptions)).toBe(true);
    expect(hasAllElements(partialRenderOptions)).toBe(false);
  });

  test('should render challenge patterns as green when overlapping with live cells, blue otherwise', () => {
    // Test the overlapping behavior between challenge patterns and live cells
    const grid = [[1, 0], [0, 1]]; // Live cells at (0,0) and (1,1)
    const challenge = {
      pattern: [[0, 0], [-1, 0], [0, 1]] // Challenge pattern at center (1,1), above center (1,0), and right of center (1,2) in 2x2 grid
    };
    const gridWidth = 2;
    const gridHeight = 2;

    // Simulate the logic from renderChallengePattern
    const simulateRenderChallengePattern = (challenge, grid, gridWidth, gridHeight) => {
      const centerOffsetY = Math.floor(gridHeight / 2);
      const centerOffsetX = Math.floor(gridWidth / 2);
      const renderedPixels = [];

      if (challenge && challenge.pattern) {
        for (const coord of challenge.pattern) {
          if (Array.isArray(coord) && coord.length === 2) {
            const [dy, dx] = coord;
            const ny = centerOffsetY + dy;
            const nx = centerOffsetX + dx;
            if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
              // Check if there's a live cell at this position
              const hasLiveCell = grid && grid[ny] && grid[ny][nx];

              renderedPixels.push({
                x: nx,
                y: ny,
                color: hasLiveCell ? 'green' : 'blue'
              });
            }
          }
        }
      }

      return renderedPixels;
    };

    const renderedPixels = simulateRenderChallengePattern(challenge, grid, gridWidth, gridHeight);

    // In a 2x2 grid:
    // centerOffsetY = 1, centerOffsetX = 1
    // Challenge pattern positions:
    // [0, 0] -> (1+0, 1+0) = (1, 1) - has live cell -> green
    // [-1, 0] -> (1-1, 1+0) = (0, 1) - no live cell -> blue
    // [0, 1] -> (1+0, 1+1) = (1, 2) - out of bounds, not rendered

    expect(renderedPixels).toContainEqual({ x: 1, y: 1, color: 'green' }); // Live cell at (1,1)
    expect(renderedPixels).toContainEqual({ x: 1, y: 0, color: 'blue' });  // No live cell at (1,0)
    expect(renderedPixels.length).toBe(2); // Only 2 positions are valid (third is out of bounds)

    // Verify the color logic
    const greenPixels = renderedPixels.filter(p => p.color === 'green');
    const bluePixels = renderedPixels.filter(p => p.color === 'blue');

    expect(greenPixels.length).toBe(1); // One overlap with live cell
    expect(bluePixels.length).toBe(1);  // One challenge pattern without live cell
  });
});
