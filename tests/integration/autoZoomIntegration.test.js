/**
 * Integration test for auto-zoom on challenge load
 */

import { appReducer, initialAppState } from '../../src/state/appReducer.js';

describe('Auto-Zoom Challenge Load Integration', () => {
  test('should handle zoom level changes during challenge loading', () => {
    let state = { ...initialAppState };

    // Simulate setting a larger zoom level (smaller cell size for large grid)
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 4  // Smaller cell size for large grid
    });

    expect(state.cellSize).toBe(4);

    // Verify that manual zoom controls still work after auto-zoom
    state = appReducer(state, { type: 'ZOOM_IN' });
    expect(state.cellSize).toBe(6); // 4 + 2 (ZOOM_STEP)

    state = appReducer(state, { type: 'ZOOM_OUT' });
    expect(state.cellSize).toBe(4); // 6 - 2 (ZOOM_STEP)
  });

  test('should respect zoom boundaries even with auto-zoom', () => {
    let state = { ...initialAppState };

    // Try to set cell size below minimum (should be clamped)
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 1  // Below minimum of 2
    });

    // Cell size should be clamped to minimum
    expect(state.cellSize).toBeGreaterThanOrEqual(2);

    // Try to set cell size above maximum (should be clamped)
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 20  // Above maximum of 16
    });

    // Cell size should be clamped to maximum
    expect(state.cellSize).toBeLessThanOrEqual(16);
  });

  test('should not interfere with other state during auto-zoom', () => {
    let state = { ...initialAppState };

    // Set up some initial state
    state = appReducer(state, {
      type: 'SET_EXERCISE',
      payload: '1. Basics'
    });

    state = appReducer(state, {
      type: 'SET_RUNNING',
      payload: true
    });

    const guidanceLine = {
      id: 'test-line',
      type: 'guidanceLine',
      generation: 0,
      originX: 10,
      originY: 10
    };

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine
    });

    // Apply auto-zoom
    const originalExercise = state.exercise;
    const originalRunning = state.running;
    const originalGuidanceLines = [...state.guidanceLineObjects];

    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 6
    });

    // Verify that only cellSize changed, other state preserved
    expect(state.cellSize).toBe(6);
    expect(state.exercise).toBe(originalExercise);
    expect(state.running).toBe(originalRunning);
    expect(state.guidanceLineObjects).toHaveLength(originalGuidanceLines.length);
    expect(state.guidanceLineObjects[0].id).toBe(guidanceLine.id);
  });
});
