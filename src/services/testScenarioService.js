// Test Scenario service for handling in-game unit tests
import { PlacedObjectService } from './placedObjectService.js';
import { BrushService } from './brushService.js';

/**
 * Service for managing test scenarios - in-game unit tests that validate user solutions
 */
export class TestScenarioService {
  /**
   * Check if a challenge has test scenarios
   * @param {Object} challenge - Challenge configuration
   * @returns {boolean} True if challenge has test scenarios
   */
  static hasTestScenarios(challenge) {
    return challenge &&
           challenge.testScenarios &&
           Array.isArray(challenge.testScenarios) &&
           challenge.testScenarios.length > 0;
  }

  /**
   * Get test scenarios from a challenge
   * @param {Object} challenge - Challenge configuration
   * @returns {Array} Array of test scenarios
   */
  static getTestScenarios(challenge) {
    if (!this.hasTestScenarios(challenge)) {
      return [];
    }
    return challenge.testScenarios;
  }

  /**
   * Apply a test scenario to the game state
   * @param {Object} scenario - Test scenario configuration
   * @param {Object} gameState - Current game state
   * @param {Object} brushes - Available brushes
   * @param {Object} gridSize - Grid dimensions
   * @returns {Object} Updated game state for the scenario
   */
  static applyTestScenario(scenario, gameState, brushes, gridSize) {
    if (!scenario || !gameState) {
      return gameState;
    }

    // Create a copy of the current game state
    const scenarioState = {
      ...gameState,
      detectors: (scenario.detectors || []).map(detector => ({
        ...detector,
        // Convert state to currentValue for validation
        currentValue: detector.state === 'active' ? 1 : 0
      })),
      placedObjects: [...gameState.placedObjects],
      grid: gameState.grid.map(row => [...row])
    };

    // Apply scenario setup patterns
    if (scenario.setup && scenario.setup.length > 0) {
      const centerOffsetX = Math.floor(gridSize.width / 2);
      const centerOffsetY = Math.floor(gridSize.height / 2);

      for (const setupItem of scenario.setup) {
        const brush = brushes[setupItem.brush];
        if (brush && brush.pattern) {
          // Apply rotation if specified
          let rotatedBrush = brush;
          if (setupItem.rotate && setupItem.rotate !== 0) {
            const rotations = Math.floor(setupItem.rotate / 90) % 4;
            for (let i = 0; i < rotations; i++) {
              rotatedBrush = BrushService.transformPattern(rotatedBrush, 'rotateClockwise');
            }
          }

          // Place setup pattern on the grid
          for (const [dy, dx] of rotatedBrush.pattern) {
            const gridY = centerOffsetY + setupItem.y + dy;
            const gridX = centerOffsetX + setupItem.x + dx;
            if (gridY >= 0 && gridY < scenarioState.grid.length &&
                gridX >= 0 && gridX < scenarioState.grid[0].length) {
              scenarioState.grid[gridY][gridX] = 1;
            }
          }
        }
      }
    }

    return scenarioState;
  }

  /**
   * Validate test scenario results
   * @param {Object} scenario - Test scenario configuration
   * @param {Object} gameState - Current game state after running
   * @param {number} generation - Current generation
   * @returns {Object} Validation results
   */
  static validateScenario(scenario, gameState, generation) {
    if (!scenario || !scenario.detectors || scenario.detectors.length === 0) {
      return {
        passed: true,
        message: 'No validation criteria specified'
      };
    }

    const results = {
      passed: true,
      details: {},
      message: ''
    };

    // Validate detector states based on scenario detector definitions
    scenario.detectors.forEach(scenarioDetector => {
      const key = `detector_${scenarioDetector.index}`;
      const expectedState = scenarioDetector.state;

      // Find the detector in game state
      const detector = gameState.detectors.find(d => d.index === scenarioDetector.index);
      if (detector) {
        const actualState = detector.currentValue > 0 ? 'active' : 'inactive';
        const passed = actualState === expectedState;

        results.details[key] = {
          expected: expectedState,
          actual: actualState,
          passed
        };

        if (!passed) {
          results.passed = false;
        }
      } else {
        results.details[key] = {
          expected: expectedState,
          actual: 'not_found',
          passed: false
        };
        results.passed = false;
      }
    });

    // Generate validation message
    if (results.passed) {
      results.message = scenario.description || 'Test scenario passed!';
    } else {
      const failedDetectors = Object.keys(results.details)
        .filter(key => !results.details[key].passed)
        .map(key => {
          const detail = results.details[key];
          return `Detector ${key.split('_')[1]}: expected ${detail.expected}, got ${detail.actual}`;
        });
      results.message = `Test scenario failed: ${failedDetectors.join(', ')}`;
    }

    return results;
  }

  /**
   * Get all test scenarios for a challenge
   * @param {Object} challenge - Challenge configuration
   * @returns {Array} Array of test scenarios
   */
  static getTestScenarios(challenge) {
    return challenge?.testScenarios || [];
  }

  /**
   * Check if a challenge has test scenarios
   * @param {Object} challenge - Challenge configuration
   * @returns {boolean} True if challenge has test scenarios
   */
  static hasTestScenarios(challenge) {
    return !!(challenge?.testScenarios && challenge.testScenarios.length > 0);
  }

  /**
   * Run all test scenarios for a challenge
   * @param {Object} challenge - Challenge configuration
   * @param {Object} gameState - Current game state
   * @param {Object} brushes - Available brushes
   * @param {Object} gridSize - Grid dimensions
   * @param {number} generation - Current generation
   * @returns {Array} Array of test results
   */
  static runAllScenarios(challenge, gameState, brushes, gridSize, generation) {
    const scenarios = this.getTestScenarios(challenge);
    const results = [];

    for (const scenario of scenarios) {
      // Apply scenario to a copy of game state
      const scenarioState = this.applyTestScenario(scenario, gameState, brushes, gridSize);

      // For now, we validate immediately. In a full implementation,
      // we'd need to run the simulation for targetTurn generations
      const validation = this.validateScenario(scenario, scenarioState, generation);

      results.push({
        scenario: scenario.name,
        description: scenario.description,
        ...validation
      });
    }

    return results;
  }
}
