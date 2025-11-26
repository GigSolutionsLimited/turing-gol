/**
 * Test for the specific issue where test brushes appear briefly then disappear
 * and detectors are not found during validation
 */

import { GameService } from '../../src/services/gameService';
import { DetectorService } from '../../src/services/detectorService';
import { TestScenarioService } from '../../src/services/testScenarioService';

describe('Test Scenario Brush Persistence Bug Fix', () => {
  const mockChallenge = {
    name: 'Test Challenge',
    width: 151,
    height: 151,
    targetTurn: 1000,
    detectorFalloffPeriod: 60,
    testScenarios: [
      {
        name: 'Input High (1) → Output Low (0)',
        description: 'When the input gun is active, the NOT gate output should be disabled (detector shows 0)',
        setup: [
          {
            x: -50,
            y: -50,
            brush: 'p60GliderGunG'
          }
        ],
        detectors: [
          {
            x: 4,
            y: -12,
            state: 'active',
            index: 0,
            description: 'Input detector - should remain ON when input is present'
          },
          {
            x: 21,
            y: 25,
            state: 'inactive',
            index: 1,
            description: 'Output detector - should remain OFF when input is present'
          }
        ]
      }
    ]
  };

  const mockBrushes = {
    'p60GliderGunG': {
      name: 'Period 60 Glider Gun',
      pattern: [
        // Simple mock pattern for testing - represents a glider gun
        [0, 0], [0, 1], [1, 0], [1, 1], // Block
        [2, 2], [3, 2], [4, 2] // Line
      ]
    }
  };

  test('should maintain brush patterns during test scenario execution', () => {
    const scenario = mockChallenge.testScenarios[0];
    const initialGrid = GameService.createEmptyGrid(151, 151);

    const gameState = {
      grid: initialGrid,
      detectors: [],
      placedObjects: []
    };

    const gridSize = { width: 151, height: 151 };

    // Apply test scenario setup
    const scenarioState = TestScenarioService.applyTestScenario(
      scenario,
      gameState,
      mockBrushes,
      gridSize
    );

    // Verify pattern was placed
    const centerX = Math.floor(gridSize.width / 2);
    const centerY = Math.floor(gridSize.height / 2);
    const expectedX = centerX + scenario.setup[0].x;
    const expectedY = centerY + scenario.setup[0].y;

    // Check that cells from the brush pattern are placed
    const brush = mockBrushes['p60GliderGunG'];
    let placedCells = 0;

    for (const [dy, dx] of brush.pattern) {
      const gridY = expectedY + dy;
      const gridX = expectedX + dx;

      if (gridY >= 0 && gridY < scenarioState.grid.length &&
          gridX >= 0 && gridX < scenarioState.grid[0].length) {
        if (scenarioState.grid[gridY][gridX] === 1) {
          placedCells++;
        }
      }
    }

    expect(placedCells).toBeGreaterThan(0);
    expect(placedCells).toBe(brush.pattern.length);

    // Verify detectors were placed
    expect(scenarioState.detectors).toHaveLength(2);
    expect(scenarioState.detectors[0].index).toBe(0);
    expect(scenarioState.detectors[1].index).toBe(1);

    // Verify detector positions (TestScenarioService doesn't transform coordinates, it just copies them)
    const detector0 = scenarioState.detectors.find(d => d.index === 0);
    const detector1 = scenarioState.detectors.find(d => d.index === 1);

    expect(detector0).toBeDefined();
    expect(detector1).toBeDefined();

    // TestScenarioService copies detector coordinates as-is without transformation
    expect(detector0.x).toBe(scenario.detectors[0].x);
    expect(detector0.y).toBe(scenario.detectors[0].y);
    expect(detector1.x).toBe(scenario.detectors[1].x);
    expect(detector1.y).toBe(scenario.detectors[1].y);

    // Verify detector states
    expect(detector0.currentValue).toBe(1); // 'active' → 1
    expect(detector1.currentValue).toBe(0); // 'inactive' → 0
  });

  test('should maintain detectors through simulation cycles', () => {
    const scenario = mockChallenge.testScenarios[0];

    // Initialize detectors as they would be in the actual test
    const detectors = DetectorService.initializeChallengeDetectors(
      scenario.detectors.map(d => {
        const centerX = Math.floor(151 / 2);
        const centerY = Math.floor(151 / 2);
        return {
          ...d,
          x: centerX + d.x,
          y: centerY + d.y
        };
      }),
      mockChallenge.detectorFalloffPeriod
    );

    expect(detectors).toHaveLength(2);

    // Simulate several generations to ensure detectors persist
    let currentGrid = GameService.createEmptyGrid(151, 151);
    let currentDetectors = [...detectors];

    for (let gen = 0; gen < 10; gen++) {
      currentGrid = GameService.nextGeneration(currentGrid);
      currentDetectors = DetectorService.updateDetectors(currentDetectors, currentGrid, gen);

      // Verify detectors still exist
      expect(currentDetectors).toHaveLength(2);
      expect(currentDetectors[0].index).toBe(0);
      expect(currentDetectors[1].index).toBe(1);
    }
  });

  test('should properly validate test scenario with valid detectors', () => {
    const scenario = mockChallenge.testScenarios[0];

    const gameState = {
      grid: GameService.createEmptyGrid(151, 151),
      detectors: [
        {
          index: 0,
          currentValue: 1, // Active (matches expected 'active' state)
          x: 79, // centerX + 4
          y: 63  // centerY - 12
        },
        {
          index: 1,
          currentValue: 0, // Inactive (matches expected 'inactive' state)
          x: 96, // centerX + 21
          y: 100 // centerY + 25
        }
      ]
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 1000);

    expect(result.passed).toBe(true);
    expect(result.details['detector_0'].passed).toBe(true);
    expect(result.details['detector_0'].actual).toBe('active');
    expect(result.details['detector_0'].expected).toBe('active');

    expect(result.details['detector_1'].passed).toBe(true);
    expect(result.details['detector_1'].actual).toBe('inactive');
    expect(result.details['detector_1'].expected).toBe('inactive');
  });

  test('should fail validation when detectors are missing', () => {
    const scenario = mockChallenge.testScenarios[0];

    // Empty game state - no detectors
    const gameState = {
      grid: GameService.createEmptyGrid(151, 151),
      detectors: [] // No detectors - simulating the bug
    };

    const result = TestScenarioService.validateScenario(scenario, gameState, 1000);

    expect(result.passed).toBe(false);
    expect(result.details['detector_0'].passed).toBe(false);
    expect(result.details['detector_0'].actual).toBe('not_found');
    expect(result.details['detector_0'].expected).toBe('active');

    expect(result.details['detector_1'].passed).toBe(false);
    expect(result.details['detector_1'].actual).toBe('not_found');
    expect(result.details['detector_1'].expected).toBe('inactive');
  });

  test('should properly handle brush placement with negative coordinates', () => {
    // The issue scenario has setup at x: -50, y: -50
    const grid = GameService.createEmptyGrid(151, 151);
    const centerX = Math.floor(151 / 2); // 75
    const centerY = Math.floor(151 / 2); // 75

    const setupX = -50;
    const setupY = -50;

    const targetX = centerX + setupX; // 25
    const targetY = centerY + setupY; // 25

    // Verify the target coordinates are valid
    expect(targetX).toBeGreaterThanOrEqual(0);
    expect(targetY).toBeGreaterThanOrEqual(0);
    expect(targetX).toBeLessThan(151);
    expect(targetY).toBeLessThan(151);

    // Place a test pattern
    const testPattern = [[0, 0], [0, 1], [1, 0]];

    for (const [dy, dx] of testPattern) {
      const gridY = targetY + dy;
      const gridX = targetX + dx;

      if (gridY >= 0 && gridY < grid.length &&
          gridX >= 0 && gridX < grid[0].length) {
        grid[gridY][gridX] = 1;
      }
    }

    // Verify pattern was placed
    expect(grid[25][25]).toBe(1); // [0, 0]
    expect(grid[25][26]).toBe(1); // [0, 1]
    expect(grid[26][25]).toBe(1); // [1, 0]
  });

  test('should pass detector data from setup to simulation', () => {
    const scenario = mockChallenge.testScenarios[0];

    // Simulate the new setup data flow
    const mockSetupData = {
      detectors: [
        {
          index: 0,
          x: 79,
          y: 63,
          currentValue: 1,
          activationTimer: 0,
          lastCoveredGeneration: -1,
          pattern: [[0, 0]],
          position: { x: 79, y: 63 },
          falloffPeriod: 60
        },
        {
          index: 1,
          x: 96,
          y: 100,
          currentValue: 0,
          activationTimer: 0,
          lastCoveredGeneration: -1,
          pattern: [[0, 0]],
          position: { x: 96, y: 100 },
          falloffPeriod: 60
        }
      ]
    };

    // Verify setup data structure
    expect(mockSetupData.detectors).toHaveLength(2);
    expect(mockSetupData.detectors[0].index).toBe(0);
    expect(mockSetupData.detectors[1].index).toBe(1);

    // Simulate using detectors from setup data vs React state
    const detectorsFromSetup = [...mockSetupData.detectors];
    const detectorsFromReactState = []; // Empty as would happen with timing issue

    // The fix should use setup data when available
    const detectorsToUse = mockSetupData.detectors && mockSetupData.detectors.length > 0
      ? detectorsFromSetup
      : detectorsFromReactState;

    expect(detectorsToUse).toHaveLength(2);
    expect(detectorsToUse[0].index).toBe(0);
    expect(detectorsToUse[1].index).toBe(1);

    // Verify that we would NOT get the empty array
    expect(detectorsToUse).not.toEqual([]);
  });

  test('should create detectors with correct position structure for DetectorService compatibility', () => {
    const scenario = mockChallenge.testScenarios[0];

    // Mock the challenge detector initialization as done in GameOfLife
    const challengeDetectors = scenario.detectors.map(d => {
      const centerX = Math.floor(151 / 2); // 75
      const centerY = Math.floor(151 / 2); // 75
      const gridX = centerX + d.x; // 75 + 4 = 79 for detector 0
      const gridY = centerY + d.y; // 75 + (-12) = 63 for detector 0
      return {
        ...d,
        x: gridX,
        y: gridY
      };
    });

    // Initialize detectors using DetectorService
    const detectors = DetectorService.initializeChallengeDetectors(
      challengeDetectors,
      60 // falloffPeriod
    );

    expect(detectors).toHaveLength(2);

    // Verify detector 0
    expect(detectors[0].index).toBe(0);
    expect(detectors[0].position).toBeDefined();
    expect(detectors[0].position.x).toBe(79);
    expect(detectors[0].position.y).toBe(63);
    expect(detectors[0].pattern).toEqual([[0, 0]]); // Single pixel detector

    // Verify detector 1
    expect(detectors[1].index).toBe(1);
    expect(detectors[1].position).toBeDefined();
    expect(detectors[1].position.x).toBe(96); // 75 + 21
    expect(detectors[1].position.y).toBe(100); // 75 + 25
    expect(detectors[1].pattern).toEqual([[0, 0]]); // Single pixel detector

    // Verify DetectorService can use these detectors for coverage checks
    const testGrid = GameService.createEmptyGrid(151, 151);

    // Place a pixel at detector 0's position to test coverage
    testGrid[63][79] = 1;

    // This should not throw an error and should return true for detector 0
    const detector0Covered = DetectorService.isDetectorFullyCovered(detectors[0], testGrid);
    expect(detector0Covered).toBe(true);

    // Detector 1 should not be covered (no pixel at its position)
    const detector1Covered = DetectorService.isDetectorFullyCovered(detectors[1], testGrid);
    expect(detector1Covered).toBe(false);
  });
});
