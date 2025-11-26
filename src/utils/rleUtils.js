// RLE (Run Length Encoding) utilities for Conway's Game of Life patterns

/**
 * Decode RLE string to coordinate array
 * @param {string} rleString - RLE encoded pattern
 * @returns {Array<[number, number]>} Array of coordinate tuples [y, x]
 */
export function decodeRLE(rleString) {
  const coordinates = [];
  let currentY = 0;
  let i = 0;

  while (i < rleString.length) {
    let x = 0;

    // Process one line
    while (i < rleString.length) {
      let count = '';

      // Read count
      while (i < rleString.length && /\d/.test(rleString[i])) {
        count += rleString[i];
        i++;
      }
      count = count === '' ? 1 : parseInt(count);

      if (i >= rleString.length) break;

      const char = rleString[i];
      if (char === 'b') {
        // Dead cells - skip
        x += count;
        i++;
      } else if (char === 'o') {
        // Live cells - add coordinates
        for (let j = 0; j < count; j++) {
          coordinates.push([currentY, x + j]);
        }
        x += count;
        i++;
      } else if (char === '$') {
        // Line separator - could be multiple empty lines
        if (count > 1) {
          // Multiple empty lines (e.g., "14$" means 14 empty lines)
          currentY += count;
        } else {
          // Single line separator
          currentY += 1;
        }
        i++;
        break; // End of current line
      } else if (char === '!') {
        // End of pattern
        return coordinates;
      } else {
        // Unknown character, skip
        i++;
      }
    }
  }

  return coordinates;
}

/**
 * Encode a grid as RLE format
 * @param {number[][]} grid - 2D grid array
 * @returns {Object} Object with rle string and bounding box info
 */
