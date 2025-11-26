/**
 * Debug test to check if TEST button appears for level 10
 */

describe('TEST Button Debug', () => {
  test('should detect test scenarios in level 10 challenge', () => {
    // Use the exact level 10 challenge structure
    const level10Challenge = {
      "name": "10. Not gate",
      "description": "An important component in a computer is a not gate...",
      "testScenarios": [
        {
          "name": "Input High (1) → Output Low (0)",
          "description": "When the input gun is active, the NOT gate output should be disabled (detector shows 0)",
          "setup": [
            {
              "x": -50,
              "y": -50,
              "brush": "p60GliderGunG"
            }
          ],
          "detectors": [
            {
              "x": 4,
              "y": -12,
              "state": "active",
              "index": 0
            },
            {
              "x": 21,
              "y": 25,
              "state": "inactive",
              "index": 1
            }
          ]
        },
        {
          "name": "Input Low (0) → Output High (1)",
          "description": "When the input gun is inactive, the NOT gate output should be enabled (detector shows 1)",
          "setup": [],
          "detectors": [
            {
              "x": 4,
              "y": -12,
              "state": "inactive",
              "index": 0
            },
            {
              "x": 21,
              "y": 25,
              "state": "active",
              "index": 1
            }
          ]
        }
      ]
    };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Debug logging
    console.log('🔍 Challenge object:', {
      name: level10Challenge.name,
      hasTestScenarios: !!level10Challenge.testScenarios,
      testScenariosLength: level10Challenge.testScenarios?.length,
      testScenariosType: typeof level10Challenge.testScenarios,
      isArray: Array.isArray(level10Challenge.testScenarios)
    });

    // Test hasTestScenarios detection
    const hasScenarios = TestScenarioService.hasTestScenarios(level10Challenge);
    console.log('🔍 hasTestScenarios result:', hasScenarios);

    expect(hasScenarios).toBe(true);

    // Test getTestScenarios
    const scenarios = TestScenarioService.getTestScenarios(level10Challenge);
    console.log('🔍 getTestScenarios result:', {
      length: scenarios.length,
      firstScenarioName: scenarios[0]?.name
    });

    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].name).toBe("Input High (1) → Output Low (0)");
  });

  test('should simulate GameControls TEST button logic', () => {
    // Simulate the exact logic from GameControls
    const challenge = {
      testScenarios: [
        { name: "Test 1", setup: [], detectors: [] },
        { name: "Test 2", setup: [], detectors: [] }
      ]
    };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // This is the exact logic from GameControls.jsx
    const hasTestScenarios = challenge ? TestScenarioService.hasTestScenarios(challenge) : false;

    console.log('🔍 GameControls logic simulation:', {
      challenge: !!challenge,
      hasTestScenarios: hasTestScenarios,
      shouldShowButton: hasTestScenarios
    });

    expect(hasTestScenarios).toBe(true);
  });

  test('should check if challenge prop is being passed correctly', () => {
    // Test various challenge structures that might cause issues

    const validChallenge = { testScenarios: [{ name: "test" }] };
    const emptyChallenge = { testScenarios: [] };
    const nullChallenge = null;
    const undefinedChallenge = undefined;
    const challengeWithoutScenarios = { name: "1. Basics" };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    expect(TestScenarioService.hasTestScenarios(validChallenge)).toBe(true);
    expect(TestScenarioService.hasTestScenarios(emptyChallenge)).toBe(false);
    expect(TestScenarioService.hasTestScenarios(nullChallenge)).toBe(false);
    expect(TestScenarioService.hasTestScenarios(undefinedChallenge)).toBe(false);
    expect(TestScenarioService.hasTestScenarios(challengeWithoutScenarios)).toBe(false);
  });
});
