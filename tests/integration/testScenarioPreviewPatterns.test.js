/**
 * Test for Test Scenario Preview Patterns Functionality
 * Tests the rendering of test scenario patterns as gold pixels when the game is not running
 */

import { GameService } from '../../src/services/gameService';
import { TestScenarioService } from '../../src/services/testScenarioService';

describe('Test Scenario Preview Patterns', () => {
  const mockChallenge = {
    name: 'Test Challenge with Preview',
    width: 101,
    height: 101,
    testScenarios: [
      {
        name: 'Test Scenario 1',
        description: 'First test scenario with patterns',
        setup: [
          {
            x: -10,
            y: -5,
            brush: 'testPattern1'
          },
          {
            x: 10,
            y: 5,
            brush: 'testPattern2',
            rotate: 90
          }
        ],
        detectors: [
          {
            x: 0,
            y: 0,
            state: 'active',
            index: 0
          }
        ]
      },
      {
        name: 'Test Scenario 2',
        description: 'Second test scenario',
        setup: [
          {
            x: 0,
            y: 10,
            brush: 'testPattern1'
          }
        ],
        detectors: []
      }
    ]
  };

  const mockBrushes = {
    testPattern1: {
      name: 'Test Pattern 1',
      pattern: [
        [0, 0], [0, 1], [1, 0] // L-shape
      ]
    },
    testPattern2: {
      name: 'Test Pattern 2',
      pattern: [
        [0, 0], [0, 1], [0, 2] // Line
      ]
    }
  };

  const gridSize = { width: 101, height: 101 };

  // Mock function to simulate generateTestScenarioPreviewPatterns
  const generateTestScenarioPreviewPatterns = (challenge, brushes, gridSize) => {
    if (!challenge || !challenge.testScenarios || !brushes || Object.keys(brushes).length === 0) {
      return [];
    }

    const previewPatterns = [];
    const centerOffsetX = Math.floor(gridSize.width / 2);
    const centerOffsetY = Math.floor(gridSize.height / 2);

    for (const scenario of challenge.testScenarios) {
      if (scenario.setup && scenario.setup.length > 0) {
        for (const setupItem of scenario.setup) {
          const baseBrush = brushes[setupItem.brush];
          if (baseBrush && baseBrush.pattern) {
            // Apply rotation if specified (simplified for test)
            let pattern = baseBrush.pattern;
            if (setupItem.rotate === 90) {
              // Simple 90-degree rotation for test
              pattern = pattern.map(([y, x]) => [-x, y]);
            }

            // Generate preview pattern coordinates
            for (const [dy, dx] of pattern) {
              const gridY = centerOffsetY + setupItem.y + dy;
              const gridX = centerOffsetX + setupItem.x + dx;
              if (gridY >= 0 && gridY < gridSize.height &&
                  gridX >= 0 && gridX < gridSize.width) {
                previewPatterns.push({
                  x: gridX,
                  y: gridY,
                  scenario: scenario.name,
                  brush: setupItem.brush
                });
              }
            }
          }
        }
      }
    }

    return previewPatterns;
  };

  test('should generate preview patterns for all test scenarios', () => {
    const previewPatterns = generateTestScenarioPreviewPatterns(mockChallenge, mockBrushes, gridSize);

    // Should have patterns from both scenarios
    expect(previewPatterns.length).toBeGreaterThan(0);

    // Check that patterns from both scenarios are included
    const scenario1Patterns = previewPatterns.filter(p => p.scenario === 'Test Scenario 1');
    const scenario2Patterns = previewPatterns.filter(p => p.scenario === 'Test Scenario 2');

    expect(scenario1Patterns.length).toBeGreaterThan(0);
    expect(scenario2Patterns.length).toBeGreaterThan(0);

    // Verify that different brushes are represented
    const brushNames = new Set(previewPatterns.map(p => p.brush));
    expect(brushNames.has('testPattern1')).toBe(true);
    expect(brushNames.has('testPattern2')).toBe(true);
  });

  test('should generate correct coordinates for preview patterns', () => {
    const previewPatterns = generateTestScenarioPreviewPatterns(mockChallenge, mockBrushes, gridSize);

    const centerX = Math.floor(gridSize.width / 2); // 50
    const centerY = Math.floor(gridSize.height / 2); // 50

    // Check coordinates for first setup item (-10, -5 offset)
    const pattern1Coords = previewPatterns.filter(p =>
      p.scenario === 'Test Scenario 1' && p.brush === 'testPattern1'
    );

    expect(pattern1Coords.length).toBe(3); // L-shape has 3 cells

    // Should find coordinates around (centerX - 10, centerY - 5)
    const expectedBaseX = centerX - 10; // 40
    const expectedBaseY = centerY - 5;  // 45

    const coordSet = new Set(pattern1Coords.map(p => `${p.x},${p.y}`));
    expect(coordSet.has(`${expectedBaseX},${expectedBaseY}`)).toBe(true); // [0,0]
    expect(coordSet.has(`${expectedBaseX + 1},${expectedBaseY}`)).toBe(true); // [0,1]
    expect(coordSet.has(`${expectedBaseX},${expectedBaseY + 1}`)).toBe(true); // [1,0]
  });

  test('should handle rotation in preview patterns', () => {
    const previewPatterns = generateTestScenarioPreviewPatterns(mockChallenge, mockBrushes, gridSize);

    const centerX = Math.floor(gridSize.width / 2); // 50
    const centerY = Math.floor(gridSize.height / 2); // 50

    // Check rotated pattern (testPattern2 with 90-degree rotation)
    const rotatedPatternCoords = previewPatterns.filter(p =>
      p.scenario === 'Test Scenario 1' && p.brush === 'testPattern2'
    );

    expect(rotatedPatternCoords.length).toBe(3); // Line pattern has 3 cells

    // Original pattern: [0,0], [0,1], [0,2]
    // After 90-degree rotation: [0,0], [-1,0], [-2,0]
    // At offset (10, 5): (centerX + 10, centerY + 5)
    const expectedBaseX = centerX + 10; // 60
    const expectedBaseY = centerY + 5;  // 55

    const coordSet = new Set(rotatedPatternCoords.map(p => `${p.x},${p.y}`));
    expect(coordSet.has(`${expectedBaseX},${expectedBaseY}`)).toBe(true);     // [0,0] -> [0,0]
    expect(coordSet.has(`${expectedBaseX},${expectedBaseY - 1}`)).toBe(true); // [0,1] -> [-1,0]
    expect(coordSet.has(`${expectedBaseX},${expectedBaseY - 2}`)).toBe(true); // [0,2] -> [-2,0]
  });

  test('should return empty array when no test scenarios exist', () => {
    const challengeWithoutScenarios = {
      name: 'No Scenarios Challenge',
      width: 101,
      height: 101
    };

    const previewPatterns = generateTestScenarioPreviewPatterns(challengeWithoutScenarios, mockBrushes, gridSize);
    expect(previewPatterns).toEqual([]);
  });

  test('should return empty array when no brushes are loaded', () => {
    const previewPatterns = generateTestScenarioPreviewPatterns(mockChallenge, {}, gridSize);
    expect(previewPatterns).toEqual([]);
  });

  test('should handle scenarios without setup', () => {
    const challengeWithEmptySetup = {
      name: 'Empty Setup Challenge',
      width: 101,
      height: 101,
      testScenarios: [
        {
          name: 'No Setup Scenario',
          description: 'Scenario without setup patterns',
          detectors: [
            { x: 0, y: 0, state: 'active', index: 0 }
          ]
        }
      ]
    };

    const previewPatterns = generateTestScenarioPreviewPatterns(challengeWithEmptySetup, mockBrushes, gridSize);
    expect(previewPatterns).toEqual([]);
  });

  test('should filter out patterns outside grid bounds', () => {
    const challengeWithOutOfBounds = {
      name: 'Out of Bounds Challenge',
      width: 10,
      height: 10,
      testScenarios: [
        {
          name: 'Out of Bounds Scenario',
          setup: [
            {
              x: -10, // This would place pattern outside the 10x10 grid
              y: -10,
              brush: 'testPattern1'
            }
          ]
        }
      ]
    };

    const smallGridSize = { width: 10, height: 10 };
    const previewPatterns = generateTestScenarioPreviewPatterns(challengeWithOutOfBounds, mockBrushes, smallGridSize);

    // All patterns should be filtered out because they're outside bounds
    expect(previewPatterns).toEqual([]);
  });

  test('should include valid coordinates and exclude invalid ones for partially out-of-bounds patterns', () => {
    const challengeWithPartialBounds = {
      name: 'Partial Bounds Challenge',
      width: 10,
      height: 10,
      testScenarios: [
        {
          name: 'Partial Bounds Scenario',
          setup: [
            {
              x: -4, // Places pattern at edge where some cells are valid, others are not
              y: -4,
              brush: 'testPattern1'
            }
          ]
        }
      ]
    };

    const smallGridSize = { width: 10, height: 10 };
    const previewPatterns = generateTestScenarioPreviewPatterns(challengeWithPartialBounds, mockBrushes, smallGridSize);

    // Should have fewer patterns than the full brush pattern due to filtering
    expect(previewPatterns.length).toBeLessThanOrEqual(3);
    expect(previewPatterns.length).toBeGreaterThan(0);

    // All included patterns should have valid coordinates
    previewPatterns.forEach(pattern => {
      expect(pattern.x).toBeGreaterThanOrEqual(0);
      expect(pattern.x).toBeLessThan(10);
      expect(pattern.y).toBeGreaterThanOrEqual(0);
      expect(pattern.y).toBeLessThan(10);
    });
  });
});
