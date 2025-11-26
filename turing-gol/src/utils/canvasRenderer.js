// Canvas rendering optimizations for Game of Life
import { CELL_SIZE } from '../constants/gameConstants.js';

/**
 * Optimized canvas rendering utilities
 */
export class CanvasRenderer {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.dirtyRegions = new Set();
    this.lastGrid = null;
    this.imageData = null;
    this.gridBuffer = null;

    // Canvas size tracking for zoom operations
    this.lastCanvasWidth = canvas.width;
    this.lastCanvasHeight = canvas.height;

    // Performance settings
    this.ctx.imageSmoothingEnabled = false; // Disable smoothing for pixel-perfect rendering

    // Additional settings for better small-scale rendering
    if (this.ctx.imageSmoothingQuality) {
      this.ctx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Mark a region as dirty for partial redraws
   * @param {number} x - X coordinate in grid units
   * @param {number} y - Y coordinate in grid units
   * @param {number} width - Width in grid units
   * @param {number} height - Height in grid units
   */
  markDirty(x, y, width = 1, height = 1) {
    this.dirtyRegions.add(`${x},${y},${width},${height}`);
  }

  /**
   * Clear all dirty regions
   */
  clearDirtyRegions() {
    this.dirtyRegions.clear();
  }

  /**
   * Get dirty regions for rendering
   * @param {number} cellSize - Cell size in pixels
   * @returns {Array} Array of dirty region objects
   */
  getDirtyRegions(cellSize = CELL_SIZE) {
    return Array.from(this.dirtyRegions).map(region => {
      const [x, y, width, height] = region.split(',').map(Number);
      return {
        gridX: x,
        gridY: y,
        gridWidth: width,
        gridHeight: height,
        pixelX: x * cellSize,
        pixelY: y * cellSize,
        pixelWidth: width * cellSize,
        pixelHeight: height * cellSize
      };
    });
  }

  /**
   * Render using ImageData for better performance with large grids
   * @param {Array} grid - 2D grid array
   * @param {Object} options - Rendering options including cellSize
   */
  renderWithImageData(grid, options = {}) {
    const {
      width = this.canvas.width,
      height = this.canvas.height,
      cellSize = CELL_SIZE
    } = options;

    if (!this.imageData || this.imageData.width !== width || this.imageData.height !== height) {
      this.imageData = this.ctx.createImageData(width, height);
    }

    const data = this.imageData.data;
    const gridHeight = grid.length;
    const gridWidth = gridHeight > 0 ? grid[0].length : 0;

    // Fill ImageData buffer
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const gridY = Math.floor(y / cellSize);
        const gridX = Math.floor(x / cellSize);

        const pixelIndex = (y * width + x) * 4;

        // Ensure we're within grid bounds
        if (gridY >= 0 && gridY < gridHeight && gridX >= 0 && gridX < gridWidth && grid[gridY][gridX]) {
          // Live cell - white
          data[pixelIndex] = 255;     // R
          data[pixelIndex + 1] = 255; // G
          data[pixelIndex + 2] = 255; // B
          data[pixelIndex + 3] = 255; // A
        } else {
          // Dead cell - black
          data[pixelIndex] = 0;       // R
          data[pixelIndex + 1] = 0;   // G
          data[pixelIndex + 2] = 0;   // B
          data[pixelIndex + 3] = 255; // A
        }
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
  }

  /**
   * Optimized grid rendering with dirty region support
   * @param {Array} grid - Current grid
   * @param {Array} previousGrid - Previous grid for diff
   * @param {Object} renderOptions - Rendering configuration
   */
  renderOptimized(grid, previousGrid, renderOptions = {}) {
    const {
      challenge,
      selectedPattern,
      hoverCell,
      pasting,
      isEditableCell,
      adminMode,
      cellSize = CELL_SIZE
    } = renderOptions;

    const gridHeight = grid.length;
    const gridWidth = gridHeight > 0 ? grid[0].length : 0;

    // Reset dirty regions if canvas size has changed (e.g., during zoom)
    const currentCanvasWidth = this.canvas.width;
    const currentCanvasHeight = this.canvas.height;
    if (this.lastCanvasWidth !== currentCanvasWidth || this.lastCanvasHeight !== currentCanvasHeight) {
      this.clearDirtyRegions();
      this.lastGrid = null; // Force full redraw
      this.imageData = null; // Clear any cached ImageData to prevent corruption
      this.lastCanvasWidth = currentCanvasWidth;
      this.lastCanvasHeight = currentCanvasHeight;
    }

    // Calculate dirty regions by comparing with previous grid
    let hasChanges = false;
    if (previousGrid && previousGrid.length === gridHeight) {
      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (grid[y][x] !== previousGrid[y][x]) {
            this.markDirty(x, y);
            hasChanges = true;
          }
        }
      }
    } else {
      // Full redraw if no previous grid or size changed
      this.markDirty(0, 0, gridWidth, gridHeight);
      hasChanges = true;
    }

