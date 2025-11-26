// Detector service for managing detector patterns and their state
import { DETECTOR_CONSTANTS } from '../constants/gameConstants.js';

/**
 * Service for managing detector patterns and their state
 */
export class DetectorService {
  /**
   * Initialize detectors from placed patterns
   * @param {Array} placedDetectors - Array of placed detector patterns with positions
   * @returns {Array} Array of detector state objects
   */
  static initializeDetectors(placedDetectors) {
    return placedDetectors.map((placedDetector, index) => ({
      id: `detector_${index}`,
      pattern: placedDetector.pattern,
      position: placedDetector.position, // {x, y} - top-left position
      initialValue: placedDetector.initialValue || 0,
      falloffPeriod: placedDetector.falloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD,
      currentValue: placedDetector.initialValue || 0,
      activationTimer: 0,
      lastCoveredGeneration: -1
    }));
  }

  /**
   * Initialize detectors from challenge configuration
   * @param {Array} challengeDetectors - Array of detector configs from challenge JSON
   * @param {number} falloffPeriod - Falloff period from challenge
   * @returns {Array} Array of detector state objects
   */
  static initializeChallengeDetectors(challengeDetectors, falloffPeriod) {
    return challengeDetectors.map((detectorConfig, index) => {
      const targetState = (detectorConfig.state === 'active' || detectorConfig.direction === 'active') ? 1 : 0;
      return {
        id: `challenge_detector_${index}`,
        pattern: [[0, 0]], // Single pixel detector
        position: { x: detectorConfig.x, y: detectorConfig.y },
        initialValue: 0, // Always start in off state
        falloffPeriod: falloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD,
        currentValue: 0, // Always start in off state
        activationTimer: 0,
        lastCoveredGeneration: -1,
        targetState: targetState, // Target state for win condition
        isChallenge: true, // Flag to identify challenge detectors for special rendering
        index: detectorConfig.index // Preserve the index from challenge configuration
      };
    });
  }

  /**
   * Update detector states based on current grid
   * @param {Array} detectors - Array of detector objects
   * @param {Array} grid - Current grid state
   * @param {number} generation - Current generation number
   * @returns {Array} Updated detector states
   */
  static updateDetectors(detectors, grid, generation) {
    // Defensive programming: validate inputs
    if (!Array.isArray(detectors)) {
      console.warn('🧪 DetectorService.updateDetectors: detectors is not an array:', detectors);
      return [];
    }

    if (!Array.isArray(grid) || grid.length === 0) {
      console.warn('🧪 DetectorService.updateDetectors: grid is null or empty:', grid);
      return detectors; // Return detectors unchanged if grid is invalid
    }

    return detectors.map((detector) => {
      const isFullyCovered = DetectorService.isDetectorFullyCovered(detector, grid);

      let newValue = detector.currentValue;
      let newTimer = detector.activationTimer;
      let newLastCovered = detector.lastCoveredGeneration;

      if (isFullyCovered) {
        // Detector is fully covered - activate it
        newValue = 1;
        newTimer = detector.falloffPeriod;
        newLastCovered = generation;
      } else {
        // Detector is not fully covered
        if (newTimer > 0) {
          // Still in falloff period
          newTimer--;
          if (newTimer === 0) {
            // Falloff period expired
            newValue = 0;
          }
        } else {
          // Not covered and no timer - value becomes 0
          newValue = 0;
        }
      }

      return {
        ...detector,
        currentValue: newValue,
        activationTimer: newTimer,
        lastCoveredGeneration: newLastCovered
      };
    });
  }

  /**
   * Check if a detector is fully covered by the grid
   * @param {Object} detector - Detector state object
   * @param {Array} grid - Current grid state
   * @returns {boolean} Whether the detector is fully covered
   */
  static isDetectorFullyCovered(detector, grid) {
    // Defensive programming: validate inputs
    if (!detector || !detector.pattern || !Array.isArray(detector.pattern)) {
      return false;
    }

    if (!Array.isArray(grid) || grid.length === 0) {
      return false;
    }

    const gridHeight = grid.length;
    const gridWidth = gridHeight > 0 ? grid[0].length : 0;

    if (gridWidth === 0) {
      return false;
    }

    // Check if all detector pixels are covered by live cells
    return detector.pattern.every(([dy, dx]) => {
      const gridY = detector.position.y + dy;
      const gridX = detector.position.x + dx;

      // Check bounds
      if (gridY < 0 || gridY >= gridHeight || gridX < 0 || gridX >= gridWidth) {
        return false;
      }

      // Check if cell is alive
      return grid[gridY][gridX] === 1;
    });
  }

