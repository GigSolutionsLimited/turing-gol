// Challenge service for loading, saving, and managing challenges
import { STORAGE_KEYS } from '../constants/gameConstants.js';
import { decodeRLE, decodeMultiplePatterns } from '../utils/rleUtils.js';

/**
 * Service for managing challenges and exercise data
 */
export class ChallengeService {
  /**
   * Discover available challenge files from the challenges directory
   * @returns {Promise<string[]>} Array of available challenge filenames
   */
  static async discoverChallengeFiles() {
    // Try to fetch a challenge manifest file first (optional optimization)
    try {
      const manifestResponse = await fetch('/challenges/manifest.json');
      if (manifestResponse.ok) {
        const manifest = await manifestResponse.json();
        if (manifest.challenges && Array.isArray(manifest.challenges)) {
          return manifest.challenges;
        }
      }
    } catch {
      // Manifest doesn't exist, fall back to discovery
    }

    // Fallback: probe for challenge files
    // Since only challenge files will be in the directory, we can check common patterns

    // Check for numbered challenge files (1.json, 2.json, etc.)
    const maxChallenges = 20; // Check up to 20 challenges
    const promises = [];

    for (let i = 1; i <= maxChallenges; i++) {
      const fileName = `${i}.json`;
      const promise = fetch(`/challenges/${fileName}`, { method: 'HEAD' })
        .then(response => response.ok ? fileName : null)
        .catch(() => null);
      promises.push(promise);
    }

    const results = await Promise.all(promises);
    return results.filter(Boolean);
  }

  /**
   * Load available challenges metadata
   * @returns {Promise<Array>} Array of challenge metadata
   */
  static async loadAvailableChallenges() {
    const challenges = [];
    const challengeFiles = await ChallengeService.discoverChallengeFiles();

    for (const fileName of challengeFiles) {
      try {
        const response = await fetch(`/challenges/${fileName}`);
        if (response.ok) {
          const challengeData = await response.json();
          // Extract ID from filename (e.g., "1.json" -> 1)
          const idMatch = fileName.match(/^(\d+)\.json$/);
          const id = idMatch ? parseInt(idMatch[1], 10) : fileName;

          challenges.push({
            id,
            name: challengeData.name || `${id}. Unknown`,
            ...challengeData
          });
        }
      } catch (error) {
        console.warn(`Failed to load challenge ${fileName}:`, error);
      }
    }

    // Sort challenges by ID to ensure consistent ordering
    return challenges.sort((a, b) => {
      if (typeof a.id === 'number' && typeof b.id === 'number') {
        return a.id - b.id;
      }
      return String(a.id).localeCompare(String(b.id));
    });
  }

