import React from 'react';

const GameStatus = ({
  generation,
  mouseCoords,
  levelCompleted,
  levelFailed,
  targetTurn // <-- add targetTurn prop
}) => {
  return (
    <>
      {/* Generation display - center bottom overlay */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid var(--light-blue)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: 'var(--light-blue)',
        fontFamily: 'var(--futuristic-font)',
        fontSize: '0.9rem',
        fontWeight: 'bold',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 0 10px var(--light-blue-glow)',
        pointerEvents: 'none'
      }}>
        Gen: {generation}{typeof targetTurn === 'number' ? ` / ${targetTurn}` : ''}
      </div>

      {/* Mouse coordinates - follow cursor */}
      {mouseCoords && (
        <div style={{
          position: 'fixed',
          left: `${mouseCoords.screenX + 15}px`,
          top: `${mouseCoords.screenY - 25}px`,
          background: 'rgba(0, 0, 0, 0.9)',
          border: '1px solid var(--light-blue-half)',
          borderRadius: '4px',
          padding: '4px 8px',
          color: 'var(--light-blue-half)',
          fontFamily: 'var(--futuristic-font)',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          zIndex: 1001,
          backdropFilter: 'blur(2px)',
          pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          ({mouseCoords.x}, {mouseCoords.y})
        </div>
      )}



      {/* Level status messages - centered overlay */}
      {(levelCompleted || levelFailed) && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1002,
          pointerEvents: 'none'
        }}>
          {levelCompleted && (
            <div style={{
              fontWeight: 'bold',
              color: 'var(--light-blue)',
              background: 'rgba(62, 198, 255, 0.2)',
              padding: '12px 40px', // Increased horizontal padding from 30px to 40px
              borderRadius: '8px',
              border: '2px solid var(--light-blue)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: 'var(--futuristic-font)',
              fontSize: '1.2rem',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 20px var(--light-blue-glow)',
              minWidth: '320px', // Increased from 280px to 320px
              whiteSpace: 'nowrap', // Prevent text wrapping
              display: 'inline-block' // Ensure proper sizing
            }}>
              🎉 COMPLETED! 🎉
            </div>
          )}
          {levelFailed && (
            <div style={{
              fontWeight: 'bold',
              color: '#ff6b6b',
              background: 'rgba(255, 107, 107, 0.2)',
              padding: '12px 40px', // Increased horizontal padding from 30px to 40px
              borderRadius: '8px',
              border: '2px solid #ff6b6b',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              fontFamily: 'var(--futuristic-font)',
              fontSize: '1.2rem',
              textAlign: 'center',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 20px rgba(255, 107, 107, 0.5)',
              minWidth: '280px', // Keep existing width for failed message (shorter text)
              whiteSpace: 'nowrap', // Prevent text wrapping
              display: 'inline-block' // Ensure proper sizing
            }}>
              ❌ FAILED! ❌
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default GameStatus;
