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

  return (
    <div className="detector-panel">
      <div className="detector-display">
        {indexedDetectors.map((detector) => (
          <span
            key={detector.index}
            className="detector-digit"
          >
            {detector.currentValue}
          </span>
        ))}
      </div>
    </div>
  );
};

export default DetectorPanel;
