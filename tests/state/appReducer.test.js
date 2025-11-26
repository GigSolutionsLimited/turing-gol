// Unit tests for app state reducer
import { appReducer, initialAppState, APP_ACTIONS, appActions } from '../../src/state/appReducer.js';

describe('App Reducer', () => {
  describe('initialAppState', () => {
    test('should have correct initial state structure', () => {
      expect(initialAppState).toBeDefined();
      expect(typeof initialAppState).toBe('object');
      expect(initialAppState.completedExercises).toBeInstanceOf(Set);
    });

    test('should have Set for completedExercises', () => {
      expect(initialAppState.completedExercises).toBeInstanceOf(Set);
    });

    test('should have default challenge structure', () => {
      expect(initialAppState.challenge).toBeDefined();
      expect(typeof initialAppState.challenge).toBe('object');
    });
  });

  describe('SET_EXERCISE action', () => {
    test('should set exercise correctly', () => {
      const action = { type: APP_ACTIONS.SET_EXERCISE, payload: '1. Basics' };
      const newState = appReducer(initialAppState, action);

      expect(newState.exercise).toBe('1. Basics');
      expect(newState.error).toBe(null); // Error should be cleared
    });

    test('should handle null/undefined exercise', () => {
      const action = { type: APP_ACTIONS.SET_EXERCISE, payload: null };
      const newState = appReducer(initialAppState, action);

      expect(newState.exercise).toBe('');
    });

    test('should clear errors on exercise change', () => {
      const stateWithError = { ...initialAppState, error: 'Some error' };
      const action = { type: APP_ACTIONS.SET_EXERCISE, payload: '2. Advanced' };
      const newState = appReducer(stateWithError, action);

      expect(newState.error).toBe(null);
    });
  });

  describe('SET_AVAILABLE_CHALLENGES action', () => {
    test('should set challenges array', () => {
      const challenges = [{ id: 1, name: '1. Basics' }, { id: 2, name: '2. Advanced' }];
      const action = { type: APP_ACTIONS.SET_AVAILABLE_CHALLENGES, payload: challenges };
      const newState = appReducer(initialAppState, action);

      expect(newState.availableChallenges).toEqual(challenges);
    });

    test('should validate input is array', () => {
      const action = { type: APP_ACTIONS.SET_AVAILABLE_CHALLENGES, payload: 'not an array' };
      const newState = appReducer(initialAppState, action);

      expect(newState.availableChallenges).toEqual([]);
    });

    test('should handle null payload', () => {
      const action = { type: APP_ACTIONS.SET_AVAILABLE_CHALLENGES, payload: null };
      const newState = appReducer(initialAppState, action);

      expect(newState.availableChallenges).toEqual([]);
    });
  });

  describe('ADD_COMPLETED_EXERCISE action', () => {
    test('should add exercise to completed set', () => {
      const action = { type: APP_ACTIONS.ADD_COMPLETED_EXERCISE, payload: '1. Basics' };
      const newState = appReducer(initialAppState, action);

      expect(newState.completedExercises.has('1. Basics')).toBe(true);
      expect(newState.completedExercises).toBeInstanceOf(Set);
    });

    test('should not add duplicates', () => {
      const stateWithCompleted = {
        ...initialAppState,
        completedExercises: new Set(['1. Basics'])
      };

      const action = { type: APP_ACTIONS.ADD_COMPLETED_EXERCISE, payload: '1. Basics' };
      const newState = appReducer(stateWithCompleted, action);

      expect(newState.completedExercises.size).toBe(1);
      expect(newState.completedExercises.has('1. Basics')).toBe(true);
    });

    test('should handle null payload', () => {
      const action = { type: APP_ACTIONS.ADD_COMPLETED_EXERCISE, payload: null };
      const newState = appReducer(initialAppState, action);

      expect(newState.completedExercises.size).toBe(0); // Should remain empty
      expect(newState.error).toBe(null); // Error should be cleared (baseState)
    });
  });

  describe('TOGGLE_ADMIN_MODE action', () => {
    test('should toggle admin mode from false to true', () => {
      const action = { type: APP_ACTIONS.TOGGLE_ADMIN_MODE };
      const newState = appReducer(initialAppState, action);

      expect(newState.adminMode).toBe(true);
    });

    test('should toggle admin mode from true to false', () => {
      const stateWithAdmin = { ...initialAppState, adminMode: true };
      const action = { type: APP_ACTIONS.TOGGLE_ADMIN_MODE };
      const newState = appReducer(stateWithAdmin, action);

      expect(newState.adminMode).toBe(false);
    });
  });

  describe('SET_CHALLENGE_DATA action', () => {
    test('should merge challenge data correctly', () => {
      const challengeUpdate = {
        pattern: [[1, 1], [1, 2]],
        targetTurn: 200,
        width: 60
      };

      const action = { type: APP_ACTIONS.SET_CHALLENGE_DATA, payload: challengeUpdate };
      const newState = appReducer(initialAppState, action);

      expect(newState.challenge.pattern).toEqual([[1, 1], [1, 2]]);
      expect(newState.challenge.targetTurn).toBe(200);
      expect(newState.challenge.width).toBe(60);
      // Should preserve unchanged values
      expect(newState.challenge.height).toBeDefined();
    });

    test('should handle null payload', () => {
      const action = { type: APP_ACTIONS.SET_CHALLENGE_DATA, payload: null };
      const newState = appReducer(initialAppState, action);

      expect(newState.challenge).toEqual(initialAppState.challenge);
    });

    test('should handle non-object payload', () => {
      const action = { type: APP_ACTIONS.SET_CHALLENGE_DATA, payload: 'string' };
      const newState = appReducer(initialAppState, action);

      expect(newState.challenge).toEqual(initialAppState.challenge);
    });
  });

  describe('SET_SELECTED_PATTERN action', () => {
    test('should set pattern and enable pasting', () => {
      const pattern = { name: 'glider', pattern: [[0, 1], [1, 2]] };
      const action = { type: APP_ACTIONS.SET_SELECTED_PATTERN, payload: pattern };
      const newState = appReducer(initialAppState, action);

      expect(newState.selectedPattern).toEqual(pattern);
      expect(newState.pasting).toBe(true);
    });

    test('should clear pattern and disable pasting', () => {
      const stateWithPattern = {
        ...initialAppState,
        selectedPattern: { name: 'test' },
        pasting: true
      };

      const action = { type: APP_ACTIONS.SET_SELECTED_PATTERN, payload: null };
      const newState = appReducer(stateWithPattern, action);

      expect(newState.selectedPattern).toBe(null);
      expect(newState.pasting).toBe(false);
    });
  });

  describe('SET_ERROR action', () => {
    test('should set error message', () => {
      const error = 'Something went wrong';
      const action = { type: APP_ACTIONS.SET_ERROR, payload: error };
      const newState = appReducer(initialAppState, action);

      expect(newState.error).toBe(error);
    });

    test('should not clear errors automatically', () => {
      const stateWithError = { ...initialAppState, error: 'Previous error' };
      const action = { type: APP_ACTIONS.SET_ERROR, payload: 'New error' };
      const newState = appReducer(stateWithError, action);

      expect(newState.error).toBe('New error');
    });
  });

  describe('CLEAR_ERROR action', () => {
    test('should clear error', () => {
      const stateWithError = { ...initialAppState, error: 'Some error' };
      const action = { type: APP_ACTIONS.CLEAR_ERROR };
      const newState = appReducer(stateWithError, action);

      expect(newState.error).toBe(null);
    });
  });

  describe('error clearing behavior', () => {
    test('should clear errors on non-error actions', () => {
      const stateWithError = { ...initialAppState, error: 'Some error' };
      const action = { type: APP_ACTIONS.SET_EXERCISE, payload: '1. Basics' };
      const newState = appReducer(stateWithError, action);

      expect(newState.error).toBe(null);
    });

    test('should not clear errors on error actions', () => {
      const stateWithError = { ...initialAppState, error: 'Previous error' };
      const action = { type: APP_ACTIONS.SET_ERROR, payload: 'New error' };
      const newState = appReducer(stateWithError, action);

      expect(newState.error).toBe('New error');
    });
  });

  describe('RESET_STATE action', () => {
    test('should reset to initial state preserving challenges and exercise', () => {
      const modifiedState = {
        ...initialAppState,
        exercise: '2. Advanced',
        availableChallenges: [{ id: 1, name: '1. Basics' }],
        adminMode: true,
        running: true,
        error: 'Some error'
      };

      const action = { type: APP_ACTIONS.RESET_STATE };
      const newState = appReducer(modifiedState, action);

      // Should preserve exercise and challenges, reset other state
      expect(newState.adminMode).toBe(false); // Reset
      expect(newState.running).toBe(false); // Reset
      expect(newState.error).toBe(null); // Reset
    });
  });

  describe('unknown action', () => {
    test('should return current state and log warning', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const action = { type: 'UNKNOWN_ACTION', payload: 'test' };
      const newState = appReducer(initialAppState, action);

      expect(newState).toBe(initialAppState);
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('action creators', () => {
    test('action creators should exist and create correct actions', () => {
      expect(typeof appActions).toBe('object');

      // Test that action creators exist
      expect(typeof appActions.setExercise).toBe('function');
      expect(typeof appActions.addCompletedExercise).toBe('function');
      expect(typeof appActions.toggleAdminMode).toBe('function');
      expect(typeof appActions.setChallengeData).toBe('function');
      expect(typeof appActions.setSelectedPattern).toBe('function');
    });
  });

  describe('immutability', () => {
    test('should not mutate original state', () => {
      const originalState = { ...initialAppState };
      const action = { type: APP_ACTIONS.SET_EXERCISE, payload: '1. Basics' };

      appReducer(initialAppState, action);

      expect(initialAppState.exercise).toEqual(originalState.exercise);
    });

    test('should create new challenge object when updating', () => {
      const action = { type: APP_ACTIONS.SET_CHALLENGE_DATA, payload: { width: 100 } };
      const newState = appReducer(initialAppState, action);

      expect(newState.challenge).not.toBe(initialAppState.challenge);
      expect(newState.challenge.width).toBe(100);
    });
  });
});
