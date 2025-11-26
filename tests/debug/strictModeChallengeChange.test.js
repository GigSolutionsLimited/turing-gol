/**
 * Test to verify that challenge change detection works correctly in React Strict Mode
 * Addresses the issue where effects run twice in development mode
 */

describe('React Strict Mode Challenge Change Detection', () => {
  test('should detect challenge changes correctly even when effects run twice', () => {
    let previousChallengeNameRef = { current: null };
    let resetGuidanceLinesCallCount = 0;

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      resetGuidanceLinesCallCount++;
    });

    // Simulate the challenge change detection logic from GameOfLife
    const simulateEffect = (challenge) => {
      const currentChallengeName = challenge?.name;
      const previousChallengeName = previousChallengeNameRef.current;
      const challengeChanged = previousChallengeName !== currentChallengeName;

      console.log('🔄 Simulated challenge change effect:', {
        challengeChanged,
        previousChallenge: previousChallengeName || 'null',
        currentChallenge: currentChallengeName || 'null'
      });

      // Clear guidance lines if challenge changed
      if (challengeChanged && mockOnResetGuidanceLineObjects) {
        console.log('🔄 Challenge changed - clearing guidance lines from',
          previousChallengeName || 'null', 'to', currentChallengeName || 'null');
        mockOnResetGuidanceLineObjects();
      }

      // Update ref at the end
      previousChallengeNameRef.current = currentChallengeName;
    };

    // Test scenario: Level 8 loads initially
    const level8Challenge = { name: '8. Detectors' };

    // First run (initial mount in Strict Mode)
    simulateEffect(level8Challenge);
    expect(resetGuidanceLinesCallCount).toBe(1); // Should detect change from null to 8

    // Second run (Strict Mode double execution)
    simulateEffect(level8Challenge);
    expect(resetGuidanceLinesCallCount).toBe(1); // Should NOT detect change (8 to 8)

    // User switches to level 9
    const level9Challenge = { name: '9. Phases' };

    // First run of level transition
    simulateEffect(level9Challenge);
    expect(resetGuidanceLinesCallCount).toBe(2); // Should detect change from 8 to 9

    // Second run (Strict Mode double execution)
    simulateEffect(level9Challenge);
    expect(resetGuidanceLinesCallCount).toBe(2); // Should NOT detect change (9 to 9)

    // Verify the final calls
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(2);
  });

  test('should handle null/undefined challenges correctly in Strict Mode', () => {
    let previousChallengeNameRef = { current: null };
    let resetGuidanceLinesCallCount = 0;

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      resetGuidanceLinesCallCount++;
    });

    const simulateEffect = (challenge) => {
      const currentChallengeName = challenge?.name;
      const previousChallengeName = previousChallengeNameRef.current;
      const challengeChanged = previousChallengeName !== currentChallengeName;

      if (challengeChanged && mockOnResetGuidanceLineObjects) {
        mockOnResetGuidanceLineObjects();
      }

      previousChallengeNameRef.current = currentChallengeName;
    };

    // Start with null challenge - this will trigger change from null to undefined
    // because challenge?.name when challenge is null returns undefined
    simulateEffect(null);
    expect(resetGuidanceLinesCallCount).toBe(1); // Change from null to undefined

    // Strict Mode double execution - should not trigger again
    simulateEffect(null);
    expect(resetGuidanceLinesCallCount).toBe(1); // No additional change (undefined to undefined)

    // Load first challenge
    simulateEffect({ name: '1. Basics' });
    expect(resetGuidanceLinesCallCount).toBe(2); // Change from undefined to '1. Basics'

    // Strict Mode double execution
    simulateEffect({ name: '1. Basics' });
    expect(resetGuidanceLinesCallCount).toBe(2); // No additional change

    // Load challenge without name (undefined)
    simulateEffect({ other: 'property' }); // name is undefined
    expect(resetGuidanceLinesCallCount).toBe(3); // Change from '1. Basics' to undefined

    // Strict Mode double execution
    simulateEffect({ other: 'property' });
    expect(resetGuidanceLinesCallCount).toBe(3); // No additional change

    // Back to null challenge (still undefined)
    simulateEffect(null);
    expect(resetGuidanceLinesCallCount).toBe(3); // undefined to undefined, no change

    // Strict Mode double execution
    simulateEffect(null);
    expect(resetGuidanceLinesCallCount).toBe(3); // No additional change

    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(3);
  });

  test('should work correctly with rapid challenge changes in Strict Mode', () => {
    let previousChallengeNameRef = { current: null };
    const resetCalls = [];

    const mockOnResetGuidanceLineObjects = jest.fn(() => {
      resetCalls.push(previousChallengeNameRef.current);
    });

    const simulateEffect = (challenge) => {
      const currentChallengeName = challenge?.name;
      const previousChallengeName = previousChallengeNameRef.current;
      const challengeChanged = previousChallengeName !== currentChallengeName;

      if (challengeChanged && mockOnResetGuidanceLineObjects) {
        mockOnResetGuidanceLineObjects();
      }

      previousChallengeNameRef.current = currentChallengeName;
    };

    // Simulate rapid level changes (each with Strict Mode double execution)
    const challenges = [
      { name: '1. Basics' },
      { name: '2. Glider Gun' },
      { name: '3. Wires' },
      { name: '4. Detectors' },
      { name: '5. Guidance' }
    ];

    for (const challenge of challenges) {
      // First run (normal execution)
      simulateEffect(challenge);
      // Second run (Strict Mode double execution)
      simulateEffect(challenge);
    }

    // Should have reset guidance lines for each actual challenge change
    expect(mockOnResetGuidanceLineObjects).toHaveBeenCalledTimes(5);

    // Verify that resets happened at the right transitions
    expect(resetCalls).toEqual([
      null,           // null -> 1. Basics
      '1. Basics',    // 1. Basics -> 2. Glider Gun
      '2. Glider Gun', // 2. Glider Gun -> 3. Wires
      '3. Wires',     // 3. Wires -> 4. Detectors
      '4. Detectors'  // 4. Detectors -> 5. Guidance
    ]);
  });
});
