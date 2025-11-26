// State management for the Game of Life application
import { DEFAULT_TARGET_TURN, DEFAULT_GRID_WIDTH, DEFAULT_GRID_HEIGHT, CELL_SIZE, MIN_CELL_SIZE, MAX_CELL_SIZE, ZOOM_STEP } from '../constants/gameConstants.js';

// Action types
export const APP_ACTIONS = {
  // Exercise management
  SET_EXERCISE: 'SET_EXERCISE',
  SET_AVAILABLE_CHALLENGES: 'SET_AVAILABLE_CHALLENGES',
  SET_COMPLETED_EXERCISES: 'SET_COMPLETED_EXERCISES',
  ADD_COMPLETED_EXERCISE: 'ADD_COMPLETED_EXERCISE',

  // Admin mode
  TOGGLE_ADMIN_MODE: 'TOGGLE_ADMIN_MODE',
  SET_ADMIN_MODE: 'SET_ADMIN_MODE',

  // Challenge state
  SET_CHALLENGE_DATA: 'SET_CHALLENGE_DATA',
  SET_HAS_STORED_CHALLENGE: 'SET_HAS_STORED_CHALLENGE',
  CLEAR_CHALLENGE_DATA: 'CLEAR_CHALLENGE_DATA',

  // UI state
  SET_SELECTED_PATTERN: 'SET_SELECTED_PATTERN',
  SET_PASTING: 'SET_PASTING',
  SET_RUNNING: 'SET_RUNNING',

  // Zoom state
  SET_ZOOM_LEVEL: 'SET_ZOOM_LEVEL',
  ZOOM_IN: 'ZOOM_IN',
  ZOOM_OUT: 'ZOOM_OUT',

  // Error handling
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',

  // Guidance lines (object-based system only)
  SET_GUIDANCE_LINES_VISIBLE: 'SET_GUIDANCE_LINES_VISIBLE',

  // Generation-based guidance lines
  ADD_GUIDANCE_LINE_OBJECT: 'ADD_GUIDANCE_LINE_OBJECT',
  REMOVE_GUIDANCE_LINE_OBJECT: 'REMOVE_GUIDANCE_LINE_OBJECT',
  RESET_GUIDANCE_LINE_OBJECTS: 'RESET_GUIDANCE_LINE_OBJECTS',

  // Reset
  RESET_STATE: 'RESET_STATE'
};

// Initial state
export const initialAppState = {
  // Exercise management
  exercise: '',
  availableChallenges: [],
  completedExercises: new Set(),

  // Admin mode
  adminMode: false,

  // Challenge configuration
  challenge: {
    name: '', // Challenge name for proper change detection
    pattern: [[0,1],[1,2],[2,0],[2,1],[2,2]], // Default pattern
    setup: [],
    targetTurn: DEFAULT_TARGET_TURN,
    editableSpace: null,
    width: DEFAULT_GRID_WIDTH,
    height: DEFAULT_GRID_HEIGHT,
    brushes: [],
    detectorFalloffPeriod: null, // Will be set from challenge data
    detectors: [], // Will be set from challenge data
    description: '' // Will be set from challenge data
  },
  hasStoredChallenge: false,

  // UI state
  selectedPattern: null,
  pasting: false,
  running: false,

  // Zoom state
  cellSize: CELL_SIZE,

  // Guidance lines state (object-based system only)
  guidanceLinesVisible: true, // Whether guidance lines should be rendered
  guidanceLineObjects: [], // Array of generation-based guidance line objects

  // Error state
  error: null
};

