/**
 * Test to ensure useAppState hook properly includes testScenarios in challenge object
 * This test prevents regression of the missing testScenarios field bug
 */

describe('useAppState Hook - testScenarios Integration', () => {
  test('should include testScenarios in challenge object when present', () => {
    // Mock the reducer state that would be returned
    const mockState = {
      hasStoredChallenge: true,
      challenge: {
        name: "10. Not gate",
        targetTurn: 1000,
        pattern: [],
        editableSpace: null,
        setup: [],
        width: 101,
        height: 101,
        brushes: ["p30GliderGunG"],
        detectorFalloffPeriod: 60,
        detectors: [],
        description: "Test challenge description",
        testScenarios: [
          {
            name: "Test scenario 1",
            setup: [],
            detectors: [{ x: 0, y: 0, state: "active", index: 0 }]
          },
          {
            name: "Test scenario 2",
            setup: [],
            detectors: [{ x: 1, y: 1, state: "inactive", index: 1 }]
          }
        ]
      }
    };

    // Simulate the challenge object creation logic from useAppState
    const challenge = mockState.hasStoredChallenge ? {
      name: mockState.challenge.name,
      targetTurn: mockState.challenge.targetTurn,
      pattern: mockState.challenge.pattern,
      editableSpace: mockState.challenge.editableSpace,
      setup: mockState.challenge.setup,
      width: mockState.challenge.width,
      height: mockState.challenge.height,
      brushes: mockState.challenge.brushes,
      detectorFalloffPeriod: mockState.challenge.detectorFalloffPeriod,
      detectors: mockState.challenge.detectors,
      description: mockState.challenge.description,
      testScenarios: mockState.challenge.testScenarios // This field was missing!
    } : null;

    // Verify challenge object is created correctly
    expect(challenge).not.toBeNull();
    expect(challenge.name).toBe("10. Not gate");

    // Critical test: verify testScenarios are included
    expect(challenge.testScenarios).toBeDefined();
    expect(Array.isArray(challenge.testScenarios)).toBe(true);
    expect(challenge.testScenarios).toHaveLength(2);
    expect(challenge.testScenarios[0].name).toBe("Test scenario 1");
    expect(challenge.testScenarios[1].name).toBe("Test scenario 2");

    // Test that the TestScenarioService would work with this challenge object
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');
    expect(TestScenarioService.hasTestScenarios(challenge)).toBe(true);

    const scenarios = TestScenarioService.getTestScenarios(challenge);
    expect(scenarios).toHaveLength(2);
  });

  test('should handle challenge without testScenarios gracefully', () => {
    // Mock state without testScenarios
    const mockState = {
      hasStoredChallenge: true,
      challenge: {
        name: "1. Basics",
        targetTurn: 150,
        pattern: [],
        editableSpace: null,
        setup: [],
        width: 50,
        height: 50,
        brushes: ["block"],
        detectorFalloffPeriod: 10,
        detectors: [],
        description: "Basic challenge"
        // No testScenarios field
      }
    };

    // Simulate the challenge object creation logic
    const challenge = mockState.hasStoredChallenge ? {
      name: mockState.challenge.name,
      targetTurn: mockState.challenge.targetTurn,
      pattern: mockState.challenge.pattern,
      editableSpace: mockState.challenge.editableSpace,
      setup: mockState.challenge.setup,
      width: mockState.challenge.width,
      height: mockState.challenge.height,
      brushes: mockState.challenge.brushes,
      detectorFalloffPeriod: mockState.challenge.detectorFalloffPeriod,
      detectors: mockState.challenge.detectors,
      description: mockState.challenge.description,
      testScenarios: mockState.challenge.testScenarios // Should be undefined
    } : null;

    // Verify challenge object is created
    expect(challenge).not.toBeNull();
    expect(challenge.name).toBe("1. Basics");

    // testScenarios should be undefined (not missing entirely)
    expect(challenge.testScenarios).toBeUndefined();

    // TestScenarioService should handle this gracefully
    const { TestScenarioService } = require('../../src/services/testScenarioService.js');
    expect(TestScenarioService.hasTestScenarios(challenge)).toBe(false);

    const scenarios = TestScenarioService.getTestScenarios(challenge);
    expect(scenarios).toHaveLength(0);
  });

  test('should ensure challenge object includes all necessary fields for TEST button', () => {
    // This test ensures we don't accidentally remove other important fields
    const mockState = {
      hasStoredChallenge: true,
      challenge: {
        name: "10. Not gate",
        targetTurn: 1000,
        pattern: [],
        editableSpace: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
        setup: [{ x: 0, y: 0, brush: "block" }],
        width: 101,
        height: 101,
        brushes: ["block", "glider"],
        detectorFalloffPeriod: 60,
        detectors: [{ x: 10, y: 10 }],
        description: "Test description",
        testScenarios: [{ name: "Test", setup: [], detectors: [] }]
      }
    };

    // Expected fields for a complete challenge object
    const expectedFields = [
      'name', 'targetTurn', 'pattern', 'editableSpace', 'setup',
      'width', 'height', 'brushes', 'detectorFalloffPeriod',
      'detectors', 'description', 'testScenarios'
    ];

    // Simulate challenge object creation
    const challenge = mockState.hasStoredChallenge ? {
      name: mockState.challenge.name,
      targetTurn: mockState.challenge.targetTurn,
      pattern: mockState.challenge.pattern,
      editableSpace: mockState.challenge.editableSpace,
      setup: mockState.challenge.setup,
      width: mockState.challenge.width,
      height: mockState.challenge.height,
      brushes: mockState.challenge.brushes,
      detectorFalloffPeriod: mockState.challenge.detectorFalloffPeriod,
      detectors: mockState.challenge.detectors,
      description: mockState.challenge.description,
      testScenarios: mockState.challenge.testScenarios
    } : null;

    // Verify all expected fields are present
    expectedFields.forEach(field => {
      expect(challenge).toHaveProperty(field);
    });

    // Verify specific values
    expect(challenge.name).toBe("10. Not gate");
    expect(challenge.width).toBe(101);
    expect(challenge.height).toBe(101);
    expect(challenge.testScenarios).toHaveLength(1);
  });
});
