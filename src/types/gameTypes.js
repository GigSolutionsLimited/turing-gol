// Type definitions and interfaces for Game of Life
// Note: These are JSDoc types for better IDE support and future TypeScript migration

/**
 * @typedef {Object} Coordinate
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {[number, number]} CoordinateTuple
 * Array representation of coordinates [y, x]
 */

/**
 * @typedef {Object} Pattern
 * @property {string} name - Pattern name
 * @property {CoordinateTuple[]} pattern - Array of coordinate tuples
 * @property {number} [width] - Pattern width
 * @property {number} [height] - Pattern height
 * @property {string} [rle] - RLE representation
 */

/**
 * @typedef {Object} Challenge
 * @property {CoordinateTuple[]} pattern - Target pattern coordinates
 * @property {number} targetTurn - Generation number when pattern should be achieved
 * @property {Object} [editableSpace] - Editable area constraints
 * @property {number} editableSpace.minX - Minimum X coordinate
 * @property {number} editableSpace.maxX - Maximum X coordinate
 * @property {number} editableSpace.minY - Minimum Y coordinate
 * @property {number} editableSpace.maxY - Maximum Y coordinate
 * @property {Object[]} [setup] - Initial setup patterns
 * @property {number} width - Grid width
 * @property {number} height - Grid height
 * @property {string[]} brushes - Available brush IDs
 */

/**
 * @typedef {Object} GridSize
 * @property {number} width - Grid width in cells
 * @property {number} height - Grid height in cells
 */

/**
 * @typedef {Object} CanvasSize
 * @property {number} width - Canvas width in pixels
 * @property {number} height - Canvas height in pixels
 * @property {number} maxWidth - Maximum available width
 * @property {number} maxHeight - Maximum available height
 * @property {boolean} needsScrolling - Whether scrolling is needed
 */

/**
 * @typedef {Object} MouseCoords
 * @property {number} x - Grid X coordinate (center-based)
 * @property {number} y - Grid Y coordinate (center-based)
 * @property {number} screenX - Screen X coordinate
 * @property {number} screenY - Screen Y coordinate
 */

/**
 * @typedef {Object} GameState
 * @property {number[][]} grid - 2D array representing the game grid
 * @property {number} generation - Current generation number
 * @property {boolean} running - Whether the game is running
 * @property {boolean} levelCompleted - Whether the current level is completed
 * @property {boolean} levelFailed - Whether the current level has failed
 */

/**
 * @typedef {Object} AdminPanelProps
 * @property {boolean} adminMode - Whether admin mode is active
 * @property {Object} gameRef - Reference to game instance
 * @property {string} exercise - Current exercise name
 */

/**
 * @typedef {Object} LevelCompletionResult
 * @property {boolean} completed - Whether level is completed
 * @property {boolean} failed - Whether level has failed
 */

export {};
