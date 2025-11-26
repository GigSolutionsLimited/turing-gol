// Guidance line management utilities
import { generateGuidanceLine } from './rleUtils.js';

/**
 * Create a placed guidance line object
 * @param {Object} guidanceSpec - The guidance line specification
 * @param {Array} patternCoords - The pattern coordinates that created this guidance line
 * @param {number} placedX - X position where pattern was placed
 * @param {number} placedY - Y position where pattern was placed
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @param {Array} originalPixels - The pixels that were modified to create this guidance line
 * @returns {Object} Placed guidance line data
 */
export function createPlacedGuidanceLine(guidanceSpec, patternCoords, placedX, placedY, gridWidth, gridHeight, originalPixels) {
  return {
    id: `${Date.now()}_${placedX}_${placedY}`,
    guidanceSpec,
    patternCoords,
    placedX,
    placedY,
    gridWidth,
    gridHeight,
    originalPixels: [...originalPixels], // Store original state of affected pixels
    createdAt: Date.now()
  };
}

/**
 * Generate pixels for all placed guidance lines
 * @param {Array} placedGuidanceLines - Array of placed guidance line data
 * @param {Array} grid - Current grid state
 * @returns {Array} Array of guidance line pixels [[y, x, color], ...]
 */
export function generateAllPlacedGuidanceLinePixels(placedGuidanceLines, grid) {
  if (!Array.isArray(placedGuidanceLines) || placedGuidanceLines.length === 0) {
    return [];
  }

  const allPixels = [];

  for (const placedLine of placedGuidanceLines) {
    // Generate the guidance line pixels without checking if source has changed
    // (validation effect in GameOfLife.jsx handles removal from state)
    const relativePixels = generateGuidanceLine(
      placedLine.guidanceSpec,
      placedLine.patternCoords,
      placedLine.gridWidth,
      placedLine.gridHeight
    );

    // Transform to absolute coordinates
    const absolutePixels = relativePixels.map(([y, x, color]) => [
      y + placedLine.placedY,
      x + placedLine.placedX,
      color
    ]).filter(([y, x]) =>
      y >= 0 && y < grid.length &&
      x >= 0 && x < (grid.length > 0 ? grid[0].length : 0)
    );

    allPixels.push(...absolutePixels);
  }

  return allPixels;
}

/**
 * Check if the source pixels that caused a guidance line have changed
 * @param {Object} placedLine - Placed guidance line data
 * @param {Array} grid - Current grid state
 * @returns {boolean} True if source pixels have changed
 */
export function hasSourcePixelsChanged(placedLine, grid) {
  if (!grid || !Array.isArray(grid) || grid.length === 0) {
    return true;
  }

  const gridHeight = grid.length;
  const gridWidth = gridHeight > 0 ? grid[0].length : 0;

  // Check if each original pixel position still matches its original state
  for (const originalPixel of placedLine.originalPixels) {
    const { x, y, value } = originalPixel;

    // Check bounds
    if (y < 0 || y >= gridHeight || x < 0 || x >= gridWidth) {
      continue; // Skip out-of-bounds pixels
    }

    // Check if the current value matches the original value
    if (grid[y][x] !== value) {
      return true; // Source pixels have changed
    }
  }

  return false; // No changes detected
}

/**
 * Remove placed guidance lines that have invalid source pixels
 * @param {Array} placedGuidanceLines - Array of placed guidance line data
 * @param {Array} grid - Current grid state
 * @returns {Array} Filtered array with only valid guidance lines
 */
export function filterValidGuidanceLines(placedGuidanceLines, grid) {
  if (!Array.isArray(placedGuidanceLines)) {
    return [];
  }

  return placedGuidanceLines.filter(placedLine =>
    !hasSourcePixelsChanged(placedLine, grid)
  );
}

/**
 * Get the pixels that would be affected by placing a pattern
 * @param {Array} patternCoords - Pattern coordinates
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Array} grid - Current grid state
 * @returns {Array} Array of affected pixel data [{x, y, value}, ...]
 */
export function getAffectedPixels(patternCoords, x, y, grid) {
  const affectedPixels = [];
  const gridHeight = grid.length;
  const gridWidth = gridHeight > 0 ? grid[0].length : 0;

  for (const coord of patternCoords) {
    if (Array.isArray(coord) && coord.length === 2) {
      const [dy, dx] = coord;
      const ny = y + dy;
      const nx = x + dx;

      if (ny >= 0 && ny < gridHeight && nx >= 0 && nx < gridWidth) {
        affectedPixels.push({
          x: nx,
          y: ny,
          value: grid[ny][nx]
        });
      }
    }
  }

  return affectedPixels;
}
