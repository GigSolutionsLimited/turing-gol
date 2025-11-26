/**
 * Test scenarios for the TestScenarioService
 * This tests the new in-game unit test functionality
 */

describe('TestScenarioService', () => {
  let TestScenarioService;

  beforeEach(() => {
    // Import the service for each test
    TestScenarioService = require('../../src/services/testScenarioService.js').TestScenarioService;
  });

  describe('Test Scenario Detection', () => {
    test('should identify challenges with test scenarios', () => {
      const challengeWithScenarios = {
        name: '10. Not gate',
        testScenarios: [
          {
            name: 'Input High → Output Low',
            expectedResults: { detector_0: 'inactive' }
          }
        ]
      };

      const challengeWithoutScenarios = {
        name: '1. Basics',
        patterns: []
      };

      expect(TestScenarioService.hasTestScenarios(challengeWithScenarios)).toBe(true);
      expect(TestScenarioService.hasTestScenarios(challengeWithoutScenarios)).toBe(false);
      expect(TestScenarioService.hasTestScenarios(null)).toBe(false);
    });

    test('should extract test scenarios from challenge', () => {
      const challenge = {
        testScenarios: [
          { name: 'Test 1', description: 'First test' },
          { name: 'Test 2', description: 'Second test' }
        ]
      };

      const scenarios = TestScenarioService.getTestScenarios(challenge);
      expect(scenarios).toHaveLength(2);
      expect(scenarios[0].name).toBe('Test 1');
      expect(scenarios[1].name).toBe('Test 2');
    });

    test('should return empty array for challenges without scenarios', () => {
      expect(TestScenarioService.getTestScenarios({})).toEqual([]);
      expect(TestScenarioService.getTestScenarios(null)).toEqual([]);
      expect(TestScenarioService.getTestScenarios({ patterns: [] })).toEqual([]);
    });
  });

  describe('Test Scenario Application', () => {
    test('should apply test scenario setup to game state', () => {
      const scenario = {
        name: 'Test Scenario',
        setup: [
          {
            x: 10,
            y: 5,
            brush: 'testBrush'
          }
        ],
        detectors: [
          {
            x: 20,
            y: 10,
            state: 'active',
            index: 0
          }
        ]
      };

      const gameState = {
        grid: Array(50).fill(null).map(() => Array(50).fill(0)),
        detectors: [],
        placedObjects: []
      };

      const brushes = {
        testBrush: {
          pattern: [[0, 0], [0, 1], [1, 0]]
        }
      };

      const gridSize = { width: 50, height: 50 };

      const result = TestScenarioService.applyTestScenario(scenario, gameState, brushes, gridSize);

      // Verify scenario state is applied
      expect(result.detectors).toHaveLength(1);
      expect(result.detectors[0].index).toBe(0);
      expect(result.detectors[0].state).toBe('active');

      // Verify grid has patterns placed
      expect(result.grid[25 + 5][25 + 10]).toBe(1); // Center offset + position
      expect(result.grid[25 + 5][25 + 11]).toBe(1);
      expect(result.grid[25 + 6][25 + 10]).toBe(1);
    });

    test('should handle scenarios without setup', () => {
      const scenario = {
        name: 'Empty Test',
        detectors: [{ x: 0, y: 0, state: 'inactive', index: 0 }]
      };

      const gameState = {
        grid: Array(10).fill(null).map(() => Array(10).fill(0)),
        detectors: [],
        placedObjects: []
      };

      const result = TestScenarioService.applyTestScenario(scenario, gameState, {}, { width: 10, height: 10 });

      expect(result.detectors).toHaveLength(1);
      expect(result.detectors[0].state).toBe('inactive');
    });
  });

  describe('Test Scenario Validation', () => {
    test('should validate detector states correctly', () => {
      const scenario = {
        detectors: [
          { x: 0, y: 0, state: 'active', index: 0 },
          { x: 1, y: 1, state: 'inactive', index: 1 }
        ],
        description: 'NOT gate test'
      };

      const gameState = {
        detectors: [
          { index: 0, currentValue: 1 }, // Active (detected)
          { index: 1, currentValue: 0 }  // Inactive (not detected)
        ]
      };

      const result = TestScenarioService.validateScenario(scenario, gameState, 100);

      expect(result.passed).toBe(true);
      expect(result.details.detector_0.expected).toBe('active');
      expect(result.details.detector_0.actual).toBe('active');
      expect(result.details.detector_0.passed).toBe(true);

      expect(result.details.detector_1.expected).toBe('inactive');
      expect(result.details.detector_1.actual).toBe('inactive');
      expect(result.details.detector_1.passed).toBe(true);

      expect(result.message).toBe('NOT gate test');
    });

    test('should fail validation when detector states are incorrect', () => {
      const scenario = {
        detectors: [
          { x: 0, y: 0, state: 'active', index: 0 },   // Expect active
          { x: 1, y: 1, state: 'inactive', index: 1 }  // Expect inactive
        ],
        description: 'Test should fail'
      };

      const gameState = {
        detectors: [
          { index: 0, currentValue: 0 }, // Actually inactive
          { index: 1, currentValue: 1 }  // Actually active
        ]
      };

      const result = TestScenarioService.validateScenario(scenario, gameState, 100);

      expect(result.passed).toBe(false);
      expect(result.details.detector_0.passed).toBe(false);
      expect(result.details.detector_1.passed).toBe(false);
      expect(result.message).toContain('Test scenario failed');
      expect(result.message).toContain('Detector 0: expected active, got inactive');
      expect(result.message).toContain('Detector 1: expected inactive, got active');
    });

    test('should handle missing detectors', () => {
      const scenario = {
        detectors: [
          { x: 0, y: 0, state: 'active', index: 0 },
          { x: 99, y: 99, state: 'inactive', index: 99 } // Detector that doesn't exist
        ]
      };

      const gameState = {
        detectors: [
          { index: 0, currentValue: 1 }
          // Missing detector with index 99
        ]
      };

      const result = TestScenarioService.validateScenario(scenario, gameState, 100);

      expect(result.passed).toBe(false);
      expect(result.details.detector_0.passed).toBe(true);
      expect(result.details.detector_99.passed).toBe(false);
      expect(result.details.detector_99.actual).toBe('not_found');
    });

    test('should pass validation when no criteria specified', () => {
      const scenario = { name: 'No validation' };
      const gameState = { detectors: [] };

      const result = TestScenarioService.validateScenario(scenario, gameState, 0);

      expect(result.passed).toBe(true);
      expect(result.message).toBe('No validation criteria specified');
    });
  });

  describe('NOT Gate Test Scenarios', () => {
    test('should validate NOT gate logic correctly', () => {
      // Test Input=1 → Output=0 scenario
      const scenario1 = {
        name: 'Input High (1) → Output Low (0)',
        detectors: [{ x: 90, y: 0, state: 'inactive', index: 0 }],
        description: 'NOT gate should invert: Input=1 → Output=0'
      };

      // Simulate input gun is active, output detector should be inactive
      const gameState1 = {
        detectors: [{ index: 0, currentValue: 0 }] // Output is OFF (correct for NOT gate)
      };

      const result1 = TestScenarioService.validateScenario(scenario1, gameState1, 1000);
      expect(result1.passed).toBe(true);

      // Test Input=0 → Output=1 scenario
      const scenario2 = {
        name: 'Input Low (0) → Output High (1)',
        detectors: [{ x: 90, y: 0, state: 'active', index: 0 }],
        description: 'NOT gate should invert: Input=0 → Output=1'
      };

      // Simulate no input gun, output detector should be active
      const gameState2 = {
        detectors: [{ index: 0, currentValue: 1 }] // Output is ON (correct for NOT gate)
      };

      const result2 = TestScenarioService.validateScenario(scenario2, gameState2, 1000);
      expect(result2.passed).toBe(true);
    });

    test('should detect incorrect NOT gate implementation', () => {
      const scenario = {
        detectors: [{ x: 90, y: 0, state: 'inactive', index: 0 }], // Expect output OFF when input ON
        description: 'Should be OFF when input is ON'
      };

      // Simulate broken NOT gate where output is ON when input is ON
      const gameState = {
        detectors: [{ index: 0, currentValue: 1 }] // Wrong! Should be 0
      };

      const result = TestScenarioService.validateScenario(scenario, gameState, 1000);
      expect(result.passed).toBe(false);
      expect(result.details.detector_0.expected).toBe('inactive');
      expect(result.details.detector_0.actual).toBe('active');
    });
  });

  describe('Running All Scenarios', () => {
    test('should run all test scenarios for a challenge', () => {
      const challenge = {
        testScenarios: [
          {
            name: 'Test 1',
            description: 'First test',
            setup: [],
            detectors: [{ x: 0, y: 0, state: 'active', index: 0 }]
          },
          {
            name: 'Test 2',
            description: 'Second test',
            setup: [],
            detectors: [{ x: 1, y: 1, state: 'inactive', index: 1 }]
          }
        ]
      };

      const gameState = {
        grid: Array(10).fill(null).map(() => Array(10).fill(0)),
        detectors: [
          { index: 0, currentValue: 1 },
          { index: 1, currentValue: 0 }
        ],
        placedObjects: []
      };

      const results = TestScenarioService.runAllScenarios(
        challenge,
        gameState,
        {},
        { width: 10, height: 10 },
        0
      );

      expect(results).toHaveLength(2);
      expect(results[0].scenario).toBe('Test 1');
      expect(results[0].passed).toBe(true);
      expect(results[1].scenario).toBe('Test 2');
      expect(results[1].passed).toBe(true);
    });
  });
});
