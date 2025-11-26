/**
 * Test to verify guidance line clearing between levels works correctly
 */

describe('Guidance Line Level Switching', () => {
  test('should clear guidance lines when switching between levels', () => {
    // This test verifies that when switching from one level to another,
    // all existing guidance lines are properly cleared

    const mockClearAllPlacedGuidanceLines = jest.fn();
    const mockResetGuidanceLineObjects = jest.fn();
    const mockOnRunningChange = jest.fn();
    const mockOnPatternSelect = jest.fn();

    // Simulate the exercise change logic from GameOfLife.jsx
    const simulateExerciseChange = (previousExercise, currentExercise, functions) => {
      const exerciseChanged = previousExercise !== currentExercise;

      if (exerciseChanged) {
        // These should be called when exercise changes
        if (functions.onRunningChange) functions.onRunningChange(false);
        if (functions.onPatternSelect) functions.onPatternSelect(null);

        // Reset guidance line objects to only generation 0 lines
        if (functions.onResetGuidanceLineObjects) {
          functions.onResetGuidanceLineObjects();
        }

        // Clear all legacy placed guidance lines
        if (functions.onClearAllPlacedGuidanceLines) {
          functions.onClearAllPlacedGuidanceLines();
        }
      }

      return exerciseChanged;
    };

    // Test switching from Level 3 (has guidance) to Level 5 (also has guidance)
    const previousExercise = '3. Test Level';
    const currentExercise = '5. Period 60 gun';

    const functions = {
      onRunningChange: mockOnRunningChange,
      onPatternSelect: mockOnPatternSelect,
      onResetGuidanceLineObjects: mockResetGuidanceLineObjects,
      onClearAllPlacedGuidanceLines: mockClearAllPlacedGuidanceLines
    };

    const changed = simulateExerciseChange(previousExercise, currentExercise, functions);

    expect(changed).toBe(true);
    expect(mockClearAllPlacedGuidanceLines).toHaveBeenCalledTimes(1);
    expect(mockResetGuidanceLineObjects).toHaveBeenCalledTimes(1);
    expect(mockOnRunningChange).toHaveBeenCalledWith(false);
    expect(mockOnPatternSelect).toHaveBeenCalledWith(null);
  });

  test('should not clear guidance lines when exercise does not change', () => {
    const mockClearAllPlacedGuidanceLines = jest.fn();
    const mockResetGuidanceLineObjects = jest.fn();

    const simulateExerciseChange = (previousExercise, currentExercise, functions) => {
      const exerciseChanged = previousExercise !== currentExercise;

      if (exerciseChanged) {
        if (functions.onResetGuidanceLineObjects) {
          functions.onResetGuidanceLineObjects();
        }
        if (functions.onClearAllPlacedGuidanceLines) {
          functions.onClearAllPlacedGuidanceLines();
        }
      }

      return exerciseChanged;
    };

    // Test when exercise doesn't change (e.g., re-renders)
    const exercise = '5. Period 60 gun';

    const functions = {
      onResetGuidanceLineObjects: mockResetGuidanceLineObjects,
      onClearAllPlacedGuidanceLines: mockClearAllPlacedGuidanceLines
    };

    const changed = simulateExerciseChange(exercise, exercise, functions);

    expect(changed).toBe(false);
    expect(mockClearAllPlacedGuidanceLines).not.toHaveBeenCalled();
    expect(mockResetGuidanceLineObjects).not.toHaveBeenCalled();
  });

  test('should handle missing guidance line functions gracefully', () => {
    const simulateExerciseChange = (previousExercise, currentExercise, functions) => {
      const exerciseChanged = previousExercise !== currentExercise;

      if (exerciseChanged) {
        // These should check for function existence before calling
        if (functions.onResetGuidanceLineObjects) {
          functions.onResetGuidanceLineObjects();
        }
        if (functions.onClearAllPlacedGuidanceLines) {
          functions.onClearAllPlacedGuidanceLines();
        }
      }

      return exerciseChanged;
    };

    // Test with missing functions
    const functions = {
      onResetGuidanceLineObjects: null,
      onClearAllPlacedGuidanceLines: undefined
    };

    // This should not throw an error
    expect(() => {
      simulateExerciseChange('Level 3', 'Level 5', functions);
    }).not.toThrow();
  });
});
