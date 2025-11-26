// Game service for core game logic and state management
import { GAME_STATE, LEVEL_STATE, DEFAULT_SPEED_MULTIPLIER, BASE_SPEED, MAX_GRID_SIZE } from '../constants/gameConstants.js';

/**
 * Service for managing game state and operations
 */
export class GameService {
  /**
   * Conway's Game of Life next generation calculation
   * Fixed: Removed grid caching that was causing stale data issues
   * @param {number[][]} grid - Current grid state
   * @returns {number[][]} Next generation grid
   */
  static nextGeneration(grid) {
    if (!grid || grid.length === 0) return grid;

    const height = grid.length;
    const width = grid[0].length;

    // Create a fresh grid for the new generation
    // Note: Removed caching optimization that was causing stale data issues
    const newGrid = Array.from({ length: height }, () => Array(width).fill(0));

    // Precomputed direction offsets for neighbor checking
    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];

    // Calculate next generation using Conway's rules
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let neighbors = 0;

        // Count living neighbors
        for (const [dx, dy] of directions) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            neighbors += grid[ny][nx];
          }
        }

        // Apply Conway's rules
        if (grid[y][x] === 1) {
          // Live cell: survive with 2 or 3 neighbors, otherwise die
          newGrid[y][x] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          // Dead cell: birth with exactly 3 neighbors
          newGrid[y][x] = (neighbors === 3) ? 1 : 0;
        }
      }
    }

    return newGrid;
  }

  /**
   * Create an empty grid
   * @param {number} width - Grid width
   * @param {number} height - Grid height
   * @returns {number[][]} Empty grid
   */
  static createEmptyGrid(width, height = null) {
    const gridHeight = height !== null ? height : width;

    // Validate grid size to prevent memory issues
    if (width > MAX_GRID_SIZE || gridHeight > MAX_GRID_SIZE) {
      console.warn(`Grid size ${width}x${gridHeight} exceeds maximum ${MAX_GRID_SIZE}x${MAX_GRID_SIZE}`);
      return [];
    }

    return Array.from({ length: gridHeight }, () => Array(width).fill(0));
  }

  /**
   * Resize grid while preserving center
   * @param {number[][]} oldGrid - Current grid state
   * @param {number} newWidth - New grid width
   * @param {number} newHeight - New grid height
   * @returns {number[][]} Resized grid with center preserved
   */
  static resizeGrid(oldGrid, newWidth, newHeight) {
    if (!oldGrid || oldGrid.length === 0) {
      return GameService.createEmptyGrid(newWidth, newHeight);
    }

    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0].length;

    // If dimensions are the same, return the original grid
    if (oldWidth === newWidth && oldHeight === newHeight) {
      return oldGrid; // Return same reference for efficiency
    }

    // Create new grid
    const newGrid = GameService.createEmptyGrid(newWidth, newHeight);

    // Calculate center offsets for both grids
    const oldCenterX = Math.floor(oldWidth / 2);
    const oldCenterY = Math.floor(oldHeight / 2);
    const newCenterX = Math.floor(newWidth / 2);
    const newCenterY = Math.floor(newHeight / 2);

    // Copy cells from old grid to new grid, maintaining center alignment
    for (let y = 0; y < oldHeight; y++) {
      for (let x = 0; x < oldWidth; x++) {
        if (oldGrid[y][x] === 1) {
          // Calculate position relative to old center
          const relativeX = x - oldCenterX;
          const relativeY = y - oldCenterY;

          // Calculate new position relative to new center
          const newX = newCenterX + relativeX;
          const newY = newCenterY + relativeY;

          // Place cell if within new grid bounds
          if (newX >= 0 && newX < newWidth && newY >= 0 && newY < newHeight) {
            newGrid[newY][newX] = 1;
          }
        }
      }
    }

    return newGrid;
  }

  /**
   * Check if a cell position is within editable area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {Object} challenge - Challenge configuration
   * @param {Object} gridSize - Grid size information
   * @param {boolean} adminMode - Whether admin mode is active
   * @returns {boolean} Whether the cell is editable
   */
  static isEditableCell(x, y, challenge, gridSize, adminMode) {
    // Admin mode allows editing everywhere
    if (adminMode || !challenge || !challenge.editableSpace) {
      return true;
    }

    const centerOffsetX = Math.floor((gridSize.width || gridSize) / 2);
    const centerOffsetY = Math.floor((gridSize.height || gridSize) / 2);
    const centerX = x - centerOffsetX;
    const centerY = y - centerOffsetY;

    const { minX, maxX, minY, maxY } = challenge.editableSpace;
    return centerX >= minX && centerX <= maxX && centerY >= minY && centerY <= maxY;
  }

  /**
   * Calculate animation speed from multiplier
   * @param {number} multiplier - Speed multiplier
   * @returns {number} Animation interval in milliseconds
   */
  static calculateAnimationSpeed(multiplier = DEFAULT_SPEED_MULTIPLIER) {
    return BASE_SPEED / multiplier;
  }

  /**
   * Count alive cells in grid
   * @param {number[][]} grid - Game grid
   * @returns {number} Number of alive cells
   */
  static countAliveCells(grid) {
    if (!grid || grid.length === 0) return 0;
    return grid.flat().filter(cell => cell === 1).length;
  }

  /**
   * Get grid bounds (min/max coordinates of live cells)
   * @param {number[][]} grid - Game grid
   * @returns {Object} Bounds object with minX, maxX, minY, maxY
   */
  static getGridBounds(grid) {
    if (!grid || grid.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    let minX = grid[0].length, maxX = -1;
    let minY = grid.length, maxY = -1;

    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        if (grid[y][x]) {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
    }

    return minX <= maxX ? { minX, maxX, minY, maxY } : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  }

  /**
   * Copy grid (deep clone)
   * @param {number[][]} grid - Grid to copy
   * @returns {number[][]} Copied grid
   */
  static copyGrid(grid) {
    if (!grid) return grid;
    return grid.map(row => [...row]);
  }

  /**
   * Resize grid while preserving center content
   * @param {number[][]} oldGrid - Current grid
   * @param {number} newWidth - New grid width
   * @param {number} newHeight - New grid height
   * @returns {number[][]} Resized grid
   */
  static resizeGrid(oldGrid, newWidth, newHeight) {
    const newGrid = this.createEmptyGrid(newWidth, newHeight);

    if (!oldGrid || oldGrid.length === 0) return newGrid;

    const oldHeight = oldGrid.length;
    const oldWidth = oldGrid[0].length;

    const oldCenterY = Math.floor(oldHeight / 2);
    const oldCenterX = Math.floor(oldWidth / 2);
    const newCenterY = Math.floor(newHeight / 2);
    const newCenterX = Math.floor(newWidth / 2);

    const offsetY = newCenterY - oldCenterY;
    const offsetX = newCenterX - oldCenterX;

    // Copy old grid to new grid, maintaining center position
    for (let y = 0; y < oldHeight; y++) {
      for (let x = 0; x < oldWidth; x++) {
        const newY = y + offsetY;
        const newX = x + offsetX;
        if (newY >= 0 && newY < newHeight && newX >= 0 && newX < newWidth) {
          newGrid[newY][newX] = oldGrid[y][x];
        }
      }
    }

    return newGrid;
  }

  /**
   * Check if a cell is editable based on challenge constraints
   * @param {number} x - Grid X coordinate
   * @param {number} y - Grid Y coordinate
   * @param {Object} challenge - Challenge configuration
   * @param {Object} gridSize - Grid size information
   * @param {boolean} adminMode - Whether admin mode is active
   * @returns {boolean} Whether the cell is editable
   */
  static isEditableCell(x, y, challenge, gridSize, adminMode) {
    // Admin mode allows editing anywhere
    if (adminMode) return true;

    // If no challenge or no editableSpace defined, allow editing anywhere
    if (!challenge || !challenge.editableSpace) return true;

    const editableSpace = challenge.editableSpace;

    // Convert grid coordinates to center-based coordinates for comparison
    const centerX = Math.floor((gridSize.width || gridSize) / 2);
    const centerY = Math.floor((gridSize.height || gridSize) / 2);

    const centerBasedX = x - centerX;
    const centerBasedY = y - centerY;

    // Check if coordinates are within editable bounds
    const isWithinBounds = centerBasedX >= editableSpace.minX &&
                          centerBasedX <= editableSpace.maxX &&
                          centerBasedY >= editableSpace.minY &&
                          centerBasedY <= editableSpace.maxY;

    return isWithinBounds;
  }
}
