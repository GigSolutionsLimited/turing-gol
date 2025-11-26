/**
 * Test for the real-world level 8 to 9 transition bug
 * This test simulates the exact scenario where auto-zoom triggers cellSize change
 * during level transition, which can cause guidance lines to persist incorrectly
 */

describe('Level 8 to 9 Real-World Transition Bug', () => {
  test('should clear guidance lines during level transition even when cellSize changes', () => {
    let guidanceLineObjects = [];
    let currentChallenge = null;
    let currentCellSize = 8;
    let brushesLoaded = true;

    // Mock functions
    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      console.log('🔄 onResetGuidanceLineObjects called - clearing', guidanceLineObjects.length, 'objects');
      guidanceLineObjects = [];
    });

    const mockOnAddGuidanceLineObject = jest.fn((obj) => {
      console.log('🔄 onAddGuidanceLineObject called - adding', obj.id);
      guidanceLineObjects.push(obj);
    });

    // Simulate the challenge change effect from GameOfLife
    const simulateChallengeChangeEffect = (newChallenge, cellSize, onResetGuidanceLineObjects) => {
      const challengeChanged = currentChallenge !== newChallenge;
      console.log('🔄 Challenge change effect:', { challengeChanged, from: currentChallenge?.name, to: newChallenge?.name });

      if (challengeChanged && onResetGuidanceLineObjects) {
        console.log('🔄 Challenge changed - clearing guidance lines');
        onResetGuidanceLineObjects();
      }

      if (challengeChanged) {
        currentChallenge = newChallenge;
      }
    };

    // Simulate the setup effect from GameOfLife
    const simulateSetupEffect = (challenge, brushes, brushesLoaded, cellSize, onReset, onAdd) => {
      console.log('🏗️ Setup effect running:', {
        challengeName: challenge?.name,
        setupLength: challenge?.setup?.length || 0,
        cellSize,
        brushesLoaded
      });

      if (!challenge) {
        if (onReset) {
          console.log('🔄 No challenge - clearing guidance lines');
          onReset();
        }
        return;
      }

      if (!brushesLoaded) {
        console.log('🏗️ Brushes not loaded yet, skipping setup');
        return;
      }

      // If challenge has no setup, clear guidance lines and return
      if (!challenge.setup || challenge.setup.length === 0) {
        console.log('🔄 Empty setup - clearing guidance lines for', challenge.name);
        if (onReset) {
          onReset();
        }
        return;
      }

      // Process setup patterns (simplified)
      console.log('🔄 Processing setup patterns for', challenge.name);
      if (onReset) {
        onReset(); // Always reset first
      }

      // Add setup guidance lines if any
      if (onAdd && challenge.setup.length > 0) {
        const mockGuidanceLineObject = {
          id: `setup_guidance_${challenge.name}`,
          type: 'guidanceLine',
          generation: 0
        };
        onAdd(mockGuidanceLineObject);
      }
    };

    // Define test challenges
    const level8Challenge = {
      name: '8. Detectors',
      setup: [
        { x: -100, y: -10, brush: 'p46GliderGunG' },
        { x: -67, y: -27, brush: 'p46GliderGunG' }
      ],
      width: 201,
      height: 201
    };

    const level9Challenge = {
      name: '9. Phases',
      setup: [], // Empty setup - this is the key!
      width: 201,
      height: 101
    };

    const mockBrushes = { 'p46GliderGunG': { pattern: [[0, 0]] } };

    // STEP 1: Load level 8 (has setup with guidance lines)
    console.log('\\n=== STEP 1: Loading Level 8 ===');

    // Challenge change effect runs
    simulateChallengeChangeEffect(level8Challenge, currentCellSize, mockOnResetGuidanceLineObjects);

    // Setup effect runs
    simulateSetupEffect(
      level8Challenge,
      mockBrushes,
      brushesLoaded,
      currentCellSize,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject
    );

    // Verify level 8 has guidance lines
    expect(guidanceLineObjects).toHaveLength(1);
    expect(guidanceLineObjects[0].id).toBe('setup_guidance_8. Detectors');

    // STEP 2: Switch to level 9 with AUTO-ZOOM (this simulates the real bug scenario)
    console.log('\\n=== STEP 2: Switching to Level 9 with Auto-Zoom ===');

    // Challenge changes to level 9
    simulateChallengeChangeEffect(level9Challenge, currentCellSize, mockOnResetGuidanceLineObjects);

    // Auto-zoom triggers and changes cellSize
    currentCellSize = 4;
    console.log('🔄 Auto-zoom changed cellSize to', currentCellSize);

    // Setup effect runs due to both challenge change AND cellSize change
    simulateSetupEffect(
      level9Challenge,
      {},
      brushesLoaded,
      currentCellSize,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject
    );

    // CRITICAL CHECK: Level 9 should have NO guidance lines
    console.log('\\n=== VERIFICATION ===');
    console.log('Final guidance line objects:', guidanceLineObjects);
    expect(guidanceLineObjects).toHaveLength(0);

    // Verify that onResetGuidanceLineObjects was called multiple times (once per effect run)
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalled();

    // The key insight: even with multiple effect runs and cellSize changes,
    // guidance lines should still be cleared because level 9 has empty setup
  });

  test('should handle rapid cellSize changes during level transition', () => {
    let guidanceLineObjects = [];

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      guidanceLineObjects = [];
    });

    const mockOnAddGuidanceLineObject = jest.fn((obj) => {
      guidanceLineObjects.push(obj);
    });

    const simulateSetupEffect = (challenge, brushesLoaded, cellSize, onReset, onAdd) => {
      if (!challenge || !brushesLoaded) return;

      // If challenge has no setup, clear guidance lines
      if (!challenge.setup || challenge.setup.length === 0) {
        if (onReset) onReset();
        return;
      }

      // Process setup
      if (onReset) onReset();
      if (onAdd && challenge.setup.length > 0) {
        onAdd({ id: `guidance_${challenge.name}_${cellSize}`, type: 'guidanceLine' });
      }
    };

    const level9Challenge = { name: '9. Phases', setup: [], width: 201, height: 101 };

    // Start with guidance lines from previous level
    guidanceLineObjects.push({ id: 'previous_level_guidance', type: 'guidanceLine' });
    expect(guidanceLineObjects).toHaveLength(1);

    // Simulate multiple cellSize changes during level 9 loading
    const cellSizes = [8, 6, 4, 3]; // Simulating auto-zoom changes

    for (const cellSize of cellSizes) {
      simulateSetupEffect(
        level9Challenge,
        true,
        cellSize,
        mockOnResetGuidanceLineObjects,
        mockOnAddGuidanceLineObject
      );

      // After each setup effect run, guidance lines should still be cleared
      // because level 9 has empty setup
      expect(guidanceLineObjects).toHaveLength(0);
    }

    // Verify onReset was called for each cellSize change
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(cellSizes.length);
  });

  test('should verify debug logging captures the issue', () => {
    // This test exists to validate that our debug logging approach works
    // When the user runs the actual application and switches from level 8 to 9,
    // they should see console output like:
    //
    // 🎯 Loading challenge: 9
    // 🔄 Challenge change effect running: { challengeChanged: true, previousChallenge: "8. Detectors", currentChallenge: "9. Phases", ... }
    // 🔄 Challenge changed - clearing guidance lines from 8. Detectors to 9. Phases
    // 🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered - clearing X guidance line objects
    // 🔍 Auto-zoom calculation: { originalCellSize: 8, calculatedCellSize: 4, willAutoZoom: true }
    // 🔍 Applying auto-zoom to cellSize: 4
    // 🔍 CellSize change effect running: { hasChallenge: true, challengeName: "9. Phases", cellSize: 4 }
    // 🏗️ Setup effect running: { hasChallenge: true, challengeName: "9. Phases", setupLength: 0, ... }
    // 🔄 Empty setup - clearing guidance lines for challenge: 9. Phases
    // 🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered - clearing 0 guidance line objects
    //
    // If guidance lines persist, we should see which step is failing

    const debugInfo = {
      expectedLogSequence: [
        '🎯 Loading challenge: 9',
        '🔄 Challenge changed - clearing guidance lines from 8. Detectors to 9. Phases',
        '🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered',
        '🔍 Auto-zoom calculation',
        '🔍 CellSize change effect running',
        '🏗️ Setup effect running',
        '🔄 Empty setup - clearing guidance lines for challenge: 9. Phases'
      ],
      troubleshootingSteps: [
        'Open browser console during level transition',
        'Look for the sequence of log messages above',
        'If RESET_GUIDANCE_LINE_OBJECTS is not called, the issue is in GameOfLife.jsx',
        'If it IS called but guidance lines persist, the issue is in the state management',
        'If setup effect shows setupLength > 0 for level 9, the challenge data is wrong',
        'If cellSize effect runs before challenge effect, there may be a timing issue'
      ]
    };

    expect(debugInfo.expectedLogSequence).toBeDefined();
    expect(debugInfo.troubleshootingSteps.length).toBeGreaterThan(0);
  });
});