// Reducer function
export function appReducer(state, action) {
  // Clear any existing error on new actions (except error actions)
  const baseState = action.type.includes('ERROR') ? state : { ...state, error: null };

  switch (action.type) {
    case APP_ACTIONS.SET_EXERCISE:
      return {
        ...baseState,
        exercise: action.payload || ''
      };

    case APP_ACTIONS.SET_AVAILABLE_CHALLENGES:
      return {
        ...baseState,
        availableChallenges: Array.isArray(action.payload) ? action.payload : []
      };

    case APP_ACTIONS.SET_COMPLETED_EXERCISES:
      return {
        ...baseState,
        completedExercises: new Set(action.payload || [])
      };

    case APP_ACTIONS.ADD_COMPLETED_EXERCISE:
      if (!action.payload) return baseState;
      return {
        ...baseState,
        completedExercises: new Set([...state.completedExercises, action.payload])
      };

    case APP_ACTIONS.TOGGLE_ADMIN_MODE:
      return {
        ...baseState,
        adminMode: !state.adminMode
      };

    case APP_ACTIONS.SET_ADMIN_MODE:
      return {
        ...baseState,
        adminMode: Boolean(action.payload)
      };

    case APP_ACTIONS.SET_CHALLENGE_DATA:
      if (!action.payload || typeof action.payload !== 'object') return baseState;
      return {
        ...baseState,
        challenge: {
          ...state.challenge,
          ...action.payload
        }
      };

    case APP_ACTIONS.SET_HAS_STORED_CHALLENGE:
      return {
        ...baseState,
        hasStoredChallenge: Boolean(action.payload)
      };

    case APP_ACTIONS.CLEAR_CHALLENGE_DATA:
      return {
        ...baseState,
        challenge: {
          name: '',
          pattern: [],
          setup: [],
          targetTurn: DEFAULT_TARGET_TURN,
          editableSpace: null,
          width: DEFAULT_GRID_WIDTH,
          height: DEFAULT_GRID_HEIGHT,
          brushes: [],
          detectorFalloffPeriod: null,
          detectors: [],
          description: ''
        },
        hasStoredChallenge: false
      };

    case APP_ACTIONS.SET_SELECTED_PATTERN:
      return {
        ...baseState,
        selectedPattern: action.payload,
        pasting: action.payload !== null
      };

    case APP_ACTIONS.SET_PASTING:
      return {
        ...baseState,
        pasting: Boolean(action.payload)
      };

    case APP_ACTIONS.SET_RUNNING:
      return {
        ...baseState,
        running: Boolean(action.payload)
      };

    case APP_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload
      };

    case APP_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case APP_ACTIONS.SET_ZOOM_LEVEL:
      return {
        ...baseState,
        cellSize: Math.min(MAX_CELL_SIZE, Math.max(MIN_CELL_SIZE, action.payload))
      };

    case APP_ACTIONS.ZOOM_IN:
      return {
        ...baseState,
        cellSize: Math.min(MAX_CELL_SIZE, state.cellSize + ZOOM_STEP)
      };

    case APP_ACTIONS.ZOOM_OUT:
      return {
        ...baseState,
        cellSize: Math.max(MIN_CELL_SIZE, state.cellSize - ZOOM_STEP)
      };


    case APP_ACTIONS.SET_GUIDANCE_LINES_VISIBLE:
      return {
        ...baseState,
        guidanceLinesVisible: Boolean(action.payload)
      };

    case APP_ACTIONS.ADD_GUIDANCE_LINE_OBJECT:
      return {
        ...baseState,
        guidanceLineObjects: [...state.guidanceLineObjects, action.payload]
      };

    case APP_ACTIONS.REMOVE_GUIDANCE_LINE_OBJECT:
      return {
        ...baseState,
        guidanceLineObjects: state.guidanceLineObjects.filter(line => line.id !== action.payload)
      };

    case APP_ACTIONS.RESET_GUIDANCE_LINE_OBJECTS:
      return {
        ...baseState,
        guidanceLineObjects: [] // Clear ALL guidance lines
      };

    case APP_ACTIONS.RESET_STATE:
      return {
        ...initialAppState,
        availableChallenges: state.availableChallenges, // Preserve loaded challenges
        exercise: state.exercise // Preserve current exercise
      };

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return state;
  }
}

// Action creators for common operations
export const appActions = {
  setExercise: (exercise) => ({
    type: APP_ACTIONS.SET_EXERCISE,
    payload: exercise
  }),

  setAvailableChallenges: (challenges) => ({
    type: APP_ACTIONS.SET_AVAILABLE_CHALLENGES,
    payload: challenges
  }),

  addCompletedExercise: (exercise) => ({
    type: APP_ACTIONS.ADD_COMPLETED_EXERCISE,
    payload: exercise
  }),

  toggleAdminMode: () => ({
    type: APP_ACTIONS.TOGGLE_ADMIN_MODE
  }),

  setChallengeData: (challengeData) => ({
    type: APP_ACTIONS.SET_CHALLENGE_DATA,
    payload: challengeData
  }),

  setSelectedPattern: (pattern) => ({
    type: APP_ACTIONS.SET_SELECTED_PATTERN,
    payload: pattern
  }),

  setRunning: (running) => ({
    type: APP_ACTIONS.SET_RUNNING,
    payload: running
  }),

  setHasStoredChallenge: (hasStored) => ({
    type: APP_ACTIONS.SET_HAS_STORED_CHALLENGE,
    payload: hasStored
  }),

  setError: (error) => ({
    type: APP_ACTIONS.SET_ERROR,
    payload: error
  }),

  clearError: () => ({
    type: APP_ACTIONS.CLEAR_ERROR
  }),

  // Zoom actions
  setZoomLevel: (cellSize) => ({
    type: APP_ACTIONS.SET_ZOOM_LEVEL,
    payload: cellSize
  }),

  zoomIn: () => ({
    type: APP_ACTIONS.ZOOM_IN
  }),

  zoomOut: () => ({
    type: APP_ACTIONS.ZOOM_OUT
  }),

  // Guidance line actions (object-based system only)
  setGuidanceLinesVisible: (visible) => ({
    type: APP_ACTIONS.SET_GUIDANCE_LINES_VISIBLE,
    payload: visible
  }),

  // Generation-based guidance line actions
  addGuidanceLineObject: (guidanceLineObject) => ({
    type: APP_ACTIONS.ADD_GUIDANCE_LINE_OBJECT,
    payload: guidanceLineObject
  }),

  removeGuidanceLineObject: (guidanceLineId) => ({
    type: APP_ACTIONS.REMOVE_GUIDANCE_LINE_OBJECT,
    payload: guidanceLineId
  }),

  resetGuidanceLineObjects: () => ({
    type: APP_ACTIONS.RESET_GUIDANCE_LINE_OBJECTS
  })
};
