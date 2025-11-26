/**
 * End-to-end test for TEST button with Level 10 challenge
 */

describe('TEST Button End-to-End with Level 10', () => {
  test('should show TEST button for level 10 challenge', () => {
    // Use the exact data structure from 10.json
    const level10Challenge = {
      "name": "10. Not gate",
      "description": "An important component in a computer is a not gate. This inverts a signal, so if it's one, the not gate will be off, but if it's off, the not gate will be one. Can you construct one?",
      "setup": [
        {
          "x": 27,
          "y": -29,
          "rotate": 90,
          "brush": "p30GliderGunG"
        },
        {
          "x": -9,
          "y": 26,
          "brush": "eater1",
          "rotate": 90
        }
      ],
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
              "index": 0,
              "description": "Input detector - should remain ON when input is present"
            },
            {
              "x": 21,
              "y": 25,
              "state": "inactive",
              "index": 1,
              "description": "Output detector - should remain OFF when input is present"
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
              "index": 0,
              "description": "Input detector - should remain OFF when no input is present"
            },
            {
              "x": 21,
              "y": 25,
              "state": "active",
              "index": 1,
              "description": "Output detector - should be ON when no input is present"
            }
          ]
        }
      ],
      "width": 101,
      "height": 101,
      "targetTurn": 1000,
      "detectorFalloffPeriod": 60
    };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Test that the service correctly detects test scenarios
    expect(TestScenarioService.hasTestScenarios(level10Challenge)).toBe(true);

    // Test getting scenarios
    const scenarios = TestScenarioService.getTestScenarios(level10Challenge);
    expect(scenarios).toHaveLength(2);

    // Test scenario structure
    expect(scenarios[0].name).toBe("Input High (1) → Output Low (0)");
    expect(scenarios[1].name).toBe("Input Low (0) → Output High (1)");

    // Test detector indices are correct
    expect(scenarios[0].detectors[0].index).toBe(0);
    expect(scenarios[0].detectors[1].index).toBe(1);
    expect(scenarios[1].detectors[0].index).toBe(0);
    expect(scenarios[1].detectors[1].index).toBe(1);
  });

  test('should simulate complete TEST button workflow', () => {
    // Simulate the GameControls component logic
    const challenge = {
      testScenarios: [
        {
          name: "Test 1",
          setup: [],
          detectors: [{ x: 0, y: 0, state: "active", index: 0 }]
        }
      ]
    };

    const gameState = {
      grid: Array(50).fill(null).map(() => Array(50).fill(0)),
      detectors: [],
      placedObjects: []
    };

    const brushes = {};
    const gridSize = { width: 50, height: 50 };

    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Step 1: Check if challenge has test scenarios (determines button visibility)
    const hasTestScenarios = challenge ? TestScenarioService.hasTestScenarios(challenge) : false;
    expect(hasTestScenarios).toBe(true);

    // Step 2: Get scenarios for execution
    const scenarios = TestScenarioService.getTestScenarios(challenge);
    expect(scenarios).toHaveLength(1);

    // Step 3: Apply scenario (what happens when TEST button is clicked)
    const scenarioState = TestScenarioService.applyTestScenario(
      scenarios[0],
      gameState,
      brushes,
      gridSize
    );

    expect(scenarioState).toBeDefined();
    expect(scenarioState.detectors).toBeDefined();
    expect(scenarioState.detectors[0].index).toBe(0);
    expect(scenarioState.detectors[0].currentValue).toBe(1); // active state converted to 1
  });

  test('should verify TEST button conditional rendering logic', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Test cases that should show TEST button
    const challengeWithScenarios = { testScenarios: [{ name: "test" }] };
    expect(TestScenarioService.hasTestScenarios(challengeWithScenarios)).toBe(true);

    // Test cases that should NOT show TEST button
    const challengeWithoutScenarios = { name: "1. Basics" };
    expect(TestScenarioService.hasTestScenarios(challengeWithoutScenarios)).toBe(false);

    const challengeWithEmptyScenarios = { testScenarios: [] };
    expect(TestScenarioService.hasTestScenarios(challengeWithEmptyScenarios)).toBe(false);

    const nullChallenge = null;
    expect(TestScenarioService.hasTestScenarios(nullChallenge)).toBe(false);

    const undefinedChallenge = undefined;
    expect(TestScenarioService.hasTestScenarios(undefinedChallenge)).toBe(false);
  });
});
