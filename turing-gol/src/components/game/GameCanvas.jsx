import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { CELL_SIZE } from '../../constants/gameConstants';
import { createOptimizedRenderer } from '../../utils/canvasRenderer';
import { gameCanvasEqual } from '../../utils/memoUtils';
import { generateGuidanceLine } from '../../utils/rleUtils';
import { generateAllGuidanceLinePixels } from '../../utils/guidanceLineObjects';

const GameCanvas = ({
  grid,
  previousGrid, // For optimization
  canvasSize,
  challenge,
  running,
  pasting,
  selectedPattern,
  hoverCell,
  isEditableCell,
  adminMode,
  cellSize = CELL_SIZE,
  detectorRenderData, // Array of detector render data
  moveHandleRenderData = [], // Array of move handle render data for placed objects
  // Guidance line props (object-based system only)
  guidanceLinesVisible,
  guidanceLineObjects, // Generation-based guidance line objects
  generation, // Current generation for visibility filtering
  testScenarioPreviewPatterns = [], // Test scenario preview patterns (shown as gold pixels)
  onCanvasClick,
  onMouseMove,
  onMouseLeave
}) => {
  const canvasRef = useRef(null);
  const [renderer, setRenderer] = useState(null);
  const renderStatsRef = useRef({ frames: 0, lastRender: 0 });

  // Initialize optimized renderer and recreate when canvas size changes
  useEffect(() => {
    if (canvasRef.current) {
      // Ensure canvas dimensions are properly set before creating renderer
      const canvas = canvasRef.current;
      canvas.width = canvasSize.width || canvasSize;
      canvas.height = canvasSize.height || canvasSize;

      const newRenderer = createOptimizedRenderer(canvas);

      // Clear any stale state to prevent zoom corruption
      newRenderer.clearDirtyRegions();
      newRenderer.lastGrid = null;
      newRenderer.imageData = null;

      setRenderer(newRenderer);
    }
  }, [canvasSize, cellSize]); // Recreate renderer when canvas size or cell size changes

  // Log guidance line objects changes for debugging
  useEffect(() => {
    console.log('🎯 GameCanvas guidanceLineObjects changed:', {
      count: guidanceLineObjects?.length || 0,
      objects: guidanceLineObjects?.map(obj => ({
        id: obj.id,
        generation: obj.generation,
        direction: obj.direction,
        originX: obj.originX,
        originY: obj.originY
      })) || [],
      guidanceLinesVisible,
      running
    });
  }, [guidanceLineObjects, guidanceLinesVisible, running]);

  // Log guidance lines visibility changes for debugging
  useEffect(() => {
    console.log('🎯 GameCanvas guidanceLinesVisible changed:', {
      guidanceLinesVisible,
      running,
      hasGuidanceLineObjects: !!(guidanceLineObjects && guidanceLineObjects.length > 0),
      guidanceLineObjectsCount: guidanceLineObjects?.length || 0
    });
  }, [guidanceLinesVisible, running, guidanceLineObjects]);

  const renderOptions = useMemo(() => {
    console.log('🎯 GAMECANVAS RENDER OPTIONS - Starting calculation:', {
      moveHandleCount: moveHandleRenderData?.length || 0,
      moveHandleData: moveHandleRenderData?.map(h => ({ id: h.id, x: h.x, y: h.y, brushName: h.brushName })) || [],
      running,
      hasGrid: !!grid
    });

    let guidanceLinePixels = [];

    console.log('🎯 GameCanvas renderOptions calculation:', {
      hasSelectedPattern: !!selectedPattern,
      pasting,
      hasHoverCell: !!hoverCell,
      running,
      guidanceLinesVisible,
      hasGuidanceLineObjects: !!(guidanceLineObjects && guidanceLineObjects.length > 0),
      guidanceLineObjectsCount: guidanceLineObjects?.length || 0,
      generation
    });

    // Generate hover guidance lines if selectedPattern has guidanceLine data and user is hovering
    if (selectedPattern && selectedPattern.pattern && pasting && hoverCell) {
      // Handle multiple guidance lines
      const guidanceLines = selectedPattern.guidanceLines || (selectedPattern.guidanceLine ? [selectedPattern.guidanceLine] : []);

      console.log('🎯 Processing hover guidance lines:', {
        patternName: selectedPattern.name,
        guidanceLinesCount: guidanceLines.length,
        hoverCell: { x: hoverCell.x, y: hoverCell.y }
      });

      if (guidanceLines.length > 0) {
        const gridHeight = grid.length;
        const gridWidth = gridHeight > 0 ? grid[0].length : 0;

        for (const guidanceLine of guidanceLines) {
          // Generate guidance lines relative to hover position
          const relativeGuidancePixels = generateGuidanceLine(
            guidanceLine,
            selectedPattern.pattern,
            gridWidth,
            gridHeight
          );

          const offsetY = hoverCell.y;
          const offsetX = hoverCell.x;

          // Transform guidance lines to be relative to the hover position
          const hoverGuidancePixels = relativeGuidancePixels.map(([y, x, color]) => [
            y + offsetY,
            x + offsetX,
            color
          ]).filter(([y, x]) =>
            y >= 0 && y < gridHeight && x >= 0 && x < gridWidth
          );

          guidanceLinePixels.push(...hoverGuidancePixels);
          console.log('🎯 Added hover guidance pixels:', {
            direction: guidanceLine.direction,
            pixelsAdded: hoverGuidancePixels.length,
            totalHoverPixels: guidanceLinePixels.length
          });
        }
      } else {
        console.log('🎯 No guidance lines found for hover pattern');
      }
    } else {
      const reasonsSkipped = [
        !selectedPattern && 'no selectedPattern',
        selectedPattern && !selectedPattern.pattern && 'no pattern in selectedPattern',
        !pasting && 'not pasting',
        !hoverCell && 'no hoverCell'
      ].filter(Boolean);

      console.log('🎯 Hover guidance lines not rendered:', {
        reasonsSkipped,
        hasSelectedPattern: !!selectedPattern,
        selectedPatternName: selectedPattern?.name,
        hasPattern: !!(selectedPattern?.pattern),
        pasting,
        hoverCell
      });
    }


    // Add generation-based guidance line objects if visible and not running
    // FIX: Must check guidanceLinesVisible prop to prevent guidance lines from disappearing when hovering with a brush
    if (!running && guidanceLinesVisible && guidanceLineObjects && guidanceLineObjects.length > 0) {
      const currentGridHeight = grid.length;
      const currentGridWidth = grid.length > 0 ? grid[0].length : 0;

      console.log('🎯 Processing existing guidance line objects:', {
        objectCount: guidanceLineObjects.length,
        generation,
        gridSize: `${currentGridWidth}x${currentGridHeight}`
      });

      const objectGuidancePixels = generateAllGuidanceLinePixels(
        guidanceLineObjects,
        generation || 0,
        currentGridWidth,
        currentGridHeight
      );

      const pixelsBeforeExisting = guidanceLinePixels.length;
      guidanceLinePixels.push(...objectGuidancePixels);

      console.log('🎯 Added existing guidance pixels:', {
        existingPixelsAdded: objectGuidancePixels.length,
        totalPixelsBefore: pixelsBeforeExisting,
        totalPixelsAfter: guidanceLinePixels.length,
        guidanceLineObjects: guidanceLineObjects.map(obj => ({
          id: obj.id,
          generation: obj.generation,
          direction: obj.direction,
          originX: obj.originX,
          originY: obj.originY
        }))
      });
    } else {
      const reasonsSkipped = [
        running && 'game is running',
        !guidanceLinesVisible && 'guidanceLinesVisible is false',
        !guidanceLineObjects && 'no guidanceLineObjects',
        guidanceLineObjects && guidanceLineObjects.length === 0 && 'guidanceLineObjects is empty'
      ].filter(Boolean);

      console.log('🎯 Existing guidance lines not rendered:', {
        reasonsSkipped,
        running,
        guidanceLinesVisible,
        guidanceLineObjects,
        guidanceLineObjectsLength: guidanceLineObjects?.length
      });
    }

    console.log('🎯 Final render options:', {
      totalGuidanceLinePixels: guidanceLinePixels.length,
      hasDetectorRenderData: !!(detectorRenderData && detectorRenderData.length > 0),
      hasMoveHandleRenderData: !!(moveHandleRenderData && moveHandleRenderData.length > 0),
      hasTestScenarioPreview: !!(testScenarioPreviewPatterns && testScenarioPreviewPatterns.length > 0)
    });

    return {
      challenge,
      selectedPattern,
      hoverCell,
      pasting,
      isEditableCell,
      adminMode,
      cellSize,
      detectorRenderData,
      moveHandleRenderData,
      guidanceLinePixels,
      testScenarioPreviewPatterns
    };
  }, [challenge, selectedPattern, hoverCell, pasting, isEditableCell, adminMode, cellSize, detectorRenderData, moveHandleRenderData, grid, guidanceLineObjects, generation, running, guidanceLinesVisible, testScenarioPreviewPatterns]);

  // Fallback rendering method for error cases
  const fallbackRender = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const currentGridHeight = grid.length;
    const currentGridWidth = grid.length > 0 ? grid[0].length : 0;

    // Clear entire canvas first
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Draw cells with proper handling for small cell sizes
    ctx.fillStyle = 'white';
    for (let y = 0; y < currentGridHeight; y++) {
      for (let x = 0; x < currentGridWidth; x++) {
        if (grid[y][x]) {
          if (cellSize < 3) {
            // Use pixel-perfect rendering for very small cells
            ctx.fillRect(
              Math.round(x * cellSize),
              Math.round(y * cellSize),
              Math.max(1, Math.round(cellSize)),
              Math.max(1, Math.round(cellSize))
            );
          } else {
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [grid, cellSize]);

  // Optimized rendering with dirty region tracking
  useEffect(() => {
    if (!grid || grid.length === 0) return;

    // Validate grid dimensions match expected size to prevent corruption
    const actualGridHeight = grid.length;
    const actualGridWidth = grid[0] ? grid[0].length : 0;

    // Log dimension mismatches that could cause zoom corruption
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      if (actualGridHeight !== actualGridWidth) {
        console.warn(`Grid dimension warning: ${actualGridHeight}x${actualGridWidth} (not square)`);
      }
    }

    // Ensure renderer is available and canvas is ready
    if (!renderer && canvasRef.current) {
      const newRenderer = createOptimizedRenderer(canvasRef.current);
      setRenderer(newRenderer);
      // Fallback render immediately to prevent blank canvas
      fallbackRender();
      return;
    }

    if (!renderer) {
      // If no renderer available, use fallback
      fallbackRender();
      return;
    }

    const startTime = performance.now();

    try {
      // During zoom operations, force full re-render to eliminate dirty region tracking issues
      // Pass null as previousGrid when cellSize changes to prevent corruption
      const shouldForceFullRedraw = !renderer.lastGrid ||
                                  renderer.lastCanvasWidth !== canvasRef.current?.width ||
                                  renderer.lastCanvasHeight !== canvasRef.current?.height;

      const gridToPass = shouldForceFullRedraw ? null : previousGrid;
      renderer.renderOptimized(grid, gridToPass, renderOptions);

      // Update render stats (development only)
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        const renderTime = performance.now() - startTime;
        renderStatsRef.current = {
          frames: renderStatsRef.current.frames + 1,
          lastRender: renderTime
        };

        // Log performance metrics occasionally
        if (renderStatsRef.current.frames % 60 === 0) {
          console.log(`Canvas render time: ${renderTime.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      console.error('Render error:', error);
      // Fallback to basic rendering
      fallbackRender();
    }
  }, [grid, previousGrid, renderer, renderOptions, fallbackRender]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize.width || canvasSize}
      height={canvasSize.height || canvasSize}
      style={{
        cursor: running ? 'not-allowed' : (pasting ? 'copy' : 'pointer'),
        background: '#1a1a1a',
        display: 'block', // Prevent inline spacing issues
        // Remove CSS width/height to prevent browser scaling artifacts during zoom
        // Let the canvas display at its natural buffer size
        imageRendering: 'pixelated', // Prevent anti-aliasing artifacts during zoom
      }}
      onClick={onCanvasClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    />
  );
};

export default React.memo(GameCanvas, gameCanvasEqual);
