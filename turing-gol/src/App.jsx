import React, { useRef, useCallback, useMemo } from 'react';
import GameOfLife from './GameOfLife';
import { GameTitle, LevelSelector, PatternSelector, GameControls, AdminToggle, ZoomControls, PerformanceMonitor, DetectorPanel } from './components/ui';
import { ChallengeService } from './services';
import { useAppState } from './hooks/useAppState';
import { calculateAutoZoomCellSize } from './utils';
import { CELL_SIZE } from './constants/gameConstants';
import './App.css'


function App() {
  // Use the custom hook for state management
  const {
    // State
    exercise,
    adminMode,
    availableChallenges,
    completedExercises,
    challenge,
    selectedPattern,
    pasting,
    running,
    cellSize,
    // Guidance line state (object-based system only)
    guidanceLinesVisible,
    guidanceLineObjects,

    // Actions
    setExercise,
    setAvailableChallenges,
    addCompletedExercise,
    setChallengeData,
    setHasStoredChallenge,
    setRunning,
    setError,
    clearError,
    handlePatternSelect,
    handleAdminModeChange,
    zoomIn,
    zoomOut,
    setZoomLevel,
    // Guidance line actions (object-based system only)
    setGuidanceLinesVisible,
    // Generation-based guidance line actions
    addGuidanceLineObject,
    resetGuidanceLineObjects
  } = useAppState();

  const gameRef = useRef();
  const [detectors, setDetectors] = React.useState([]);

  // Add logging to track guidance line visibility changes at the app level
  React.useEffect(() => {
    console.log('🎯 App.jsx - guidanceLinesVisible state changed:', {
      guidanceLinesVisible,
      running,
      hasChallenge: !!challenge,
      challengeName: challenge?.name,
      guidanceLineObjectsCount: guidanceLineObjects?.length || 0
    });
  }, [guidanceLinesVisible, running, challenge, guidanceLineObjects]);

  // Callback to handle detector updates from GameOfLife
  const handleDetectorsChange = useCallback((updatedDetectors) => {
    setDetectors(updatedDetectors);
  }, []);


  // Load available challenges metadata on component mount
  React.useEffect(() => {
    const loadAvailableChallenges = async () => {
      try {
        clearError();
        const challenges = await ChallengeService.loadAvailableChallenges();
        setAvailableChallenges(challenges);

        // If no exercise is selected and we have challenges, select the first one
        if (!exercise && challenges.length > 0) {
          setExercise(challenges[0].name);
        }
      } catch (error) {
        console.error('Error loading available challenges:', error);
        setError(`Failed to load challenges: ${error.message}`);
      }
    };

    loadAvailableChallenges();
  }, [exercise, setAvailableChallenges, setExercise, setError, clearError]);

  // Load challenge from localStorage or JSON file
  React.useEffect(() => {
    if (adminMode) return; // Only load in user mode

    const loadChallenge = async () => {
      try {
        console.log('🎯 Loading challenge:', exercise);
        clearError(); // Clear any previous errors
        const challengeData = await ChallengeService.loadChallenge(exercise);

        if (challengeData) {
          console.log('🎯 Challenge data loaded:', {
            name: challengeData.name,
            hasSetup: !!(challengeData.setup && challengeData.setup.length > 0),
            setupLength: challengeData.setup?.length || 0,
            width: challengeData.width,
            height: challengeData.height,
            hasTestScenarios: !!(challengeData.testScenarios && challengeData.testScenarios.length > 0),
            testScenariosLength: challengeData.testScenarios?.length || 0
          });

          setChallengeData({
            name: challengeData.name,
            pattern: challengeData.pattern,
            setup: challengeData.setup,
            targetTurn: challengeData.targetTurn,
            editableSpace: challengeData.editableSpace,
            width: challengeData.width,
            height: challengeData.height,
            brushes: challengeData.brushes,
            detectorFalloffPeriod: challengeData.detectorFalloffPeriod,
            detectors: challengeData.detectors,
            description: challengeData.description,
            testScenarios: challengeData.testScenarios // ← MISSING FIELD ADDED!
          });
          setHasStoredChallenge(true);

          // Auto-zoom to fit the entire grid (but never zoom out more than 25%)
          const autoZoomCellSize = calculateAutoZoomCellSize(challengeData, CELL_SIZE);
          console.log('🔍 Auto-zoom calculation:', {
            originalCellSize: CELL_SIZE,
            calculatedCellSize: autoZoomCellSize,
            willAutoZoom: autoZoomCellSize !== CELL_SIZE
          });

          if (autoZoomCellSize !== CELL_SIZE) { // Only auto-zoom if different from default
            console.log('🔍 Applying auto-zoom to cellSize:', autoZoomCellSize);
            setZoomLevel(autoZoomCellSize);
          }
        } else {
          console.log('🎯 No challenge data found for:', exercise);
          setHasStoredChallenge(false);
        }
      } catch (error) {
        console.error('❌ Error loading challenge:', error);
        setError(`Failed to load challenge "${exercise}": ${error.message}`);
        setHasStoredChallenge(false);
      }
    };

    loadChallenge();
  }, [exercise, adminMode, setChallengeData, setHasStoredChallenge, setError, clearError, setZoomLevel]);

  // Check for level completion and update completed exercises
  React.useEffect(() => {
    const checkCompletion = () => {
      if (gameRef.current && gameRef.current.isLevelCompleted && gameRef.current.isLevelCompleted()) {
        addCompletedExercise(exercise);
      }
    };

    // Check immediately and then periodically
    checkCompletion();
    const interval = setInterval(checkCompletion, 1000); // Less frequent than before
    return () => clearInterval(interval);
  }, [exercise, addCompletedExercise]);

  // Callback for immediate challenge reload from admin panel
  const handleChallengeReload = useCallback((newChallengeData) => {
    setChallengeData({
      pattern: newChallengeData.pattern,
      setup: newChallengeData.setup,
      targetTurn: newChallengeData.targetTurn,
      editableSpace: newChallengeData.editableSpace,
      width: newChallengeData.width,
      height: newChallengeData.height,
      brushes: newChallengeData.brushes,
      detectorFalloffPeriod: newChallengeData.detectorFalloffPeriod,
      detectors: newChallengeData.detectors,
      description: newChallengeData.description
    });
    setHasStoredChallenge(true);
  }, [setChallengeData, setHasStoredChallenge]);

  // Handle manual auto-zoom button press
  const handleAutoZoom = useCallback(() => {
    if (challenge) {
      const autoZoomCellSize = calculateAutoZoomCellSize(challenge, CELL_SIZE);
      console.log(`Manual auto-zoom: Challenge (${challenge.width}x${challenge.height}) -> cell size ${autoZoomCellSize}`);
      setZoomLevel(autoZoomCellSize);
    }
  }, [challenge, setZoomLevel]);

  // Handle test scenario application
  const handleScenarioApplied = useCallback((scenarioState, scenario) => {
    // Apply scenario state to the game
    if (gameRef.current && scenarioState) {
      // Update detectors based on scenario
      setDetectors(scenarioState.detectors || []);

      // In a full implementation, we would also update the grid
      // For now, we just handle the detectors
    }
  }, []);

  // Memoize gameState to prevent infinite re-renders in TestScenarioPanel
  const gameState = useMemo(() => ({
    grid: gameRef.current?.getGrid?.() || [],
    detectors: detectors,
    placedObjects: []
  }), [detectors]); // Only re-create when detectors change

  // Memoize gridSize to prevent object recreation
  const gridSize = useMemo(() => ({
    width: challenge?.width || 50,
    height: challenge?.height || 50
  }), [challenge?.width, challenge?.height]);

  // Memoize brushes to prevent object recreation
  const memoizedBrushes = useMemo(() => challenge?.brushes || {}, [challenge?.brushes]);

  return (
    <div className="app">
      {/* Nine-slice background */}
      <div className="nine-slice-background">
        <div className="slice-tl"></div>
        <div className="slice-tc"></div>
        <div className="slice-tr"></div>
        <div className="slice-ml"></div>
        <div className="slice-mc"></div>
        <div className="slice-mr"></div>
        <div className="slice-bl"></div>
        <div className="slice-bc"></div>
        <div className="slice-br"></div>
      </div>

      {/* Title at the top */}
      <div className="game-title">
        <GameTitle description={challenge?.description} />
      </div>


      {/* Main game area */}
      <div className="game-container">
        <div className="game-layout">
          {/* Level selector and game controls on the left side */}
          <div className="left-panels">
            <LevelSelector
              exercise={exercise}
              completedExercises={completedExercises}
              availableChallenges={availableChallenges}
              onExerciseSelect={setExercise}
            />

            {/* Game controls panel */}
            <GameControls
              running={running}
              gameRef={gameRef}
              challenge={challenge}
              gameState={gameState}
              brushes={memoizedBrushes}
              gridSize={gridSize}
              generation={gameRef.current?.getGeneration?.() || 0}
              onScenarioApplied={handleScenarioApplied}
            />

            {/* Admin toggle panel moved to left */}
            <AdminToggle
              adminMode={adminMode}
              onAdminModeChange={handleAdminModeChange}
              gameRef={gameRef}
              exercise={exercise}
              onChallengeReload={handleChallengeReload}
            />
          </div>

          <div className="game-canvas-container">
            <GameOfLife
              key={`${exercise}-${challenge?.width}-${challenge?.height}`}
              ref={gameRef}
              exercise={exercise}
              challenge={challenge}
              selectedPattern={selectedPattern}
              pasting={pasting}
              running={running}
              adminMode={adminMode}
              cellSize={cellSize}
              // Guidance line props (object-based system only)
              guidanceLinesVisible={guidanceLinesVisible}
              onSetGuidanceLinesVisible={setGuidanceLinesVisible}
              // Generation-based guidance line props
              guidanceLineObjects={guidanceLineObjects}
              onAddGuidanceLineObject={addGuidanceLineObject}
              onResetGuidanceLineObjects={resetGuidanceLineObjects}
              // Other callbacks
              onPatternSelect={handlePatternSelect}
              onRunningChange={setRunning}
              onDetectorsChange={handleDetectorsChange}
            />
          </div>

          {/* Pattern selector on the right side of the game */}
          <div className="right-panels">
            <PatternSelector
              challenge={challenge}
              selectedPattern={selectedPattern}
              running={running}
              onPatternSelect={handlePatternSelect}
            />

            {/* Hints panel below brushes */}
            <div className="selector-panel" style={{
              width: '160px',
              height: '110px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              overflow: 'hidden'
            }}>
              {selectedPattern && (
                <div style={{
                  color: 'var(--light-blue)',
                  fontSize: '9px',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  marginBottom: pasting ? '4px' : '0', // Reduced margin
                  fontFamily: 'var(--futuristic-font)'
                }}>
                  Press <b>X</b> to flip vertically<br />
                  Press <b>Y</b> to flip horizontally<br />
                  Press <b>←</b> to rotate left<br />
                  Press <b>→</b> to rotate right
                </div>
              )}

              {pasting && selectedPattern && (
                <div style={{
                  color: 'var(--light-blue)',
                  fontSize: '9px',
                  textAlign: 'center',
                  paddingTop: '4px', // Reduced padding
                  borderTop: '1px solid var(--light-blue-half)',
                  lineHeight: '1.2',
                  fontFamily: 'var(--futuristic-font)'
                }}>
                  Click on grid to paste:<br />
                  <b>{selectedPattern.name}</b>
                </div>
              )}

              {!selectedPattern && (
                <div style={{
                  color: 'var(--light-blue-half)',
                  fontSize: '9px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  lineHeight: '1.2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  fontFamily: 'var(--futuristic-font)'
                }}>
                  Select a brush to see controls
                </div>
              )}
            </div>

            {/* Detector Panel */}
            <DetectorPanel detectors={detectors} />


            {/* Zoom controls panel */}
            <ZoomControls
              cellSize={cellSize}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onAutoZoom={handleAutoZoom}
            />
          </div>
        </div>
      </div>

      {/* Performance Monitor for development */}
      <PerformanceMonitor visible={import.meta.env.DEV} position="top-right" />
    </div>
  );
}

export default App
