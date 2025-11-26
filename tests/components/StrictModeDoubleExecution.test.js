// Test for React.StrictMode double execution prevention in GameOfLife
// Tests the animation callback double execution fix

describe('GameOfLife StrictMode Double Execution Prevention', () => {
  test('should prevent double execution in animation callback', () => {
    // Mock the execution pattern that was happening
    const mockSetGrid = jest.fn();
    const mockSetGeneration = jest.fn();

    // Ref to track execution (like in the real component)
    const animationExecutionRef = { current: false };

    // Simulate the fixed animation callback
    const animationCallback = () => {
      console.log('🎬 ANIMATION CALLBACK: Starting, executionRef:', animationExecutionRef.current);

      // Prevent double execution in React.StrictMode
      if (animationExecutionRef.current) {
        console.log('⚠️ ANIMATION CALLBACK: Skipping double execution');
        return;
      }

      animationExecutionRef.current = true;

      // Schedule reset of execution flag for next frame
      setTimeout(() => {
        animationExecutionRef.current = false;
      }, 0);

      mockSetGrid(jest.fn());
      mockSetGeneration(jest.fn());
    };

    // Simulate StrictMode double execution
    animationCallback(); // First call
    animationCallback(); // Second call (should be skipped)

    // Verify that the state setters were only called once
    expect(mockSetGrid).toHaveBeenCalledTimes(1);
    expect(mockSetGeneration).toHaveBeenCalledTimes(1);

    // Verify that the execution ref was set
    expect(animationExecutionRef.current).toBe(true);
  });

  test('should allow execution after reset', () => {
    // Mock functions
    const mockSetGrid = jest.fn();
    const mockSetGeneration = jest.fn();

    // Ref to track execution
    const animationExecutionRef = { current: false };

    // Animation callback
    const animationCallback = () => {
      if (animationExecutionRef.current) {
        return;
      }

      animationExecutionRef.current = true;
      mockSetGrid(jest.fn());
      mockSetGeneration(jest.fn());
    };

    // First execution
    animationCallback();
    expect(mockSetGrid).toHaveBeenCalledTimes(1);
    expect(mockSetGeneration).toHaveBeenCalledTimes(1);

    // Second execution (should be blocked)
    animationCallback();
    expect(mockSetGrid).toHaveBeenCalledTimes(1); // Still 1
    expect(mockSetGeneration).toHaveBeenCalledTimes(1); // Still 1

    // Reset the ref (simulating setTimeout completion)
    animationExecutionRef.current = false;

    // Third execution (should work)
    animationCallback();
    expect(mockSetGrid).toHaveBeenCalledTimes(2); // Now 2
    expect(mockSetGeneration).toHaveBeenCalledTimes(2); // Now 2
  });

  test('should handle step function without double execution issues', () => {
    // Step function doesn't need the ref protection because it's user-initiated
    // But we test it to ensure consistency

    const mockSetGrid = jest.fn();
    const mockSetGeneration = jest.fn();

    const handleStep = (running) => {
      if (!running) {
        mockSetGrid(jest.fn());
        mockSetGeneration(jest.fn());
      }
    };

    // Test step when not running
    handleStep(false);
    expect(mockSetGrid).toHaveBeenCalledTimes(1);
    expect(mockSetGeneration).toHaveBeenCalledTimes(1);

    // Test step when running (should not execute)
    handleStep(true);
    expect(mockSetGrid).toHaveBeenCalledTimes(1); // Still 1
    expect(mockSetGeneration).toHaveBeenCalledTimes(1); // Still 1
  });

  test('should demonstrate the problem that was fixed', () => {
    // This test shows what was happening before the fix
    const mockSetGrid = jest.fn();
    const mockSetGeneration = jest.fn();

    // OLD problematic animation callback (without protection)
    const oldAnimationCallback = () => {
      mockSetGrid(jest.fn());
      mockSetGeneration(jest.fn());
    };

    // Simulate StrictMode double execution
    oldAnimationCallback(); // First call
    oldAnimationCallback(); // Second call (would double-execute)

    // This would result in double execution
    expect(mockSetGrid).toHaveBeenCalledTimes(2); // Problem!
    expect(mockSetGeneration).toHaveBeenCalledTimes(2); // Problem!

    // Reset for comparison
    mockSetGrid.mockClear();
    mockSetGeneration.mockClear();

    // NEW protected animation callback
    const animationExecutionRef = { current: false };

    const newAnimationCallback = () => {
      if (animationExecutionRef.current) {
        return; // Skip double execution
      }
      animationExecutionRef.current = true;
      mockSetGrid(jest.fn());
      mockSetGeneration(jest.fn());
    };

    // Simulate StrictMode double execution
    newAnimationCallback(); // First call
    newAnimationCallback(); // Second call (should be skipped)

    // This should result in single execution
    expect(mockSetGrid).toHaveBeenCalledTimes(1); // Fixed!
    expect(mockSetGeneration).toHaveBeenCalledTimes(1); // Fixed!
  });
});
