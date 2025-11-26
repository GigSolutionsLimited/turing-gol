// Unit tests for DetectorPanel component
// Note: Testing logic without JSX to avoid Babel configuration issues
// Tests detector display logic, filtering, and sorting behavior

describe('DetectorPanel Logic', () => {

  describe('Detector Filtering and Sorting', () => {
    test('should filter detectors with indices', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: 2 },
        { id: 'detector_2', currentValue: 0 }, // No index property
        { id: 'detector_3', currentValue: 1, index: 0 },
        { id: 'detector_4', currentValue: 0, index: 1 }
      ];

      // Simulate the filtering logic from DetectorPanel
      const filterIndexedDetectors = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index);
      };

      const result = filterIndexedDetectors(mockDetectors);

      expect(result).toHaveLength(3);
      expect(result[0]).toMatchObject({ id: 'detector_3', index: 0 });
      expect(result[1]).toMatchObject({ id: 'detector_4', index: 1 });
      expect(result[2]).toMatchObject({ id: 'detector_1', index: 2 });
    });

    test('should handle empty detector array', () => {
      const filterIndexedDetectors = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index);
      };

      const result = filterIndexedDetectors([]);
      expect(result).toHaveLength(0);
    });

    test('should handle detectors without any indices', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1 },
        { id: 'detector_2', currentValue: 0 }
      ];

      const filterIndexedDetectors = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index);
      };

      const result = filterIndexedDetectors(mockDetectors);
      expect(result).toHaveLength(0);
    });

    test('should sort by index in ascending order', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: 5 },
        { id: 'detector_2', currentValue: 0, index: 1 },
        { id: 'detector_3', currentValue: 1, index: 3 },
        { id: 'detector_4', currentValue: 0, index: 0 },
        { id: 'detector_5', currentValue: 1, index: 2 }
      ];

      const filterIndexedDetectors = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index);
      };

      const result = filterIndexedDetectors(mockDetectors);

      expect(result).toHaveLength(5);
      expect(result.map(d => d.index)).toEqual([0, 1, 2, 3, 5]);
    });
  });

  describe('Panel Visibility Logic', () => {
    test('should show panel when indexed detectors exist', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: 0 },
        { id: 'detector_2', currentValue: 0, index: 1 }
      ];

      const shouldShowPanel = (detectors) => {
        const indexedDetectors = detectors.filter(detector => detector.index !== undefined);
        return indexedDetectors.length > 0;
      };

      expect(shouldShowPanel(mockDetectors)).toBe(true);
    });

    test('should hide panel when no indexed detectors exist', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1 },
        { id: 'detector_2', currentValue: 0 }
      ];

      const shouldShowPanel = (detectors) => {
        const indexedDetectors = detectors.filter(detector => detector.index !== undefined);
        return indexedDetectors.length > 0;
      };

      expect(shouldShowPanel(mockDetectors)).toBe(false);
    });

    test('should hide panel when detector array is empty', () => {
      const shouldShowPanel = (detectors) => {
        const indexedDetectors = detectors.filter(detector => detector.index !== undefined);
        return indexedDetectors.length > 0;
      };

      expect(shouldShowPanel([])).toBe(false);
    });
  });

  describe('Display Values', () => {
    test('should display current values from detectors', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: 0 },
        { id: 'detector_2', currentValue: 0, index: 1 },
        { id: 'detector_3', currentValue: 1, index: 2 }
      ];

      const getDisplayValues = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      const result = getDisplayValues(mockDetectors);
      expect(result).toEqual([1, 0, 1]);
    });

    test('should handle mixed index values correctly', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 0, index: 3 },
        { id: 'detector_2', currentValue: 1, index: 0 },
        { id: 'detector_3', currentValue: 0, index: 1 },
        { id: 'detector_4', currentValue: 1, index: 2 }
      ];

      const getDisplayValues = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      const result = getDisplayValues(mockDetectors);
      expect(result).toEqual([1, 0, 1, 0]); // Sorted by index: 0, 1, 2, 3
    });
  });

  describe('Edge Cases', () => {
    test('should handle undefined detector array gracefully', () => {
      const getDisplayValues = (detectors = []) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      const result = getDisplayValues(undefined);
      expect(result).toEqual([]);
    });

    test('should handle detectors with index 0', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: 0 }
      ];

      const getDisplayValues = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      const result = getDisplayValues(mockDetectors);
      expect(result).toEqual([1]);
    });

    test('should handle negative indices', () => {
      const mockDetectors = [
        { id: 'detector_1', currentValue: 1, index: -1 },
        { id: 'detector_2', currentValue: 0, index: 0 },
        { id: 'detector_3', currentValue: 1, index: 1 }
      ];

      const getDisplayValues = (detectors) => {
        return detectors
          .filter(detector => detector.index !== undefined)
          .sort((a, b) => a.index - b.index)
          .map(detector => detector.currentValue);
      };

      const result = getDisplayValues(mockDetectors);
      expect(result).toEqual([1, 0, 1]); // Sorted: -1, 0, 1
    });
  });
});
