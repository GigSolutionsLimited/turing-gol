import React from 'react';
import { uiComponentEqual } from '../../utils';
import { MIN_CELL_SIZE, MAX_CELL_SIZE, CELL_SIZE } from '../../constants/gameConstants';

const ZoomControls = ({ cellSize, onZoomIn, onZoomOut, onAutoZoom }) => {
  const canZoomIn = cellSize < MAX_CELL_SIZE;
  const canZoomOut = cellSize > MIN_CELL_SIZE;

  // Calculate zoom percentage relative to default
  const zoomPercentage = Math.round((cellSize / CELL_SIZE) * 100);

  return (
    <div className="selector-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px', // Reduced from 4px
      alignItems: 'center',
      width: '160px',
      height: 'auto',
      minHeight: '80px',
      boxSizing: 'border-box',
      paddingTop: '6px' // Reduced from 8px
    }}>
      <h4 style={{
        margin: '0 0 2px 0', // Reduced from 4px
        fontSize: '12px',
        color: 'var(--light-blue)'
      }}>
        Zoom
      </h4>

      <div style={{
        display: 'flex',
        gap: '4px',
        alignItems: 'center',
        marginBottom: '4px'
      }}>
        <button
          onClick={onZoomOut}
          disabled={!canZoomOut}
          style={{
            fontSize: '16px',
            padding: '4px 8px',
            minWidth: '32px',
            opacity: canZoomOut ? 1 : 0.3,
            cursor: canZoomOut ? 'pointer' : 'not-allowed'
          }}
          title="Zoom Out"
        >
          −
        </button>

        <div style={{
          fontSize: '10px',
          color: 'var(--light-blue)',
          textAlign: 'center',
          minWidth: '50px'
        }}>
          {zoomPercentage}%
        </div>

        <button
          onClick={onZoomIn}
          disabled={!canZoomIn}
          style={{
            fontSize: '16px',
            padding: '4px 8px',
            minWidth: '32px',
            opacity: canZoomIn ? 1 : 0.3,
            cursor: canZoomIn ? 'pointer' : 'not-allowed'
          }}
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Auto-zoom button */}
      {onAutoZoom && (
        <button
          onClick={onAutoZoom}
          style={{
            fontSize: '10px',
            padding: '3px 6px',
            minWidth: '60px',
            background: 'var(--button-background)',
            border: '1px solid var(--light-blue-half)',
            color: 'var(--light-blue)',
            borderRadius: '3px',
            cursor: 'pointer',
            fontFamily: 'var(--futuristic-font)'
          }}
          title="Auto-zoom to fit entire grid"
        >
          Auto Fit
        </button>
      )}
    </div>
  );
};

export default React.memo(ZoomControls, uiComponentEqual);
