// Performance optimization utilities and hooks
import { useRef, useCallback, useMemo, useEffect } from 'react';

/**
 * Custom hook for requestAnimationFrame-based game loop
 * Provides smoother animation than setTimeout
 * @param {boolean} running - Whether animation should be running
 * @param {Function} callback - Function to call each frame
 * @param {number} interval - Minimum time between frames in ms
 * @returns {Object} Animation controls
 */
export const useAnimationLoop = (running, callback, interval = 100) => {
  const savedCallback = useRef(callback);
  const lastTime = useRef(0);
  const animationId = useRef(null);
  const isFirstFrame = useRef(true);
  const runningRef = useRef(running);
  const intervalRef = useRef(interval);

  // Always save the latest values
  useEffect(() => {
    savedCallback.current = callback;
    runningRef.current = running;
    intervalRef.current = interval;
  });

  const tick = useCallback((time) => {
    // Use refs to get latest values without recreating tick
    if (!runningRef.current) return;

    // For the first frame, just set the time and skip execution
    if (isFirstFrame.current) {
      lastTime.current = time;
      isFirstFrame.current = false;
      animationId.current = requestAnimationFrame(tick);
      return;
    }

    if (time - lastTime.current >= intervalRef.current) {
      savedCallback.current();
      lastTime.current = time;
    }

    animationId.current = requestAnimationFrame(tick);
  }, []); // No dependencies - use refs instead

  const start = useCallback(() => {
    if (!animationId.current && runningRef.current) {
      isFirstFrame.current = true;
      lastTime.current = 0;
      animationId.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
      animationId.current = null;
      isFirstFrame.current = true;
    }
  }, []);

  useEffect(() => {
    if (running) {
      start();
    } else {
      stop();
    }

    return stop;
  }, [running, start, stop]);

  return { start, stop };
};

/**
 * Hook for throttling rapid function calls
 * @param {Function} func - Function to throttle
 * @param {number} delay - Throttle delay in ms
 * @returns {Function} Throttled function
 */
export const useThrottle = (func, delay) => {
  const lastRan = useRef(0);

  return useCallback((...args) => {
    const now = performance.now();
    if (now - lastRan.current >= delay) {
      func(...args);
      lastRan.current = now;
    }
  }, [func, delay]);
};

/**
 * Hook for debouncing rapid function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} Debounced function
 */
export const useDebounce = (func, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      func(...args);
    }, delay);
  }, [func, delay]);
};

/**
 * Hook for memoizing expensive calculations with cache invalidation
 * @param {Function} factory - Function that produces the value
 * @param {Array} deps - Dependencies array
 * @param {number} maxCacheSize - Maximum cache entries
 * @returns {*} Memoized value
 */
export const useAdvancedMemo = (factory, deps, maxCacheSize = 50) => {
  const cache = useRef(new Map());
  const depsKey = useMemo(() => JSON.stringify(deps), deps);

  return useMemo(() => {
    if (cache.current.has(depsKey)) {
      return cache.current.get(depsKey);
    }

    const value = factory();

    // Clean cache if too large
    if (cache.current.size >= maxCacheSize) {
      const firstKey = cache.current.keys().next().value;
      cache.current.delete(firstKey);
    }

    cache.current.set(depsKey, value);
    return value;
  }, [depsKey, factory, maxCacheSize]);
};

/**
 * Hook for creating stable callback references
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependencies
 * @returns {Function} Stable callback
 */
export const useStableCallback = (callback, deps) => {
  const ref = useRef();

  useEffect(() => {
    ref.current = callback;
  });

  return useCallback((...args) => {
    return ref.current?.(...args);
  }, deps);
};

/**
 * Hook for tracking component render count (development only)
 * @param {string} componentName - Name of the component
 * @returns {number} Render count
 */
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
};
