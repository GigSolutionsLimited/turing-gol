/**
 * Integration test for auto-zoom button functionality
 */

import { appReducer, initialAppState } from '../../src/state/appReducer.js';
import { calculateAutoZoomCellSize } from '../../src/utils/canvasUtils.js';

// Mock window dimensions for consistent testing
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1920,
});

Object.defineProperty(window, 'innerHeight', {
  writable: true,
  configurable: true,
  value: 1080,
});

describe('Auto-Zoom Button Integration', () => {
  test('should apply auto-zoom when button is pressed', () => {
    let state = { ...initialAppState };

    // Set initial zoom level
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 10
    });

    expect(state.cellSize).toBe(10);

    // Simulate auto-zoom button press for a large grid
    const largeChallenge = { width: 200, height: 200 };
    const autoZoomCellSize = calculateAutoZoomCellSize(largeChallenge, 8);

    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: autoZoomCellSize
    });

    // Should have applied auto-zoom
    expect(state.cellSize).toBeLessThan(10);
    expect(state.cellSize).toBeGreaterThanOrEqual(2); // Minimum constraint
  });

  test('should work with manual zoom after auto-zoom', () => {
    let state = { ...initialAppState };

    // Apply auto-zoom for large grid
    const largeChallenge = { width: 150, height: 150 };
    const autoZoomCellSize = calculateAutoZoomCellSize(largeChallenge, 8);

    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: autoZoomCellSize
    });

    const autoZoomedCellSize = state.cellSize;

    // Manual zoom in should work
    state = appReducer(state, { type: 'ZOOM_IN' });
    expect(state.cellSize).toBe(autoZoomedCellSize + 2);

    // Manual zoom out should work
    state = appReducer(state, { type: 'ZOOM_OUT' });
    expect(state.cellSize).toBe(autoZoomedCellSize);
  });

  test('should handle auto-zoom for different challenge sizes', () => {
    const testCases = [
      { challenge: { width: 61, height: 61 }, expectedResult: 8 }, // Should use default
      { challenge: { width: 201, height: 201 }, expectedLessThan: 8, expectedAtLeast: 3 }, // Should zoom out but not too much
      { challenge: { width: 201, height: 131 }, expectedLessThan: 8, expectedAtLeast: 4 }, // Level 7 should be better
      { challenge: null, expectedResult: 8 }, // Should fallback to default
    ];

    testCases.forEach(({ challenge, expectedResult, expectedLessThan, expectedAtLeast }) => {
      const result = calculateAutoZoomCellSize(challenge, 8);

      if (expectedResult !== undefined) {
        expect(result).toBe(expectedResult);
      }
      if (expectedLessThan !== undefined) {
        expect(result).toBeLessThan(expectedLessThan);
      }
      if (expectedAtLeast !== undefined) {
        expect(result).toBeGreaterThanOrEqual(expectedAtLeast);
      }
      // Always respect absolute minimum
      expect(result).toBeGreaterThanOrEqual(2); // Never below minimum
    });
  });

  test('should preserve other state during auto-zoom button usage', () => {
    let state = { ...initialAppState };

    // Set up some state
    state = appReducer(state, {
      type: 'SET_EXERCISE',
      payload: '7. Large Level'
    });

    state = appReducer(state, {
      type: 'SET_RUNNING',
      payload: false
    });

    const guidanceLine = {
      id: 'auto-zoom-test',
      type: 'guidanceLine',
      generation: 0,
      originX: 100,
      originY: 100
    };

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine
    });

    // Store original state
    const originalExercise = state.exercise;
    const originalRunning = state.running;
    const originalGuidanceLines = [...state.guidanceLineObjects];

    // Apply auto-zoom via button press
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 4
    });

    // Verify only cellSize changed
    expect(state.cellSize).toBe(4);
    expect(state.exercise).toBe(originalExercise);
    expect(state.running).toBe(originalRunning);
    expect(state.guidanceLineObjects).toHaveLength(originalGuidanceLines.length);
    expect(state.guidanceLineObjects[0].id).toBe(guidanceLine.id);
  });

  test('should handle edge cases for auto-zoom button', () => {
    let state = { ...initialAppState };

    // Test with very small grid (should use default)
    const smallAutoZoom = calculateAutoZoomCellSize({ width: 10, height: 10 }, 8);
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: smallAutoZoom
    });
    expect(state.cellSize).toBe(8);

    // Test with extremely large grid (should hit enhanced minimum for large grids)
    const hugeAutoZoom = calculateAutoZoomCellSize({ width: 2000, height: 2000 }, 8);
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: hugeAutoZoom
    });
    expect(state.cellSize).toBeGreaterThanOrEqual(2); // Should hit enhanced minimum (3px for huge grids)

    // Test with invalid data (should fallback to default)
    const invalidAutoZoom = calculateAutoZoomCellSize({}, 8);
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: invalidAutoZoom
    });
    expect(state.cellSize).toBe(8);
  });
});
