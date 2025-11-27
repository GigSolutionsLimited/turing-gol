/**
 * Service for managing user-placed objects (pixels with optional guidance lines)
 * This unifies the handling of user-placed patterns and their associated guidance lines
 */

import { BrushService } from './index';
import { createGuidanceLineFromBrush } from '../utils/guidanceLineObjects';

export class PlacedObjectService {
  /**
   * Create a placed object from a brush placement
   * @param {Object} brush - The brush that was placed
   * @param {number} gridX - Grid X coordinate where placed
   * @param {number} gridY - Grid Y coordinate where placed
   * @param {number} generation - Generation when placed
   * @param {number} rotation - Rotation applied (0, 90, 180, 270)
   * @param {boolean} flipX - Whether brush was flipped around X axis
   * @param {boolean} flipY - Whether brush was flipped around Y axis
   * @returns {Object} Placed object with pixels and optional guidance lines
   */
  static createPlacedObject(brush, gridX, gridY, generation = 0, rotation = 0, flipX = false, flipY = false) {
    const id = `placed_${Date.now()}_${gridX}_${gridY}`;

    // If the brush already has been transformed (has matching rotation and flip properties),
    // use it as-is. Otherwise apply transformations.
    let transformedBrush = brush;
    const brushAlreadyTransformed =
      brush.rotation !== undefined && brush.rotation === rotation &&
      (brush.flipX || false) === flipX &&
      (brush.flipY || false) === flipY;

    if (!brushAlreadyTransformed) {
      // Apply rotation if needed
      if (rotation && rotation !== 0 && brush.rotation !== rotation) {
        const rotations = Math.floor(rotation / 90) % 4;
        for (let i = 0; i < rotations; i++) {
          transformedBrush = this.rotateBrushClockwise(transformedBrush);
        }
      }

      // Apply flips if needed (only if brush doesn't already have them)
      if (flipX && !brush.flipX) {
        transformedBrush = BrushService.transformPattern(transformedBrush, 'flipX');
      }
      if (flipY && !brush.flipY) {
        transformedBrush = BrushService.transformPattern(transformedBrush, 'flipY');
      }
    }

    // Extract pixel positions relative to placement point
    const pixels = transformedBrush.pattern.map(([dy, dx]) => ({
      x: gridX + dx,
      y: gridY + dy
    }));

    // Create guidance line objects if brush has guidance lines
    const guidanceLines = [];
    const brushGuidanceLines = transformedBrush.guidanceLines ||
                              (transformedBrush.guidanceLine ? [transformedBrush.guidanceLine] : []);

    brushGuidanceLines.forEach((guidanceLine) => {
      const guidanceLineObject = this.createGuidanceLineFromBrush(
        guidanceLine,
        generation,
        gridX,
        gridY
      );

      if (guidanceLineObject) {
        guidanceLines.push(guidanceLineObject);
      }
    });

    return {
      id,
      type: 'placedObject',
      brushId: brush.id || brush.brushId || brush.name || 'unknown',
      brushName: brush.name || brush.id || 'unknown',
      gridX,
      gridY,
      generation,
      rotation,
      flipX,
      flipY,
      pixels,
      guidanceLines,
      intact: true, // New flag: true when pattern matches original brush
      createdAt: Date.now()
    };
  }

  /**
   * Move a placed object to a new position
   * @param {Object} placedObject - The placed object to move
   * @param {number} newGridX - New grid X coordinate
   * @param {number} newGridY - New grid Y coordinate
   * @returns {Object} Updated placed object
   */
  static movePlacedObject(placedObject, newGridX, newGridY) {
    const deltaX = newGridX - placedObject.gridX;
    const deltaY = newGridY - placedObject.gridY;

    // Move pixels
    const newPixels = placedObject.pixels.map(pixel => ({
      x: pixel.x + deltaX,
      y: pixel.y + deltaY
    }));

    // Move guidance lines
    const newGuidanceLines = placedObject.guidanceLines.map(guidanceLine => ({
      ...guidanceLine,
      originX: guidanceLine.originX + deltaX,
      originY: guidanceLine.originY + deltaY
    }));

    return {
      ...placedObject,
      gridX: newGridX,
      gridY: newGridY,
      pixels: newPixels,
      guidanceLines: newGuidanceLines
      // intact flag is preserved from original object
    };
  }

  /**
   * Rotate a placed object
   * @param {Object} placedObject - The placed object to rotate
   * @param {number} rotationDelta - Rotation to add (90, -90, etc.)
   * @returns {Object} Updated placed object
   */
  static rotatePlacedObject(placedObject, rotationDelta) {
    const newRotation = (placedObject.rotation + rotationDelta) % 360;

    // For rotation, we need to rotate around the placement point
    const centerX = placedObject.gridX;
    const centerY = placedObject.gridY;

    // Rotate pixels around center
    const newPixels = placedObject.pixels.map(pixel => {
      const relativeX = pixel.x - centerX;
      const relativeY = pixel.y - centerY;

      // Rotate 90 degrees clockwise: (x, y) -> (y, -x)
      const rotations = Math.floor(rotationDelta / 90) % 4;
      let newRelX = relativeX;
      let newRelY = relativeY;

      for (let i = 0; i < rotations; i++) {
        const temp = newRelX;
        newRelX = newRelY;
        newRelY = -temp;
      }

      return {
        x: centerX + newRelX,
        y: centerY + newRelY
      };
    });

    // Rotate guidance lines (this is more complex and may need brush-specific logic)
    const newGuidanceLines = placedObject.guidanceLines.map(guidanceLine => {
      // For now, keep guidance lines at the same position but update direction
      const directionMap = {
        'N': { 90: 'E', 180: 'S', 270: 'W' },
        'E': { 90: 'S', 180: 'W', 270: 'N' },
        'S': { 90: 'W', 180: 'N', 270: 'E' },
        'W': { 90: 'N', 180: 'E', 270: 'S' }
      };

      let newDirection = guidanceLine.direction;
      const rotations = Math.floor(rotationDelta / 90) % 4;

      for (let i = 0; i < rotations; i++) {
        newDirection = directionMap[newDirection]?.[90] || newDirection;
      }

      return {
        ...guidanceLine,
        direction: newDirection
      };
    });

    return {
      ...placedObject,
      rotation: newRotation,
      pixels: newPixels,
      guidanceLines: newGuidanceLines
    };
  }

