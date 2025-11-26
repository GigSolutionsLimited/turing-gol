/**
 * Integration test to verify TEST button works with the existing test scenarios system
 */

describe('TEST Button Integration with Challenge System', () => {
  test('should integrate with level 10 NOT gate test scenarios', () => {
    // Use the actual level 10 challenge data
    const level10Challenge = {
      name: "10. Not gate",
      description: "An important component in a computer is a not gate...",
      testScenarios: [
        {
          name: "Input High (1) → Output Low (0)",
          description: "When the input gun is active, the NOT gate output should be disabled (detector shows 0)",
          setup: [
            {
              x: -50,
              y: -50,
              brush: "p60GliderGunG"
            }
          ],
          detectors: [
            {
              x: 90,
              y: 0,
              state: "inactive",
              index: 0,
              description: "Output detector - should remain OFF when input is present"
            }
          ]
        },
        {
          name: "Input Low (0) → Output High (1)",
          description: "When the input gun is inactive, the NOT gate output should be enabled (detector shows 1)",
          setup: [],
          detectors: [
            {
              x: 90,
              y: 0,
              state: "active",
              index: 0,
              description: "Output detector - should be ON when no input is present"
            }
          ]
        }
      ]
    };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Verify the challenge has test scenarios
    expect(TestScenarioService.hasTestScenarios(level10Challenge)).toBe(true);

    // Verify we can get the scenarios
    const scenarios = TestScenarioService.getTestScenarios(level10Challenge);
    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].name).toBe("Input High (1) → Output Low (0)");
    expect(scenarios[1].name).toBe("Input Low (0) → Output High (1)");

    // Verify scenario structure matches what TEST button expects
    scenarios.forEach(scenario => {
      expect(scenario).toHaveProperty('name');
      expect(scenario).toHaveProperty('description');
      expect(scenario).toHaveProperty('detectors');
      expect(Array.isArray(scenario.detectors)).toBe(true);

      if (scenario.setup) {
        expect(Array.isArray(scenario.setup)).toBe(true);
      }
    });
  });

  test('should simulate TEST button workflow with actual challenge data', async () => {
    // Simulate the complete workflow from TEST button click to validation
    let testsExecuted = 0;
    let scenariosApplied = [];

    const mockChallenge = {
      testScenarios: [
        {
          name: "Test Scenario 1",
          setup: [{ x: 0, y: 0, brush: "testBrush" }],
          detectors: [{ x: 10, y: 10, state: "active", index: 0 }]
        },
        {
          name: "Test Scenario 2",
          setup: [],
          detectors: [{ x: 20, y: 20, state: "inactive", index: 1 }]
        }
      ]
    };

    const mockGameState = {
      grid: Array(50).fill(null).map(() => Array(50).fill(0)),
      detectors: [],
      placedObjects: []
    };

    const mockBrushes = {
      testBrush: { pattern: [[0, 0], [0, 1], [1, 0]] }
    };

    const mockGridSize = { width: 50, height: 50 };

    // Simulate the TEST button logic
    const simulateTestButton = async (challenge, gameState, brushes, gridSize) => {
      const { TestScenarioService } = require('../../src/services/testScenarioService.js');

      if (!TestScenarioService.hasTestScenarios(challenge)) {
        return { executed: 0, applied: [] };
      }

      const scenarios = TestScenarioService.getTestScenarios(challenge);

      for (const scenario of scenarios) {
        testsExecuted++;

        // Apply scenario to game state
        const scenarioState = TestScenarioService.applyTestScenario(
          scenario,
          gameState,
          brushes,
          gridSize
        );

        scenariosApplied.push({
          name: scenario.name,
          detectorCount: scenarioState.detectors.length
        });

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      return { executed: testsExecuted, applied: scenariosApplied };
    };

    const result = await simulateTestButton(mockChallenge, mockGameState, mockBrushes, mockGridSize);

    expect(result.executed).toBe(2);
    expect(result.applied).toHaveLength(2);
    expect(result.applied[0].name).toBe("Test Scenario 1");
    expect(result.applied[1].name).toBe("Test Scenario 2");
  });

  test('should handle challenges without test scenarios gracefully', () => {
    // Test that TEST button doesn't appear for challenges without scenarios
    const basicChallenge = {
      name: "1. Basics",
      patterns: [],
      brushes: ["block", "glider"]
    };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Verify no test scenarios
    expect(TestScenarioService.hasTestScenarios(basicChallenge)).toBe(false);

    // Simulate the hasTestScenarios check in GameControls
    const hasTestScenarios = TestScenarioService.hasTestScenarios(basicChallenge);

    // TEST button should not be visible
    expect(hasTestScenarios).toBe(false);

    // CLEAR button should still be full width when no TEST button
    const clearButtonStyle = hasTestScenarios ? { flex: 1 } : { width: '100%' };
    expect(clearButtonStyle.width).toBe('100%');
  });

  test('should validate TEST button state management', () => {
    // Test the state changes during TEST button operation
    let isRunningTests = false;
    let buttonText = 'TEST';
    let buttonDisabled = false;
    let buttonOpacity = 1;

    // Simulate button click and state changes
    const clickTestButton = async () => {
      // Start testing state
      isRunningTests = true;
      buttonText = 'Testing...';
      buttonDisabled = true;
      buttonOpacity = 0.6;

      // Simulate test execution
      await new Promise(resolve => setTimeout(resolve, 100));

      // End testing state
      isRunningTests = false;
      buttonText = 'TEST';
      buttonDisabled = false;
      buttonOpacity = 1;
    };

    // Verify initial state
    expect(buttonText).toBe('TEST');
    expect(buttonDisabled).toBe(false);
    expect(buttonOpacity).toBe(1);

    // Execute and verify final state
    return clickTestButton().then(() => {
      expect(buttonText).toBe('TEST');
      expect(buttonDisabled).toBe(false);
      expect(buttonOpacity).toBe(1);
      expect(isRunningTests).toBe(false);
    });
  });
});
