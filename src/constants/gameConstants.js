// Game of Life constants and configuration

// Visual constants
export const CELL_SIZE = 8;
export const MIN_CELL_SIZE = 2;
export const MAX_CELL_SIZE = 16;
export const ZOOM_STEP = 2;
export const BASE_SPEED = 640;

// Grid constraints
export const MIN_GRID_SIZE = 10;
export const MAX_GRID_SIZE = 501;
export const DEFAULT_GRID_WIDTH = 50;
export const DEFAULT_GRID_HEIGHT = 50;

// Animation settings
export const MIN_SPEED_MULTIPLIER = 1;
export const MAX_SPEED_MULTIPLIER = 64;
export const DEFAULT_SPEED_MULTIPLIER = 4;

// Challenge settings
export const DEFAULT_TARGET_TURN = 150;
export const MAX_TARGET_TURN = 1000;

// UI dimensions
export const LEFT_PANEL_WIDTH = 200;
export const RIGHT_PANEL_WIDTH = 180;
export const MIN_CANVAS_SIZE = 300;

// Note: Exercise configurations (including brushes) are now stored in individual challenge JSON files
// in /public/challenges/ directory rather than in this constants file.
// Brush files are automatically discovered from /public/brushes/ directory.

// Local storage keys
export const STORAGE_KEYS = {
  CHALLENGE_PREFIX: 'challenge_',
  TARGETS: 'challengeTargets',
  USER_SETTINGS: 'userSettings'
};

// Game states
export const GAME_STATE = {
  STOPPED: 'stopped',
  RUNNING: 'running',
  PAUSED: 'paused'
};

// Level completion states
export const LEVEL_STATE = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

// Detector constants
export const DETECTOR_CONSTANTS = {
  DEFAULT_FALLOFF_PERIOD: 10,
  MIN_FALLOFF_PERIOD: 1,
  MAX_FALLOFF_PERIOD: 100,
  FONT_SIZE_RATIO: 0.6, // Relative to cell size
  MIN_FONT_SIZE: 8,
  MAX_FONT_SIZE: 24
};

// Pattern types
export const PATTERN_TYPES = {
  NORMAL: 'normal',
  DETECTOR: 'detector',
  ERASER: 'eraser'
};

