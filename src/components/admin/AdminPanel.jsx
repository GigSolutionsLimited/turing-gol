import React from 'react';
import { ChallengeService } from '../../services/challengeService';
import { encodeRLE } from '../../utils/rleUtils';
import { getCenterOffsets } from '../../utils/canvasUtils';

const AdminPanel = ({
  adminMode,
  gameRef,
  exercise
}) => {
  if (!adminMode) return null;

  const handleReloadFromFile = async () => {
    try {
      // Extract exercise number from exercise prop (e.g., "1. Basics" -> "1")
      const exerciseMatch = exercise.match(/^(\d+)\./);
      const exerciseNumber = exerciseMatch ? exerciseMatch[1] : '1';

      const challengeData = await ChallengeService.loadChallenge(exercise, true); // Force reload
      if (challengeData) {
        alert(`Successfully reloaded challenge ${exerciseNumber}! Please refresh the page to see changes.`);
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
    <div style={{
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      <button
        onClick={handleReloadFromFile}
      >
        Reload from file
      </button>
      <button
        onClick={handleCopyChallenge}
      >
        Copy Challenge
      </button>
    </div>
  );
};

export default AdminPanel;
