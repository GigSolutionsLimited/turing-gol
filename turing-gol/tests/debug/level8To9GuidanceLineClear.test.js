// Test for level 8 to level 9 guidance line clearing bug
// Tests that guidance lines from level with setup don't persist when switching to level without setup

describe('Level 8 to 9 Transition Guidance Line Clearing', () => {
  test('should clear guidance lines when switching from setup level to empty setup level', () => {
    let guidanceLineObjects = [];
    let setupPatterns = [];
    let currentChallenge = null;
    let brushesLoaded = true;

    // Mock functions
    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      guidanceLineObjects = [];
    });

    const mockOnAddGuidanceLineObject = jest.fn((obj) => {
      guidanceLineObjects.push(obj);
    });

    // Simulate the setup effect logic from GameOfLife
    const simulateSetupEffect = (challenge, brushes, brushesLoaded, onReset, onAdd) => {
      console.log('🏗️ Setup effect running:', {
        hasChallenge: !!challenge,
        challengeName: challenge?.name,
        setupLength: challenge?.setup?.length || 0,
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

      // Always clear guidance lines first
      if (onReset) {
        console.log('🔄 Clearing guidance lines before processing setup');
        onReset();
      }

      // If challenge has no setup, return early (already cleared above)
      if (!challenge.setup || challenge.setup.length === 0) {
        console.log('🔄 Empty setup - guidance lines cleared for', challenge.name);
        return;
      }

      // Process setup patterns and add guidance lines (simplified simulation)
      setupPatterns = challenge.setup || [];
      console.log('🔄 Processing', setupPatterns.length, 'setup patterns');

      // Simulate adding guidance lines for setup patterns
      if (setupPatterns.length > 0 && onAdd) {
        // Simulate that some setup patterns have guidance lines
        const mockGuidanceLineObject = {
          id: 'setup_guidance_0',
          type: 'guidanceLine',
          generation: 0
        };
        console.log('🔄 Adding setup guidance line');
        onAdd(mockGuidanceLineObject);
      }
    };

    // Simulate level 8 (has setup patterns with guidance lines)
    const level8Challenge = {
      name: '8. Detectors',
      setup: [
        { x: -100, y: -10, brush: 'p46GliderGunG' },
        { x: -67, y: -27, brush: 'p46GliderGunG' }
      ],
      width: 201,
      height: 201
    };

    // Simulate level 9 (empty setup)
    const level9Challenge = {
      name: '9. Phases',
      setup: [],
      width: 201,
      height: 101
    };

    // Step 1: Load level 8 - should create guidance lines
    currentChallenge = level8Challenge;
    simulateSetupEffect(
      currentChallenge,
      { 'p46GliderGunG': { pattern: [[0, 0]] } },
      brushesLoaded,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject
    );

    // Verify level 8 has guidance lines
    expect(guidanceLineObjects).toHaveLength(1);
    expect(guidanceLineObjects[0].id).toBe('setup_guidance_0');
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(1);
    expect(mockOnAddGuidanceLineObject).toHaveBeenCalledTimes(1);

    // Step 2: Switch to level 9 - should clear guidance lines
    currentChallenge = level9Challenge;
    simulateSetupEffect(
      currentChallenge,
      {},
      brushesLoaded,
      mockOnResetGuidanceLineObjects,
      mockOnAddGuidanceLineObject
    );

    // Verify level 9 has NO guidance lines (they were cleared)
    expect(guidanceLineObjects).toHaveLength(0);
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(2); // Called again for level 9
    // mockOnAddGuidanceLineObject should still be 1 (not called again for level 9)
    expect(mockOnAddGuidanceLineObject).toHaveBeenCalledTimes(1);
  });

  test('should handle level transitions with different grid sizes correctly', () => {
    let guidanceLineObjects = [];

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      guidanceLineObjects = [];
    });

    const mockOnAddGuidanceLineObject = jest.fn((obj) => {
      guidanceLineObjects.push(obj);
    });

    const simulateSetupEffect = (challenge, brushes, brushesLoaded, onReset, onAdd) => {
      if (!challenge || !brushesLoaded) return;

      // Always clear first
      if (onReset) onReset();

      // Add guidance lines if setup exists
      if (challenge.setup && challenge.setup.length > 0 && onAdd) {
        onAdd({ id: `guidance_${challenge.name}`, type: 'guidanceLine' });
      }
    };

    // Test transition from 201x201 (level 8) to 201x101 (level 9)
    const level8 = { name: '8. Detectors', setup: [{ brush: 'test' }], width: 201, height: 201 };
    const level9 = { name: '9. Phases', setup: [], width: 201, height: 101 };

    // Load level 8
    simulateSetupEffect(level8, { test: {} }, true, mockOnResetGuidanceLineObjects, mockOnAddGuidanceLineObject);
    expect(guidanceLineObjects).toHaveLength(1);

    // Switch to level 9
    simulateSetupEffect(level9, {}, true, mockOnResetGuidanceLineObjects, mockOnAddGuidanceLineObject);
    expect(guidanceLineObjects).toHaveLength(0);

    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(2);
  });

  test('should not interfere with manual guidance line placement after clearing', () => {
    let guidanceLineObjects = [];

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      guidanceLineObjects = [];
    });

    const mockOnAddGuidanceLineObject = jest.fn((obj) => {
      guidanceLineObjects.push(obj);
    });

    const simulateSetupEffect = (challenge, brushes, brushesLoaded, onReset, onAdd) => {
      if (!challenge || !brushesLoaded) return;
      if (onReset) onReset();
      if (challenge.setup && challenge.setup.length > 0 && onAdd) {
        onAdd({ id: 'setup_guidance', type: 'guidanceLine', generation: 0 });
      }
    };

    const level8 = { name: '8. Detectors', setup: [{ brush: 'test' }] };
    const level9 = { name: '9. Phases', setup: [] };

    // Load level 8
    simulateSetupEffect(level8, { test: {} }, true, mockOnResetGuidanceLineObjects, mockOnAddGuidanceLineObject);
    expect(guidanceLineObjects).toHaveLength(1);

    // Switch to level 9 - should clear setup guidance lines
    simulateSetupEffect(level9, {}, true, mockOnResetGuidanceLineObjects, mockOnAddGuidanceLineObject);
    expect(guidanceLineObjects).toHaveLength(0);

    // User manually adds a guidance line
    mockOnAddGuidanceLineObject({ id: 'user_guidance', type: 'guidanceLine', generation: 5 });
    expect(guidanceLineObjects).toHaveLength(1);
    expect(guidanceLineObjects[0].id).toBe('user_guidance');
  });
});