  /**
   * Check if a placed object's pattern is still intact on the grid
   * @param {Object} placedObject - The placed object to check
   * @param {Array} grid - Current grid state
   * @param {Object} brushes - Available brushes to get original pattern
   * @returns {boolean} True if pattern is intact
   */
  static checkPatternIntegrity(placedObject, grid, brushes) {
    // Get the original brush
    const brush = brushes[placedObject.brushId] || brushes[placedObject.brushName];
    if (!brush) return false;

    // Apply rotation to get expected pattern
    let transformedBrush = brush;
    if (placedObject.rotation && placedObject.rotation !== 0) {
      const rotations = Math.floor(placedObject.rotation / 90) % 4;
      for (let i = 0; i < rotations; i++) {
        transformedBrush = this.rotateBrushClockwise(transformedBrush);
      }
    }

    // Check if all expected pixels are present
    return transformedBrush.pattern.every(([dy, dx]) => {
      const gridX = placedObject.gridX + dx;
      const gridY = placedObject.gridY + dy;

      // Check bounds
      if (gridY < 0 || gridY >= grid.length || gridX < 0 || gridX >= grid[0].length) {
        return false;
      }

      // Check if pixel is live
      return grid[gridY][gridX] === 1;
    });
  }

  /**
   * Update the intact status of all placed objects based on current grid
   * @param {Array} placedObjects - Array of placed objects to check
   * @param {Array} grid - Current grid state
   * @param {Object} brushes - Available brushes
   * @returns {Array} Updated placed objects with correct intact flags
   */
  static updatePlacedObjectsIntegrity(placedObjects, grid, brushes) {
    return placedObjects.map(placedObject => {
      const isIntact = this.checkPatternIntegrity(placedObject, grid, brushes);

      return {
        ...placedObject,
        intact: isIntact
      };
    });
  }

  /**
   * Get visible guidance lines from placed objects (only from intact patterns)
   * @param {Array} placedObjects - Array of placed objects
   * @returns {Array} Array of guidance line objects from intact patterns only
   */
  static getVisibleGuidanceLines(placedObjects) {
    return placedObjects
      .filter(placedObject => placedObject.intact) // Only intact patterns
      .flatMap(placedObject => placedObject.guidanceLines);
  }

  /**
   * Apply placed objects to a grid
   * @param {Array} grid - The grid to apply objects to
   * @param {Array} placedObjects - Array of placed objects
   * @returns {Array} New grid with objects applied
   */
  static applyPlacedObjectsToGrid(grid, placedObjects) {
    const newGrid = grid.map(row => [...row]);

    placedObjects.forEach(placedObject => {
      placedObject.pixels.forEach(pixel => {
        if (pixel.y >= 0 && pixel.y < newGrid.length &&
            pixel.x >= 0 && pixel.x < newGrid[0].length) {
          newGrid[pixel.y][pixel.x] = 1;
        }
      });
    });

    return newGrid;
  }

  /**
   * Extract guidance line objects from placed objects (only from intact patterns)
   * @param {Array} placedObjects - Array of placed objects
   * @returns {Array} Array of guidance line objects from intact patterns only
   */
  static extractGuidanceLines(placedObjects) {
    return this.getVisibleGuidanceLines(placedObjects);
  }

  /**
   * Remove a placed object and its guidance lines
   * @param {Array} placedObjects - Array of placed objects
   * @param {string} objectId - ID of object to remove
   * @returns {Array} Updated array without the specified object
   */
  static removePlacedObject(placedObjects, objectId) {
    return placedObjects.filter(obj => obj.id !== objectId);
  }

  /**
   * Find placed object at a specific grid position
   * @param {Array} placedObjects - Array of placed objects
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object|null} Found placed object or null
   */
  static findPlacedObjectAt(placedObjects, gridX, gridY) {
    return placedObjects.find(placedObject =>
      placedObject.pixels.some(pixel => pixel.x === gridX && pixel.y === gridY)
    ) || null;
  }

  /**
   * Rotate a brush pattern 90 degrees clockwise
   * @param {Object} brush - Brush to rotate
   * @returns {Object} Rotated brush
   */
  static rotateBrushClockwise(brush) {
    return BrushService.transformPattern(brush, 'rotateClockwise');
  }

  /**
   * Create guidance line object from brush guidance line
   * @param {Object} guidanceLine - Brush guidance line definition
   * @param {number} generation - Generation when created
   * @param {number} gridX - Grid X coordinate
   * @param {number} gridY - Grid Y coordinate
   * @returns {Object|null} Guidance line object
   */
  static createGuidanceLineFromBrush(guidanceLine, generation, gridX, gridY) {
    if (!guidanceLine) return null;

    return createGuidanceLineFromBrush(guidanceLine, generation, gridX, gridY);
  }
}

export default PlacedObjectService;
