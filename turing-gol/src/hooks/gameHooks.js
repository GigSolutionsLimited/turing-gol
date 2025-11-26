import { useState, useEffect, useCallback } from 'react';
import { BrushService } from '../services/brushService.js';
import { DetectorService } from '../services/detectorService.js';
import { getCenterOffsets } from '../utils/canvasUtils.js';


// Hook to manage brush loading
export const useBrushes = () => {
  const [brushes, setBrushes] = useState({});
  const [brushesLoaded, setBrushesLoaded] = useState(false);

  useEffect(() => {
    const initializeBrushes = async () => {
      if (!brushesLoaded) {
        const loadedBrushes = await BrushService.loadAllBrushes();
        setBrushes(loadedBrushes);
        setBrushesLoaded(true);
      }
    };

    initializeBrushes();
  }, []); // Empty dependency array - only run once on mount

  return { brushes, brushesLoaded };
};

// Hook to manage level completion checking
export const useLevelCompletion = () => {
  const checkLevelCompletion = useCallback((currentGrid, currentGeneration, challenge, levelCompleted, levelFailed, detectors = [], testResultsRef = null) => {
    if (!challenge || levelCompleted || levelFailed) return { completed: false, failed: false };

    // Add error handling for malformed challenge data
    if (!challenge.targetTurn || typeof challenge.targetTurn !== 'number') {
      return { completed: false, failed: false };
    }

    const targetTurn = challenge.targetTurn;

    // Check if we've reached or passed the target turn
    if (currentGeneration < targetTurn) return { completed: false, failed: false };

    // Check if challenge has test scenarios
    const hasTestScenarios = challenge.testScenarios && Array.isArray(challenge.testScenarios) && challenge.testScenarios.length > 0;

    if (hasTestScenarios) {
      // If there are test scenarios, level completion requires all tests to pass
      // The test results should be available in the testResultsRef if tests have been run
      if (testResultsRef && testResultsRef.current) {
        const testResults = testResultsRef.current;

        if (currentGeneration === targetTurn) {
          // At target turn - check test results
          if (testResults.allPassed) {
            return { completed: true, failed: false, testBased: true };
          } else {
            return { completed: false, failed: true, testBased: true, testMessage: testResults.message };
          }
        } else if (currentGeneration > targetTurn) {
          // Past target turn - if we haven't run tests yet, that's a failure
          // If tests were run and failed, that's also a failure
          if (!testResults.allPassed) {
            return { completed: false, failed: true, testBased: true, testMessage: testResults.message };
          }
        }
      } else if (currentGeneration >= targetTurn) {
        // No test results available yet at target turn - trigger test execution
        return { completed: false, failed: false, needsTestExecution: true };
      }

      return { completed: false, failed: false };
    }

    // Original logic for challenges without test scenarios
    // Determine challenge type and check win condition accordingly
    const hasPatternChallenge = challenge.pattern && Array.isArray(challenge.pattern) && challenge.pattern.length > 0;
    const hasDetectorChallenge = challenge.detectors && Array.isArray(challenge.detectors) && challenge.detectors.length > 0;

    let patternComplete = true;
    let detectorsComplete = true;

    // Check pattern-based win condition (if applicable)
    if (hasPatternChallenge) {
      const { centerOffsetX, centerOffsetY } = getCenterOffsets(currentGrid);

      // Check if all challenge pixels are both alive and match the pattern (green)
      let allGreen = true;
      let aliveCount = 0;
      let totalPixels = 0;

      for (const coord of challenge.pattern) {
        // Validate coordinate format
        if (!Array.isArray(coord) || coord.length !== 2 ||
            typeof coord[0] !== 'number' || typeof coord[1] !== 'number') {
          continue;
        }

        const [dy, dx] = coord;
        const ny = centerOffsetY + dy;
        const nx = centerOffsetX + dx;
        if (ny >= 0 && ny < currentGrid.length && nx >= 0 && nx < currentGrid[0].length) {
          totalPixels++;
          if (currentGrid[ny][nx]) {
            aliveCount++;
          } else {
            allGreen = false;
          }
        }
      }

      patternComplete = allGreen;
    }

    // Check detector-based win condition (if applicable)
    if (hasDetectorChallenge) {
      detectorsComplete = DetectorService.checkDetectorWinCondition(detectors);
    }

    // If neither challenge type is present, default to success for backwards compatibility
    const challengeComplete = (!hasPatternChallenge || patternComplete) && (!hasDetectorChallenge || detectorsComplete);

    if (currentGeneration === targetTurn) {
      // Exactly at target turn - check for success or failure
      if (challengeComplete) {
        return { completed: true, failed: false };
      } else {
        return { completed: false, failed: true };
      }
    } else if (currentGeneration > targetTurn && !levelCompleted && !levelFailed) {
      // Past target turn and haven't succeeded yet - failure
      return { completed: false, failed: true };
    }

    return { completed: false, failed: false };
  }, []);

  return { checkLevelCompletion };
};

// Hook to manage targets for admin mode
export const useTargets = (adminMode) => {
  const [targets, setTargets] = useState([]);

  // Helper to load targets from localStorage
  const loadTargets = useCallback(() => {
    try {
      const storedTargets = localStorage.getItem('challengeTargets');
      const loaded = storedTargets ? JSON.parse(storedTargets) : [];

      // Validate that loaded data is an array
      if (!Array.isArray(loaded)) {
        setTargets([]);
        return;
      }

      setTargets([...loaded]); // Always set a new array reference
    } catch (error) {
      setTargets([]); // Fallback to empty array
    }
  }, []);

  // Load targets on mount and when adminMode changes
  useEffect(() => {
    if (adminMode) {
      loadTargets();
    }
  }, [adminMode, loadTargets]);

  return { targets, loadTargets };
};
