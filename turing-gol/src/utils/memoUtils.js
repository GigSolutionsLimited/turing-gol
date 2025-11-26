// Memoized component wrappers for performance optimization
import React from 'react';

/**
 * Shallow comparison for basic props
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} Whether props are equal
 */
export const shallowEqual = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (let key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
};



/**
 * Custom comparison for GameCanvas component
 * Only re-render when essential props change
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} Whether props are equal (true = skip render)
 */
export const gameCanvasEqual = (prevProps, nextProps) => {
  // Always re-render if grid changed
  if (prevProps.grid !== nextProps.grid) {
    return false;
  }

  // Re-render if canvas size changed
  if (prevProps.canvasSize !== nextProps.canvasSize) {
    return false;
  }

  // Re-render if cell size changed (zoom)
  if (prevProps.cellSize !== nextProps.cellSize) {
    return false;
  }

  // Re-render if interaction state changed
  if (prevProps.running !== nextProps.running ||
      prevProps.pasting !== nextProps.pasting ||
      prevProps.adminMode !== nextProps.adminMode) {
    return false;
  }

  // Re-render if hover state changed
  if (prevProps.hoverCell !== nextProps.hoverCell) {
    return false;
  }

  // Re-render if selected pattern changed
  if (prevProps.selectedPattern !== nextProps.selectedPattern) {
    return false;
  }

  // Re-render if challenge changed
  if (prevProps.challenge !== nextProps.challenge) {
    return false;
  }

  // Re-render if detector render data changed
  if (prevProps.detectorRenderData !== nextProps.detectorRenderData) {
    return false;
  }

  // Re-render if move handle render data changed
  if (prevProps.moveHandleRenderData !== nextProps.moveHandleRenderData) {
    return false;
  }

  // Re-render if guidance line objects changed
  if (prevProps.guidanceLineObjects !== nextProps.guidanceLineObjects) {
    return false;
  }

  // Re-render if guidance lines visibility changed
  if (prevProps.guidanceLinesVisible !== nextProps.guidanceLinesVisible) {
    return false;
  }

  // Re-render if test scenario preview patterns changed
  if (prevProps.testScenarioPreviewPatterns !== nextProps.testScenarioPreviewPatterns) {
    return false;
  }

  // Re-render if generation changed (affects guidance line visibility)
  if (prevProps.generation !== nextProps.generation) {
    return false;
  }

  // Skip re-render if all essential props are the same
  return true;
};

/**
 * Custom comparison for UI components
 * Re-renders when challenge, selectedPattern, or running state changes
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @returns {boolean} Whether props are equal (true = skip render)
 */
export const uiComponentEqual = (prevProps, nextProps) => {
  // Always re-render if challenge changed (includes detectorFalloffPeriod)
  if (prevProps.challenge !== nextProps.challenge) {
    return false;
  }

  // Re-render if pattern selection changed
  if (prevProps.selectedPattern !== nextProps.selectedPattern) {
    return false;
  }

  // Re-render if running state changed
  if (prevProps.running !== nextProps.running) {
    return false;
  }

  // For other props, do shallow comparison
  return shallowEqual(prevProps, nextProps);
};

