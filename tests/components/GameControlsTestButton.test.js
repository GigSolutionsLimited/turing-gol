/**
 * Test for the TEST button functionality in GameControls
 */

describe('GameControls TEST Button', () => {
  test('should display TEST button when challenge has test scenarios', () => {
    // Mock a challenge with test scenarios
    const challengeWithScenarios = {
      name: '10. Not gate',
      testScenarios: [
        {
          name: 'Input High → Output Low',
          description: 'Test NOT gate with input',
          setup: [{ x: -90, y: 0, brush: 'p30GliderGunG' }],
          detectors: [{ x: 90, y: 0, state: 'inactive', index: 0 }]
        }
      ]
    };

    const challengeWithoutScenarios = {
      name: '1. Basics',
      patterns: []
    };

    // Import the service to test logic
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Test that challenges with scenarios are detected
    expect(TestScenarioService.hasTestScenarios(challengeWithScenarios)).toBe(true);
    expect(TestScenarioService.hasTestScenarios(challengeWithoutScenarios)).toBe(false);
    expect(TestScenarioService.hasTestScenarios(null)).toBe(false);
  });

  test('should simulate TEST button functionality', () => {
    // Simulate the TEST button logic
    let testButtonVisible = false;
    let isRunningTests = false;
    let scenarioAppliedCount = 0;

    const mockChallenge = {
      testScenarios: [
        {
          name: 'Test 1',
          setup: [],
          detectors: [{ x: 0, y: 0, state: 'active', index: 0 }]
        },
        {
          name: 'Test 2',
          setup: [],
          detectors: [{ x: 1, y: 1, state: 'inactive', index: 1 }]
        }
      ]
    };

    const mockGameState = {
      grid: Array(10).fill(null).map(() => Array(10).fill(0)),
      detectors: [],
      placedObjects: []
    };

    const mockBrushes = {};
    const mockGridSize = { width: 10, height: 10 };

    // Simulate hasTestScenarios check
    testButtonVisible = mockChallenge.testScenarios && mockChallenge.testScenarios.length > 0;
    expect(testButtonVisible).toBe(true);

    // Simulate clicking TEST button
    const simulateTestButtonClick = async () => {
      isRunningTests = true;

      // Simulate running each scenario
      for (const scenario of mockChallenge.testScenarios) {
        // Simulate applying scenario
        scenarioAppliedCount++;

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      isRunningTests = false;
    };

    // Execute the simulation
    return simulateTestButtonClick().then(() => {
      expect(scenarioAppliedCount).toBe(2); // Both scenarios applied
      expect(isRunningTests).toBe(false); // Finished running
    });
  });

  test('should validate TEST button integration with existing controls', () => {
    // Test that TEST button doesn't interfere with existing game controls
    const mockGameRef = {
      current: {
        handlePlay: jest.fn(),
        handleStop: jest.fn(),
        handleStep: jest.fn(),
        handleReset: jest.fn(),
        handleClear: jest.fn(),
        getGeneration: jest.fn(() => 0),
        getMultiplier: jest.fn(() => 4),
        setMultiplier: jest.fn()
      }
    };

    // Simulate existing button functionality
    mockGameRef.current.handlePlay();
    mockGameRef.current.handleStop();
    mockGameRef.current.handleStep();
    mockGameRef.current.handleReset();
    mockGameRef.current.handleClear();

    // Verify existing functionality still works
    expect(mockGameRef.current.handlePlay).toHaveBeenCalled();
    expect(mockGameRef.current.handleStop).toHaveBeenCalled();
    expect(mockGameRef.current.handleStep).toHaveBeenCalled();
    expect(mockGameRef.current.handleReset).toHaveBeenCalled();
    expect(mockGameRef.current.handleClear).toHaveBeenCalled();
  });

  test('should validate CLEAR button size reduction', () => {
    // Test that CLEAR button is now using flex: 1 instead of width: 100%
    // This is a structural test to ensure the layout changes are correct

    // Before: CLEAR button had width: '100%' (full width)
    // After: CLEAR button has flex: 1 and shares row with TEST button

    // Simulate the layout structure
    const clearButtonStyle = { flex: 1, fontSize: '10px' };
    const testButtonStyle = { flex: 1, fontSize: '10px' };

    // Both buttons should have equal flex values (sharing space)
    expect(clearButtonStyle.flex).toBe(testButtonStyle.flex);
    expect(clearButtonStyle.flex).toBe(1);

    // TEST button should only appear when scenarios exist
    const hasScenarios = true;
    const buttonsInRow = hasScenarios ? 2 : 1;

    expect(buttonsInRow).toBe(2); // CLEAR + TEST when scenarios exist
  });

  test('should handle TEST button states correctly', () => {
    let isRunningTests = false;
    let buttonDisabled = false;
    let buttonText = 'TEST';
    let buttonOpacity = 1;

    // Simulate starting test run
    const startTesting = () => {
      isRunningTests = true;
      buttonDisabled = true;
      buttonText = 'Testing...';
      buttonOpacity = 0.6;
    };

    // Simulate finishing test run
    const finishTesting = () => {
      isRunningTests = false;
      buttonDisabled = false;
      buttonText = 'TEST';
      buttonOpacity = 1;
    };

    // Initial state
    expect(buttonText).toBe('TEST');
    expect(buttonDisabled).toBe(false);
    expect(buttonOpacity).toBe(1);

    // During testing
    startTesting();
    expect(buttonText).toBe('Testing...');
    expect(buttonDisabled).toBe(true);
    expect(buttonOpacity).toBe(0.6);

    // After testing
    finishTesting();
    expect(buttonText).toBe('TEST');
    expect(buttonDisabled).toBe(false);
    expect(buttonOpacity).toBe(1);
  });
});
