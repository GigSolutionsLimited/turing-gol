// Canvas and layout utilities
import { CELL_SIZE, MIN_CANVAS_SIZE, LEFT_PANEL_WIDTH, RIGHT_PANEL_WIDTH } from '../constants/gameConstants.js';

/**
 * Calculate center offsets for a grid
 * @param {Object|Array} grid - Grid object or array
 * @returns {Object} Object with centerOffsetX and centerOffsetY
 */
export function getCenterOffsets(grid) {
  const height = Array.isArray(grid) ? grid.length : grid.height || grid;
  const width = Array.isArray(grid) && grid.length > 0 ? grid[0].length : grid.width || grid;
  return {
    centerOffsetX: Math.floor(width / 2),
    centerOffsetY: Math.floor(height / 2)
  };
}

/**
 * Convert grid coordinates to center-based coordinates
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @param {Object|Array} grid - Grid object or array
 * @returns {Object} Object with centerX and centerY
 */
export function gridToCenter(gridX, gridY, grid) {
  const { centerOffsetX, centerOffsetY } = getCenterOffsets(grid);
  return {
    centerX: gridX - centerOffsetX,
    centerY: gridY - centerOffsetY
  };
}

/**
 * Convert center-based coordinates to grid coordinates
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {Object|Array} grid - Grid object or array
 * @returns {Object} Object with gridX and gridY
 */
export function centerToGrid(centerX, centerY, grid) {
  const { centerOffsetX, centerOffsetY } = getCenterOffsets(grid);
  return {
    gridX: centerOffsetX + centerX,
    gridY: centerOffsetY + centerY
  };
}

/**
 * Calculate canvas size based on available space and challenge requirements
 * @param {Object} challenge - Challenge configuration (optional)
 * @param {number} cellSize - Cell size in pixels (optional, defaults to CELL_SIZE)
 * @returns {Object} Canvas size configuration
 */
export function calculateCanvasSize(challenge = null, cellSize = CELL_SIZE) {
  // Calculate available space for the game canvas
  const totalCenterWidth = window.innerWidth - 182 - 124; // minus left and right borders
  const totalCenterHeight = window.innerHeight - 233 - 182; // minus top and bottom borders

  // Account for inline panels and gaps
  const availableWidth = totalCenterWidth - LEFT_PANEL_WIDTH - RIGHT_PANEL_WIDTH - 4 - 8;
  const availableHeight = totalCenterHeight - 8;

  // Set maximum canvas dimensions based on available space
  const maxWidth = Math.max(MIN_CANVAS_SIZE, availableWidth);
  const maxHeight = Math.max(MIN_CANVAS_SIZE, availableHeight);

  if (challenge && challenge.width && challenge.height) {
    // Use challenge dimensions with dynamic cell size
    const challengeWidth = challenge.width * cellSize;
    const challengeHeight = challenge.height * cellSize;

    return {
      width: challengeWidth,
      height: challengeHeight,
      maxWidth,
      maxHeight,
      needsScrolling: challengeWidth > maxWidth || challengeHeight > maxHeight
    };
  }

  // Fallback to container-based sizing (square)
  const size = Math.min(maxWidth, maxHeight);
  const finalSize = Math.max(MIN_CANVAS_SIZE, size);

  return {
    width: finalSize,
    height: finalSize,
    maxWidth,
    maxHeight,
    needsScrolling: false
  };
}

/**
 * Convert mouse coordinates to grid coordinates
 * @param {number} mouseX - Mouse X coordinate relative to canvas
 * @param {number} mouseY - Mouse Y coordinate relative to canvas
 * @param {number} cellSize - Cell size in pixels (optional, defaults to CELL_SIZE)
 * @returns {Object} Object with gridX and gridY
 */
export function mouseToGrid(mouseX, mouseY, cellSize = CELL_SIZE) {
  return {
    gridX: Math.floor(mouseX / cellSize),
    gridY: Math.floor(mouseY / cellSize)
  };
}

/**
 * Convert grid coordinates to pixel coordinates
 * @param {number} gridX - Grid X coordinate
 * @param {number} gridY - Grid Y coordinate
 * @returns {Object} Object with pixelX and pixelY
 */
export function gridToPixel(gridX, gridY) {
  return {
    pixelX: gridX * CELL_SIZE,
    pixelY: gridY * CELL_SIZE
  };
}

/**
 * Check if coordinates are within grid bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} gridSize - Grid size object
 * @returns {boolean} Whether coordinates are within bounds
 */
