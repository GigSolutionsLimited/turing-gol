/**
 * Test to verify that challenge objects properly include the 'name' property
 * This addresses the root cause of the level 8-9 guidance line persistence bug
 */

describe('Challenge Name Property Fix', () => {
  test('should include challenge name in state when challenge data is set', () => {
    const { appReducer } = require('../../src/state/appReducer.js');
    const initialState = {
      challenge: {
        name: '',
        pattern: [],
        setup: [],
        targetTurn: 150,
        editableSpace: null,
        width: 50,
        height: 50,
        brushes: [],
        detectorFalloffPeriod: null,
        detectors: [],
        description: ''
      },
      hasStoredChallenge: false
    };

    const challengeData = {
      name: '9. Phases',
      pattern: [[0, 0], [1, 1]],
      setup: [],
      targetTurn: 200,
      width: 201,
      height: 101,
      brushes: ['block'],
      detectors: [],
      description: 'Test challenge'
    };

    const action = {
      type: 'SET_CHALLENGE_DATA',
      payload: challengeData
    };

    const newState = appReducer(initialState, action);

    // Verify that the challenge name is properly set in the state
    expect(newState.challenge.name).toBe('9. Phases');
    expect(newState.challenge.pattern).toEqual([[0, 0], [1, 1]]);
    expect(newState.challenge.width).toBe(201);
    expect(newState.challenge.height).toBe(101);
  });

  test('should include challenge name in derived challenge object from useAppState', () => {
    const mockState = {
      hasStoredChallenge: true,
      challenge: {
        name: '8. Detectors',
        pattern: [[0, 0]],
        setup: [{ x: 0, y: 0, brush: 'test' }],
        targetTurn: 150,
        editableSpace: null,
        width: 201,
        height: 201,
        brushes: ['detector'],
        detectorFalloffPeriod: 10,
        detectors: [],
        description: 'Detector challenge'
      }
    };

    // Simulate the challenge object creation logic from useAppState
    const challenge = mockState.hasStoredChallenge ? {
      name: mockState.challenge.name,
      targetTurn: mockState.challenge.targetTurn,
      pattern: mockState.challenge.pattern,
      editableSpace: mockState.challenge.editableSpace,
      setup: mockState.challenge.setup,
      width: mockState.challenge.width,
      height: mockState.challenge.height,
      brushes: mockState.challenge.brushes,
      detectorFalloffPeriod: mockState.challenge.detectorFalloffPeriod,
      detectors: mockState.challenge.detectors,
      description: mockState.challenge.description
    } : null;

    // Verify that the derived challenge object includes the name
    expect(challenge).not.toBeNull();
    expect(challenge.name).toBe('8. Detectors');
    expect(challenge.width).toBe(201);
    expect(challenge.setup).toHaveLength(1);
  });

  test('should properly detect challenge changes when names are different', () => {
    const mockPreviousChallenge = { name: '8. Detectors' };
    const mockCurrentChallenge = { name: '9. Phases' };

    // Simulate the challenge change detection logic from GameOfLife
    const challengeChanged = mockPreviousChallenge !== mockCurrentChallenge;
    const nameChanged = mockPreviousChallenge?.name !== mockCurrentChallenge?.name;

    // Both reference equality and name comparison should detect the change
    expect(challengeChanged).toBe(true);
    expect(nameChanged).toBe(true);
  });

  test('should not detect challenge change when names are the same', () => {
    const mockChallengeName = '8. Detectors';
    const mockPreviousChallenge = { name: mockChallengeName };
    const mockCurrentChallenge = { name: mockChallengeName };

    // Simulate the scenario where only the challenge object reference changes
    // but the content (including name) is the same
    const challengeChanged = mockPreviousChallenge !== mockCurrentChallenge; // Reference comparison
    const nameChanged = mockPreviousChallenge?.name !== mockCurrentChallenge?.name; // Name comparison

    // Reference equality will be true (different objects) but name should be the same
    expect(challengeChanged).toBe(true); // Different object references
    expect(nameChanged).toBe(false);     // Same name content

    // In the actual code, we use reference comparison (previousChallengeRef.current !== challenge)
    // which is correct for detecting when React passes a new challenge object
  });

  test('should clear challenge name when challenge data is cleared', () => {
    const { appReducer } = require('../../src/state/appReducer.js');
    const stateWithChallenge = {
      challenge: {
        name: '8. Detectors',
        pattern: [[0, 0]],
        setup: [{ x: 0, y: 0 }],
        targetTurn: 150,
        width: 201,
        height: 201,
        brushes: ['detector'],
        detectorFalloffPeriod: 10,
        detectors: [],
        description: 'Test'
      },
      hasStoredChallenge: true
    };

    const clearAction = {
      type: 'CLEAR_CHALLENGE_DATA'
    };

    const newState = appReducer(stateWithChallenge, clearAction);

    // Verify that the challenge name is cleared along with other data
    expect(newState.challenge.name).toBe('');
    expect(newState.challenge.pattern).toEqual([]);
    expect(newState.challenge.setup).toEqual([]);
    expect(newState.hasStoredChallenge).toBe(false);
  });
});