export function encodeRLE(grid) {
  if (!grid || grid.length === 0) {
    return { rle: '!', minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  // Find the bounding box of live cells
  let minRow = grid.length, maxRow = -1;
  let minCol = grid[0].length, maxCol = -1;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  if (maxRow === -1) {
    return { rle: '!', minRow: 0, maxRow: 0, minCol: 0, maxCol: 0 };
  }

  // Build array of line strings first
  const lines = [];
  for (let row = minRow; row <= maxRow; row++) {
    let line = '';
    let deadCount = 0;
    let liveCount = 0;
    let hasLiveCells = false;

    // Check if this row has any live cells in the bounding box
    for (let col = minCol; col <= maxCol; col++) {
      if (grid[row][col]) {
        hasLiveCells = true;
        break;
      }
    }

    if (!hasLiveCells) {
      // Empty line
      lines.push('');
      continue;
    }

    // Process the current line with live cells
    for (let col = minCol; col <= maxCol; col++) {
      if (grid[row][col]) {
        // Live cell
        if (deadCount > 0) {
          line += deadCount === 1 ? 'b' : `${deadCount}b`;
          deadCount = 0;
        }
        liveCount++;
      } else {
        // Dead cell
        if (liveCount > 0) {
          line += liveCount === 1 ? 'o' : `${liveCount}o`;
          liveCount = 0;
        }
        deadCount++;
      }
    }

    // Handle remaining live cells at end of row
    if (liveCount > 0) {
      line += liveCount === 1 ? 'o' : `${liveCount}o`;
    }

    lines.push(line);
  }

  // Now build RLE string with proper empty line compression
  let rle = '';
  let i = 0;
  while (i < lines.length) {
    if (lines[i] === '') {
      // Count consecutive empty lines
      let emptyCount = 0;
      while (i < lines.length && lines[i] === '') {
        emptyCount++;
        i++;
      }
      // Add compressed empty lines
      if (emptyCount === 1) {
        rle += '$';
      } else {
        rle += `${emptyCount}$`;
      }
    } else {
      // Add line content
      rle += lines[i];
      i++;
      // Add line separator if not at end
      if (i < lines.length) {
        rle += '$';
      }
    }
  }

  return {
    rle: rle + '!',
    minRow,
    maxRow,
    minCol,
    maxCol
  };
}

/**
 * Parse RLE file content and extract pattern data
 * @param {string} rleContent - Raw RLE file content
 * @returns {Object} Pattern data with name, coordinates, dimensions, and RLE
 */
export function parseRLEFile(rleContent) {
  const lines = rleContent.split('\n');
  let header = '';
  let rleData = '';
  let name = '';
  let guidanceLines = []; // Changed to array to support multiple guidance lines

  for (const line of lines) {
    if (line.startsWith('#N ')) {
      // Name line
      name = line.substring(3).trim();
    } else if (line.startsWith('#P ')) {
      // Guidance line comment - collect all of them
      const guidanceSpec = line.substring(3).trim();
      const parsedGuidanceLine = parseGuidanceLineSpec(guidanceSpec);
      if (parsedGuidanceLine) {
        guidanceLines.push(parsedGuidanceLine);
      }
    } else if (line.startsWith('x = ')) {
      // Header line
      header = line;
    } else if (line && !line.startsWith('#') && !line.startsWith('x = ')) {
      // RLE data lines
      rleData += line;
    }
  }

  // Extract width and height from header with validation
  const headerMatch = header.match(/x = (\d+), y = (\d+)/);
  const width = headerMatch ? parseInt(headerMatch[1]) : 50;
  const height = headerMatch ? parseInt(headerMatch[2]) : 50;

  // Validate parsed dimensions
  if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
    return {
      name: name || 'Invalid Pattern',
      pattern: [],
      width: 50,
      height: 50,
      rle: '',
      guidanceLines: [] // Use array for consistency
    };
  }

  // Decode RLE to coordinates with error handling
  try {
    const coordinates = decodeRLE(rleData);

    // Validate coordinates are within reasonable bounds
    const validCoordinates = coordinates.filter(([y, x]) =>
      typeof y === 'number' && typeof x === 'number' &&
      !isNaN(y) && !isNaN(x) &&
      Math.abs(y) < 1000 && Math.abs(x) < 1000
    );

    // For backward compatibility, include single guidanceLine property if there's exactly one
    const result = {
      name: name || 'Unknown Pattern',
      pattern: validCoordinates,
      width,
      height,
      rle: rleData,
      guidanceLines
    };

    // Backward compatibility: set guidanceLine property for patterns with exactly one guidance line
    if (guidanceLines.length === 1) {
      result.guidanceLine = guidanceLines[0];
    } else if (guidanceLines.length === 0) {
      result.guidanceLine = null;
    }
    // If multiple guidance lines, don't set the single guidanceLine property

    return result;
  } catch (error) {
    console.warn(`Error parsing RLE pattern "${name}":`, error);
    return {
      name: name || 'Error Pattern',
      pattern: [],
      width: 50,
      height: 50,
      rle: '',
      guidanceLines: []
    };
  }
}

/**
 * Decode multiple patterns with individual coordinates
 * @param {Array} patterns - Array of pattern objects with x, y, and rle properties
 * @returns {Array<[number, number]>} Combined coordinate array
 */
export function decodeMultiplePatterns(patterns) {
  const allCoordinates = [];

  for (const pattern of patterns) {
    if (!pattern.rle) continue;

    try {
      const patternCoords = decodeRLE(pattern.rle);
      // Add the pattern's start coordinates to each decoded coordinate
      for (const [y, x] of patternCoords) {
        allCoordinates.push([y + (pattern.y || 0), x + (pattern.x || 0)]);
      }
    } catch (error) {
      console.warn('Error decoding pattern:', error);
    }
  }

  return allCoordinates;
}

/*
 * Parse guidance line specification from #P comment
 * Format: Direction/x/y/length/speed
 * Example: SE/35/21/star/4 (where star means *)
 */
function parseGuidanceLineSpec(spec) {
  const parts = spec.split('/');
  if (parts.length !== 5) return null;

  const [direction, xStr, yStr, lengthStr, speedStr] = parts;
  const x = parseInt(xStr, 10);
  const y = parseInt(yStr, 10);
  const speed = parseInt(speedStr, 10);

  if (isNaN(x) || isNaN(y) || isNaN(speed) || speed <= 0) return null;

  const validDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  if (!validDirections.includes(direction.toUpperCase())) return null;

  return {
    direction: direction.toUpperCase(),
    startX: x,
    startY: y,
    length: lengthStr === '*' ? 'infinite' : parseInt(lengthStr, 10),
    speed: speed
  };
}

/*
 * Generate guidance line pixels based on specification and grid bounds
 */
export function generateGuidanceLine(guidanceSpec, patternCoords, gridWidth, gridHeight) {
  if (!guidanceSpec) return [];

  const { direction, startX, startY, length, speed } = guidanceSpec;

  // Direction vectors
  const directionVectors = {
    'N': [0, -1],
    'NE': [1, -1],
    'E': [1, 0],
    'SE': [1, 1],
    'S': [0, 1],
    'SW': [-1, 1],
    'W': [-1, 0],
    'NW': [-1, -1]
  };

  const [dx, dy] = directionVectors[direction];
  if ((!dx && dx !== 0) || (!dy && dy !== 0)) return [];

  const guidancePixels = [];

  let currentX = startX;
  let currentY = startY;
  let pixelCount = 0;

  // For infinite length, use a reasonable maximum based on grid diagonal
  const maxLength = length === 'infinite' ?
    Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight) * 2 :
    length;

  for (let i = 0; i < maxLength; i++) {
    // Generate pixels in pattern-relative space
    // Bounds checking will be done later when transforming to absolute coordinates

    // Determine color based on speed pattern
    // Alternate between two colors every 'speed' pixels
    const colorPhase = Math.floor(pixelCount / speed) % 2;
    const color = colorPhase === 0 ? 'guidanceColor1' : 'guidanceColor2';

    guidancePixels.push([currentY, currentX, color]);

    // Move to next position
    currentX += dx;
    currentY += dy;
    pixelCount++;
  }

  return guidancePixels;
}
