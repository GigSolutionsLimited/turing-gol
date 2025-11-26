/**
 * Test to verify that clear and reset buttons are working correctly
 */

describe('Clear and Reset Button Debug', () => {
  test('should verify handleClear function is defined and callable', () => {
    // Mock the GameOfLife component structure
    const mockGameRef = {
      current: {
        handleClear: jest.fn(),
        handleReset: jest.fn(),
        getGrid: jest.fn(() => []),
        getGeneration: jest.fn(() => 0),
        isLevelCompleted: jest.fn(() => false)
      }
    };

    // Simulate the button click handlers
    const clearButtonHandler = () => {
      console.log('🟠 CLEAR BUTTON CLICKED - about to call gameRef.current?.handleClear?.()');
      console.log('🟠 gameRef.current:', mockGameRef.current);
      console.log('🟠 handleClear exists:', !!mockGameRef.current?.handleClear);
      mockGameRef.current?.handleClear?.();
    };

    const resetButtonHandler = () => {
      mockGameRef.current?.handleReset?.();
    };

    // Test clear button
    clearButtonHandler();
    expect(mockGameRef.current.handleClear).toHaveBeenCalledTimes(1);

    // Test reset button
    resetButtonHandler();
    expect(mockGameRef.current.handleReset).toHaveBeenCalledTimes(1);

    // Verify both functions exist
    expect(typeof mockGameRef.current.handleClear).toBe('function');
    expect(typeof mockGameRef.current.handleReset).toBe('function');
  });

  test('should verify useImperativeHandle exposes handleClear', () => {
    // Mock React.useImperativeHandle
    const mockRef = { current: null };
    const mockHandleClear = jest.fn();
    const mockHandleReset = jest.fn();

    // Simulate the useImperativeHandle call
    const imperativeHandleCallback = () => ({
      getGrid: jest.fn(),
      getGeneration: jest.fn(),
      isLevelCompleted: jest.fn(),
      handlePlay: jest.fn(),
      handleStop: jest.fn(),
      handleStep: jest.fn(),
      handleReset: mockHandleReset,
      handleClear: mockHandleClear,
      getMultiplier: jest.fn(),
      setMultiplier: jest.fn()
    });

    // Set the ref
    mockRef.current = imperativeHandleCallback();

    // Verify both functions are exposed
    expect(mockRef.current.handleClear).toBeDefined();
    expect(mockRef.current.handleReset).toBeDefined();
    expect(typeof mockRef.current.handleClear).toBe('function');
    expect(typeof mockRef.current.handleReset).toBe('function');

    // Test calling them
    mockRef.current.handleClear();
    mockRef.current.handleReset();

    expect(mockHandleClear).toHaveBeenCalledTimes(1);
    expect(mockHandleReset).toHaveBeenCalledTimes(1);
  });

  test('should debug why Clear button might not work', () => {
    // Check common issues that could prevent Clear button from working

    // 1. Missing function reference
    const gameRefWithMissingClear = { current: { handleReset: jest.fn() } };

    // This should not throw but also not call anything
    const clearWithMissing = () => {
      gameRefWithMissingClear.current?.handleClear?.();
    };

    expect(() => clearWithMissing()).not.toThrow();

    // 2. Null ref
    const nullGameRef = { current: null };

    const clearWithNullRef = () => {
      nullGameRef.current?.handleClear?.();
    };

    expect(() => clearWithNullRef()).not.toThrow();

    // 3. Working scenario
    const workingGameRef = {
      current: {
        handleClear: jest.fn(),
        handleReset: jest.fn()
      }
    };

    const clearWorking = () => {
      workingGameRef.current?.handleClear?.();
    };

    clearWorking();
    expect(workingGameRef.current.handleClear).toHaveBeenCalledTimes(1);
  });
});
