// Unit tests for DetectorService
// Tests detector state management, coverage detection, and falloff behavior

import { DetectorService } from '../../src/services/detectorService.js';
import { DETECTOR_CONSTANTS } from '../../src/constants/gameConstants.js';

describe('DetectorService', () => {

  describe('initializeDetectors', () => {
    test('should initialize detectors from placed patterns', () => {
      const placedDetectors = [
        {
          pattern: [[0, 0]],
          position: { x: 5, y: 5 },
          initialValue: 0,
          falloffPeriod: 10
        },
        {
          pattern: [[0, 0], [0, 1], [1, 0]],
          position: { x: 10, y: 10 },
          initialValue: 1,
          falloffPeriod: 5
        }
      ];

      const detectors = DetectorService.initializeDetectors(placedDetectors);

      expect(detectors).toHaveLength(2);

      expect(detectors[0]).toMatchObject({
        id: 'detector_0',
        pattern: [[0, 0]],
        position: { x: 5, y: 5 },
        initialValue: 0,
        falloffPeriod: 10,
        currentValue: 0,
        activationTimer: 0,
        lastCoveredGeneration: -1
      });

      expect(detectors[1]).toMatchObject({
        id: 'detector_1',
        pattern: [[0, 0], [0, 1], [1, 0]],
        position: { x: 10, y: 10 },
        initialValue: 1,
        falloffPeriod: 5,
        currentValue: 1,
        activationTimer: 0,
        lastCoveredGeneration: -1
      });
    });
  });

  describe('initializeChallengeDetectors', () => {
    test('should initialize detectors from challenge configuration', () => {
      const challengeDetectors = [
        { x: 80, y: 0, state: 'active' },
        { x: -80, y: 0, direction: 'inactive' }
      ];
      const falloffPeriod = 43;

      const result = DetectorService.initializeChallengeDetectors(challengeDetectors, falloffPeriod);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'challenge_detector_0',
        pattern: [[0, 0]],
        position: { x: 80, y: 0 },
        initialValue: 0, // Always start in off state
        falloffPeriod: 43,
        currentValue: 0, // Always start in off state
        targetState: 1, // Target state is active
        isChallenge: true
      });
      expect(result[1]).toMatchObject({
        id: 'challenge_detector_1',
        pattern: [[0, 0]],
        position: { x: -80, y: 0 },
        initialValue: 0, // Always start in off state
        falloffPeriod: 43,
        currentValue: 0, // Always start in off state
        targetState: 0, // Target state is inactive
        isChallenge: true
      });
    });

    test('should handle direction property as alias for state', () => {
      const challengeDetectors = [
        { x: 0, y: 80, direction: 'active' },
        { x: 0, y: -80, direction: 'inactive' }
      ];

      const result = DetectorService.initializeChallengeDetectors(challengeDetectors, 10);

      expect(result[0].initialValue).toBe(0); // Always start in off state
      expect(result[0].targetState).toBe(1); // Target is active
      expect(result[1].initialValue).toBe(0); // Always start in off state
      expect(result[1].targetState).toBe(0); // Target is inactive
    });

    test('should preserve index property from challenge configuration', () => {
      const challengeDetectors = [
        { x: 10, y: 10, state: 'active', index: 2 },
        { x: 20, y: 20, state: 'inactive', index: 0 },
        { x: 30, y: 30, direction: 'active', index: 1 }
      ];
      const falloffPeriod = 15;

      const result = DetectorService.initializeChallengeDetectors(challengeDetectors, falloffPeriod);

      expect(result).toHaveLength(3);

      // Check that index is preserved for each detector
      expect(result[0].index).toBe(2);
      expect(result[1].index).toBe(0);
      expect(result[2].index).toBe(1);

      // Verify other properties are still correct
      expect(result[0]).toMatchObject({
        id: 'challenge_detector_0',
        position: { x: 10, y: 10 },
        targetState: 1,
        index: 2
      });

      expect(result[1]).toMatchObject({
        id: 'challenge_detector_1',
        position: { x: 20, y: 20 },
        targetState: 0,
        index: 0
      });

      expect(result[2]).toMatchObject({
        id: 'challenge_detector_2',
        position: { x: 30, y: 30 },
        targetState: 1,
        index: 1
      });
    });

    test('should handle detectors without index property', () => {
      const challengeDetectors = [
        { x: 10, y: 10, state: 'active', index: 1 },
        { x: 20, y: 20, state: 'inactive' }, // No index property
        { x: 30, y: 30, direction: 'active', index: 0 }
      ];

      const result = DetectorService.initializeChallengeDetectors(challengeDetectors, 10);

      expect(result[0].index).toBe(1);
      expect(result[1].index).toBeUndefined(); // Should remain undefined
      expect(result[2].index).toBe(0);
    });

    test('should handle mixed index values including zero', () => {
      const challengeDetectors = [
        { x: 10, y: 10, state: 'active', index: 0 },
        { x: 20, y: 20, state: 'inactive', index: 3 },
        { x: 30, y: 30, direction: 'active', index: 1 },
        { x: 40, y: 40, direction: 'inactive', index: 2 }
      ];

      const result = DetectorService.initializeChallengeDetectors(challengeDetectors, 10);

      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(3);
      expect(result[2].index).toBe(1);
      expect(result[3].index).toBe(2);
    });
  });

  describe('initializeDetectorStates', () => {
    test('should activate initially covered detectors', () => {
      const detectors = [
        {
          id: 'test1',
          pattern: [[0, 0]],
          position: { x: 1, y: 1 },
          currentValue: 0,
          falloffPeriod: 10,
          activationTimer: 0,
          lastCoveredGeneration: -1
        },
        {
          id: 'test2',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 },
          currentValue: 0,
          falloffPeriod: 10,
          activationTimer: 0,
          lastCoveredGeneration: -1
        }
      ];

      // Grid with detector at (1,1) covered but (2,2) not covered
      const grid = [
        [0, 0, 0, 0],
        [0, 1, 0, 0], // Position (1,1) is covered
        [0, 0, 0, 0], // Position (2,2) is not covered
        [0, 0, 0, 0]
      ];

      const result = DetectorService.initializeDetectorStates(detectors, grid, 0);

      // First detector should be activated
      expect(result[0].currentValue).toBe(1);
      expect(result[0].activationTimer).toBe(10);
      expect(result[0].lastCoveredGeneration).toBe(0);

      // Second detector should remain inactive
      expect(result[1].currentValue).toBe(0);
      expect(result[1].activationTimer).toBe(0);
      expect(result[1].lastCoveredGeneration).toBe(-1);
    });

    test('should keep detectors unchanged if not covered', () => {
      const detectors = [
        {
          id: 'test1',
          pattern: [[0, 0]],
          position: { x: 1, y: 1 },
          currentValue: 0,
          falloffPeriod: 10,
          activationTimer: 0,
          lastCoveredGeneration: -1
        }
      ];

      // Empty grid
      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
      ];

      const result = DetectorService.initializeDetectorStates(detectors, grid, 0);

      expect(result[0]).toEqual(detectors[0]); // Should be unchanged
    });
  });

  describe('checkDetectorWinCondition', () => {
    test('should return true when all detectors match target states', () => {
      const detectors = [
        { currentValue: 1, targetState: 1 },
        { currentValue: 0, targetState: 0 },
        { currentValue: 1 } // No target state - should be ignored
      ];

      const result = DetectorService.checkDetectorWinCondition(detectors);

      expect(result).toBe(true);
    });

    test('should return false when some detectors do not match target states', () => {
      const detectors = [
        { currentValue: 1, targetState: 1 },
        { currentValue: 1, targetState: 0 }, // Mismatch!
        { currentValue: 1 } // No target state - should be ignored
      ];

      const result = DetectorService.checkDetectorWinCondition(detectors);

      expect(result).toBe(false);
    });

    test('should return true for empty detectors array', () => {
      const result = DetectorService.checkDetectorWinCondition([]);

      expect(result).toBe(true);
    });

    test('should ignore detectors without target states', () => {
      const detectors = [
        { currentValue: 1 }, // No target state
        { currentValue: 0 }  // No target state
      ];

      const result = DetectorService.checkDetectorWinCondition(detectors);

      expect(result).toBe(true);
    });
  });

  describe('isDetectorFullyCovered', () => {
    const detector = {
      pattern: [[0, 0], [0, 1], [1, 0]], // L-shape
      position: { x: 2, y: 3 }
    };

    test('should return true when all detector pixels are covered', () => {
      const grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 1, 1, 0], // Row 3: positions (2,3) and (2,4) covered
        [0, 0, 1, 0, 0]  // Row 4: position (3,2) covered
      ];

      expect(DetectorService.isDetectorFullyCovered(detector, grid)).toBe(true);
    });

    test('should return false when some detector pixels are not covered', () => {
      const grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 1, 0, 0], // Row 3: only position (2,3) covered, (2,4) not covered
        [0, 0, 1, 0, 0]  // Row 4: position (3,2) covered
      ];

      expect(DetectorService.isDetectorFullyCovered(detector, grid)).toBe(false);
    });

    test('should return false when detector is outside grid bounds', () => {
      const outOfBoundsDetector = {
        pattern: [[0, 0]],
        position: { x: 10, y: 10 } // Outside 5x5 grid
      };

      const grid = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0]
      ];

      expect(DetectorService.isDetectorFullyCovered(outOfBoundsDetector, grid)).toBe(false);
    });
  });

  describe('updateDetectors', () => {
    test('should activate detector when fully covered', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 },
          currentValue: 0,
          activationTimer: 0,
          falloffPeriod: 5,
          lastCoveredGeneration: -1
        }
      ];

      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 1] // Position (2,2) is covered
      ];

      const updatedDetectors = DetectorService.updateDetectors(detectors, grid, 10);

      expect(updatedDetectors[0]).toMatchObject({
        currentValue: 1,
        activationTimer: 5,
        lastCoveredGeneration: 10
      });
    });

    test('should maintain activation during falloff period', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 },
          currentValue: 1,
          activationTimer: 3, // Still has timer
          falloffPeriod: 5,
          lastCoveredGeneration: 5
        }
      ];

      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0] // Position (2,2) is not covered
      ];

      const updatedDetectors = DetectorService.updateDetectors(detectors, grid, 8);

      expect(updatedDetectors[0]).toMatchObject({
        currentValue: 1, // Still active
        activationTimer: 2, // Timer decremented
        lastCoveredGeneration: 5
      });
    });

    test('should deactivate detector when falloff period expires', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 },
          currentValue: 1,
          activationTimer: 1, // About to expire
          falloffPeriod: 5,
          lastCoveredGeneration: 5
        }
      ];

      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0] // Position (2,2) is not covered
      ];

      const updatedDetectors = DetectorService.updateDetectors(detectors, grid, 10);

      expect(updatedDetectors[0]).toMatchObject({
        currentValue: 0, // Deactivated
        activationTimer: 0,
        lastCoveredGeneration: 5
      });
    });

    test('should reset timer when detector is covered again during falloff', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 },
          currentValue: 1,
          activationTimer: 2, // In falloff
          falloffPeriod: 5,
          lastCoveredGeneration: 8
        }
      ];

      const grid = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 1] // Position (2,2) is covered again
      ];

      const updatedDetectors = DetectorService.updateDetectors(detectors, grid, 12);

      expect(updatedDetectors[0]).toMatchObject({
        currentValue: 1,
        activationTimer: 5, // Timer reset to full falloff period
        lastCoveredGeneration: 12
      });
    });
  });

  describe('getDetectorRenderData', () => {
    test('should calculate render data for detectors', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 5, y: 5 },
          currentValue: 1,
          activationTimer: 3,
          falloffPeriod: 10
        },
        {
          id: 'detector_1',
          pattern: [[0, 0], [0, 1], [1, 0]], // L-shape
          position: { x: 2, y: 3 },
          currentValue: 0,
          activationTimer: 0,
          falloffPeriod: 5
        }
      ];

      const renderData = DetectorService.getDetectorRenderData(detectors);

      expect(renderData).toHaveLength(2);

      expect(renderData[0]).toMatchObject({
        id: 'detector_0',
        positions: [{ x: 5, y: 5 }],
        centerX: 5,
        centerY: 5,
        currentValue: 1,
        activationTimer: 3,
        falloffPeriod: 10
      });

      expect(renderData[1]).toMatchObject({
        id: 'detector_1',
        positions: [
          { x: 2, y: 3 },
          { x: 3, y: 3 }, // position + [dy, dx] = [2,3] + [0,1] = [2,4] -> x=3, y=3
          { x: 2, y: 4 }  // position + [dy, dx] = [2,3] + [1,0] = [3,2] -> x=2, y=4
        ],
        centerX: 2, // (2+3+2)/3 = 2.33, rounded to 2
        centerY: 3, // (3+3+4)/3 = 3.33, rounded to 3
        currentValue: 0,
        activationTimer: 0,
        falloffPeriod: 5
      });
    });
  });

  describe('addDetector', () => {
    test('should add new detector to array', () => {
      const existingDetectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 1, y: 1 }
        }
      ];

      const detectorPattern = {
        pattern: [[0, 0], [1, 0]],
        initialValue: 1,
        falloffPeriod: 8
      };

      const newDetectors = DetectorService.addDetector(
        existingDetectors,
        detectorPattern,
        { x: 5, y: 5 }
      );

      expect(newDetectors).toHaveLength(2);
      expect(newDetectors[1]).toMatchObject({
        id: 'detector_1',
        pattern: [[0, 0], [1, 0]],
        position: { x: 5, y: 5 },
        initialValue: 1,
        falloffPeriod: 8,
        currentValue: 1,
        activationTimer: 0,
        lastCoveredGeneration: -1
      });
    });
  });

  describe('removeDetectorsAtPosition', () => {
    test('should remove detectors that overlap with erase pattern', () => {
      const detectors = [
        {
          id: 'detector_0',
          pattern: [[0, 0]],
          position: { x: 2, y: 2 } // Single pixel at (2,2)
        },
        {
          id: 'detector_1',
          pattern: [[0, 0]],
          position: { x: 5, y: 5 } // Single pixel at (5,5) - far away
        },
        {
          id: 'detector_2',
          pattern: [[0, 0], [0, 1]], // Two pixels at (1,2) and (2,2) - [dy,dx] format
          position: { x: 1, y: 2 }   // position + [0,1] = (1+1, 2+0) = (2,2)
        }
      ];

      const erasePattern = [[0, 0]]; // Single cell erase
      const erasePosition = { x: 2, y: 2 }; // Erasing at (2,2)

      const remainingDetectors = DetectorService.removeDetectorsAtPosition(
        detectors,
        erasePosition,
        erasePattern
      );

      // detector_0 and detector_2 should be removed (both have pixels at (2,2))
      // detector_1 should remain (pixel at (5,5))
      expect(remainingDetectors).toHaveLength(1);
      expect(remainingDetectors[0].id).toBe('detector_1');
    });
  });
});