export function isWithinBounds(x, y, gridSize) {
  const width = gridSize.width || gridSize;
  const height = gridSize.height || gridSize;
  return x >= 0 && x < width && y >= 0 && y < height;
}

/**
 * Calculate optimal cell size for given canvas and grid dimensions
 * @param {number} canvasWidth - Canvas width in pixels
 * @param {number} canvasHeight - Canvas height in pixels
 * @param {number} gridWidth - Grid width in cells
 * @param {number} gridHeight - Grid height in cells
 * @returns {number} Optimal cell size in pixels
 */
export function calculateOptimalCellSize(canvasWidth, canvasHeight, gridWidth, gridHeight) {
  const cellSizeX = Math.floor(canvasWidth / gridWidth);
  const cellSizeY = Math.floor(canvasHeight / gridHeight);
  return Math.min(cellSizeX, cellSizeY, CELL_SIZE);
}

/**
 * Calculate auto-zoom cell size for a challenge to fit the entire grid
 * @param {Object} challenge - Challenge configuration
 * @param {number} defaultCellSize - Default cell size (CELL_SIZE)
 * @returns {number} Auto-zoom cell size, never less than 25% of default
 */
export function calculateAutoZoomCellSize(challenge, defaultCellSize = CELL_SIZE) {
  if (!challenge || !challenge.width || !challenge.height) {
    return defaultCellSize;
  }

  // Calculate available space for the game canvas
  const totalCenterWidth = window.innerWidth - 182 - 124; // minus left and right borders
  const totalCenterHeight = window.innerHeight - 233 - 182; // minus top and bottom borders

  // Account for inline panels and gaps
  const availableWidth = totalCenterWidth - LEFT_PANEL_WIDTH - RIGHT_PANEL_WIDTH - 4 - 8;
  const availableHeight = totalCenterHeight - 8;

  // Set maximum canvas dimensions based on available space
  const maxWidth = Math.max(MIN_CANVAS_SIZE, availableWidth);
  const maxHeight = Math.max(MIN_CANVAS_SIZE, availableHeight);

  // Calculate what the size would be with default cell size
  const defaultRequiredWidth = challenge.width * defaultCellSize;
  const defaultRequiredHeight = challenge.height * defaultCellSize;

  // Add generous breathing room - use 80% of available space for comfortable viewing
  const breathingRoomFactor = 0.80; // More generous breathing room
  const comfortableMaxWidth = maxWidth * breathingRoomFactor;
  const comfortableMaxHeight = maxHeight * breathingRoomFactor;

  // If default cell size fits comfortably with breathing room, use it
  if (defaultRequiredWidth <= comfortableMaxWidth && defaultRequiredHeight <= comfortableMaxHeight) {
    return defaultCellSize;
  }

  // Calculate optimal cell size to fit the grid with breathing room
  const optimalCellSizeX = Math.floor(comfortableMaxWidth / challenge.width);
  const optimalCellSizeY = Math.floor(comfortableMaxHeight / challenge.height);
  let optimalCellSize = Math.min(optimalCellSizeX, optimalCellSizeY);

  // For better user experience, prefer staying closer to default when possible
  // If the optimal size is close to default (within 62.5%), use default instead
  const defaultToleranceFactor = 0.625; // 5/8 - more aggressive about staying at default
  if (optimalCellSize >= defaultCellSize * defaultToleranceFactor) {
    return defaultCellSize;
  }

  // Special handling for known problematic levels to ensure better zoom
  const gridArea = challenge.width * challenge.height;

  // For very large grids, ensure we don't go too small
  if (gridArea > 35000) { // Large grids like 201x201
    const enhancedMinimum = Math.max(3, Math.floor(defaultCellSize * 0.375)); // 3px minimum for huge grids
    optimalCellSize = Math.max(optimalCellSize, enhancedMinimum);
  } else if (gridArea > 25000) { // Medium-large grids like 201x131
    const enhancedMinimum = Math.max(4, Math.floor(defaultCellSize * 0.5)); // 4px minimum for large grids
    optimalCellSize = Math.max(optimalCellSize, enhancedMinimum);
  }

  // Ensure minimum cell size is 25% of default (never zoom out more than 75%)
  const minimumCellSize = Math.floor(defaultCellSize * 0.25);

  // Return the larger of optimal size and minimum size, but cap at default
  return Math.min(Math.max(optimalCellSize, minimumCellSize), defaultCellSize);
}

