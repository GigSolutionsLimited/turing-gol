import React, { useState, useEffect } from 'react';
import { shallowEqual } from '../../utils/memoUtils';
import { TestScenarioService } from '../../services/testScenarioService';

const GameControls = ({
  running,
  multiplier,
  speed,
  onPlay,
  onStop,
  onStep,
  onReset,
  onClear,
  onSpeedChange,
  gameRef, // New prop for ref-based controls
  // Test scenario props
  challenge
}) => {
  // State for ref-based controls
  const [refMultiplier, setRefMultiplier] = useState(4); // Default to 4x
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState(null);

  // Check if challenge has test scenarios
  const hasTestScenarios = challenge ? TestScenarioService.hasTestScenarios(challenge) : false;

  // Function to run all test scenarios
  const runAllTestScenarios = async () => {
    if (!hasTestScenarios || !gameRef?.current) {
      console.log('🧪 Cannot run tests: no scenarios or no gameRef');
      return;
    }

    try {
      setIsRunningTests(true);
      setTestResults(null); // Clear previous results
      console.log('🧪 Starting test execution via gameRef');

      // Call the handleTest method from GameOfLife via ref
      if (gameRef.current.handleTest) {
        const results = await gameRef.current.handleTest();
        setTestResults(results);

        // Auto-clear results after 5 seconds
        setTimeout(() => setTestResults(null), 5000);
      } else {
        console.error('🧪 handleTest method not available on gameRef');
      }

      console.log('🧪 Test execution completed');
    } catch (error) {
      console.error('🧪 Error running test scenarios:', error);
      setTestResults({
        allPassed: false,
        message: 'Error running tests: ' + error.message,
        scenarios: []
      });
      // Auto-clear error after 5 seconds
      setTimeout(() => setTestResults(null), 5000);
    } finally {
      setIsRunningTests(false);
    }
  };

  // Update local state when gameRef methods are available and sync with multiplier changes
  useEffect(() => {
    if (gameRef?.current?.getMultiplier) {
      const currentMultiplier = gameRef.current.getMultiplier();
      if (currentMultiplier !== refMultiplier) {
        setRefMultiplier(currentMultiplier);
      }
    }
  }, [gameRef, refMultiplier]);

  // Additional effect to sync when the underlying multiplier changes (e.g., level switch)
  useEffect(() => {
    const syncMultiplier = () => {
      if (gameRef?.current?.getMultiplier) {
        const currentMultiplier = gameRef.current.getMultiplier();
        setRefMultiplier(currentMultiplier);
      }
    };

    // Check immediately
    syncMultiplier();

    // Set up periodic sync to catch changes
    const intervalId = setInterval(syncMultiplier, 100);

    return () => clearInterval(intervalId);
  }, [gameRef]);

  // If using gameRef approach
  if (gameRef) {
    return (
      <div className="selector-panel" style={{
        width: '180px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px' // Reduced from 6px
      }}>
        <h3 style={{ margin: '0 0 2px 0', fontSize: '12px' }}> {/* Reduced margin */}
          Controls
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px', // Reduced from 6px
          width: '100%',
          maxWidth: '160px'
        }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => gameRef.current?.handlePlay?.()}
              disabled={running}
              style={{
                fontSize: '10px',
                flex: 1
              }}
            >
              Play
            </button>
            <button
              onClick={() => gameRef.current?.handleStop?.()}
              disabled={!running}
              style={{
                fontSize: '10px',
                flex: 1
              }}
            >
              Stop
            </button>
          </div>

          <div style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'center'
          }}>
            <button
              onClick={() => gameRef.current?.handleStep?.()}
              disabled={running}
              style={{
                fontSize: '10px',
                flex: 1
              }}
            >
              Step
            </button>
            <button
              onClick={() => gameRef.current?.handleReset?.()}
              style={{
                fontSize: '10px',
                flex: 1
              }}
            >
              Reset
            </button>
          </div>

          {/* Clear and Test buttons row */}
          <div style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'center',
            width: '100%'
          }}>
            <button
              onClick={() => {
                console.log('🟠 CLEAR BUTTON CLICKED - about to call gameRef.current?.handleClear?.()');
                console.log('🟠 gameRef.current:', gameRef.current);
                console.log('🟠 handleClear exists:', !!gameRef.current?.handleClear);
                gameRef.current?.handleClear?.();
              }}
              style={{
                fontSize: '10px',
                width: '48%', // Exactly half width minus gap
                minWidth: '60px' // Ensure minimum usable width
              }}
            >
              Clear
            </button>

            <button
              onClick={runAllTestScenarios}
              disabled={isRunningTests || !hasTestScenarios}
              style={{
                fontSize: '10px',
                width: '48%', // Exactly half width minus gap
                minWidth: '60px', // Ensure minimum usable width
                backgroundColor: isRunningTests ? 'var(--dark-blue)' : (hasTestScenarios ? 'var(--light-blue)' : '#666'),
                opacity: isRunningTests ? 0.6 : (hasTestScenarios ? 1 : 0.5),
                cursor: hasTestScenarios ? 'pointer' : 'not-allowed',
                color: hasTestScenarios ? 'var(--text-color)' : '#999'
              }}
              title={hasTestScenarios ? "Run all test scenarios for this challenge" : "No test scenarios available for this challenge"}
            >
              {isRunningTests ? 'Testing...' : 'TEST'}
            </button>
          </div>
        </div>

        {/* Speed control */}
        <div style={{
          width: '100%',
          textAlign: 'center'
        }}>
          <label style={{
            color: 'var(--light-blue)',
            fontSize: '10px',
            display: 'block',
            marginBottom: '4px',
            fontFamily: 'var(--futuristic-font)',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Speed: {refMultiplier}x
          </label>
          <input
            type="range"
            min="0"
            max="6"
            step="1"
            value={Math.log2(refMultiplier)}
            onChange={(e) => {
              const position = parseInt(e.target.value);
              const newMultiplier = Math.pow(2, position);
              gameRef.current?.setMultiplier?.(newMultiplier);
              setRefMultiplier(newMultiplier);
            }}
            style={{
              width: '100%',
              height: '4px'
            }}
          />
        </div>

        {/* Test Results Display */}
        {testResults && (
          <div style={{
            width: '100%',
            marginTop: '8px',
            padding: '8px',
            borderRadius: '4px',
            backgroundColor: testResults.allPassed ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
            border: `1px solid ${testResults.allPassed ? 'var(--light-green)' : 'var(--error-color)'}`
          }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: testResults.allPassed ? 'var(--light-green)' : 'var(--error-color)',
              textAlign: 'center',
              marginBottom: '4px'
            }}>
              {testResults.allPassed ? '✅ All Tests Passed!' : '❌ Some Tests Failed'}
            </div>
            {testResults.scenarios && testResults.scenarios.map((scenario, index) => (
              <div key={index} style={{
                fontSize: '8px',
                color: scenario.passed ? 'var(--light-green)' : 'var(--error-color)',
                marginBottom: '2px'
              }}>
                {scenario.passed ? '✅' : '❌'} {scenario.name}
              </div>
            ))}
            {testResults.message && (
              <div style={{
                fontSize: '8px',
                color: 'var(--text-color)',
                marginTop: '4px',
                opacity: 0.8
              }}>
                {testResults.message}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Original horizontal layout for backward compatibility
  const sliderPosition = Math.log2(multiplier);
  const actualMultiplier = Math.pow(2, sliderPosition);

  const handleSliderChange = (e) => {
    const position = Number(e.target.value);
    const newMultiplier = Math.pow(2, position);
    onSpeedChange(newMultiplier);
  };

  return (
    <div style={{ margin: '10px' }}>
      <button onClick={onPlay} disabled={running}>Play</button>
      <button onClick={onStop} disabled={!running}>Stop</button>
      <button onClick={onStep} disabled={running}>Step</button>
      <button onClick={onReset}>Reset</button>
      <button onClick={onClear}>Clear</button>
      <label style={{ marginLeft: '10px' }}>
        Speed Multiplier:
        <input
          type="range"
          min="0"
          max="6"
          step="1"
          value={sliderPosition}
          onChange={handleSliderChange}
          style={{ marginLeft: '5px' }}
        />
        {actualMultiplier}x ({Math.round(speed)} ms)
      </label>
    </div>
  );
};

export default React.memo(GameControls, shallowEqual);
