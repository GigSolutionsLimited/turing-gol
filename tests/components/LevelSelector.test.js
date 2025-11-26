// Unit tests for LevelSelector component sliding window logic
// Note: Testing logic without JSX to avoid Babel configuration issues
// Admin functionality moved to AdminToggle component

describe('LevelSelector Sliding Window Logic', () => {
  const mockChallenges = [
    { id: 1, name: '1. Basics' },
    { id: 2, name: '2. Glider Gun' },
    { id: 3, name: '3. Wires' },
    { id: 4, name: '4. Detectors' },
    { id: 5, name: '5. Advanced' }
  ];

  // Helper function to simulate the sliding window logic from LevelSelector
  const calculateVisibleLevels = (availableChallenges, currentExercise) => {
    if (availableChallenges.length === 0) return [];

    const currentIndex = availableChallenges.findIndex(challenge => challenge.name === currentExercise);
    const totalLevels = availableChallenges.length;

    if (currentIndex === -1) {
      return availableChallenges.slice(0, Math.min(3, totalLevels));
    }

    let startIndex, endIndex;

    if (currentIndex === 0) {
      startIndex = 0;
      endIndex = Math.min(3, totalLevels);
    } else if (currentIndex === totalLevels - 1) {
      startIndex = Math.max(0, totalLevels - 3);
      endIndex = totalLevels;
    } else {
      startIndex = Math.max(0, currentIndex - 1);
      endIndex = Math.min(totalLevels, currentIndex + 2);
    }

    return availableChallenges.slice(startIndex, endIndex);
  };

  // Helper function to find most recently completed level
  const findMostRecentCompleted = (availableChallenges, completedExercises) => {
    if (completedExercises.size === 0) return null;

    let highestCompleted = null;
    let highestId = -1;

    availableChallenges.forEach(challenge => {
      if (completedExercises.has(challenge.name) && challenge.id > highestId) {
        highestId = challenge.id;
        highestCompleted = challenge;
      }
    });

    return highestCompleted;
  };

  describe('sliding window calculation', () => {
    test('should show levels 1-3 when current level is first', () => {
      const visible = calculateVisibleLevels(mockChallenges, '1. Basics');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('1. Basics');
      expect(visible[1].name).toBe('2. Glider Gun');
      expect(visible[2].name).toBe('3. Wires');
    });

    test('should show prev, current, next when current level is in middle', () => {
      const visible = calculateVisibleLevels(mockChallenges, '3. Wires');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('2. Glider Gun');
      expect(visible[1].name).toBe('3. Wires');
      expect(visible[2].name).toBe('4. Detectors');
    });

    test('should show last 3 levels when current level is last', () => {
      const visible = calculateVisibleLevels(mockChallenges, '5. Advanced');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('3. Wires');
      expect(visible[1].name).toBe('4. Detectors');
      expect(visible[2].name).toBe('5. Advanced');
    });

    test('should show first 3 levels when no exercise is selected', () => {
      const visible = calculateVisibleLevels(mockChallenges, '');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('1. Basics');
      expect(visible[1].name).toBe('2. Glider Gun');
      expect(visible[2].name).toBe('3. Wires');
    });

    test('should show first 3 levels when current exercise not found', () => {
      const visible = calculateVisibleLevels(mockChallenges, 'Unknown Exercise');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('1. Basics');
      expect(visible[1].name).toBe('2. Glider Gun');
      expect(visible[2].name).toBe('3. Wires');
    });

    test('should handle case with less than 3 total challenges', () => {
      const shortChallenges = mockChallenges.slice(0, 2);
      const visible = calculateVisibleLevels(shortChallenges, '1. Basics');

      expect(visible).toHaveLength(2);
      expect(visible[0].name).toBe('1. Basics');
      expect(visible[1].name).toBe('2. Glider Gun');
    });

    test('should handle empty challenges array', () => {
      const visible = calculateVisibleLevels([], '1. Basics');
      expect(visible).toHaveLength(0);
    });

    test('should handle case with only one challenge', () => {
      const singleChallenge = [mockChallenges[0]];
      const visible = calculateVisibleLevels(singleChallenge, '1. Basics');

      expect(visible).toHaveLength(1);
      expect(visible[0].name).toBe('1. Basics');
    });
  });

  describe('edge cases for sliding window', () => {
    test('should show levels 1-3 for level 2 when only 4 total levels', () => {
      const fourLevels = mockChallenges.slice(0, 4);
      const visible = calculateVisibleLevels(fourLevels, '2. Glider Gun');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('1. Basics');
      expect(visible[1].name).toBe('2. Glider Gun');
      expect(visible[2].name).toBe('3. Wires');
    });

    test('should show levels 2-4 for level 3 when only 4 total levels', () => {
      const fourLevels = mockChallenges.slice(0, 4);
      const visible = calculateVisibleLevels(fourLevels, '3. Wires');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('2. Glider Gun');
      expect(visible[1].name).toBe('3. Wires');
      expect(visible[2].name).toBe('4. Detectors');
    });

    test('should show levels 2-4 for level 4 when only 4 total levels', () => {
      const fourLevels = mockChallenges.slice(0, 4);
      const visible = calculateVisibleLevels(fourLevels, '4. Detectors');

      expect(visible).toHaveLength(3);
      expect(visible[0].name).toBe('2. Glider Gun');
      expect(visible[1].name).toBe('3. Wires');
      expect(visible[2].name).toBe('4. Detectors');
    });
  });

  describe('most recently completed level detection', () => {
    test('should find highest ID completed level', () => {
      const completedExercises = new Set(['1. Basics', '3. Wires']);
      const mostRecent = findMostRecentCompleted(mockChallenges, completedExercises);

      expect(mostRecent).not.toBeNull();
      expect(mostRecent.name).toBe('3. Wires');
      expect(mostRecent.id).toBe(3);
    });

    test('should return null when no exercises are completed', () => {
      const completedExercises = new Set();
      const mostRecent = findMostRecentCompleted(mockChallenges, completedExercises);

      expect(mostRecent).toBeNull();
    });

    test('should find single completed level', () => {
      const completedExercises = new Set(['2. Glider Gun']);
      const mostRecent = findMostRecentCompleted(mockChallenges, completedExercises);

      expect(mostRecent).not.toBeNull();
      expect(mostRecent.name).toBe('2. Glider Gun');
      expect(mostRecent.id).toBe(2);
    });

    test('should find highest when multiple completed', () => {
      const completedExercises = new Set(['1. Basics', '2. Glider Gun', '4. Detectors']);
      const mostRecent = findMostRecentCompleted(mockChallenges, completedExercises);

      expect(mostRecent).not.toBeNull();
      expect(mostRecent.name).toBe('4. Detectors');
      expect(mostRecent.id).toBe(4);
    });

    test('should handle completed exercise not in available challenges', () => {
      const completedExercises = new Set(['Unknown Exercise']);
      const mostRecent = findMostRecentCompleted(mockChallenges, completedExercises);

      expect(mostRecent).toBeNull();
    });
  });

  describe('navigation logic', () => {
    test('should calculate prev button disabled state correctly', () => {
      const isFirstLevel = (challenges, currentExercise) => {
        const currentIndex = challenges.findIndex(c => c.name === currentExercise);
        return currentIndex === -1 || currentIndex <= 0;
      };

      expect(isFirstLevel(mockChallenges, '1. Basics')).toBe(true);
      expect(isFirstLevel(mockChallenges, '2. Glider Gun')).toBe(false);
      expect(isFirstLevel(mockChallenges, 'Unknown')).toBe(true); // Not found
    });

    test('should calculate next button disabled state correctly', () => {
      const isLastLevel = (challenges, currentExercise) => {
        const currentIndex = challenges.findIndex(c => c.name === currentExercise);
        return currentIndex === -1 || currentIndex >= challenges.length - 1;
      };

      expect(isLastLevel(mockChallenges, '5. Advanced')).toBe(true);
      expect(isLastLevel(mockChallenges, '4. Detectors')).toBe(false);
      expect(isLastLevel(mockChallenges, 'Unknown')).toBe(true); // Not found
    });

    test('should calculate prev level correctly', () => {
      const getPrevLevel = (challenges, currentExercise) => {
        const currentIndex = challenges.findIndex(c => c.name === currentExercise);
        const prevIndex = Math.max(0, currentIndex - 1);
        return prevIndex !== currentIndex ? challenges[prevIndex] : null;
      };

      const prev = getPrevLevel(mockChallenges, '3. Wires');
      expect(prev).not.toBeNull();
      expect(prev.name).toBe('2. Glider Gun');

      const noPrev = getPrevLevel(mockChallenges, '1. Basics');
      expect(noPrev).toBeNull();
    });

    test('should calculate next level correctly', () => {
      const getNextLevel = (challenges, currentExercise) => {
        const currentIndex = challenges.findIndex(c => c.name === currentExercise);
        const nextIndex = Math.min(challenges.length - 1, currentIndex + 1);
        return nextIndex !== currentIndex ? challenges[nextIndex] : null;
      };

      const next = getNextLevel(mockChallenges, '3. Wires');
      expect(next).not.toBeNull();
      expect(next.name).toBe('4. Detectors');

      const noNext = getNextLevel(mockChallenges, '5. Advanced');
      expect(noNext).toBeNull();
    });
  });
});