  /**
   * Load a specific challenge from localStorage or file
   * @param {string} exercise - Exercise name (e.g., "1. Basics")
   * @param {boolean} forceReload - Whether to force reload from file
   * @returns {Promise<Object|null>} Challenge data or null if not found
   */
  static async loadChallenge(exercise, forceReload = false) {
    try {
      // Extract exercise number
      const exerciseMatch = exercise.match(/^(\d+)\./);
      if (!exerciseMatch) {
        return null;
      }

      const exerciseNumber = exerciseMatch[1];
      const storageKey = `${STORAGE_KEYS.CHALLENGE_PREFIX}${exerciseNumber}`;

      // Check localStorage first (unless forcing reload)
      if (!forceReload) {
        const localData = localStorage.getItem(storageKey);
        if (localData) {
          try {
            const parsed = JSON.parse(localData);

            // Smart cache invalidation: Check if localStorage data has a different structure
            // than what we expect (e.g., missing testScenarios or changed setup)
            // To detect this, we'll fetch the actual file and compare
            const response = await fetch(`/challenges/${exerciseNumber}.json`);
            if (response.ok) {
              const jsonData = await response.json();

              let needsInvalidation = false;
              let reason = '';

              // Check if the JSON file has test scenarios but cached data doesn't
              if (jsonData.testScenarios && jsonData.testScenarios.length > 0 &&
                  (!parsed.testScenarios || parsed.testScenarios.length === 0)) {
                needsInvalidation = true;
                reason = 'missing test scenarios';
              }

              // Check if setup array length has changed
              const jsonSetupLength = jsonData.setup?.length || 0;
              const cachedSetupLength = parsed.setup?.length || 0;
              if (jsonSetupLength !== cachedSetupLength) {
                needsInvalidation = true;
                reason = `setup length changed (${cachedSetupLength} -> ${jsonSetupLength})`;
              }

              // Check if test scenarios length has changed
              const jsonTestLength = jsonData.testScenarios?.length || 0;
              const cachedTestLength = parsed.testScenarios?.length || 0;
              if (jsonTestLength !== cachedTestLength) {
                needsInvalidation = true;
                reason = `test scenarios length changed (${cachedTestLength} -> ${jsonTestLength})`;
              }

              if (needsInvalidation) {
                console.log(`🔧 Cache invalidation: Reloading level ${exerciseNumber} from file due to ${reason}`);
                localStorage.setItem(storageKey, JSON.stringify(jsonData));
                return this.processChallengeData(jsonData);
              }

              // If cached data seems valid, use it
              console.log(`✅ Using cached data for ${exerciseNumber}:`, {
                hasTestScenarios: !!(parsed.testScenarios && parsed.testScenarios.length > 0),
                testScenariosLength: parsed.testScenarios?.length || 0,
                setupLength: parsed.setup?.length || 0
              });
              return this.processChallengeData(parsed);
            }

            // If fetch failed, use cached data anyway
            return this.processChallengeData(parsed);
          } catch (error) {
            console.warn(`Failed to parse localStorage data for exercise ${exerciseNumber}:`, error);
          }
        }
      }

      // Load from JSON file
      const response = await fetch(`/challenges/${exerciseNumber}.json`);
      if (response.ok) {
        const jsonData = await response.json();

        console.log(`📥 Loaded fresh data for ${exerciseNumber} from JSON file:`, {
          hasTestScenarios: !!(jsonData.testScenarios && jsonData.testScenarios.length > 0),
          testScenariosLength: jsonData.testScenarios?.length || 0
        });

        // Save original data to localStorage
        localStorage.setItem(storageKey, JSON.stringify(jsonData));

        return this.processChallengeData(jsonData);
      }

      return null;
    } catch (error) {
      console.error(`Error loading challenge for ${exercise}:`, error);
      return null;
    }
  }

  /**
   * Process raw challenge data and apply defaults
   * @param {Object} rawData - Raw challenge data from JSON
   * @returns {Object} Processed challenge data
   */
  static processChallengeData(rawData) {
    // Handle multiple patterns, single RLE, or coordinate patterns
    let pattern;
    if (rawData.patterns) {
      pattern = decodeMultiplePatterns(rawData.patterns);
    } else if (rawData.rle) {
      pattern = decodeRLE(rawData.rle);
    } else {
      pattern = rawData.pattern || [];
    }

    return {
      name: rawData.name,
      pattern,
      setup: rawData.setup || [],
      targetTurn: rawData.targetTurn || 150,
      editableSpace: rawData.editableSpace || null,
      width: rawData.width || 50,
      height: rawData.height || 50,
      brushes: rawData.brushes || [],
      detectorFalloffPeriod: rawData.detectorFalloffPeriod || 10,
      detectors: rawData.detectors || [],
      description: rawData.description || '',
      testScenarios: rawData.testScenarios || [],
      solution: rawData.solution || []
    };
  }

  /**
   * Save challenge data to localStorage
   * @param {string} exerciseNumber - Exercise number
   * @param {Object} challengeData - Challenge data to save
   */
  static saveChallengeToStorage(exerciseNumber, challengeData) {
    try {
      const storageKey = `${STORAGE_KEYS.CHALLENGE_PREFIX}${exerciseNumber}`;
      localStorage.setItem(storageKey, JSON.stringify(challengeData));
    } catch (error) {
      console.error(`Failed to save challenge ${exerciseNumber} to localStorage:`, error);
    }
  }

  /**
   * Clear challenge data from localStorage
   * @param {string} exerciseNumber - Exercise number
   */
  static clearChallengeFromStorage(exerciseNumber) {
    try {
      const storageKey = `${STORAGE_KEYS.CHALLENGE_PREFIX}${exerciseNumber}`;
      localStorage.removeItem(storageKey);
      console.log(`🗑️ Cleared cache for challenge ${exerciseNumber}`);
    } catch (error) {
      console.error(`Failed to clear challenge ${exerciseNumber} from localStorage:`, error);
    }
  }

  /**
   * Clear all challenge caches from localStorage
   */
  static clearAllChallengeCaches() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.CHALLENGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️ Cleared ${keysToRemove.length} challenge caches`);
      return keysToRemove.length;
    } catch (error) {
      console.error('Failed to clear all challenge caches:', error);
      return 0;
    }
  }
}
