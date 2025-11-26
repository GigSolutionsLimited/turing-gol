// Custom hook for managing application state
import { useReducer, useCallback, useMemo } from 'react';
import { appReducer, initialAppState, appActions } from '../state/appReducer.js';

/**
 * Custom hook for managing the main application state
 * @returns {Object} State and action dispatchers
 */
export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialAppState);

  // Memoized action dispatchers to prevent unnecessary re-renders
  const actions = useMemo(() => ({
    setExercise: (exercise) => dispatch(appActions.setExercise(exercise)),
    setAvailableChallenges: (challenges) => dispatch(appActions.setAvailableChallenges(challenges)),
    addCompletedExercise: (exercise) => dispatch(appActions.addCompletedExercise(exercise)),
    toggleAdminMode: () => dispatch(appActions.toggleAdminMode()),
    setAdminMode: (adminMode) => dispatch({ type: 'SET_ADMIN_MODE', payload: adminMode }),
    setChallengeData: (challengeData) => dispatch(appActions.setChallengeData(challengeData)),
    setSelectedPattern: (pattern) => dispatch(appActions.setSelectedPattern(pattern)),
    setRunning: (running) => dispatch(appActions.setRunning(running)),
    setHasStoredChallenge: (hasStored) => dispatch(appActions.setHasStoredChallenge(hasStored)),
    setError: (error) => dispatch(appActions.setError(error)),
    clearError: () => dispatch(appActions.clearError()),
    clearChallengeData: () => dispatch({ type: 'CLEAR_CHALLENGE_DATA' }),
    resetState: () => dispatch({ type: 'RESET_STATE' }),
    // Zoom actions
    zoomIn: () => dispatch(appActions.zoomIn()),
    zoomOut: () => dispatch(appActions.zoomOut()),
    setZoomLevel: (cellSize) => dispatch(appActions.setZoomLevel(cellSize)),
    // Guidance line actions (object-based system only)
    setGuidanceLinesVisible: (visible) => dispatch(appActions.setGuidanceLinesVisible(visible)),
    // Generation-based guidance line actions
    addGuidanceLineObject: (guidanceLineData) => dispatch(appActions.addGuidanceLineObject(guidanceLineData)),
    resetGuidanceLineObjects: () => dispatch(appActions.resetGuidanceLineObjects())
  }), []);

  // Derived state for the challenge object used by GameOfLife
  const challenge = useMemo(() => {
    return state.hasStoredChallenge ? {
      name: state.challenge.name,
      targetTurn: state.challenge.targetTurn,
      pattern: state.challenge.pattern,
      editableSpace: state.challenge.editableSpace,
      setup: state.challenge.setup,
      width: state.challenge.width,
      height: state.challenge.height,
      brushes: state.challenge.brushes,
      detectorFalloffPeriod: state.challenge.detectorFalloffPeriod,
      detectors: state.challenge.detectors,
      description: state.challenge.description,
      testScenarios: state.challenge.testScenarios // ← MISSING FIELD ADDED!
    } : null;
  }, [
    state.hasStoredChallenge,
    state.challenge.name,
    state.challenge.targetTurn,
    state.challenge.pattern,
    state.challenge.editableSpace,
    state.challenge.setup,
    state.challenge.width,
    state.challenge.height,
    state.challenge.brushes,
    state.challenge.detectorFalloffPeriod,
    state.challenge.detectors,
    state.challenge.description,
    state.challenge.testScenarios // ← MISSING DEPENDENCY ADDED!
  ]);

  // Callback for pattern selection that automatically sets pasting state
  const handlePatternSelect = useCallback((pattern) => {
    actions.setSelectedPattern(pattern);
  }, [actions]);

  // Callback for admin mode change
  const handleAdminModeChange = useCallback((adminMode) => {
    actions.setAdminMode(adminMode);
  }, [actions]);

  return {
    // State
    ...state,
    challenge,

    // Actions
    ...actions,

    // Specialized handlers
    handlePatternSelect,
    handleAdminModeChange,

    // Raw dispatch for advanced use cases
    dispatch
  };
};