  /**
   * Get detector positions for rendering
   * @param {Array} detectors - Array of detector state objects
   * @returns {Array} Array of detector render data
   */
  static getDetectorRenderData(detectors) {
    return detectors.map(detector => {
      // Find the center position for value display
      const positions = detector.pattern.map(([dy, dx]) => ({
        x: detector.position.x + dx,
        y: detector.position.y + dy
      }));

      // Calculate center position (for value display)
      const centerX = positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length;
      const centerY = positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length;

      return {
        id: detector.id,
        positions: positions,
        centerX: Math.round(centerX),
        centerY: Math.round(centerY),
        currentValue: detector.currentValue,
        activationTimer: detector.activationTimer,
        falloffPeriod: detector.falloffPeriod,
        targetState: detector.targetState,
        isChallenge: detector.isChallenge
      };
    });
  }

  /**
   * Add a new detector to the detectors array
   * @param {Array} detectors - Current detectors array
   * @param {Object} detectorPattern - Detector pattern object
   * @param {Object} position - Position {x, y}
   * @param {Object} options - Optional overrides {falloffPeriod}
   * @returns {Array} Updated detectors array
   */
  static addDetector(detectors, detectorPattern, position, options = {}) {
    const newDetector = {
      id: `detector_${detectors.length}`,
      pattern: detectorPattern.pattern,
      position: position,
      initialValue: detectorPattern.initialValue || 0,
      falloffPeriod: options.falloffPeriod !== undefined ?
        options.falloffPeriod :
        (detectorPattern.falloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD),
      currentValue: detectorPattern.initialValue || 0,
      activationTimer: 0,
      lastCoveredGeneration: -1
    };

    return [...detectors, newDetector];
  }

  /**
   * Remove detectors at a specific position (for eraser functionality)
   * @param {Array} detectors - Current detectors array
   * @param {Object} position - Position {x, y}
   * @param {Array} erasePattern - Erase pattern coordinates
   * @returns {Array} Updated detectors array
   */
  static removeDetectorsAtPosition(detectors, position, erasePattern) {
    return detectors.filter(detector => {
      // Check if any detector pixel overlaps with any erase pixel
      return !detector.pattern.some(([detectorDy, detectorDx]) => {
        const detectorX = detector.position.x + detectorDx;
        const detectorY = detector.position.y + detectorDy;

        return erasePattern.some(([eraseDy, eraseDx]) => {
          const eraseX = position.x + eraseDx;
          const eraseY = position.y + eraseDy;

          return detectorX === eraseX && detectorY === eraseY;
        });
      });
    });
  }

  /**
   * Check if all challenge detectors match their target states
   * @param {Array} detectors - Array of detector state objects
   * @returns {boolean} Whether all detectors match their target states
   */
  static checkDetectorWinCondition(detectors) {
    return detectors.every(detector => {
      // Only check detectors that have a target state (challenge detectors)
      if (detector.targetState === undefined) return true;
      return detector.currentValue === detector.targetState;
    });
  }

  /**
   * Initialize detector states based on current grid coverage
   * Called when play starts to activate any initially covered detectors
   * @param {Array} detectors - Array of detector state objects
   * @param {Array} grid - Current grid state
   * @param {number} generation - Current generation number (usually 0)
   * @returns {Array} Updated detector states
   */
  static initializeDetectorStates(detectors, grid, generation) {
    return detectors.map(detector => {
      const isFullyCovered = DetectorService.isDetectorFullyCovered(detector, grid);

      if (isFullyCovered) {
        // Detector is initially covered - activate it immediately
        return {
          ...detector,
          currentValue: 1,
          activationTimer: detector.falloffPeriod,
          lastCoveredGeneration: generation
        };
      }

      // Not covered, keep current state
      return detector;
    });
  }
}