    // Get dirty regions
    const dirtyRegions = this.getDirtyRegions(cellSize);

    // Always redraw if there are changes OR if we need to show overlays
    const shouldRedraw = hasChanges ||
                        (!adminMode && typeof isEditableCell === 'function') ||
                        (hoverCell && pasting) ||
                        (renderOptions.guidanceLinePixels && renderOptions.guidanceLinePixels.length > 0) ||
                        (renderOptions.testScenarioPreviewPatterns && renderOptions.testScenarioPreviewPatterns.length > 0) ||
                        (renderOptions.moveHandleRenderData && renderOptions.moveHandleRenderData.length > 0);

    if (!shouldRedraw && dirtyRegions.length === 0) {
      return; // Nothing to update
    }

    // Always clear entire canvas to ensure proper rendering at all zoom levels
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines first (as background)
    this.renderGrid(gridWidth, gridHeight, cellSize);

    // 1. Render guidance lines (low priority - should be overwritten by live cells)
    if (renderOptions.guidanceLinePixels) {
      this.renderGuidanceLines(renderOptions.guidanceLinePixels, cellSize);
    }

    // 1.5. Render test scenario preview patterns as gold background pixels
    if (renderOptions.testScenarioPreviewPatterns) {
      this.renderTestScenarioPreviewPatterns(renderOptions.testScenarioPreviewPatterns, cellSize);
    }

    // 2. Render placed grid pixels (live cells)
    this.renderLiveCells(grid, gridWidth, gridHeight, cellSize);

    // 3. Render challenge patterns (required patterns) - these overlay on top of live cells AND guidance lines
    this.renderChallengePattern(challenge, grid, gridWidth, gridHeight, cellSize);

    // 4. Render editor overlays (for hover effects, paste preview, editable areas)
    this.renderEditorOverlays(selectedPattern, hoverCell, pasting, isEditableCell, adminMode, gridWidth, gridHeight, cellSize);

    // 5. Render detectors last (highest priority - always visible, never obscured)
    if (renderOptions.detectorRenderData) {
      this.renderDetectors(renderOptions.detectorRenderData, cellSize);
    }

    // 6. Render move handles for placed objects (only when not running)
    if (renderOptions.moveHandleRenderData) {
      this.renderMoveHandles(renderOptions.moveHandleRenderData, cellSize);
    }

