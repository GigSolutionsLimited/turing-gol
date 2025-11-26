// Brush service for loading and managing pattern brushes
import { parseRLEFile } from '../utils/rleUtils.js';
import { PATTERN_TYPES, DETECTOR_CONSTANTS } from '../constants/gameConstants.js';

/**
 * Service for managing pattern brushes
 */
export class BrushService {
  /**
   * Discover available brush files from the brushes directory
   * Uses manifest.json as the authoritative source of available brushes
   * @returns {Promise<string[]>} Array of available brush filenames
   */
  static async discoverBrushFiles() {
    try {
      const manifestResponse = await fetch('/brushes/manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        if (manifest.brushes && Array.isArray(manifest.brushes)) {
          return manifest.brushes;
        }
      }

      // If manifest doesn't exist or is invalid, return empty array
      console.warn('No valid manifest.json found in /brushes/ directory');
      return [];
    } catch (error) {
      console.warn('Failed to load brush manifest:', error);
      return [];
    }
  }

  /**
   * Load all available brushes from the brushes folder
   * @returns {Promise<Object>} Object with brush IDs as keys and brush data as values
   */
  static async loadAllBrushes() {
    const brushes = {};
    const availableFiles = await BrushService.discoverBrushFiles();

    for (const file of availableFiles) {
      try {
        const response = await fetch(`/brushes/${file}`);
        if (response.ok) {
          const rleContent = await response.text();
          const brushData = parseRLEFile(rleContent);
          const brushId = file.replace('.rle', '');

          // Check if this should be a detector pattern based on filename
          if (brushId.toLowerCase().includes('detector')) {
            // Convert to detector pattern
            brushes[brushId] = BrushService.createDetectorPattern(
              brushData.name || brushId,
              brushData.pattern,
              {
                initialValue: brushId.includes('active') ? 1 : 0, // Default to inactive unless specified
                falloffPeriod: DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
              }
            );
          } else {
            // Regular brush pattern
            brushes[brushId] = brushData;
          }
        }
      } catch (error) {
        console.warn(`Failed to load brush ${file}:`, error);
      }
    }

    return brushes;
  }

  /**
   * Get patterns available for a specific challenge
   * @param {Object} challenge - Challenge configuration
   * @param {Object} brushes - Available brushes
   * @returns {Array} Array of pattern objects
   */
  static getPatternsForChallenge(challenge, brushes) {
    if (!challenge || !challenge.brushes || !brushes) {
      return [];
    }

    return challenge.brushes
      .map(brushId => brushes[brushId])
      .filter(Boolean);
  }

  /**
   * Check if a pattern is an eraser pattern
   * @param {Object} pattern - Pattern object
   * @returns {boolean} Whether the pattern is an eraser
   */
  static isEraserPattern(pattern) {
    return pattern && pattern.name && pattern.name.toLowerCase().includes('eraser');
  }

  /**
   * Check if a pattern is a detector pattern
   * @param {Object} pattern - Pattern object
   * @returns {boolean} Whether the pattern is a detector
   */
  static isDetectorPattern(pattern) {
    return pattern && pattern.type === PATTERN_TYPES.DETECTOR;
  }

  /**
   * Get the pattern type
   * @param {Object} pattern - Pattern object
   * @returns {string} Pattern type
   */
  static getPatternType(pattern) {
    if (BrushService.isDetectorPattern(pattern)) {
      return PATTERN_TYPES.DETECTOR;
    }
    if (BrushService.isEraserPattern(pattern)) {
      return PATTERN_TYPES.ERASER;
    }
    return PATTERN_TYPES.NORMAL;
  }

  /**
   * Create a detector pattern
   * @param {string} name - Detector name
   * @param {Array} pattern - Pattern coordinates [[y, x], ...]
   * @param {Object} options - Detector options
   * @param {number} challengeFalloffPeriod - Falloff period from challenge (optional)
   * @returns {Object} Detector pattern object
   */
  static createDetectorPattern(name, pattern, options = {}, challengeFalloffPeriod = null) {
    const {
      initialValue = 0,
      falloffPeriod = challengeFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
    } = options;

    return {
      name,
      type: PATTERN_TYPES.DETECTOR,
      pattern,
      initialValue,
      falloffPeriod,
      // Current state (will be managed by game logic)
      currentValue: initialValue,
      activationTimer: 0,
      lastCoveredGeneration: -1
    };
  }

  /**
   * Update a detector pattern with challenge-specific falloff period
   * @param {Object} detectorPattern - Original detector pattern
   * @param {number} challengeFalloffPeriod - Challenge's falloff period
   * @returns {Object} Updated detector pattern
   */
  static updateDetectorWithChallengeFalloff(detectorPattern, challengeFalloffPeriod) {
    if (!BrushService.isDetectorPattern(detectorPattern) || !challengeFalloffPeriod) {
      return detectorPattern;
    }

    return {
      ...detectorPattern,
      falloffPeriod: challengeFalloffPeriod
    };
  }

  /**
   * Apply pattern transformations (flip/rotate)
   * @param {Object} pattern - Pattern to transform
   * @param {string} transformation - Transformation type ('flipX', 'flipY', 'rotateClockwise', 'rotateCounterclockwise')
   * @returns {Object} Transformed pattern
   */
  static transformPattern(pattern, transformation) {
    if (!pattern || !pattern.pattern) return pattern;

    const coords = pattern.pattern;
    if (coords.length === 0) return pattern;

    let transformedCoords;

    if (transformation === 'rotateClockwise' || transformation === 'rotateCounterclockwise') {
      // For rotations, rotate around origin (0,0) first
      switch (transformation) {
        case 'rotateClockwise':
          // Rotate 90 degrees clockwise around origin
          transformedCoords = coords.map(([y, x]) => [
            Math.round(x) || 0, // Ensure positive zero
            Math.round(-y) || 0 // Ensure positive zero
          ]);
          break;

        case 'rotateCounterclockwise':
          // Rotate 90 degrees counterclockwise around origin
          transformedCoords = coords.map(([y, x]) => [
            Math.round(-x) || 0, // Ensure positive zero
            Math.round(y) || 0   // Ensure positive zero
          ]);
          break;
      }

      // Normalize the pattern so it always "hangs" from top-left (0,0)
      // Find the minimum coordinates after rotation
      const minY = Math.min(...transformedCoords.map(([y]) => y));
      const minX = Math.min(...transformedCoords.map(([, x]) => x));

      // Offset all coordinates to make the top-left corner at (0,0)
      transformedCoords = transformedCoords.map(([y, x]) => [y - minY, x - minX]);
    } else {
      // For flips, use center-based transformation to maintain pattern integrity
      // Find pattern bounds
      const maxY = Math.max(...coords.map(([y]) => y));
      const minY = Math.min(...coords.map(([y]) => y));
      const maxX = Math.max(...coords.map(([, x]) => x));
      const minX = Math.min(...coords.map(([, x]) => x));

      const centerY = Math.floor((maxY + minY) / 2);
      const centerX = Math.floor((maxX + minX) / 2);

      switch (transformation) {
        case 'flipX':
          // Flip around X axis (vertical flip)
          transformedCoords = coords.map(([y, x]) => [Math.round(2 * centerY - y), Math.round(x)]);
          break;

        case 'flipY':
          // Flip around Y axis (horizontal flip)
          transformedCoords = coords.map(([y, x]) => [Math.round(y), Math.round(2 * centerX - x)]);
          break;

        default:
          return pattern;
      }
    }

    // Transform guidance lines if present
    let transformedGuidanceLine = pattern.guidanceLine;
    let transformedGuidanceLines = pattern.guidanceLines;
    let normalizationOffset = { offsetY: 0, offsetX: 0 };

    // For rotations, calculate the normalization offset that was applied to the pattern
    if ((transformation === 'rotateClockwise' || transformation === 'rotateCounterclockwise') && transformedCoords.length > 0) {
      // Find the offset that was applied during normalization
      let minY, minX;

      if (transformation === 'rotateClockwise') {
        minY = Math.min(...coords.map(([, x]) => Math.round(x) || 0));
        minX = Math.min(...coords.map(([y]) => Math.round(-y) || 0));
      } else { // rotateCounterclockwise
        minY = Math.min(...coords.map(([, x]) => Math.round(-x) || 0));
        minX = Math.min(...coords.map(([y]) => Math.round(y) || 0));
      }

      normalizationOffset = { offsetY: -minY, offsetX: -minX };
    }

    if (pattern.guidanceLine || pattern.guidanceLines) {
      // Handle single guidance line (for backward compatibility)
      if (pattern.guidanceLine) {
        transformedGuidanceLine = BrushService.transformGuidanceLine(pattern.guidanceLine, transformation, coords, normalizationOffset);
      }

      // Handle multiple guidance lines
      if (pattern.guidanceLines && Array.isArray(pattern.guidanceLines)) {
        transformedGuidanceLines = pattern.guidanceLines.map(guidanceLine =>
          BrushService.transformGuidanceLine(guidanceLine, transformation, coords, normalizationOffset)
        );
      }
    }

    const result = {
      ...pattern,
      pattern: transformedCoords
    };

    // Maintain backward compatibility while supporting multiple guidance lines
    if (transformedGuidanceLine !== undefined) {
      result.guidanceLine = transformedGuidanceLine;
    }

    if (transformedGuidanceLines !== undefined) {
      result.guidanceLines = transformedGuidanceLines;
    }

    return result;
  }

  /**
   * Transform guidance line direction and position for pattern rotation and flips
   * @param {Object} guidanceLine - Guidance line specification
   * @param {string} transformation - Transformation type
   * @param {Array} patternCoords - Pattern coordinates for center-based transformations (optional)
   * @param {Object} normalizationOffset - Offset applied during pattern normalization (for rotations)
   * @returns {Object} Transformed guidance line specification
   */
  static transformGuidanceLine(guidanceLine, transformation, patternCoords = null, normalizationOffset = { offsetY: 0, offsetX: 0 }) {
    if (!guidanceLine || !guidanceLine.direction) return guidanceLine;

    // Direction mapping
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const currentIndex = directions.indexOf(guidanceLine.direction.toUpperCase());

    if (currentIndex === -1) return guidanceLine;

    let newIndex = currentIndex;
    let newStartX = guidanceLine.startX || 0;
    let newStartY = guidanceLine.startY || 0;
    let newDirection = guidanceLine.direction;

    switch (transformation) {
      case 'rotateClockwise': {
        // Rotate 90 degrees clockwise (2 steps in direction array)
        newIndex = (currentIndex + 2) % directions.length;

        // Apply correct 90° clockwise rotation for Y-down coordinate system
        // Standard rotation matrix for clockwise in Y-down: [x, y] -> [-y, x]
        const tempX = newStartX;
        newStartX = -newStartY || 0; // Ensure positive zero
        newStartY = tempX || 0;

        // Apply normalization offset to match pattern normalization
        newStartX += normalizationOffset.offsetX;
        newStartY += normalizationOffset.offsetY;

        newDirection = directions[newIndex];
        break;
      }

      case 'rotateCounterclockwise': {
        // Rotate 90 degrees counterclockwise (2 steps backwards in direction array)
        newIndex = (currentIndex - 2 + directions.length) % directions.length;

        // Apply correct 90° counterclockwise rotation for Y-down coordinate system
        // Standard rotation matrix for counterclockwise in Y-down: [x, y] -> [y, -x]
        const tempY = newStartY;
        newStartY = -newStartX || 0; // Ensure positive zero
        newStartX = tempY || 0;

        // Apply normalization offset to match pattern normalization
        newStartX += normalizationOffset.offsetX;
        newStartY += normalizationOffset.offsetY;

        newDirection = directions[newIndex];
        break;
      }

      case 'flipX': {
        // Flip vertically: transform relative to pattern center if available
        if (patternCoords && patternCoords.length > 0) {
          const maxY = Math.max(...patternCoords.map(([y]) => y));
          const minY = Math.min(...patternCoords.map(([y]) => y));
          const centerY = Math.floor((maxY + minY) / 2);
          newStartY = 2 * centerY - newStartY;
        } else {
          newStartY = -newStartY;
        }

        switch (guidanceLine.direction.toUpperCase()) {
          case 'N': newDirection = 'S'; break;
          case 'S': newDirection = 'N'; break;
          case 'NE': newDirection = 'SE'; break;
          case 'SE': newDirection = 'NE'; break;
          case 'NW': newDirection = 'SW'; break;
          case 'SW': newDirection = 'NW'; break;
          default: newDirection = guidanceLine.direction; break;
        }
        break;
      }

      case 'flipY': {
        // Flip horizontally: transform relative to pattern center if available
        if (patternCoords && patternCoords.length > 0) {
          const maxX = Math.max(...patternCoords.map(([, x]) => x));
          const minX = Math.min(...patternCoords.map(([, x]) => x));
          const centerX = Math.floor((maxX + minX) / 2);
          newStartX = 2 * centerX - newStartX;
        } else {
          newStartX = -newStartX;
        }

        switch (guidanceLine.direction.toUpperCase()) {
          case 'E': newDirection = 'W'; break;
          case 'W': newDirection = 'E'; break;
          case 'NE': newDirection = 'NW'; break;
          case 'NW': newDirection = 'NE'; break;
          case 'SE': newDirection = 'SW'; break;
          case 'SW': newDirection = 'SE'; break;
          default: newDirection = guidanceLine.direction; break;
        }
        break;
      }

      default:
        return guidanceLine;
    }

    return {
      ...guidanceLine,
      direction: newDirection,
      startX: newStartX,
      startY: newStartY
    };
  }
}
