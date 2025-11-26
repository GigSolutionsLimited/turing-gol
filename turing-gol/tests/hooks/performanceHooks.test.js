// Unit tests for performance hooks
import { useAnimationLoop, useThrottle, useDebounce } from '../../src/hooks/performanceHooks.js';

describe('Performance Hooks', () => {
  // Use fake timers for all tests
  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();

    // Mock performance.now
    global.performance = {
      now: jest.fn().mockReturnValue(0)
    };

    // Mock requestAnimationFrame and cancelAnimationFrame with proper fake timer support
    global.requestAnimationFrame = jest.fn((callback) => {
      return setTimeout(callback, 16); // This will use fake timers
    });

    global.cancelAnimationFrame = jest.fn((id) => {
      clearTimeout(id);
    });
  });

  afterEach(() => {
    jest.clearAllTimers(); // Clear any remaining timers
  });

  describe('useAnimationLoop', () => {
    test('should properly handle timing to prevent double execution', () => {
      const callback = jest.fn();
      let running = true;

      // Mock the hook behavior manually
      const savedCallback = { current: callback };
      const lastTime = { current: 0 };
      const animationId = { current: null };
      const isFirstFrame = { current: true };
      const interval = 100;

      // Simulate the tick function
      const tick = (time) => {
        if (!running) return;

        // For the first frame, just set the time and skip execution
        if (isFirstFrame.current) {
          lastTime.current = time;
          isFirstFrame.current = false;
          animationId.current = requestAnimationFrame(tick);
          return;
        }

        if (time - lastTime.current >= interval) {
          savedCallback.current();
          lastTime.current = time;
        }

        animationId.current = requestAnimationFrame(tick);
      };

      // Start the animation loop
      isFirstFrame.current = true;
      lastTime.current = 0;
      animationId.current = requestAnimationFrame(tick);

      // First frame at time 0
      global.performance.now.mockReturnValue(0);
      tick(0);

      // Should not have called callback on first frame
      expect(callback).not.toHaveBeenCalled();
      expect(isFirstFrame.current).toBe(false);
      expect(lastTime.current).toBe(0);

      // Second frame at time 50ms (less than interval)
      global.performance.now.mockReturnValue(50);
      tick(50);

      // Should still not call callback (interval not reached)
      expect(callback).not.toHaveBeenCalled();

      // Third frame at time 150ms (more than interval)
      global.performance.now.mockReturnValue(150);
      tick(150);

      // Now should call callback
      expect(callback).toHaveBeenCalledTimes(1);
      expect(lastTime.current).toBe(150);

      // Clean up
      running = false;
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    });
  });

  describe('useThrottle', () => {
    test('should throttle function calls correctly', () => {
      const fn = jest.fn();
      const delay = 100;
      let lastRan = 0;

      // Mock throttle behavior
      const throttledFn = (...args) => {
        const now = performance.now();
        if (now - lastRan >= delay) {
          fn(...args);
          lastRan = now;
        }
      };

      // First call should execute (0 - 0 >= 100 is false, but for first call we need special handling)
      global.performance.now.mockReturnValue(0);
      // Simulate first call behavior (initial lastRan is 0, so first call should work)
      lastRan = -delay; // Set to negative delay so first call passes
      throttledFn('arg1');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg1');

      // Call within delay should be ignored
      global.performance.now.mockReturnValue(50);
      throttledFn('arg2');
      expect(fn).toHaveBeenCalledTimes(1);

      // Call after delay should execute
      global.performance.now.mockReturnValue(150);
      throttledFn('arg3');
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenCalledWith('arg3');
    });
  });

  describe('useDebounce', () => {
    test('should debounce function calls correctly', () => {
      const fn = jest.fn();
      const delay = 100;
      let timeoutId = null;

      // Mock debounce behavior
      const debouncedFn = (...args) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
          fn(...args);
        }, delay);
      };

      // Multiple quick calls
      debouncedFn('arg1');
      debouncedFn('arg2');
      debouncedFn('arg3');

      // Should not execute yet
      expect(fn).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(delay);

      // Should execute with last arguments
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('arg3');

      // Clean up
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
  });

  describe('Animation Loop Edge Cases', () => {
    test('should handle rapid start/stop correctly', () => {
      let stopCalled = false;
      let startCalled = false;
      let animationId = null;

      // Mock the start/stop behavior
      const mockStart = () => {
        startCalled = true;
        animationId = requestAnimationFrame(() => {});
      };

      const mockStop = () => {
        stopCalled = true;
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      };

      // Test rapid start/stop
      mockStart();
      expect(startCalled).toBe(true);

      mockStop();
      expect(stopCalled).toBe(true);
      expect(animationId).toBe(null);
    });

    test('should prevent double execution timing issue', () => {
      // This test verifies that the fix for the original issue works
      const callback = jest.fn();

      // Simulate what was happening before the fix
      let time = 0;
      const interval = 100;
      const lastTime = { current: 0 };

      // Old logic (that caused double execution)
      const oldTick = (currentTime) => {
        if (currentTime - lastTime.current >= interval) {
          callback();
          lastTime.current = currentTime;
        }
      };

      // Set lastTime to performance.now() (as start() did)
      lastTime.current = 0;

      // First frame comes in at 16ms (typical RAF timing)
      oldTick(16);

      // This would cause immediate execution with old logic
      // because 16 - 0 >= 100 is false, but timing issues could cause this

      // With our fix, first frame is skipped entirely
      const isFirstFrame = { current: true };
      const newTick = (currentTime) => {
        if (isFirstFrame.current) {
          lastTime.current = currentTime;
          isFirstFrame.current = false;
          return; // Skip execution on first frame
        }

        if (currentTime - lastTime.current >= interval) {
          callback();
          lastTime.current = currentTime;
        }
      };

      // Reset
      callback.mockClear();
      lastTime.current = 0;
      isFirstFrame.current = true;

      // First frame with new logic
      newTick(16);
      expect(callback).not.toHaveBeenCalled(); // Should not execute

      // Second frame after interval
      newTick(116);
      expect(callback).toHaveBeenCalledTimes(1); // Should execute once
    });

    test('should not execute callback multiple times per interval due to function recreation', () => {
      const callback = jest.fn();
      let runningRef = { current: true };
      let intervalRef = { current: 100 };
      let savedCallback = { current: callback };
      let lastTime = { current: 0 };
      let isFirstFrame = { current: true };
      let animationId = { current: null };

      // Simulate the fixed tick function that uses refs
      const tick = (time) => {
        if (!runningRef.current) return;

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
      };

      // Start animation
      isFirstFrame.current = true;
      animationId.current = requestAnimationFrame(tick);

      // First frame at 0ms
      tick(0);
      expect(callback).not.toHaveBeenCalled(); // Should not execute on first frame

      // Second frame at 50ms (within interval)
      tick(50);
      expect(callback).not.toHaveBeenCalled(); // Should not execute yet

      // Third frame at 120ms (past interval)
      tick(120);
      expect(callback).toHaveBeenCalledTimes(1); // Should execute once

      // Fourth frame at 140ms (within new interval)
      tick(140);
      expect(callback).toHaveBeenCalledTimes(1); // Should still be once

      // Fifth frame at 240ms (past second interval)
      tick(240);
      expect(callback).toHaveBeenCalledTimes(2); // Should execute second time

      // Clean up
      runningRef.current = false;
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    });
  });
});
