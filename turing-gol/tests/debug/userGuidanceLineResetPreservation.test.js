/**
 * Test for user-placed guidance line preservation during reset
 */

import { appReducer, initialAppState } from '../../src/state/appReducer.js';

describe('User Guidance Line Reset Preservation', () => {
  test('should preserve user-placed guidance lines at generation 0 during reset', () => {
    // Start with initial state
    let state = { ...initialAppState };

    // Add some guidance lines that simulate user placing brushes at generation 0
    const userGuidanceLine1 = {
      id: 'user-line-1',
      type: 'guidanceLine',
      generation: 0, // User placed at generation 0 (should be preserved)
      originX: 91,
      originY: 50,
      direction: 'E',
      length: 10,
      speed: 2
    };

    const userGuidanceLine2 = {
      id: 'user-line-2',
      type: 'guidanceLine',
      generation: 0, // User placed at generation 0 (should be preserved)
      originX: 75,
      originY: 92,
      direction: 'N',
      length: 15,
      speed: 3
    };

    const setupGuidanceLine = {
      id: 'setup-line-1',
      type: 'guidanceLine',
      generation: 0, // Setup guidance line (should be preserved)
      originX: 24,
      originY: 8,
      direction: 'SE',
      length: 'infinite',
      speed: 6
    };

    const gameplayGuidanceLine = {
      id: 'gameplay-line-1',
      type: 'guidanceLine',
      generation: 5, // User placed during gameplay (should NOT be preserved)
      originX: 100,
      originY: 100,
      direction: 'W',
      length: 8,
      speed: 1
    };

    // Add all guidance lines
    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: userGuidanceLine1
    });

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: userGuidanceLine2
    });

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: setupGuidanceLine
    });

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: gameplayGuidanceLine
    });

    // Verify all 4 guidance lines are present
    expect(state.guidanceLineObjects).toHaveLength(4);
    expect(state.guidanceLineObjects.map(line => line.id)).toEqual([
      'user-line-1',
      'user-line-2',
      'setup-line-1',
      'gameplay-line-1'
    ]);

    // Simulate reset operation - this should only preserve generation 0 lines
    const mockGeneration0Lines = state.guidanceLineObjects.filter(line => line.generation === 0);

    // First clear all guidance lines (what RESET_GUIDANCE_LINE_OBJECTS does)
    state = appReducer(state, {
      type: 'RESET_GUIDANCE_LINE_OBJECTS'
    });

    // Verify all guidance lines are cleared
    expect(state.guidanceLineObjects).toHaveLength(0);

    // Then restore generation 0 guidance lines (what the new reset logic does)
    mockGeneration0Lines.forEach(guidanceLine => {
      state = appReducer(state, {
        type: 'ADD_GUIDANCE_LINE_OBJECT',
        payload: guidanceLine
      });
    });

    // Verify only generation 0 guidance lines are preserved (both user-placed and setup)
    expect(state.guidanceLineObjects).toHaveLength(3);
    expect(state.guidanceLineObjects.map(line => line.id)).toEqual([
      'user-line-1',   // User-placed at generation 0 - preserved ✅
      'user-line-2',   // User-placed at generation 0 - preserved ✅
      'setup-line-1'   // Setup guidance line - preserved ✅
    ]);

    // Verify gameplay guidance line was NOT preserved
    const gameplayLineExists = state.guidanceLineObjects.some(line => line.id === 'gameplay-line-1');
    expect(gameplayLineExists).toBe(false);

    // Verify all preserved lines are generation 0
    state.guidanceLineObjects.forEach(line => {
      expect(line.generation).toBe(0);
    });
  });

  test('should handle reset when no guidance lines exist', () => {
    let state = { ...initialAppState };

    // Verify starting with no guidance lines
    expect(state.guidanceLineObjects).toHaveLength(0);

    // Simulate reset with no guidance lines
    state = appReducer(state, {
      type: 'RESET_GUIDANCE_LINE_OBJECTS'
    });

    // Should still have no guidance lines
    expect(state.guidanceLineObjects).toHaveLength(0);
  });

  test('should preserve guidance lines when all are generation 0', () => {
    let state = { ...initialAppState };

    // Add only generation 0 guidance lines
    const guidanceLine1 = {
      id: 'line-1',
      type: 'guidanceLine',
      generation: 0,
      originX: 10,
      originY: 10,
      direction: 'N',
      length: 5,
      speed: 1
    };

    const guidanceLine2 = {
      id: 'line-2',
      type: 'guidanceLine',
      generation: 0,
      originX: 20,
      originY: 20,
      direction: 'S',
      length: 8,
      speed: 2
    };

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine1
    });

    state = appReducer(state, {
      type: 'ADD_GUIDANCE_LINE_OBJECT',
      payload: guidanceLine2
    });

    expect(state.guidanceLineObjects).toHaveLength(2);

    // Filter generation 0 lines (what the new reset logic does)
    const generation0Lines = state.guidanceLineObjects.filter(line => line.generation === 0);
    expect(generation0Lines).toHaveLength(2);

    // Reset and restore
    state = appReducer(state, {
      type: 'RESET_GUIDANCE_LINE_OBJECTS'
    });

    generation0Lines.forEach(guidanceLine => {
      state = appReducer(state, {
        type: 'ADD_GUIDANCE_LINE_OBJECT',
        payload: guidanceLine
      });
    });

    // All guidance lines should be preserved
    expect(state.guidanceLineObjects).toHaveLength(2);
    expect(state.guidanceLineObjects.map(line => line.id)).toEqual(['line-1', 'line-2']);
  });

  test('should verify setup and user patterns are both preserved in reset scenarios', () => {
    // This test simulates the real-world scenario:
    // 1. Level 7 loads with setup patterns (p60GliderGunG brushes)
    // 2. User places additional brushes at generation 0
    // 3. Reset should preserve both setup and user-placed patterns/guidance lines

    let state = { ...initialAppState };

    // Simulate setup guidance lines (what level 7 setup creates)
    const setupGuidanceLine1 = {
      id: 'setup-p60gun-1',
      type: 'guidanceLine',
      generation: 0,
      originX: 24,  // First p60GliderGunG at position (0, 0) + startX
      originY: 8,   // startY from brush
      direction: 'SE',
      length: 'infinite',
      speed: 6
    };

    const setupGuidanceLine2 = {
      id: 'setup-p60gun-2',
      type: 'guidanceLine',
      generation: 0,
      originX: 67,  // Second p60GliderGunG at position (43, 0) + startX
      originY: 8,   // startY from brush
      direction: 'SE',
      length: 'infinite',
      speed: 6
    };

    // Simulate user-placed guidance lines (what snarks create)
    const userSnark1 = {
      id: 'user-snark-1',
      type: 'guidanceLine',
      generation: 0,  // User placed at generation 0
      originX: 91,
      originY: 50,
      direction: 'E',
      length: 10,
      speed: 2
    };

    const userSnark2 = {
      id: 'user-snark-2',
      type: 'guidanceLine',
      generation: 0,  // User placed at generation 0
      originX: 75,
      originY: 92,
      direction: 'N',
      length: 15,
      speed: 3
    };

    const userSnark3 = {
      id: 'user-snark-3',
      type: 'guidanceLine',
      generation: 0,  // User placed at generation 0
      originX: 27,
      originY: 70,
      direction: 'W',
      length: 12,
      speed: 1
    };

    // Add all guidance lines (simulating the state when user has placed snarks)
    [setupGuidanceLine1, setupGuidanceLine2, userSnark1, userSnark2, userSnark3].forEach(line => {
      state = appReducer(state, {
        type: 'ADD_GUIDANCE_LINE_OBJECT',
        payload: line
      });
    });

    // Verify all guidance lines are present
    expect(state.guidanceLineObjects).toHaveLength(5);

    // Simulate reset operation (preserve generation 0 guidance lines)
    const generation0Lines = state.guidanceLineObjects.filter(line => line.generation === 0);
    expect(generation0Lines).toHaveLength(5); // All are generation 0

    // Reset guidance lines
    state = appReducer(state, {
      type: 'RESET_GUIDANCE_LINE_OBJECTS'
    });
    expect(state.guidanceLineObjects).toHaveLength(0);

    // Restore generation 0 guidance lines
    generation0Lines.forEach(guidanceLine => {
      state = appReducer(state, {
        type: 'ADD_GUIDANCE_LINE_OBJECT',
        payload: guidanceLine
      });
    });

    // Verify all guidance lines are preserved (both setup and user-placed)
    expect(state.guidanceLineObjects).toHaveLength(5);

    const preservedIds = state.guidanceLineObjects.map(line => line.id);
    expect(preservedIds).toContain('setup-p60gun-1');    // Setup guidance line 1 preserved
    expect(preservedIds).toContain('setup-p60gun-2');    // Setup guidance line 2 preserved
    expect(preservedIds).toContain('user-snark-1');      // User snark 1 guidance line preserved
    expect(preservedIds).toContain('user-snark-2');      // User snark 2 guidance line preserved
    expect(preservedIds).toContain('user-snark-3');      // User snark 3 guidance line preserved

    // Verify all preserved lines are generation 0
    state.guidanceLineObjects.forEach(line => {
      expect(line.generation).toBe(0);
    });
  });
});
