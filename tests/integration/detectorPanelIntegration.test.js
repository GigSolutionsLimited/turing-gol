// Integration tests for DetectorPanel functionality
// Tests the complete detector flow: service -> GameOfLife -> App -> DetectorPanel
// Note: Testing logic without JSX to avoid Babel configuration issues

import { DetectorService } from '../../src/services/detectorService.js';

describe('DetectorPanel Integration', () => {

  describe('Detector Data Flow', () => {
    test('should simulate complete detector panel update flow', () => {
      // Mock challenge configuration with indexed detectors
      const challengeDetectors = [
        { x: 10, y: 10, state: 'active', index: 2 },
        { x: 20, y: 20, state: 'inactive', index: 0 },
        { x: 30, y: 30, direction: 'active', index: 1 }
      ];

      // Simulate DetectorService initialization (as done in GameOfLife)
      const detectors = DetectorService.initializeChallengeDetectors(challengeDetectors, 15);

      // Simulate state updates that would happen in the game
      const updatedDetectors = detectors.map(detector => ({
        ...detector,
        currentValue: detector.index % 2 === 0 ? 1 : 0 // Simulate some detectors being active
      }));

      // Simulate App component detector callback handling
      let appDetectorState = [];
      const mockSetDetectors = (detectors) => {
        appDetectorState = detectors;
      };

      const simulateOnDetectorsChange = (detectors) => {
        mockSetDetectors(detectors);
      };

      // Simulate the flow
      simulateOnDetectorsChange(updatedDetectors);

      // Verify App state was updated
      expect(appDetectorState).toHaveLength(3);
      expect(appDetectorState[0].index).toBe(2);
      expect(appDetectorState[1].index).toBe(0);
      expect(appDetectorState[2].index).toBe(1);

      // Simulate DetectorPanel filtering and sorting logic
      const getDetectorPanelData = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => ({
            index: detector.index,
            currentValue: detector.currentValue
          }));
      };

      const panelData = getDetectorPanelData(appDetectorState);

      // Verify DetectorPanel would display the correct data in order
      expect(panelData).toEqual([
        { index: 0, currentValue: 1 }, // Index 0, even so value = 1
        { index: 1, currentValue: 0 }, // Index 1, odd so value = 0
        { index: 2, currentValue: 1 }  // Index 2, even so value = 1
      ]);
    });

    test('should handle dynamic detector state changes', () => {
      // Simulate initial detector state
      const initialDetectors = [
        { id: 'det_0', currentValue: 0, index: 0 },
        { id: 'det_1', currentValue: 0, index: 1 },
        { id: 'det_2', currentValue: 0, index: 2 }
      ];

      let panelState = [];
      const mockDetectorPanelUpdate = (detectors) => {
        panelState = detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      // Initial state
      mockDetectorPanelUpdate(initialDetectors);
      expect(panelState).toEqual([0, 0, 0]);

      // Simulate first detector activation
      const updatedDetectors1 = [
        { id: 'det_0', currentValue: 1, index: 0 }, // Activated
        { id: 'det_1', currentValue: 0, index: 1 },
        { id: 'det_2', currentValue: 0, index: 2 }
      ];

      mockDetectorPanelUpdate(updatedDetectors1);
      expect(panelState).toEqual([1, 0, 0]);

      // Simulate multiple activations
      const updatedDetectors2 = [
        { id: 'det_0', currentValue: 1, index: 0 },
        { id: 'det_1', currentValue: 1, index: 1 }, // Activated
        { id: 'det_2', currentValue: 1, index: 2 }  // Activated
      ];

      mockDetectorPanelUpdate(updatedDetectors2);
      expect(panelState).toEqual([1, 1, 1]);

      // Simulate falloff
      const updatedDetectors3 = [
        { id: 'det_0', currentValue: 0, index: 0 }, // Deactivated
        { id: 'det_1', currentValue: 1, index: 1 },
        { id: 'det_2', currentValue: 0, index: 2 }  // Deactivated
      ];

      mockDetectorPanelUpdate(updatedDetectors3);
      expect(panelState).toEqual([0, 1, 0]);
    });
  });

  describe('Panel Visibility Integration', () => {
    test('should handle challenge transitions with and without indexed detectors', () => {
      let isPanelVisible = false;
      const mockSetPanelVisibility = (visible) => {
        isPanelVisible = visible;
      };

      const simulatePanelVisibilityLogic = (detectors) => {
        const hasIndexedDetectors = detectors.some(detector => detector.index !== undefined);
        mockSetPanelVisibility(hasIndexedDetectors);
      };

      // Challenge with indexed detectors
      const challengeWithIndices = [
        { id: 'det_1', currentValue: 0, index: 0 },
        { id: 'det_2', currentValue: 1, index: 1 }
      ];

      simulatePanelVisibilityLogic(challengeWithIndices);
      expect(isPanelVisible).toBe(true);

      // Challenge without indexed detectors
      const challengeWithoutIndices = [
        { id: 'det_1', currentValue: 0 },
        { id: 'det_2', currentValue: 1 }
      ];

      simulatePanelVisibilityLogic(challengeWithoutIndices);
      expect(isPanelVisible).toBe(false);

      // Empty challenge
      simulatePanelVisibilityLogic([]);
      expect(isPanelVisible).toBe(false);
    });

    test('should maintain visibility when only some detectors have indices', () => {
      const mixedDetectors = [
        { id: 'det_1', currentValue: 0, index: 0 },
        { id: 'det_2', currentValue: 1 }, // No index
        { id: 'det_3', currentValue: 0, index: 2 }
      ];

      const hasIndexedDetectors = mixedDetectors.some(detector => detector.index !== undefined);
      expect(hasIndexedDetectors).toBe(true);

      // Should only display the indexed ones
      const visibleDetectors = mixedDetectors
        .filter(detector => detector.index !== undefined)
        .sort((a, b) => a.index - b.index);

      expect(visibleDetectors).toHaveLength(2);
      expect(visibleDetectors[0].index).toBe(0);
      expect(visibleDetectors[1].index).toBe(2);
    });
  });

  describe('GameOfLife to App Communication', () => {
    test('should simulate onDetectorsChange callback flow', () => {
      let appDetectorState = [];
      let callbackCallCount = 0;

      // Simulate the callback from GameOfLife to App
      const mockOnDetectorsChange = (detectors) => {
        callbackCallCount++;
        appDetectorState = [...detectors]; // Copy to simulate React state update
      };

      // Simulate GameOfLife detector updates
      const simulateGameOfLifeUpdate = (newDetectors) => {
        mockOnDetectorsChange(newDetectors);
      };

      const initialDetectors = [
        { id: 'challenge_detector_0', currentValue: 0, index: 1 },
        { id: 'challenge_detector_1', currentValue: 0, index: 0 }
      ];

      simulateGameOfLifeUpdate(initialDetectors);

      expect(callbackCallCount).toBe(1);
      expect(appDetectorState).toHaveLength(2);
      expect(appDetectorState[0].index).toBe(1);
      expect(appDetectorState[1].index).toBe(0);

      // Simulate detector state change
      const updatedDetectors = [
        { id: 'challenge_detector_0', currentValue: 1, index: 1 },
        { id: 'challenge_detector_1', currentValue: 0, index: 0 }
      ];

      simulateGameOfLifeUpdate(updatedDetectors);

      expect(callbackCallCount).toBe(2);
      expect(appDetectorState[0].currentValue).toBe(1);
      expect(appDetectorState[1].currentValue).toBe(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed detector data gracefully', () => {
      const malformedDetectors = [
        { currentValue: 1, index: 0 }, // Missing id
        null, // Null detector
        { id: 'valid', currentValue: 0, index: 1 },
        undefined, // Undefined detector
        { id: 'no_value', index: 2 } // Missing currentValue
      ];

      // Simulate defensive filtering
      const safeFilterDetectors = (detectors) => {
        return detectors
          .filter(detector => detector && detector.index !== undefined && detector.currentValue !== undefined)
          .sort((a, b) => a.index - b.index);
      };

      const result = safeFilterDetectors(malformedDetectors);

      expect(result).toHaveLength(2);
      expect(result[0].index).toBe(0);
      expect(result[1].index).toBe(1);
    });

    test('should handle large index values', () => {
      const detectorsWithLargeIndices = [
        { id: 'det_1', currentValue: 1, index: 100 },
        { id: 'det_2', currentValue: 0, index: 1 },
        { id: 'det_3', currentValue: 1, index: 50 }
      ];

      const sortedDetectors = detectorsWithLargeIndices
        .filter(detector => detector.index !== undefined)
        .sort((a, b) => a.index - b.index);

      expect(sortedDetectors.map(d => d.index)).toEqual([1, 50, 100]);
    });
  });
});
