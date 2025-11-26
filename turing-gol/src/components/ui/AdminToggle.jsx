import React from 'react';
import { uiComponentEqual } from '../../utils/memoUtils';
import { ChallengeService } from '../../services/challengeService';
import { encodeRLE } from '../../utils/rleUtils';
import { getCenterOffsets } from '../../utils/canvasUtils';

const AdminToggle = ({ adminMode, onAdminModeChange, gameRef, exercise, onChallengeReload }) => {
  const handleReloadFromFile = async () => {
    try {
      // Extract exercise number from exercise prop (e.g., "1. Basics" -> "1")
      const exerciseMatch = exercise.match(/^(\d+)\./);
      const exerciseNumber = exerciseMatch ? exerciseMatch[1] : '1';

      // Clear localStorage for this challenge to force reload
      const storageKey = `challenge_${exerciseNumber}`;
      localStorage.removeItem(storageKey);

      const challengeData = await ChallengeService.loadChallenge(exercise, true); // Force reload

      if (challengeData) {
        // Trigger immediate reload in the app state
        if (onChallengeReload) {
          onChallengeReload(challengeData);
        }
        alert(`Successfully reloaded challenge ${exerciseNumber}!`);
      } else {
        alert(`Failed to load challenge file ${exerciseNumber}.json`);
      }
    } catch (error) {
      alert(`Error reloading challenge file: ${error.message}`);
    }
  };

  const handleCopyChallenge = () => {
    if (!gameRef?.current) {
      alert('Game not ready yet. Please try again.');
      return;
    }

    const currentTurn = gameRef.current.getGeneration();
    const grid = gameRef.current.getGrid();
    const { rle, minRow, minCol } = encodeRLE(grid);

    // Calculate center-based coordinates for the pattern position
    const { centerOffsetX, centerOffsetY } = getCenterOffsets(grid);

    // Convert grid coordinates to center-based coordinates
    const patternY = minRow - centerOffsetY;
    const patternX = minCol - centerOffsetX;

    const challengeData = {
      patterns: [
        {
          x: patternX,
          y: patternY,
          rle: rle
        }
      ],
      width: grid[0] ? grid[0].length : 50,
      height: grid.length,
      targetTurn: currentTurn
    };

    const jsonString = JSON.stringify(challengeData, null, 2);
    navigator.clipboard.writeText(jsonString);
    alert('Challenge JSON with positioned RLE pattern copied to clipboard!');
  };

  return (
    <div className="selector-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      alignItems: 'center',
      width: '180px',
      height: 'auto',
      minHeight: adminMode ? '70px' : '50px',
      boxSizing: 'border-box',
      justifyContent: 'flex-start',
      paddingTop: '12px' // Reduced from 12px
    }}>
      <button
        onClick={() => onAdminModeChange(!adminMode)}
        className={adminMode ? 'selected' : ''}
        style={{
          width: '140px',
          fontSize: '11px',
          padding: '8px 12px'
        }}
      >
        {adminMode ? 'User Mode' : 'Admin Mode'}
      </button>

      {adminMode && (
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '4px',
          justifyContent: 'center'
        }}>
          <button
            onClick={handleReloadFromFile}
            style={{
              width: '74px',
              fontSize: '10px',
              padding: '6px 8px'
            }}
          >
            Reload
          </button>
          <button
            onClick={handleCopyChallenge}
            style={{
              width: '62px',
              fontSize: '10px',
              padding: '6px 8px'
            }}
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(AdminToggle, uiComponentEqual);
