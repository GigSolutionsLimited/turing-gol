/**
 * Test for guidance line preservation during zoom operations
 */

import { appReducer, initialAppState } from '../../src/state/appReducer.js';

describe('Zoom Guidance Line Preservation', () => {
  test('should preserve guidance lines when zooming in and out', () => {
    // Start with initial state
    let state = { ...initialAppState };

    // Add some guidance lines
    const guidanceLine1 = {
      id: 'test-line-1',
      type: 'guidanceLine',
      generation: 0,
      originX: 50,
      originY: 25,
      direction: 'E',
      length: 10,
      speed: 2
    };

    const guidanceLine2 = {
      id: 'test-line-2',
      type: 'guidanceLine',
      generation: 5,
      originX: 100,
      originY: 75,
      direction: 'SE',
      length: 15,
      speed: 3
    };

    // Add guidance lines
    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine1
    });

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine2
    });

    // Verify guidance lines are present
    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.cellSize).toBe(8); // Default cell size

    // Test zoom in
    state = appReducer(state, { type: 'ZOOM_IN' });

    // Verify cell size changed but guidance lines are preserved
    expect(state.cellSize).toBe(10); // Should increase by ZOOM_STEP (2)
    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.guidanceLineObjects[0].id).toBe('test-line-1');
    expect(state.guidanceLineObjects[1].id).toBe('test-line-2');

    // Test zoom out multiple times
    state = appReducer(state, { type: 'ZOOM_OUT' });
    state = appReducer(state, { type: 'ZOOM_OUT' });
    state = appReducer(state, { type: 'ZOOM_OUT' });

    // Verify cell size changed but guidance lines are still preserved
    expect(state.cellSize).toBe(4); // Should decrease by ZOOM_STEP * 3
    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.guidanceLineObjects[0].id).toBe('test-line-1');
    expect(state.guidanceLineObjects[1].id).toBe('test-line-2');

    // Verify guidance line properties are unchanged
    expect(state.guidanceLineObjects[0].generation).toBe(0);
    expect(state.guidanceLineObjects[0].originX).toBe(50);
    expect(state.guidanceLineObjects[0].direction).toBe('E');

    expect(state.guidanceLineObjects[1].generation).toBe(5);
    expect(state.guidanceLineObjects[1].originX).toBe(100);
    expect(state.guidanceLineObjects[1].direction).toBe('SE');
  });

  test('should respect zoom limits while preserving guidance lines', () => {
    let state = { ...initialAppState };

    // Add a guidance line
    const guidanceLine = {
      id: 'zoom-limit-test',
      type: 'guidanceLine',
      generation: 0,
      originX: 25,
      originY: 25,
      direction: 'N',
      length: 5,
      speed: 1
    };

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine
    });

    // Test zoom in to maximum
    const initialCellSize = state.cellSize;
    for (let i = 0; i < 20; i++) { // Try to zoom in many times
      state = appReducer(state, { type: 'ZOOM_IN' });
    }

    // Should hit maximum zoom limit but guidance line should remain
    expect(state.cellSize).toBeGreaterThan(initialCellSize);
    expect(state.guidanceLineObjects).toHaveLength(1);
    expect(state.guidanceLineObjects[0].id).toBe('zoom-limit-test');

    // Test zoom out to minimum
    for (let i = 0; i < 20; i++) { // Try to zoom out many times
      state = appReducer(state, { type: 'ZOOM_OUT' });
    }

    // Should hit minimum zoom limit but guidance line should remain
    expect(state.cellSize).toBeLessThan(initialCellSize);
    expect(state.guidanceLineObjects).toHaveLength(1);
    expect(state.guidanceLineObjects[0].id).toBe('zoom-limit-test');
  });

  test('should handle SET_ZOOM_LEVEL action while preserving guidance lines', () => {
    let state = { ...initialAppState };

    // Add guidance lines
    const guidanceLines = [
      {
        id: 'direct-zoom-1',
        type: 'guidanceLine',
        generation: 0,
        originX: 10,
        originY: 10,
        direction: 'S',
        length: 8,
        speed: 2
      },
      {
        id: 'direct-zoom-2',
        type: 'guidanceLine',
        generation: 3,
        originX: 30,
        originY: 40,
        direction: 'NW',
        length: 12,
        speed: 4
      }
    ];

    guidanceLines.forEach(line => {
      state = appReducer(state, {
        type: 'ADD_GUIDANCE_LINE_OBJECT',
        payload: line
      });
    });

    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.cellSize).toBe(8); // Default

    // Test direct zoom level setting
    state = appReducer(state, {
      type: 'SET_ZOOM_LEVEL',
      payload: 16
    });

    // Cell size should change but guidance lines should be preserved
    expect(state.cellSize).toBe(16);
    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.guidanceLineObjects.map(line => line.id)).toEqual(['direct-zoom-1', 'direct-zoom-2']);
  });
});
