import React, { useMemo } from 'react';
import { uiComponentEqual } from '../../utils/memoUtils';

const LevelSelector = ({
  exercise,
  completedExercises,
  availableChallenges = [],
  onExerciseSelect
}) => {
  // Calculate which 3 levels to show based on current level
  const visibleLevels = useMemo(() => {
    if (availableChallenges.length === 0) return [];

    // Find current level index
    const currentIndex = availableChallenges.findIndex(challenge => challenge.name === exercise);
    const totalLevels = availableChallenges.length;

    if (currentIndex === -1) {
      // No current exercise selected, show first 3
      return availableChallenges.slice(0, Math.min(3, totalLevels));
    }

    let startIndex, endIndex;

    if (currentIndex === 0) {
      // Current level is first, show levels 1-3
      startIndex = 0;
      endIndex = Math.min(3, totalLevels);
    } else if (currentIndex === totalLevels - 1) {
      // Current level is last, show last 3 levels
      startIndex = Math.max(0, totalLevels - 3);
      endIndex = totalLevels;
    } else {
      // Current level is somewhere in the middle, show prev, current, next
      startIndex = Math.max(0, currentIndex - 1);
      endIndex = Math.min(totalLevels, currentIndex + 2);
    }

    return availableChallenges.slice(startIndex, endIndex);
  }, [availableChallenges, exercise]);

  // Handle level selection with debug logging
  const handleLevelSelect = (levelName) => {
    console.log('🎯 User selected level:', levelName, 'from current level:', exercise);
    onExerciseSelect(levelName);
  };

  // Find the most recently completed level for navigation hints
  const mostRecentCompleted = useMemo(() => {
    if (completedExercises.size === 0) return null;

    // Find the highest numbered completed level
    let highestCompleted = null;
    let highestId = -1;

    availableChallenges.forEach(challenge => {
      if (completedExercises.has(challenge.name) && challenge.id > highestId) {
        highestId = challenge.id;
        highestCompleted = challenge;
      }
    });

    return highestCompleted;
  }, [availableChallenges, completedExercises]);

  return (
    <div className="selector-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px', // Reduced from 4px
      alignItems: 'center',
      width: '180px',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ margin: '0 0 2px 0', fontSize: '12px' }}> {/* Reduced margin */}
        Levels
      </h3>

      {/* Navigation indicators */}
      {availableChallenges.length > 3 && (
        <div style={{
          fontSize: '9px',
          color: 'var(--light-blue)',
          opacity: 0.7,
          textAlign: 'center',
          marginBottom: '3px' // Reduced from 5px
        }}>
          {visibleLevels.length > 0 && (
            <>
              Showing {visibleLevels[0].id} - {visibleLevels[visibleLevels.length - 1].id} of {availableChallenges.length}
            </>
          )}
        </div>
      )}

      {visibleLevels.map((challenge) => (
        <button
          key={challenge.id}
          onClick={() => handleLevelSelect(challenge.name)}
          className={exercise === challenge.name ? 'selected' : ''}
          style={{
            width: '150px',
            fontSize: '11px',
            textAlign: 'center',
            opacity: completedExercises.has(challenge.name) ? '1' : '0.8',
            position: 'relative'
          }}
        >
          {challenge.name} {completedExercises.has(challenge.name) ? '✓' : ''}
          {mostRecentCompleted && challenge.id === mostRecentCompleted.id && (
            <span style={{
              position: 'absolute',
              right: '5px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '8px',
              color: 'var(--light-blue)',
              opacity: 0.8
            }}>
              ⭐
            </span>
          )}
        </button>
      ))}

      {/* Navigation arrows if needed */}
      {availableChallenges.length > 3 && (
        <div style={{
          display: 'flex',
          gap: '5px',
          marginTop: '5px'
        }}>
          {/* Previous button */}
          <button
            onClick={() => {
              const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
              const prevIndex = Math.max(0, currentIndex - 1);
              if (prevIndex !== currentIndex && currentIndex !== -1) {
                console.log('🎯 User clicked previous arrow');
                handleLevelSelect(availableChallenges[prevIndex].name);
              }
            }}
            disabled={(() => {
              const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
              return currentIndex === -1 || currentIndex <= 0;
            })()}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              opacity: (() => {
                const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
                return currentIndex === -1 || currentIndex <= 0 ? 0.3 : 0.8;
              })(),
              cursor: (() => {
                const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
                return currentIndex === -1 || currentIndex <= 0 ? 'not-allowed' : 'pointer';
              })()
            }}
          >
            ← Prev
          </button>

          {/* Next button */}
          <button
            onClick={() => {
              const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
              const nextIndex = Math.min(availableChallenges.length - 1, currentIndex + 1);
              if (nextIndex !== currentIndex && currentIndex !== -1) {
                console.log('🎯 User clicked next arrow');
                handleLevelSelect(availableChallenges[nextIndex].name);
              }
            }}
            disabled={(() => {
              const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
              return currentIndex === -1 || currentIndex >= availableChallenges.length - 1;
            })()}
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              opacity: (() => {
                const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
                return currentIndex === -1 || currentIndex >= availableChallenges.length - 1 ? 0.3 : 0.8;
              })(),
              cursor: (() => {
                const currentIndex = availableChallenges.findIndex(c => c.name === exercise);
                return currentIndex === -1 || currentIndex >= availableChallenges.length - 1 ? 'not-allowed' : 'pointer';
              })()
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(LevelSelector, uiComponentEqual);
