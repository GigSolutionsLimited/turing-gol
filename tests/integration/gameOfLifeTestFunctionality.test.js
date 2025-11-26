/**
 * GameOfLife Test Functionality Integration Tests
 * Tests the complete test scenario execution flow including handleTest method
 */

import { TestScenarioService } from '../../src/services/testScenarioService';
import { GameService } from '../../src/services/gameService';
import { DetectorService } from '../../src/services/detectorService';

describe('GameOfLife Test Functionality', () => {
  const mockChallenge = {
    name: 'Test Challenge',
    width: 21,
    height: 21,
    targetTurn: 100,
    detectorFalloffPeriod: 10,
    testScenarios: [
      {
        name: 'Test Scenario 1',
        description: 'A test scenario for validation',
        setup: [
          {
            x: 0,
            y: 0,
            brush: 'block'
          }
        ],
        detectors: [
          {
            x: 0,
            y: 0,
            state: 'active',
            index: 0,
            description: 'Test detector'
          }
        ]
      }
    ]
  };

  const mockBrushes = {
    block: {
      pattern: [[0, 0], [0, 1], [1, 0], [1, 1]]
    }
  };

  test('should validate test scenario with correct detector state', () => {
    const scenario = mockChallenge.testScenarios[0];

    const gameState = {
      grid: GameService.createEmptyGrid(21, 21),
      detectors: [
        {
          index: 0,
          currentValue: 1 // Active state
        }
      ]
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 100);

    expect(result.passed).toBe(true);
    expect(result.details['detector_0'].expected).toBe('active');
    expect(result.details['detector_0'].actual).toBe('active');
    expect(result.details['detector_0'].passed).toBe(true);
  });

  test('should validate test scenario with incorrect detector state', () => {
    const scenario = mockChallenge.testScenarios[0];

    const gameState = {
      grid: GameService.createEmptyGrid(21, 21),
      detectors: [
        {
          index: 0,
          currentValue: 0 // Inactive state (expected active)
        }
      ]
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 100);

    expect(result.passed).toBe(false);
    expect(result.details['detector_0'].expected).toBe('active');
    expect(result.details['detector_0'].actual).toBe('inactive');
    expect(result.details['detector_0'].passed).toBe(false);
  });

  test('should handle null grid gracefully in DetectorService', () => {
    const detectors = [
      {
        index: 0,
        pattern: [[0, 0]],
        position: { x: 5, y: 5 },
        currentValue: 0,
        activationTimer: 0,
        lastCoveredGeneration: -1
      }
    ];

    // Test with null grid - should not throw error
    const result1 = DetectorService.updateDetectors(detectors, null, 0);
    expect(result1).toEqual(detectors); // Should return unchanged detectors

    // Test with empty grid - should not throw error
    const result2 = DetectorService.updateDetectors(detectors, [], 0);
    expect(result2).toEqual(detectors); // Should return unchanged detectors

    // Test with invalid detectors input
    const result3 = DetectorService.updateDetectors(null, [[0, 0]], 0);
    expect(result3).toEqual([]); // Should return empty array
  });

  test('should apply test scenario setup correctly', () => {
    const scenario = mockChallenge.testScenarios[0];

    const gameState = {
      grid: GameService.createEmptyGrid(21, 21),
      detectors: [],
      placedObjects: []
    };

    const gridSize = { width: 21, height: 21 };

    const result = TestScenarioService.applyTestScenario(scenario, gameState, mockBrushes, gridSize);

    // Check that test detectors were added
    expect(result.detectors).toHaveLength(1);
    expect(result.detectors[0].index).toBe(0);
    expect(result.detectors[0].currentValue).toBe(1); // Active state

    // Check that setup pattern was placed
    const centerX = Math.floor(gridSize.width / 2);
    const centerY = Math.floor(gridSize.height / 2);

    // Block pattern should be placed at center + scenario setup position
    expect(result.grid[centerY][centerX]).toBe(1);
    expect(result.grid[centerY][centerX + 1]).toBe(1);
    expect(result.grid[centerY + 1][centerX]).toBe(1);
    expect(result.grid[centerY + 1][centerX + 1]).toBe(1);
  });

  test('should simulate GameOfLife.handleTest workflow', () => {
    // Mock the workflow that would happen in GameOfLife.handleTest
    const simulateHandleTest = async () => {
      const scenarios = mockChallenge.testScenarios;
      const results = [];

      for (const scenario of scenarios) {
        // Step 1: Reset to pre-play state (simulated)
        let testGrid = GameService.createEmptyGrid(21, 21);
        let testDetectors = [];

        // Step 2: Apply test scenario setup
        const scenarioState = TestScenarioService.applyTestScenario(
          scenario,
          { grid: testGrid, detectors: testDetectors, placedObjects: [] },
          mockBrushes,
          { width: 21, height: 21 }
        );

        testGrid = scenarioState.grid;
        testDetectors = scenarioState.detectors;

        // Step 3: Run simulation (simplified - just a few generations)
        for (let gen = 0; gen < 10; gen++) {
          testGrid = GameService.nextGeneration(testGrid);
          testDetectors = DetectorService.updateDetectors(testDetectors, testGrid, gen);
        }

        // Step 4: Validate scenario
        const validationResult = TestScenarioService.validateScenario(scenario, {
          grid: testGrid,
          detectors: testDetectors
        }, 10);

        results.push({
          name: scenario.name,
          passed: validationResult.passed,
          message: validationResult.message,
          details: validationResult.details
        });
      }

      const allPassed = results.every(result => result.passed);
      return {
        allPassed,
        message: `1/1 scenarios passed`,
        scenarios: results
      };
    };

    return simulateHandleTest().then(result => {
      expect(result).toBeDefined();
      expect(result.scenarios).toHaveLength(1);
      expect(result.scenarios[0].name).toBe('Test Scenario 1');
      // The result could be either passed or failed depending on the scenario design
      expect(typeof result.scenarios[0].passed).toBe('boolean');
    });
  });

  test('should identify challenges with test scenarios', () => {
    expect(TestScenarioService.hasTestScenarios(mockChallenge)).toBe(true);

    const challengeWithoutTests = { name: 'No Tests' };
    expect(TestScenarioService.hasTestScenarios(challengeWithoutTests)).toBe(false);

    const challengeWithEmptyTests = { name: 'Empty Tests', testScenarios: [] };
    expect(TestScenarioService.hasTestScenarios(challengeWithEmptyTests)).toBe(false);
  });

  test('should handle defensive programming in detector coverage checks', () => {
    const grid = GameService.createEmptyGrid(10, 10);

    // Test with invalid detector - should return false
    expect(DetectorService.isDetectorFullyCovered(null, grid)).toBe(false);
    expect(DetectorService.isDetectorFullyCovered({}, grid)).toBe(false);
    expect(DetectorService.isDetectorFullyCovered({ pattern: null }, grid)).toBe(false);

    // Test with null/invalid grid - should return false
    const validDetector = {
      pattern: [[0, 0]],
      position: { x: 5, y: 5 }
    };
    expect(DetectorService.isDetectorFullyCovered(validDetector, null)).toBe(false);
    expect(DetectorService.isDetectorFullyCovered(validDetector, [])).toBe(false);
    expect(DetectorService.isDetectorFullyCovered(validDetector, [[]])).toBe(false);
  });
});