    this.clearDirtyRegions();
  }

  /**
   * Render challenge pattern (required patterns) - these overlay on top of live cells
   * Shows green when there's a live cell at the challenge pattern position, blue otherwise
   */
  renderChallengePattern(challenge, grid, gridWidth, gridHeight, cellSize = CELL_SIZE) {
    if (!challenge || !challenge.pattern || !Array.isArray(challenge.pattern)) return;

    const centerOffsetY = Math.floor(gridHeight / 2);
    const centerOffsetX = Math.floor(gridWidth / 2);

    for (const coord of challenge.pattern) {
      if (Array.isArray(coord) && coord.length === 2) {
        const [dy, dx] = coord;
        const ny = centerOffsetY + dy;
        const nx = centerOffsetX + dx;
        if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
          // Check if there's a live cell at this position
          const hasLiveCell = grid && grid[ny] && grid[ny][nx];

          // Green if there's a live cell, blue otherwise
          this.ctx.fillStyle = hasLiveCell ? 'green' : 'blue';

          // Use pixel-perfect rendering for small cells
          if (cellSize < 3) {
            this.ctx.fillRect(
              Math.round(nx * cellSize),
              Math.round(ny * cellSize),
              Math.max(1, Math.round(cellSize)),
              Math.max(1, Math.round(cellSize))
            );
          } else {
            this.ctx.fillRect(nx * cellSize, ny * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }

  /**
   * Render live cells (all grid pixels)
   */
  renderLiveCells(grid, gridWidth, gridHeight, cellSize = CELL_SIZE) {
    // Render all live cells in white
    this.ctx.fillStyle = 'white';
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        if (grid[y][x]) {
          // Ensure minimum 1px size for visibility
          const renderX = Math.round(x * cellSize);
          const renderY = Math.round(y * cellSize);
          const renderWidth = Math.max(1, Math.round(cellSize));
          const renderHeight = Math.max(1, Math.round(cellSize));

          this.ctx.fillRect(renderX, renderY, renderWidth, renderHeight);
        }
      }
    }
  }

  /**
   * Render editor overlays (hover, paste preview, editable area)
   */
  renderEditorOverlays(selectedPattern, hoverCell, pasting, isEditableCell, adminMode, gridWidth, gridHeight, cellSize = CELL_SIZE) {
    // Render editable area background (only in non-admin mode)
    if (!adminMode && typeof isEditableCell === 'function') {
      this.ctx.fillStyle = 'rgba(0, 100, 200, 0.1)'; // Light blue tint for editable area

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (isEditableCell(x, y)) {
            if (cellSize < 3) {
              this.ctx.fillRect(
                Math.round(x * cellSize),
                Math.round(y * cellSize),
                Math.max(1, Math.round(cellSize)),
                Math.max(1, Math.round(cellSize))
              );
            } else {
              this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
          }
        }
      }

      // Draw editable area border
      this.ctx.strokeStyle = 'rgba(0, 150, 255, 0.6)'; // Brighter blue border
      this.ctx.lineWidth = Math.max(1, Math.round(cellSize / 4)); // Scale line width with cell size
      this.ctx.setLineDash([Math.max(2, cellSize), Math.max(2, cellSize)]); // Scale dash pattern

      // Find the bounds of the editable area for border drawing
      let minEditableX = gridWidth, maxEditableX = -1;
      let minEditableY = gridHeight, maxEditableY = -1;

      for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
          if (isEditableCell(x, y)) {
            minEditableX = Math.min(minEditableX, x);
            maxEditableX = Math.max(maxEditableX, x);
            minEditableY = Math.min(minEditableY, y);
            maxEditableY = Math.max(maxEditableY, y);
          }
        }
      }

      // Draw the border rectangle if we found an editable area
      if (minEditableX <= maxEditableX && minEditableY <= maxEditableY) {
        this.ctx.strokeRect(
          Math.round(minEditableX * cellSize + 1),
          Math.round(minEditableY * cellSize + 1),
          Math.round((maxEditableX - minEditableX + 1) * cellSize - 2),
          Math.round((maxEditableY - minEditableY + 1) * cellSize - 2)
        );
      }

      // Reset line dash
      this.ctx.setLineDash([]);
    }

    // Render hover and paste preview
    if (hoverCell && pasting && selectedPattern && selectedPattern.pattern) {
      const isEraser = selectedPattern.name && selectedPattern.name.toLowerCase().includes('eraser');
      this.ctx.fillStyle = isEraser ? 'rgba(255, 100, 100, 0.7)' : 'rgba(173, 216, 230, 0.7)';

      for (const coord of selectedPattern.pattern) {
        if (Array.isArray(coord) && coord.length === 2) {
          const [dy, dx] = coord;
          const ny = hoverCell.y + dy;
          const nx = hoverCell.x + dx;
          if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth &&
              (adminMode || (typeof isEditableCell === 'function' && isEditableCell(nx, ny)))) {
            if (cellSize < 3) {
              this.ctx.fillRect(
                Math.round(nx * cellSize),
                Math.round(ny * cellSize),
                Math.max(1, Math.round(cellSize)),
                Math.max(1, Math.round(cellSize))
              );
            } else {
              this.ctx.fillRect(nx * cellSize, ny * cellSize, cellSize, cellSize);
            }
          }
        }
      }
    }
  }

  /**
   * Render detector pixels on the grid
   * @param {Array} detectorRenderData - Array of detector render data
   * @param {number} cellSize - Cell size in pixels
   */
  renderDetectors(detectorRenderData, cellSize = CELL_SIZE) {
    if (!detectorRenderData || detectorRenderData.length === 0) {
      return;
    }

    detectorRenderData.forEach((detector) => {
      // Render each detector pixel with color based on current value
      detector.positions.forEach((position) => {
        const pixelX = position.x * cellSize;
        const pixelY = position.y * cellSize;

        // For challenge detectors, show target state with half brightness when inactive
        if (detector.isChallenge && detector.targetState !== undefined) {
          if (detector.currentValue === 1) {
            // Active: full brightness based on target state
            this.ctx.fillStyle = detector.targetState === 1 ? 'green' : 'red';
          } else {
            // Inactive: half brightness based on target state
            this.ctx.fillStyle = detector.targetState === 1 ? 'rgba(0, 128, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)';
          }
        } else {
          // Regular detectors: red for inactive (0), green for active (1)
          this.ctx.fillStyle = detector.currentValue === 1 ? 'green' : 'red';
        }

        // Render the pixel
        if (cellSize < 3) {
          this.ctx.fillRect(
            Math.round(pixelX),
            Math.round(pixelY),
            Math.max(1, Math.round(cellSize)),
            Math.max(1, Math.round(cellSize))
          );
        } else {
          this.ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
        }
      });
    });
  }

  /**
   * Render move handles for placed objects
   * @param {Array} moveHandleRenderData - Array of move handle render data
   * @param {number} cellSize - Cell size in pixels
   */
  renderMoveHandles(moveHandleRenderData, cellSize = CELL_SIZE) {
    console.log('🎯 CANVAS RENDERER - renderMoveHandles called:', {
      handleCount: moveHandleRenderData?.length || 0,
      cellSize,
      handles: moveHandleRenderData?.map(h => ({ id: h.id, x: h.x, y: h.y, brushName: h.brushName })) || []
    });

    if (!moveHandleRenderData || moveHandleRenderData.length === 0) {
      console.log('🎯 CANVAS RENDERER - No move handles to render');
      return;
    }

    moveHandleRenderData.forEach((handle, index) => {
      const pixelX = handle.x * cellSize;
      const pixelY = handle.y * cellSize;

      // Calculate handle size - minimum 6px, maximum 1/3 of cell size
      const handleSize = Math.max(6, Math.min(cellSize / 3, 12));

      console.log(`🎯 CANVAS RENDERER - Rendering handle ${index + 1}/${moveHandleRenderData.length}:`, {
        handleId: handle.id,
        gridPosition: { x: handle.x, y: handle.y },
        pixelPosition: { x: pixelX, y: pixelY },
        handleSize,
        brushName: handle.brushName
      });

      // Draw handle background (dark semi-transparent)
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(
        pixelX - handleSize/2,
        pixelY - handleSize/2,
        handleSize,
        handleSize
      );

      // Draw handle border (bright blue)
      this.ctx.strokeStyle = '#3EC6FF';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(
        pixelX - handleSize/2,
        pixelY - handleSize/2,
        handleSize,
        handleSize
      );

      // Draw move icon (4 small arrows) - simplified for small sizes
      this.ctx.fillStyle = '#3EC6FF';
      const iconSize = Math.max(2, handleSize / 3);
      const centerX = pixelX;
      const centerY = pixelY;

      // Draw a simple cross/plus pattern as move indicator
      this.ctx.fillRect(centerX - iconSize/2, centerY - 1, iconSize, 2);
      this.ctx.fillRect(centerX - 1, centerY - iconSize/2, 2, iconSize);
    });

    console.log('🎯 CANVAS RENDERER - Move handles rendering complete');
  }

  /**
   * Get CSS variable value
   * @param {string} varName - CSS variable name (without --)
   * @returns {string} CSS variable value
   */
  getCSSVariable(varName) {
    // Handle test environment where getComputedStyle is not available
    if (typeof getComputedStyle === 'undefined') {
      const fallbackColors = {
        'guidance-blue-dark': '#1e3a8a',
        'guidance-blue-light': '#60a5fa',
        'guidance-blue-medium': '#3b82f6'
      };
      return fallbackColors[varName] || '#3b82f6';
    }

    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${varName}`)
      .trim();
  }

  /**
   * Render guidance lines with alternating colors
   * @param {Array} guidanceLinePixels - Array of guidance line pixels [[y, x, color], ...]
   * @param {number} cellSize - Cell size in pixels
   */
  renderGuidanceLines(guidanceLinePixels, cellSize = CELL_SIZE) {
    if (!Array.isArray(guidanceLinePixels) || guidanceLinePixels.length === 0) {
      return;
    }

    for (const [y, x, color] of guidanceLinePixels) {
      // Set color based on guidance line pattern using CSS variables
      if (color === 'guidanceColor1') {
        this.ctx.fillStyle = this.getCSSVariable('guidance-blue-dark');
      } else if (color === 'guidanceColor2') {
        this.ctx.fillStyle = this.getCSSVariable('guidance-blue-light');
      } else {
        this.ctx.fillStyle = this.getCSSVariable('guidance-blue-medium');
      }

      // Render the guidance pixel
      if (cellSize < 3) {
        this.ctx.fillRect(
          Math.round(x * cellSize),
          Math.round(y * cellSize),
          Math.max(1, Math.round(cellSize)),
          Math.max(1, Math.round(cellSize))
        );
      } else {
        this.ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  /**
   * Render test scenario preview patterns as gold pixels
   * @param {Array} testScenarioPreviewPatterns - Array of preview pattern objects
   * @param {number} cellSize - Cell size in pixels
   */
  renderTestScenarioPreviewPatterns(testScenarioPreviewPatterns, cellSize = CELL_SIZE) {
    if (!testScenarioPreviewPatterns || testScenarioPreviewPatterns.length === 0) {
      return;
    }

    // Use the same gold color as the detector panel digits
    this.ctx.fillStyle = '#FFD700'; // Gold color

    testScenarioPreviewPatterns.forEach((pattern) => {
      const pixelX = pattern.x * cellSize;
      const pixelY = pattern.y * cellSize;

      // Use pixel-perfect rendering for small cells
      if (cellSize < 3) {
        this.ctx.fillRect(
          Math.round(pixelX),
          Math.round(pixelY),
          Math.max(1, Math.round(cellSize)),
          Math.max(1, Math.round(cellSize))
        );
      } else {
        this.ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
      }
    });
  }

  renderGrid(gridWidth, gridHeight, cellSize = CELL_SIZE) {
    // Adjust grid line visibility based on cell size
    if (cellSize < 3) {
      // For very small cells, make grid lines more subtle or skip them
      this.ctx.strokeStyle = 'rgba(31, 99, 127, 0.3)';
      this.ctx.lineWidth = 0.25;
    } else if (cellSize < 6) {
      // For small cells, use thinner lines
      this.ctx.strokeStyle = 'rgba(31, 99, 127, 0.5)';
      this.ctx.lineWidth = 0.5;
    } else if (cellSize >= 16) {
      // For very large cells, use slightly thicker but still subtle lines
      this.ctx.strokeStyle = 'rgba(31, 99, 127, 0.4)';
      this.ctx.lineWidth = 0.5;
    } else {
      // Normal grid lines for medium cells
      this.ctx.strokeStyle = '#1f637f';
      this.ctx.lineWidth = 0.5;
    }

    this.ctx.beginPath();

    // Only draw grid lines if cell size is reasonable
    if (cellSize >= 2) {
      // Vertical lines
      for (let i = 0; i <= gridWidth; i++) {
        const x = Math.round(i * cellSize) + 0.5; // +0.5 for crisp lines
        this.ctx.moveTo(x, 0);
        this.ctx.lineTo(x, Math.round(gridHeight * cellSize));
      }

      // Horizontal lines
      for (let i = 0; i <= gridHeight; i++) {
        const y = Math.round(i * cellSize) + 0.5; // +0.5 for crisp lines
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(Math.round(gridWidth * cellSize), y);
      }

      this.ctx.stroke();
    }
  }
}

/**
 * Create an optimized canvas renderer instance
 * @param {HTMLCanvasElement} canvas - Canvas element
 * @returns {CanvasRenderer} Renderer instance
 */
export const createOptimizedRenderer = (canvas) => {
  const context = canvas.getContext('2d');
  return new CanvasRenderer(canvas, context);
};
