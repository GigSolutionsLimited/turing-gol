import React, { useEffect } from 'react';
import { BrushService } from '../../services/brushService';
import { useBrushes } from '../../hooks/gameHooks';
import { uiComponentEqual } from '../../utils/memoUtils';
import { DETECTOR_CONSTANTS } from '../../constants/gameConstants';

const PatternSelector = ({
  challenge,
  selectedPattern,
  running = false,
  onPatternSelect
}) => {
  const { brushes, brushesLoaded } = useBrushes();

  // Check if challenge has detector patterns or challenge detectors
  const hasDetectorPatterns = React.useMemo(() => {
    if (!challenge) return false;

    // Check for detector brushes in the available brushes
    const hasDetectorBrushes = challenge.brushes && brushes &&
      challenge.brushes.some(brushId => {
        const pattern = brushes[brushId];
        return pattern && BrushService.isDetectorPattern(pattern);
      });

    // Check for challenge detectors (pre-placed detectors)
    const hasChallengeDetectors = challenge.detectors && challenge.detectors.length > 0;

    return hasDetectorBrushes || hasChallengeDetectors;
  }, [challenge, brushes]);

  // Handle keyboard events for flipping and rotating patterns
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!selectedPattern || running) return;

      const key = event.key.toLowerCase();
      let transformedPattern = null;

      if (key === 'x') {
        // Flip around X axis (vertical flip)
        transformedPattern = BrushService.transformPattern(selectedPattern, 'flipX');
        event.preventDefault();
      } else if (key === 'y') {
        // Flip around Y axis (horizontal flip)
        transformedPattern = BrushService.transformPattern(selectedPattern, 'flipY');
        event.preventDefault();
      } else if (event.key === 'ArrowRight') {
        // Rotate 90 degrees clockwise
        transformedPattern = BrushService.transformPattern(selectedPattern, 'rotateClockwise');
        event.preventDefault();
      } else if (event.key === 'ArrowLeft') {
        // Rotate 90 degrees counterclockwise
        transformedPattern = BrushService.transformPattern(selectedPattern, 'rotateCounterclockwise');
        event.preventDefault();
      }

      if (transformedPattern) {
        // Apply challenge falloff period to detector patterns after transformation
        if (BrushService.isDetectorPattern(transformedPattern) && challenge?.detectorFalloffPeriod) {
          transformedPattern = BrushService.updateDetectorWithChallengeFalloff(transformedPattern, challenge.detectorFalloffPeriod);
        }
        onPatternSelect(transformedPattern);
      }
    };

    // Add event listener to document
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPattern, running, onPatternSelect]);

  return (
    <div className="selector-panel" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '2px', // Reduced from 4px to save space
      alignItems: 'center',
      width: '160px',
      boxSizing: 'border-box'
    }}>
      <h3 style={{ margin: '0 0 2px 0', fontSize: '12px' }}> {/* Reduced margin */}
        Brushes
      </h3>

      {!brushesLoaded ? (
        <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center', fontSize: '12px' }}>
          Loading brushes...
        </div>
      ) : !challenge ? (
        <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center', fontSize: '12px' }}>
          Loading challenge...
        </div>
      ) : !challenge.brushes || challenge.brushes.length === 0 ? (
        <div style={{ color: '#ccc', fontStyle: 'italic', textAlign: 'center', fontSize: '12px' }}>
          No brushes configured
        </div>
      ) : (
        BrushService.getPatternsForChallenge(challenge, brushes).map((pat) => (
          <button
            key={pat.name}
            disabled={running}
            className={selectedPattern?.name === pat.name ? 'selected' : ''}
            style={{
              width: '130px',
              fontSize: '10px',
              textAlign: 'center',
              margin: '1px 0' // Reduced button spacing
            }}
            onClick={() => {
              if (selectedPattern?.name === pat.name) {
                onPatternSelect(null);
              } else {
                // Apply challenge falloff period to detector patterns
                let patternToSelect = pat;
                if (BrushService.isDetectorPattern(pat) && challenge?.detectorFalloffPeriod) {
                  patternToSelect = BrushService.updateDetectorWithChallengeFalloff(pat, challenge.detectorFalloffPeriod);
                }
                onPatternSelect(patternToSelect);
              }
            }}
          >
            {pat.name}
          </button>
        ))
      )}

      {/* Detector Falloff Period Label - only show if level has detector patterns */}
      {hasDetectorPatterns && (
        <div style={{
          width: '100%',
          marginTop: '8px',
          paddingTop: '6px',
          borderTop: '1px solid var(--light-blue-half)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '4px'
        }}>
          <label style={{
            color: 'var(--light-blue)',
            fontSize: '10px',
            textAlign: 'center',
            margin: 0
          }}>
            Detector Falloff: {challenge?.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD} generations
          </label>
        </div>
      )}

    </div>
  );
};

export default React.memo(PatternSelector, uiComponentEqual);
