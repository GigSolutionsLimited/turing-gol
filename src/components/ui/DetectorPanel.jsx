import React from 'react';

const DetectorPanel = ({ detectors }) => {
  // Check if we have any detectors with indices
  const indexedDetectors = detectors
    .filter(detector => detector.index !== undefined)
    .sort((a, b) => a.index - b.index);

  // Don't render if there are no indexed detectors
  if (indexedDetectors.length === 0) {
    return null;
  }

  const detectorCount = indexedDetectors.length;
  const useTwoRows = detectorCount > 4;

  // Split detectors into two rows if needed
  let firstRow = indexedDetectors;
  let secondRow = [];

  if (useTwoRows) {
    const splitPoint = Math.ceil(detectorCount / 2);
    firstRow = indexedDetectors.slice(0, splitPoint);
    secondRow = indexedDetectors.slice(splitPoint);
  }

  return (
    <div className={`detector-panel ${useTwoRows ? 'two-rows' : ''}`}>
      <div className="detector-display">
        <div className="detector-row">
          {firstRow.map((detector) => (
            <span
              key={detector.index}
              className="detector-digit"
            >
              {detector.currentValue}
            </span>
          ))}
        </div>
        {useTwoRows && (
          <div className="detector-row">
            {secondRow.map((detector) => (
              <span
                key={detector.index}
                className="detector-digit"
              >
                {detector.currentValue}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DetectorPanel;
