// Guidance line object management
// Independent guidance lines with generation tracking

/**
 * Create a guidance line object
 * @param {number} generation - Generation when the line was placed
 * @param {number} originX - X coordinate of line origin
 * @param {number} originY - Y coordinate of line origin
 * @param {string} direction - Direction (N, NE, E, SE, S, SW, W, NW)
 * @param {number|string} length - Length of line (number or 'infinite')
 * @param {number} speed - Speed pattern for alternating colors
 * @returns {Object} Guidance line object
 */
export function createGuidanceLineObject(generation, originX, originY, direction, length, speed) {
  return {
    id: `guidance_${Date.now()}_${originX}_${originY}`,
    type: 'guidanceLine',
    generation,
    originX,
    originY,
    direction: direction.toUpperCase(),
    length,
    speed,
    createdAt: Date.now()
  };
}

/**
 * Generate pixels for a guidance line object
 * @param {Object} guidanceLine - Guidance line object
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @param {Array} allGuidanceLines - All guidance line objects for intersection detection
 * @returns {Array} Array of guidance line pixels [[y, x, color], ...]
 */
/**
 * Generate pixels for a guidance line object
 * @param {Object} guidanceLine - Guidance line object
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @param {Array} allGuidanceLines - All guidance line objects for intersection detection
 * @returns {Array} Array of guidance line pixels [[y, x, color], ...]
 */
export function generateGuidanceLinePixels(guidanceLine, gridWidth, gridHeight, allGuidanceLines = []) {
  // If no other lines or only one line, use basic generation without intersection logic
  if (allGuidanceLines.length <= 1) {
    return generateGuidanceLinePixelsWithColors(guidanceLine, gridWidth, gridHeight);
  }

  // Use the intersection logic directly for this single line
  const visibleLines = getVisibleGuidanceLines(allGuidanceLines, 0);

  // First, calculate the full path for each line without intersections
  const linePaths = new Map();
  for (const line of visibleLines) {
    const pixels = generateGuidanceLinePixelsBasic(line, gridWidth, gridHeight);
    const lineKey = line.id || line;
    linePaths.set(lineKey, pixels);
  }

  // Find the truncated path for this specific line
  const lineKey = guidanceLine.id || guidanceLine;
  const fullPath = linePaths.get(lineKey);
  if (!fullPath) return [];

  let truncatedPath = [];

  for (let i = 0; i < fullPath.length; i++) {
    const [currentY, currentX] = fullPath[i];

    // Check for intersections with other lines
    let shouldStop = false;
    if (i > 0) { // Don't stop at origin
      for (const otherLine of visibleLines) {
        const otherLineKey = otherLine.id || otherLine;
        if (lineKey === otherLineKey) continue;

        const otherPath = linePaths.get(otherLineKey);

        // Count consecutive pixels that would intersect
        let consecutiveHits = 0;
        for (let j = 0; j < Math.min(2, fullPath.length - i); j++) {
          if (i + j >= fullPath.length) break;
          const [checkY, checkX] = fullPath[i + j];
          const hasIntersection = otherPath.some(([otherY, otherX]) =>
            otherY === checkY && otherX === checkX
          );
          if (hasIntersection) {
            consecutiveHits++;
          } else {
            break;
          }
        }

        // If we would hit 2+ consecutive pixels, check distance and stop if needed
        if (consecutiveHits >= 2) {
          const currentLineDistance = Math.sqrt(
            Math.pow(currentX - guidanceLine.originX, 2) + Math.pow(currentY - guidanceLine.originY, 2)
          );
          const otherLineDistance = Math.sqrt(
            Math.pow(currentX - otherLine.originX, 2) + Math.pow(currentY - otherLine.originY, 2)
          );

          // Stop the line that has its origin further from the intersection
          if (currentLineDistance > otherLineDistance) {
            shouldStop = true;
            break;
          }
        }
      }
    }

    if (shouldStop) {
      break;
    }

    truncatedPath.push([currentY, currentX]);
  }

  // Generate final pixels with colors
  return truncatedPath.map(([y, x], index) => {
    const colorPhase = Math.floor(index / guidanceLine.speed) % 2;
    const color = colorPhase === 0 ? 'guidanceColor1' : 'guidanceColor2';
    return [y, x, color];
  });
}

/**
 * Generate pixels for a guidance line with colors but no intersection detection
 * @param {Object} guidanceLine - Guidance line object
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @returns {Array} Array of guidance line pixels [[y, x, color], ...]
 */
function generateGuidanceLinePixelsWithColors(guidanceLine, gridWidth, gridHeight) {
  const basicPixels = generateGuidanceLinePixelsBasic(guidanceLine, gridWidth, gridHeight);
  return basicPixels.map(([y, x], index) => {
    const colorPhase = Math.floor(index / guidanceLine.speed) % 2;
    const color = colorPhase === 0 ? 'guidanceColor1' : 'guidanceColor2';
    return [y, x, color];
  });
}

/**
 * Generate basic pixels for a guidance line without intersection detection (helper function)
 * @param {Object} guidanceLine - Guidance line object
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @returns {Array} Array of guidance line pixels [[y, x], ...]
 */
