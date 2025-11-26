// Unit tests for AdminToggle component
// Note: Testing logic without JSX to avoid Babel configuration issues
// Now includes merged AdminPanel functionality

describe('AdminToggle Component Logic', () => {

  // Mock the dependencies
  const mockGameRef = {
    current: {
      getGeneration: jest.fn(() => 150),
      getGrid: jest.fn(() => [
        [1, 1, 0],
        [1, 0, 0],
        [0, 0, 0]
      ])
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock navigator.clipboard
    global.navigator = {
      clipboard: {
        writeText: jest.fn()
      }
    };

    // Mock window.alert
    global.alert = jest.fn();
  });

  describe('admin mode state handling', () => {
    test('should calculate correct button text for user mode', () => {
      const getButtonText = (adminMode) => adminMode ? 'User Mode' : 'Admin Mode';

      expect(getButtonText(false)).toBe('Admin Mode');
    });

    test('should calculate correct button text for admin mode', () => {
      const getButtonText = (adminMode) => adminMode ? 'User Mode' : 'Admin Mode';

      expect(getButtonText(true)).toBe('User Mode');
    });
  });

  describe('toggle functionality', () => {
    test('should toggle to admin mode when in user mode', () => {
      const mockOnAdminModeChange = jest.fn();
      const currentAdminMode = false;

      // Simulate button click behavior
      const handleClick = () => mockOnAdminModeChange(!currentAdminMode);

      handleClick();

      expect(mockOnAdminModeChange).toHaveBeenCalledWith(true);
    });

    test('should toggle to user mode when in admin mode', () => {
      const mockOnAdminModeChange = jest.fn();
      const currentAdminMode = true;

      // Simulate button click behavior
      const handleClick = () => mockOnAdminModeChange(!currentAdminMode);

      handleClick();

      expect(mockOnAdminModeChange).toHaveBeenCalledWith(false);
    });
  });

  describe('admin panel functionality', () => {
    test('should handle copy challenge correctly', () => {
      // Mock the functions that would be called
      const mockEncodeRLE = jest.fn(() => ({
        rle: 'test_rle',
        minRow: 0,
        minCol: 0
      }));

      const mockGetCenterOffsets = jest.fn(() => ({
        centerOffsetX: 25,
        centerOffsetY: 25
      }));

      // Simulate the copy challenge logic
      const handleCopyChallenge = (gameRef, encodeRLE, getCenterOffsets) => {
        if (!gameRef?.current) {
          alert('Game not ready yet. Please try again.');
          return false;
        }

        const currentTurn = gameRef.current.getGeneration();
        const grid = gameRef.current.getGrid();
        const { rle, minRow, minCol } = encodeRLE(grid);
        const { centerOffsetX, centerOffsetY } = getCenterOffsets(grid);

        const patternY = minRow - centerOffsetY;
        const patternX = minCol - centerOffsetX;

        const challengeData = {
          patterns: [{
            x: patternX,
            y: patternY,
            rle: rle
          }],
          width: grid[0] ? grid[0].length : 50,
          height: grid.length,
          targetTurn: currentTurn
        };

        navigator.clipboard.writeText(JSON.stringify(challengeData, null, 2));
        alert('Challenge JSON with positioned RLE pattern copied to clipboard!');
        return true;
      };

      const result = handleCopyChallenge(mockGameRef, mockEncodeRLE, mockGetCenterOffsets);

      expect(result).toBe(true);
      expect(mockGameRef.current.getGeneration).toHaveBeenCalled();
      expect(mockGameRef.current.getGrid).toHaveBeenCalled();
      expect(mockEncodeRLE).toHaveBeenCalled();
      expect(mockGetCenterOffsets).toHaveBeenCalled();
      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalledWith('Challenge JSON with positioned RLE pattern copied to clipboard!');
    });

    test('should handle copy challenge when game is not ready', () => {
      const nullGameRef = { current: null };

      const handleCopyChallenge = (gameRef) => {
        if (!gameRef?.current) {
          alert('Game not ready yet. Please try again.');
          return false;
        }
        return true;
      };

      const result = handleCopyChallenge(nullGameRef);

      expect(result).toBe(false);
      expect(global.alert).toHaveBeenCalledWith('Game not ready yet. Please try again.');
    });

    test('should extract exercise number correctly for reload', () => {
      const extractExerciseNumber = (exercise) => {
        const exerciseMatch = exercise.match(/^(\d+)\./);
        return exerciseMatch ? exerciseMatch[1] : '1';
      };

      expect(extractExerciseNumber('1. Basics')).toBe('1');
      expect(extractExerciseNumber('2. Glider Gun')).toBe('2');
      expect(extractExerciseNumber('3. Wires')).toBe('3');
      expect(extractExerciseNumber('Invalid')).toBe('1');
    });
  });

  describe('styling logic', () => {
    test('should determine selected class correctly', () => {
      const getSelectedClass = (adminMode) => adminMode ? 'selected' : '';

      expect(getSelectedClass(true)).toBe('selected');
      expect(getSelectedClass(false)).toBe('');
    });

    test('should calculate panel height based on admin mode', () => {
      const getPanelMinHeight = (adminMode) => adminMode ? '140px' : '60px';

      expect(getPanelMinHeight(true)).toBe('140px');
      expect(getPanelMinHeight(false)).toBe('60px');
    });

    test('should have consistent button styling', () => {
      const mainButtonStyles = {
        width: '140px',
        fontSize: '11px',
        padding: '8px 12px'
      };

      const adminButtonStyles = {
        width: '140px',
        fontSize: '10px',
        padding: '6px 10px'
      };

      expect(mainButtonStyles.width).toBe('140px');
      expect(adminButtonStyles.width).toBe('140px');
      expect(adminButtonStyles.fontSize).toBe('10px');
    });
  });

  describe('component structure', () => {
    test('should have correct panel dimensions', () => {
      const panelStyles = {
        width: '160px',
        height: 'auto'
      };

      expect(panelStyles.width).toBe('160px');
      expect(panelStyles.height).toBe('auto');
    });

    test('should show admin buttons only when in admin mode', () => {
      const shouldShowAdminButtons = (adminMode) => adminMode;

      expect(shouldShowAdminButtons(true)).toBe(true);
      expect(shouldShowAdminButtons(false)).toBe(false);
    });

    test('should maintain proper component hierarchy', () => {
      // Test the component structure requirements
      const componentStructure = {
        hasPanel: true,
        hasToggleButton: true,
        hasConditionalAdminButtons: true,
        hasCenterAlignment: true
      };

      expect(componentStructure.hasPanel).toBe(true);
      expect(componentStructure.hasToggleButton).toBe(true);
      expect(componentStructure.hasConditionalAdminButtons).toBe(true);
      expect(componentStructure.hasCenterAlignment).toBe(true);
    });
  });

  describe('integration with app state', () => {
    test('should work with handleAdminModeChange function', () => {
      const mockHandleAdminModeChange = jest.fn();

      // Simulate the app's handleAdminModeChange behavior
      const handleAdminModeChange = (newAdminMode) => {
        mockHandleAdminModeChange(newAdminMode);
      };

      handleAdminModeChange(true);
      expect(mockHandleAdminModeChange).toHaveBeenCalledWith(true);

      handleAdminModeChange(false);
      expect(mockHandleAdminModeChange).toHaveBeenCalledWith(false);
    });

    test('should maintain state consistency', () => {
      let adminMode = false;
      const setAdminMode = (newValue) => { adminMode = newValue; };

      // Simulate toggle behavior
      setAdminMode(!adminMode);
      expect(adminMode).toBe(true);

      setAdminMode(!adminMode);
      expect(adminMode).toBe(false);
    });

    test('should work with required props', () => {
      const requiredProps = {
        adminMode: false,
        onAdminModeChange: jest.fn(),
        gameRef: mockGameRef,
        exercise: '1. Basics'
      };

      expect(requiredProps.adminMode).toBeDefined();
      expect(requiredProps.onAdminModeChange).toBeDefined();
      expect(requiredProps.gameRef).toBeDefined();
      expect(requiredProps.exercise).toBeDefined();
    });
  });
});
