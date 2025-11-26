/**
 * Test scenario functionality tests
 * Tests the complete test scenario execution flow
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

  test('should identify challenges with test scenarios', () => {
    expect(TestScenarioService.hasTestScenarios(mockChallenge)).toBe(true);

    const challengeWithoutTests = { name: 'No Tests' };
    expect(TestScenarioService.hasTestScenarios(challengeWithoutTests)).toBe(false);

    const challengeWithEmptyTests = { name: 'Empty Tests', testScenarios: [] };
    expect(TestScenarioService.hasTestScenarios(challengeWithEmptyTests)).toBe(false);
  });

  test('should return test scenarios from challenge', () => {
    const scenarios = TestScenarioService.getTestScenarios(mockChallenge);
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0].name).toBe('Test Scenario 1');

    const noScenarios = TestScenarioService.getTestScenarios({});
    expect(noScenarios).toHaveLength(0);
  });

  test('should handle missing detectors in validation gracefully', () => {
    const scenario = {
      name: 'Missing Detector Test',
      detectors: [
        {
          x: 0,
          y: 0,
          state: 'active',
          index: 99, // Non-existent detector
          description: 'Missing detector'
        }
      ]
    };

    const gameState = {
      grid: GameService.createEmptyGrid(21, 21),
      detectors: [] // No detectors in game state
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 100);

    expect(result.passed).toBe(false);
    expect(result.details['detector_99'].expected).toBe('active');
    expect(result.details['detector_99'].actual).toBe('not_found');
    expect(result.details['detector_99'].passed).toBe(false);
  });

  test('should handle empty test scenario validation', () => {
    const scenario = {
      name: 'Empty Test',
      detectors: [] // No detectors to validate
    };

    const gameState = {
      grid: GameService.createEmptyGrid(21, 21),
      detectors: []
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 100);

    expect(result.passed).toBe(true);
    expect(result.message).toBe('No validation criteria specified');
  });
});