function generateGuidanceLinePixelsBasic(guidanceLine, gridWidth, gridHeight) {
  const { originX, originY, direction, length } = guidanceLine;

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

  const [dx, dy] = directionVectors[direction] || [];
  if ((!dx && dx !== 0) || (!dy && dy !== 0)) return [];

  const pixels = [];
  let currentX = originX;
  let currentY = originY;

  // For infinite length, use a reasonable maximum based on grid diagonal
  const maxLength = length === 'infinite' ?
    Math.sqrt(gridWidth * gridWidth + gridHeight * gridHeight) * 2 :
    length;

  for (let i = 0; i < maxLength; i++) {
    // Check grid bounds
    if (currentX < 0 || currentX >= gridWidth || currentY < 0 || currentY >= gridHeight) {
      break;
    }

    pixels.push([currentY, currentX]);

    // Move to next position
    currentX += dx;
    currentY += dy;
  }

  return pixels;
}

/**
 * Filter guidance lines based on current generation
 * @param {Array} guidanceLines - Array of guidance line objects
 * @param {number} currentGeneration - Current game generation
 * @returns {Array} Filtered guidance lines
 */
export function getVisibleGuidanceLines(guidanceLines, currentGeneration) {
  return guidanceLines.filter(line =>
    line.generation <= currentGeneration
  );
}

/**
 * Remove guidance lines placed after generation 0 (for reset)
 * @param {Array} guidanceLines - Array of guidance line objects
 * @returns {Array} Filtered guidance lines (only gen 0 lines remain)
 */
export function resetGuidanceLines(guidanceLines) {
  return guidanceLines.filter(line => line.generation === 0);
}

/**
 * Generate all visible guidance line pixels for rendering
 * @param {Array} guidanceLines - Array of guidance line objects
 * @param {number} currentGeneration - Current game generation
 * @param {number} gridWidth - Grid width
 * @param {number} gridHeight - Grid height
 * @returns {Array} All guidance line pixels
 */
export function generateAllGuidanceLinePixels(guidanceLines, currentGeneration, gridWidth, gridHeight) {
  const visibleLines = getVisibleGuidanceLines(guidanceLines, currentGeneration);

  // First, calculate the full path for each line without intersections
  const linePaths = new Map();
  for (const line of visibleLines) {
    const pixels = generateGuidanceLinePixelsBasic(line, gridWidth, gridHeight);
    const lineKey = line.id || line; // Use the line object itself as key if no id
    linePaths.set(lineKey, pixels);
  }

  // Find intersections and determine which lines should be truncated
  const truncatedPaths = new Map();
  for (const line of visibleLines) {
    const lineKey = line.id || line;
    const fullPath = linePaths.get(lineKey);
    let truncatedPath = [];

    for (let i = 0; i < fullPath.length; i++) {
      const [currentY, currentX] = fullPath[i];

      // Check for intersections with other lines
      let shouldStop = false;
      if (i > 0) { // Don't stop at origin
        for (const otherLine of visibleLines) {
          const otherLineKey = otherLine.id || otherLine;
          if (lineKey === otherLineKey) continue;

          const otherPath = linePaths.get(otherLineKey);

          // Count consecutive pixels that would intersect
          let consecutiveHits = 0;
          for (let j = 0; j < Math.min(2, fullPath.length - i); j++) {
            if (i + j >= fullPath.length) break;
            const [checkY, checkX] = fullPath[i + j];
            const hasIntersection = otherPath.some(([otherY, otherX]) =>
              otherY === checkY && otherX === checkX
            );
            if (hasIntersection) {
              consecutiveHits++;
            } else {
              break;
            }
          }

          // If we would hit 2+ consecutive pixels, check distance and stop if needed
          if (consecutiveHits >= 2) {
            const currentLineDistance = Math.sqrt(
              Math.pow(currentX - line.originX, 2) + Math.pow(currentY - line.originY, 2)
            );
            const otherLineDistance = Math.sqrt(
              Math.pow(currentX - otherLine.originX, 2) + Math.pow(currentY - otherLine.originY, 2)
            );

            // Stop the line that has its origin further from the intersection
            if (currentLineDistance > otherLineDistance) {
              shouldStop = true;
              break;
            }
          }
        }
      }

      if (shouldStop) {
        break;
      }

      truncatedPath.push([currentY, currentX]);
    }

    truncatedPaths.set(lineKey, truncatedPath);
  }

  // Generate final pixels with colors
  const allPixels = [];
  for (const line of visibleLines) {
    const lineKey = line.id || line;
    const path = truncatedPaths.get(lineKey);
    for (let i = 0; i < path.length; i++) {
      const [y, x] = path[i];
      const colorPhase = Math.floor(i / line.speed) % 2;
      const color = colorPhase === 0 ? 'guidanceColor1' : 'guidanceColor2';
      allPixels.push([y, x, color]);
    }
  }

  return allPixels;
}

/**
 * Create a guidance line object from a brush pattern's guidance line specification
 * @param {Object} guidanceSpec - Guidance line spec from brush pattern
 * @param {number} generation - Current generation when pattern was placed
 * @param {number} placementX - X coordinate where pattern was placed
 * @param {number} placementY - Y coordinate where pattern was placed
 * @returns {Object} Guidance line object
 */
export function createGuidanceLineFromBrush(guidanceSpec, generation, placementX, placementY) {
  if (!guidanceSpec || !guidanceSpec.direction) {
    return null;
  }

  // Convert from brush-relative coordinates to absolute grid coordinates
  const originX = placementX + (guidanceSpec.startX || 0);
  const originY = placementY + (guidanceSpec.startY || 0);

  return createGuidanceLineObject(
    generation,
    originX,
    originY,
    guidanceSpec.direction,
    guidanceSpec.length,
    guidanceSpec.speed
  );
}
