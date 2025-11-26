/**
 * Integration tests for Test Scenario functionality
 * Tests the integration between TestScenarioService and TestScenarioPanel
 */

describe('Test Scenario Integration', () => {
  test('should integrate test scenarios with challenge system', () => {
    // Mock challenge with test scenarios (Level 10 NOT gate)
    const challenge = {
      name: '10. Not gate',
      testScenarios: [
        {
          name: 'Input High (1) → Output Low (0)',
          description: 'When input gun is active, NOT gate output should be disabled',
          setup: [
            {
              x: -90,
              y: 0,
              brush: 'p30GliderGunG'
            }
          ],
          detectors: [
            {
              x: 90,
              y: 0,
              state: 'inactive',
              index: 0
            }
          ],
          expectedResults: {
            detector_0: 'inactive',
            description: 'NOT gate should invert: Input=1 → Output=0'
          }
        },
        {
          name: 'Input Low (0) → Output High (1)',
          description: 'When input gun is inactive, NOT gate output should be enabled',
          setup: [],
          detectors: [
            {
              x: 90,
              y: 0,
              state: 'active',
              index: 0
            }
          ],
          expectedResults: {
            detector_0: 'active',
            description: 'NOT gate should invert: Input=0 → Output=1'
          }
        }
      ]
    };

    // Import services
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');
    const { ChallengeService } = require('../../src/services/challengeService.js');

    // Test challenge processing includes test scenarios
    const processedChallenge = ChallengeService.processChallengeData(challenge);
    expect(processedChallenge.testScenarios).toBeDefined();
    expect(processedChallenge.testScenarios).toHaveLength(2);

    // Test scenario detection
    expect(TestScenarioService.hasTestScenarios(processedChallenge)).toBe(true);

    const scenarios = TestScenarioService.getTestScenarios(processedChallenge);
    expect(scenarios).toHaveLength(2);
    expect(scenarios[0].name).toBe('Input High (1) → Output Low (0)');
    expect(scenarios[1].name).toBe('Input Low (0) → Output High (1)');
  });

  test('should validate NOT gate test scenarios correctly', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Test scenario 1: Input High → Output Low
    const scenario1 = {
      name: 'Input High (1) → Output Low (0)',
      detectors: [{ x: 90, y: 0, state: 'inactive', index: 0 }], // NOT gate inverts: input=1 → output=0
      description: 'NOT gate should invert the signal'
    };

    // Simulate correct NOT gate behavior (input active, output inactive)
    const gameState1 = {
      detectors: [
        { index: 0, currentValue: 0 } // Output detector shows 0 (inactive)
      ]
    };

    const result1 = TestScenarioService.validateScenario(scenario1, gameState1, 1000);
    expect(result1.passed).toBe(true);
    expect(result1.details.detector_0.expected).toBe('inactive');
    expect(result1.details.detector_0.actual).toBe('inactive');

    // Test scenario 2: Input Low → Output High
    const scenario2 = {
      name: 'Input Low (0) → Output High (1)',
      detectors: [{ x: 90, y: 0, state: 'active', index: 0 }], // NOT gate inverts: input=0 → output=1
      description: 'NOT gate should invert the signal'
    };

    // Simulate correct NOT gate behavior (no input, output active)
    const gameState2 = {
      detectors: [
        { index: 0, currentValue: 1 } // Output detector shows 1 (active)
      ]
    };

    const result2 = TestScenarioService.validateScenario(scenario2, gameState2, 1000);
    expect(result2.passed).toBe(true);
    expect(result2.details.detector_0.expected).toBe('active');
    expect(result2.details.detector_0.actual).toBe('active');
  });

  test('should detect broken NOT gate implementation', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    // Test scenario expecting output to be OFF when input is ON
    const scenario = {
      name: 'Input High → Output should be Low',
      detectors: [{ x: 90, y: 0, state: 'inactive', index: 0 }],
      description: 'Output should be OFF when input is ON'
    };

    // Simulate broken implementation where output is ON when input is ON (not inverted)
    const brokenGameState = {
      detectors: [
        { index: 0, currentValue: 1 } // Wrong! Should be 0 for NOT gate
      ]
    };

    const result = TestScenarioService.validateScenario(scenario, brokenGameState, 1000);
    expect(result.passed).toBe(false);
    expect(result.details.detector_0.expected).toBe('inactive');
    expect(result.details.detector_0.actual).toBe('active');
    expect(result.message).toContain('Test scenario failed');
  });

  test('should apply test scenario setup patterns', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    const scenario = {
      name: 'Setup Test',
      setup: [
        {
          x: -50,
          y: 0,
          brush: 'testGun'
        }
      ],
      detectors: [
        {
          x: 50,
          y: 0,
          state: 'inactive',
          index: 0
        }
      ]
    };

    const gameState = {
      grid: Array(201).fill(null).map(() => Array(201).fill(0)),
      detectors: [],
      placedObjects: []
    };

    const brushes = {
      testGun: {
        pattern: [[0, 0], [0, 1], [1, 0], [1, 1]] // 2x2 block
      }
    };

    const gridSize = { width: 201, height: 201 };

    const result = TestScenarioService.applyTestScenario(scenario, gameState, brushes, gridSize);

    // Verify setup pattern was applied to the grid
    const centerX = Math.floor(201 / 2);
    const centerY = Math.floor(201 / 2);

    // Check that the gun pattern was placed at the correct location
    expect(result.grid[centerY + 0][centerX + (-50) + 0]).toBe(1);
    expect(result.grid[centerY + 0][centerX + (-50) + 1]).toBe(1);
    expect(result.grid[centerY + 1][centerX + (-50) + 0]).toBe(1);
    expect(result.grid[centerY + 1][centerX + (-50) + 1]).toBe(1);

    // Verify detector was set up
    expect(result.detectors).toHaveLength(1);
    expect(result.detectors[0].x).toBe(50);
    expect(result.detectors[0].y).toBe(0);
    expect(result.detectors[0].index).toBe(0);
  });

  test('should handle multiple test scenarios in a challenge', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    const challenge = {
      testScenarios: [
        {
          name: 'Test A',
          detectors: [{ x: 0, y: 0, state: 'active', index: 0 }],
          expectedResults: { detector_0: 'active' }
        },
        {
          name: 'Test B',
          detectors: [{ x: 1, y: 1, state: 'inactive', index: 1 }],
          expectedResults: { detector_1: 'inactive' }
        },
        {
          name: 'Test C',
          detectors: [{ x: 2, y: 2, state: 'active', index: 2 }],
          expectedResults: { detector_2: 'active' }
        }
      ]
    };

    const gameState = {
      grid: Array(50).fill(null).map(() => Array(50).fill(0)),
      detectors: [
        { index: 0, currentValue: 1 }, // Active
        { index: 1, currentValue: 0 }, // Inactive
        { index: 2, currentValue: 1 }  // Active
      ],
      placedObjects: []
    };

    const results = TestScenarioService.runAllScenarios(
      challenge,
      gameState,
      {},
      { width: 50, height: 50 },
      0
    );

    expect(results).toHaveLength(3);
    expect(results[0].scenario).toBe('Test A');
    expect(results[0].passed).toBe(true);
    expect(results[1].scenario).toBe('Test B');
    expect(results[1].passed).toBe(true);
    expect(results[2].scenario).toBe('Test C');
    expect(results[2].passed).toBe(true);
  });

  test('should provide meaningful validation feedback', () => {
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');

    const scenario = {
      name: 'Multi-detector test',
      detectors: [
        { x: 0, y: 0, state: 'active', index: 0 },
        { x: 1, y: 1, state: 'inactive', index: 1 },
        { x: 2, y: 2, state: 'active', index: 2 }
      ],
      description: 'Complex logic gate test'
    };

    // Mixed results: some pass, some fail
    const gameState = {
      detectors: [
        { index: 0, currentValue: 1 }, // Correct (active)
        { index: 1, currentValue: 1 }, // Wrong (should be inactive)
        { index: 2, currentValue: 1 }  // Correct (active)
      ]
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 100);

    expect(result.passed).toBe(false);
    expect(result.details.detector_0.passed).toBe(true);
    expect(result.details.detector_1.passed).toBe(false);
    expect(result.details.detector_2.passed).toBe(true);

    expect(result.message).toContain('Detector 1: expected inactive, got active');
    expect(result.message).not.toContain('Detector 0:');
    expect(result.message).not.toContain('Detector 2:');
  });
});
