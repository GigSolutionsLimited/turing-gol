import React, {useEffect, useState, useCallback, useRef} from 'react';
import {GameCanvas, GameStatus} from './components/game';
import {useBrushes, useLevelCompletion} from './hooks/gameHooks';
import {useAnimationLoop, useThrottle} from './hooks/performanceHooks';
import {GameService, DetectorService, BrushService, PlacedObjectService} from './services';
import {calculateCanvasSize, getCenterOffsets} from './utils';
import {createGuidanceLineFromBrush} from './utils/guidanceLineObjects';
import {CELL_SIZE, BASE_SPEED, DETECTOR_CONSTANTS} from './constants/gameConstants';

const GameOfLife = React.forwardRef(({
                                         challenge,
                                         selectedPattern: externalSelectedPattern,
                                         pasting: externalPasting,
                                         running: externalRunning,
                                         adminMode,
                                         cellSize = CELL_SIZE,
                                         // Guidance line props (object-based system only)
                                         guidanceLinesVisible,
                                         onSetGuidanceLinesVisible,
                                         // Generation-based guidance line props
                                         guidanceLineObjects,
                                         onAddGuidanceLineObject,
                                         onResetGuidanceLineObjects,
                                         // Other callbacks
                                         onPatternSelect,
                                         onRunningChange,
                                         onDetectorsChange
                                     }, ref) => {
    // Helper function to calculate initial grid size consistently
    const calculateInitialGridSize = useCallback(() => {
        if (challenge && challenge.width && challenge.height) {
            return {width: challenge.width, height: challenge.height};
        }
        const canvasSize = calculateCanvasSize(null, cellSize);
        return {
            width: Math.floor(canvasSize.maxWidth / cellSize),
            height: Math.floor(canvasSize.maxHeight / cellSize)
        };
    }, [challenge, cellSize]);

    // Custom hooks
    const {brushes, brushesLoaded} = useBrushes();
    const {checkLevelCompletion} = useLevelCompletion();

    // Use refs to avoid dependency issues and track previous values
    const onPatternSelectRef = React.useRef(onPatternSelect);
    const onRunningChangeRef = React.useRef(onRunningChange);
    const previousChallengeRef = React.useRef(null);
    const previousChallengeNameRef = React.useRef(null); // Separate ref for challenge name to handle Strict Mode

    // Update refs when callbacks change
    React.useEffect(() => {
        onPatternSelectRef.current = onPatternSelect;
        onRunningChangeRef.current = onRunningChange;
    }, [onPatternSelect, onRunningChange]);

    // State initialization with helper
    const [canvasSize, setCanvasSize] = useState(() => calculateCanvasSize(challenge, cellSize));
    const [gridSize, setGridSize] = useState(calculateInitialGridSize);
    const [grid, setGrid] = useState(() => {
        const initialGridSize = calculateInitialGridSize();
        return GameService.createEmptyGrid(initialGridSize.width, initialGridSize.height);
    });
    const [multiplier, setMultiplier] = useState(4);
    const selectedPattern = externalSelectedPattern;
    const pasting = externalPasting;
    const running = externalRunning !== undefined ? externalRunning : false;
    const [hoverCell, setHoverCell] = useState(null);
    const [mouseCoords, setMouseCoords] = useState(null);
    const [generation, setGeneration] = useState(0);
    const [levelCompleted, setLevelCompleted] = useState(false);
    const [levelFailed, setLevelFailed] = useState(false);
    const [previousGrid, setPreviousGrid] = useState(null);
    const [detectors, setDetectors] = useState([]);

    // Board state management - clearer separation of purposes
    const [setupBoardState, setSetupBoardState] = useState(() => {
        const initialGridSize = calculateInitialGridSize();
        return GameService.createEmptyGrid(initialGridSize.width, initialGridSize.height);
    });
    const [prePlayBoardState, setPrePlayBoardState] = useState(() => {
        const initialGridSize = calculateInitialGridSize();
        return GameService.createEmptyGrid(initialGridSize.width, initialGridSize.height);
    });

    // Track placed objects (user-placed patterns with linked guidance lines)
    const [placedObjects, setPlacedObjects] = useState([]);
    const [initialPlacedObjects, setInitialPlacedObjects] = useState([]);

    // Track test scenario preview patterns (shown as gold pixels when not running)
    const [testScenarioPreviewPatterns, setTestScenarioPreviewPatterns] = useState([]);

    const speed = BASE_SPEED / multiplier;

    // Ref to prevent double execution in React.StrictMode
    const animationExecutionRef = useRef(false);
    const setupCompletedRef = useRef(null);

    // Ref to store test results for level completion logic
    const testResultsRef = useRef(null);

    // Helper to check if cell is editable for current exercise - memoized to prevent re-renders
    const isEditableCell = useCallback((x, y) => {
        return GameService.isEditableCell(x, y, challenge, gridSize, adminMode);
    }, [challenge, gridSize, adminMode]);

    // Helper function to generate test scenario preview patterns
    const generateTestScenarioPreviewPatterns = useCallback(() => {
        if (!challenge || !challenge.testScenarios || !brushes || Object.keys(brushes).length === 0) {
            return [];
        }

        const previewPatterns = [];
        const centerOffsetX = Math.floor(gridSize.width / 2);
        const centerOffsetY = Math.floor(gridSize.height / 2);

        for (const scenario of challenge.testScenarios) {
            if (scenario.setup && scenario.setup.length > 0) {
                for (const setupItem of scenario.setup) {
                    const baseBrush = brushes[setupItem.brush];
                    if (baseBrush && baseBrush.pattern) {
                        // Apply rotation if specified
                        let brush = baseBrush;
                        if (setupItem.rotate && setupItem.rotate !== 0) {
                            const rotations = Math.floor(setupItem.rotate / 90) % 4;
                            for (let i = 0; i < rotations; i++) {
                                brush = BrushService.transformPattern(brush, 'rotateClockwise');
                            }
                        }

                        // Generate preview pattern coordinates
                        for (const [dy, dx] of brush.pattern) {
                            const gridY = centerOffsetY + setupItem.y + dy;
                            const gridX = centerOffsetX + setupItem.x + dx;
                            if (gridY >= 0 && gridY < gridSize.height &&
                                gridX >= 0 && gridX < gridSize.width) {
                                previewPatterns.push({
                                    x: gridX,
                                    y: gridY,
                                    scenario: scenario.name,
                                    brush: setupItem.brush
                                });
                            }
                        }
                    }
                }
            }
        }

        return previewPatterns;
    }, [challenge, brushes, gridSize]);

    // Helper function to reset to pre-play state (generation 0 with user's pixels)
    const resetToPrePlayState = useCallback(() => {
        return new Promise(resolve => {
            console.log('🧪 Resetting to pre-play state...');

            // Restore placed objects to initial state
            setPlacedObjects(initialPlacedObjects);

            // Restore to prePlayBoardState (the state at generation 0 with user's additions)
            const baseGrid = prePlayBoardState ?
                prePlayBoardState.map(arr => [...arr]) :
                (setupBoardState ? setupBoardState.map(arr => [...arr]) : GameService.createEmptyGrid(gridSize.width, gridSize.height));

            // Apply initial placed objects on top of the pre-play state
            const restoredGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, initialPlacedObjects);
            setGrid(restoredGrid);

            setGeneration(0);
            setLevelCompleted(false);
            setLevelFailed(false);
            setPreviousGrid(null);

            console.log('🧪 Reset to pre-play state complete');
            setTimeout(resolve, 100); // Small delay for state updates
        });
    }, [initialPlacedObjects, prePlayBoardState, setupBoardState, gridSize]);
    // Helper function to apply test scenario setup
    const applyTestScenarioSetup = useCallback((scenario) => {
        return new Promise(resolve => {
            console.log(`🧪 Applying test scenario setup for "${scenario.name}"`);

            let setupDetectors = [];
            let expectedLiveCells = 0;

            // Calculate expected live cells first
            if (scenario.setup && scenario.setup.length > 0 && brushes && Object.keys(brushes).length > 0) {
                console.log(`🧪 Processing ${scenario.setup.length} setup patterns with ${Object.keys(brushes).length} available brushes`);

                for (const setupItem of scenario.setup) {
                    const baseBrush = brushes[setupItem.brush];
                    if (baseBrush && baseBrush.pattern) {
                        let brush = baseBrush;
                        if (setupItem.rotate && setupItem.rotate !== 0) {
                            const rotations = Math.floor(setupItem.rotate / 90) % 4;
                            for (let j = 0; j < rotations; j++) {
                                brush = BrushService.transformPattern(brush, 'rotateClockwise');
                            }
                        }
                        expectedLiveCells += brush.pattern.length;
                    }
                }

                setGrid(currentGrid => {
                    const newGrid = currentGrid.map(row => [...row]);
                    const centerOffsetX = Math.floor(gridSize.width / 2);
                    const centerOffsetY = Math.floor(gridSize.height / 2);

                    for (const setupItem of scenario.setup) {
                        const baseBrush = brushes[setupItem.brush];
                        console.log(`🧪 Looking for brush "${setupItem.brush}":`, baseBrush ? 'FOUND' : 'NOT FOUND');

                        if (baseBrush && baseBrush.pattern) {
                            console.log(`🧪 Brush "${setupItem.brush}" has ${baseBrush.pattern.length} pattern cells`);

                            // Apply rotation if specified
                            let brush = baseBrush;
                            if (setupItem.rotate && setupItem.rotate !== 0) {
                                const rotations = Math.floor(setupItem.rotate / 90) % 4;
                                for (let j = 0; j < rotations; j++) {
                                    brush = BrushService.transformPattern(brush, 'rotateClockwise');
                                }
                                console.log(`🧪 Applied ${rotations} rotations to brush`);
                            }

                            // Place pattern on the grid
                            let placedCells = 0;
                            for (const [dy, dx] of brush.pattern) {
                                const gridY = centerOffsetY + setupItem.y + dy;
                                const gridX = centerOffsetX + setupItem.x + dx;
                                if (gridY >= 0 && gridY < newGrid.length &&
                                    gridX >= 0 && gridX < newGrid[0].length) {
                                    newGrid[gridY][gridX] = 1;
                                    placedCells++;
                                }
                            }
                            console.log(`🧪 Placed ${placedCells}/${brush.pattern.length} cells for brush "${setupItem.brush}" at offset (${centerOffsetX + setupItem.x}, ${centerOffsetY + setupItem.y})`);
                        } else {
                            console.error(`🧪 Brush "${setupItem.brush}" not found or has no pattern`);
                        }
                    }

                    const totalLiveCells = newGrid.reduce((count, row) =>
                        count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0
                    );
                    console.log(`🧪 Grid now has ${totalLiveCells} live cells after setup`);

                    return newGrid;
                });
            } else {
                console.log('🧪 No setup patterns to apply or brushes not loaded');
            }

            // Setup test scenario detectors
            // Use main challenge detectors for positions, scenario detectors only specify expected states for validation
            if (challenge.detectors && challenge.detectors.length > 0) {
                console.log('🧪 Using main challenge detectors for test scenario');
                const testDetectors = DetectorService.initializeChallengeDetectors(
                    challenge.detectors.map(d => {
                        const centerX = Math.floor(gridSize.width / 2);
                        const centerY = Math.floor(gridSize.height / 2);
                        const gridX = centerX + d.x;
                        const gridY = centerY + d.y;
                        console.log(`🧪 Setting up detector ${d.index} at grid position (${gridX}, ${gridY}) from main challenge`);
                        return {
                            ...d,
                            x: gridX,
                            y: gridY
                        };
                    }),
                    challenge.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
                );

                setupDetectors = testDetectors;
                setDetectors(testDetectors);
                console.log('🧪 Test detectors initialized:', testDetectors.length);
                console.log('🧪 Detector positions:', testDetectors.map(d => `Detector ${d.index}: position=(${d.position?.x}, ${d.position?.y})`));
            } else {
                console.log('🧪 No main challenge detectors found');
            }

            console.log('🧪 Test scenario setup complete');

            // Wait for React state updates to complete by checking grid state
            const checkGridUpdate = () => {
                // Use a RAF-based approach to check for grid updates
                requestAnimationFrame(() => {
                    // Get current grid state via the grid ref to bypass React state timing
                    setGrid(currentGrid => {
                        const totalLiveCells = currentGrid.reduce((count, row) =>
                            count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0
                        );

                        // Check if we have the expected number of live cells (accounting for pre-play state)
                        if (expectedLiveCells === 0 || totalLiveCells >= expectedLiveCells) {
                            console.log(`🧪 Grid state confirmed with ${totalLiveCells} live cells`);
                            // Use a small delay to ensure detector states are also updated
                            setTimeout(() => resolve({detectors: setupDetectors}), 100);
                        } else {
                            console.log(`🧪 Waiting for grid update: expected >= ${expectedLiveCells}, current = ${totalLiveCells}`);
                            // Retry in next frame
                            setTimeout(checkGridUpdate, 50);
                        }

                        return currentGrid; // Return unchanged grid
                    });
                });
            };

            checkGridUpdate();
        });
    }, [brushes, gridSize, challenge]);

    // Helper function to run test at high speed
    const runTestAtHighSpeed = useCallback((setupData = {}) => {
        return new Promise(resolve => {
            console.log(`🧪 Running test at 128x speed for ${challenge?.targetTurn || 1000} generations`);

            const targetGenerations = challenge?.targetTurn || 1000;

            // Get the current grid state fresh from React state
            const getCurrentGridAndDetectors = () => {
                return new Promise(gridResolve => {
                    setGrid(currentGrid => {
                        setDetectors(currentDetectors => {
                            // Use detectors from setup data if available, otherwise fall back to React state
                            const detectorsToUse = setupData.detectors && setupData.detectors.length > 0
                                ? [...setupData.detectors]
                                : [...currentDetectors];

                            console.log(`🧪 Starting simulation with grid size: ${currentGrid.length}x${currentGrid[0]?.length || 0}, detectors: ${detectorsToUse.length}`);

                            // Verify we have the expected setup
                            if (detectorsToUse.length === 0) {
                                console.error('🧪 No detectors found - test scenario setup may not have completed properly');
                            } else {
                                console.log(`🧪 Using detectors from ${setupData.detectors ? 'setup data' : 'React state'}`);
                                detectorsToUse.forEach((d, i) => {
                                    console.log(`🧪 Detector ${i}: index=${d.index}, position=(${d.x}, ${d.y}), currentValue=${d.currentValue}`);
                                });
                            }

                            // Count non-empty cells to verify pattern was placed
                            const liveCells = currentGrid.reduce((count, row) =>
                                count + row.reduce((rowCount, cell) => rowCount + (cell ? 1 : 0), 0), 0
                            );
                            console.log(`🧪 Live cells at simulation start: ${liveCells}`);

                            gridResolve({
                                grid: currentGrid.map(row => [...row]),
                                detectors: detectorsToUse
                            });

                            return currentDetectors; // Return unchanged detectors
                        });
                        return currentGrid; // Return unchanged grid
                    });
                });
            };

            // Wait a bit for setup to complete, then get fresh state
            setTimeout(async () => {
                const {grid: currentGrid, detectors: currentDetectors} = await getCurrentGridAndDetectors();

                // Run simulation at high speed - smaller batch size for better UX
                const batchSize = 32; // Reduced from 128 for more frequent UI updates
                let currentGeneration = 0;
                let workingGrid = currentGrid;
                let workingDetectors = currentDetectors;

                const processBatch = () => {
                    // Validate current grid before processing
                    if (!workingGrid || !Array.isArray(workingGrid) || workingGrid.length === 0) {
                        console.error('🧪 Invalid grid state during test execution:', workingGrid);
                        resolve();
                        return;
                    }

                    // Process a batch of generations without state updates
                    for (let i = 0; i < batchSize && currentGeneration < targetGenerations; i++) {
                        try {
                            workingGrid = GameService.nextGeneration(workingGrid);
                            workingDetectors = DetectorService.updateDetectors(workingDetectors, workingGrid, currentGeneration);
                            currentGeneration++;
                        } catch (error) {
                            console.error(`🧪 Error during simulation at generation ${currentGeneration}:`, error);
                            resolve();
                            return;
                        }
                    }

                    // Update state with batch result for visual feedback
                    setGrid(workingGrid.map(row => [...row]));
                    setDetectors([...workingDetectors]);
                    setGeneration(currentGeneration);

                    if (currentGeneration >= targetGenerations) {
                        console.log(`🧪 Test simulation complete after ${currentGeneration} generations`);
                        resolve();
                        return;
                    }

                    // Progress logging - more frequent updates
                    if (currentGeneration % (batchSize * 2) === 0) {
                        console.log(`🧪 Test progress: ${currentGeneration}/${targetGenerations} generations (${Math.round((currentGeneration / targetGenerations) * 100)}%)`);
                    }

                    // Continue with next batch - minimal delay for UI updates
                    setTimeout(processBatch, 10);
                };

                processBatch();
            }, 100); // Reduced delay since we're now properly waiting for state
        });
    }, [challenge]);

    // Helper function to validate test scenario
    const validateTestScenario = useCallback((scenario) => {
        console.log(`🧪 Validating scenario: "${scenario.name}"`);

        if (!scenario.detectors || scenario.detectors.length === 0) {
            return {passed: true, message: 'No validation criteria specified'};
        }

        const results = {passed: true, details: {}, message: ''};

        // Validate detector states against scenario expected states
        scenario.detectors.forEach(scenarioDetector => {
            // Find the actual detector by index (detectors come from main challenge, not scenario)
            const detector = detectors.find(d => d.index === scenarioDetector.index);
            if (detector) {
                const actualState = detector.currentValue > 0 ? 'active' : 'inactive';
                const expectedState = scenarioDetector.state;
                const passed = actualState === expectedState;

                results.details[`detector_${scenarioDetector.index}`] = {
                    expected: expectedState,
                    actual: actualState,
                    passed
                };

                console.log(`🧪 Detector ${scenarioDetector.index}: expected ${expectedState}, got ${actualState} (${passed ? 'PASS' : 'FAIL'})`);

                if (!passed) {
                    results.passed = false;
                }
            } else {
                console.log(`🧪 Detector ${scenarioDetector.index}: not found in main challenge detectors (FAIL)`);
                results.details[`detector_${scenarioDetector.index}`] = {
                    expected: scenarioDetector.state,
                    actual: 'not_found',
                    passed: false
                };
                results.passed = false;
            }
        });

        // Generate result message
        if (results.passed) {
            results.message = `Test scenario "${scenario.name}" passed!`;
        } else {
            const failedDetectors = Object.keys(results.details)
                .filter(key => !results.details[key].passed)
                .map(key => {
                    const detail = results.details[key];
                    return `Detector ${key.split('_')[1]}: expected ${detail.expected}, got ${detail.actual}`;
                });
            results.message = `Test scenario "${scenario.name}" failed: ${failedDetectors.join(', ')}`;
        }

        return results;
    }, [detectors]);

    // Helper function to clear test scenario setup
    const clearTestScenarioSetup = useCallback(() => {
        return new Promise(resolve => {
            console.log('🧪 Clearing test scenario setup...');

            // Reset to pre-play state again
            resetToPrePlayState().then(() => {
                // Restore original challenge detectors if any
                if (challenge?.detectors && challenge.detectors.length > 0) {
                    const challengeDetectors = DetectorService.initializeChallengeDetectors(
                        challenge.detectors.map(d => {
                            const centerX = Math.floor(gridSize.width / 2);
                            const centerY = Math.floor(gridSize.height / 2);
                            const gridX = centerX + d.x;
                            const gridY = centerY + d.y;
                            return {
                                ...d,
                                x: gridX,
                                y: gridY
                            };
                        }),
                        challenge.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
                    );
                    setDetectors(challengeDetectors);
                } else {
                    setDetectors([]);
                }

                console.log('🧪 Test scenario setup cleared');
                resolve();
            });
        });
    }, [challenge, gridSize, resetToPrePlayState]);


    // Handle test scenarios
    const handleTest = useCallback(async () => {
        console.log('🧪 TEST BUTTON PRESSED - handleTest called');

        if (!challenge || !challenge.testScenarios || challenge.testScenarios.length === 0) {
            console.log('🧪 No test scenarios available for this challenge');
            return {
                allPassed: false,
                message: 'No test scenarios available for this challenge',
                scenarios: []
            };
        }

        // Stop the game if running
        if (onRunningChangeRef.current) {
            onRunningChangeRef.current(false);
        }

        try {
            const scenarios = challenge.testScenarios;
            const results = [];
            console.log(`🧪 Running ${scenarios.length} test scenario(s)`);

            for (let i = 0; i < scenarios.length; i++) {
                const scenario = scenarios[i];
                console.log(`🧪 Running scenario ${i + 1}: ${scenario.name}`);

                // Step 1: Reset the entire board but keep user's placements made on generation 0
                await resetToPrePlayState();

                // Step 2: Setup the brushes in the test scenario and get detector data
                const setupData = await applyTestScenarioSetup(scenario);

                // Step 3: Run the test at 128x speed with setup data
                await runTestAtHighSpeed(setupData);

                // Step 4: Validate detector states
                const testResult = validateTestScenario(scenario);
                results.push({
                    name: scenario.name,
                    description: scenario.description,
                    passed: testResult.passed,
                    message: testResult.message,
                    details: testResult.details
                });

                console.log(`🧪 Scenario "${scenario.name}" result:`, testResult.passed ? 'PASSED ✅' : 'FAILED ❌');
                if (!testResult.passed) {
                    console.log(`🧪 Failure details: ${testResult.message}`);
                }

                // Step 5: Clear the test scenario setup (restore to pre-test state)
                await clearTestScenarioSetup();

                // Brief pause between scenarios for UI updates
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            const allPassed = results.every(result => result.passed);
            const passedCount = results.filter(result => result.passed).length;

            console.log('🧪 All test scenarios completed');
            console.log(`🧪 Results: ${passedCount}/${results.length} scenarios passed`);

            const testResults = {
                allPassed,
                message: `${passedCount}/${results.length} scenarios passed`,
                scenarios: results
            };

            // Store results in ref for level completion logic
            testResultsRef.current = testResults;

            return testResults;

        } catch (error) {
            console.error('🧪 Error during test execution:', error);
            const errorResults = {
                allPassed: false,
                message: 'Error during test execution: ' + error.message,
                scenarios: []
            };

            // Store error results in ref for level completion logic
            testResultsRef.current = errorResults;

            return errorResults;
        }
    }, [challenge, onRunningChangeRef, resetToPrePlayState, applyTestScenarioSetup, runTestAtHighSpeed, validateTestScenario, clearTestScenarioSetup]);

    // Handle window resize to keep canvas fitted to container (only for non-challenge mode)
    // Window resize handler - only responds to actual window resize events
    useEffect(() => {
        const handleResize = () => {
            // Always recalculate canvas size to update scrolling behavior
            const newCanvasSize = calculateCanvasSize(challenge, cellSize);
            setCanvasSize(newCanvasSize);

            // Skip grid resize for challenge mode with fixed dimensions
            if (challenge && challenge.width && challenge.height) {
                return;
            }

            const newGridWidth = Math.floor(newCanvasSize.maxWidth / cellSize);
            const newGridHeight = Math.floor(newCanvasSize.maxHeight / cellSize);
            setGridSize({width: newGridWidth, height: newGridHeight});

            // Resize grid while preserving center at 0,0
            setGrid(prevGrid => {
                return GameService.resizeGrid(prevGrid, newGridWidth, newGridHeight);
            });
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [challenge]); // Removed cellSize - window resize should not trigger on zoom

    // Check for level completion when generation changes
    useEffect(() => {
        if (challenge && generation > 0) {
            const result = checkLevelCompletion(grid, generation, challenge, levelCompleted, levelFailed, detectors, testResultsRef);

            if (result.needsTestExecution) {
                // Automatically run test scenarios when target turn is reached for challenges with test scenarios
                console.log('🧪 Auto-running test scenarios for level completion check...');
                handleTest().then(testResults => {
                    testResultsRef.current = testResults;

                    // Re-check level completion with test results
                    const finalResult = checkLevelCompletion(grid, generation, challenge, levelCompleted, levelFailed, detectors, testResultsRef);
                    if (finalResult.completed) {
                        setLevelCompleted(true);
                        if (onRunningChangeRef.current) onRunningChangeRef.current(false);
                    } else if (finalResult.failed) {
                        setLevelFailed(true);
                        if (onRunningChangeRef.current) onRunningChangeRef.current(false);
                    }
                }).catch(error => {
                    console.error('🧪 Error auto-running test scenarios:', error);
                    // On test error, consider it a failure
                    setLevelFailed(true);
                    if (onRunningChangeRef.current) onRunningChangeRef.current(false);
                });
            } else if (result.completed) {
                setLevelCompleted(true);
                if (onRunningChangeRef.current) onRunningChangeRef.current(false);
            } else if (result.failed) {
                setLevelFailed(true);
                if (onRunningChangeRef.current) onRunningChangeRef.current(false);
            }
        }
    }, [generation, grid, challenge, checkLevelCompletion, levelCompleted, levelFailed, detectors, handleTest]);

    // Initialize detector states when play starts
    useEffect(() => {
        if (running && generation === 0 && detectors.length > 0) {
            // Check if any detectors are initially covered and activate them
            const initializedDetectors = DetectorService.initializeDetectorStates(detectors, grid, generation);

            // Only update if there were changes
            const hasChanges = initializedDetectors.some((detector, index) =>
                detector.currentValue !== detectors[index].currentValue ||
                detector.activationTimer !== detectors[index].activationTimer
            );

            if (hasChanges) {
                setDetectors(initializedDetectors);
            }
        }
    }, [running, generation, detectors, grid]);

    // Capture initial placed objects state for reset functionality
    useEffect(() => {
        if (generation === 0) {
            setInitialPlacedObjects([...placedObjects]);
        }
    }, [placedObjects, generation]);

    // Capture prePlayBoardState when user is at generation 0 with current grid
    useEffect(() => {
        if (generation === 0 && grid) {
            setPrePlayBoardState(grid.map(arr => [...arr]));
        }
    }, [grid, generation]);

    // Notify parent component when detectors change
    useEffect(() => {
        if (onDetectorsChange) {
            onDetectorsChange(detectors);
        }
    }, [detectors, onDetectorsChange]);

    // Update grid when challenge changes
    useEffect(() => {
        const currentChallengeName = challenge?.name;
        const previousChallengeName = previousChallengeNameRef.current;
        const challengeChanged = previousChallengeName !== currentChallengeName;

        // Always clear guidance lines FIRST when challenge changes
        // This ensures guidance lines from previous levels don't persist
        if (challengeChanged && onResetGuidanceLineObjects) {
            console.log('🎯 CHALLENGE CHANGED - Resetting guidance line objects:', {
                previousChallenge: previousChallengeName,
                newChallenge: challenge?.name,
                challengeChanged
            });
            onResetGuidanceLineObjects();
            // Reset setup completion tracking for new challenge
            setupCompletedRef.current = null;
        }

        // Only reset other game state if challenge actually changed
        if (challengeChanged) {
            // Clear test results for new challenge
            testResultsRef.current = null;

            // ...existing code...
            if (onRunningChangeRef.current) onRunningChangeRef.current(false);
            if (onPatternSelectRef.current) {
                onPatternSelectRef.current(null);
            }

            setLevelCompleted(false);
            setLevelFailed(false);
            setGeneration(0);

            // Calculate new grid size for the new challenge
            const newCanvasSize = calculateCanvasSize(challenge, cellSize);
            const newGridSize = challenge && challenge.width && challenge.height
                ? {width: challenge.width, height: challenge.height}
                : {
                    width: Math.floor(newCanvasSize.maxWidth / cellSize),
                    height: Math.floor(newCanvasSize.maxHeight / cellSize)
                };

            setCanvasSize(newCanvasSize);
            setGridSize(newGridSize);

            // Create new grid only when challenge changes
            const newGrid = GameService.createEmptyGrid(newGridSize.width, newGridSize.height);
            setGrid(newGrid);
            setSetupBoardState(newGrid.map(arr => [...arr]));
            setPrePlayBoardState(newGrid.map(arr => [...arr]));
        }

        // Update refs at the end - handles React Strict Mode double execution correctly
        previousChallengeRef.current = challenge;
        previousChallengeNameRef.current = currentChallengeName;
    }, [challenge, onResetGuidanceLineObjects]); // Removed cellSize to prevent false triggers

    // Separate effect for handling cellSize changes (zoom)
    useEffect(() => {
        if (!challenge) return; // Only update if we have a challenge

        // Calculate new canvas and grid sizes based on new cellSize
        const newCanvasSize = calculateCanvasSize(challenge, cellSize);
        const newGridSize = challenge && challenge.width && challenge.height
            ? {width: challenge.width, height: challenge.height}
            : {
                width: Math.floor(newCanvasSize.maxWidth / cellSize),
                height: Math.floor(newCanvasSize.maxHeight / cellSize)
            };


        setCanvasSize(newCanvasSize);
        setGridSize(newGridSize);

        // Note: We intentionally do NOT clear guidance lines or reset grid here
        // This effect is only for updating rendering dimensions during zoom
    }, [cellSize, challenge]);

    // Separate effect for detector initialization - runs whenever challenge data changes
    useEffect(() => {
        // Clear existing detectors
        setDetectors([]);

        // Initialize challenge detectors if the challenge has them
        if (challenge?.detectors && challenge.detectors.length > 0) {
            // Get current grid size for coordinate conversion
            const currentGridSize = challenge && challenge.width && challenge.height
                ? {width: challenge.width, height: challenge.height}
                : gridSize;

            const challengeDetectors = DetectorService.initializeChallengeDetectors(
                challenge.detectors.map(d => {
                    const centerX = Math.floor(currentGridSize.width / 2);
                    const centerY = Math.floor(currentGridSize.height / 2);
                    const gridX = centerX + d.x;
                    const gridY = centerY + d.y;

                    return {
                        ...d,
                        x: gridX,
                        y: gridY
                    };
                }),
                challenge.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
            );
            setDetectors(challengeDetectors);
        }
    }, [challenge, gridSize]);

    // Load setup patterns when brushes become available (separate from main useEffect)
    useEffect(() => {
        const challengeKey = `${challenge?.name}_${challenge?.setup?.length || 0}`;

        console.log('🎯 SETUP EFFECT STARTED:', {
            hasChallenge: !!challenge,
            challengeName: challenge?.name,
            challengeKey,
            previousSetupKey: setupCompletedRef.current,
            hasSetup: !!(challenge?.setup && challenge.setup.length > 0),
            setupLength: challenge?.setup?.length || 0,
            brushesLoaded,
            hasBrushes: !!(brushes && Object.keys(brushes).length > 0),
            brushCount: Object.keys(brushes || {}).length
        });

        // Always ensure we have a consistent state
        if (!challenge) {
            console.log('🎯 SETUP EFFECT - No challenge, resetting guidance lines');
            if (onResetGuidanceLineObjects) {
                onResetGuidanceLineObjects();
            }
            setupCompletedRef.current = null;
            return;
        }

        if (!brushesLoaded) {
            console.log('🎯 SETUP EFFECT - Brushes not loaded yet, skipping setup');
            return;
        }

        // If challenge has no setup, clear guidance lines and return
        if (!challenge.setup || challenge.setup.length === 0) {
            console.log('🎯 SETUP EFFECT - Challenge has no setup patterns, resetting guidance lines');
            if (onResetGuidanceLineObjects && setupCompletedRef.current !== challengeKey) {
                onResetGuidanceLineObjects();
                setupCompletedRef.current = challengeKey;
            }
            return;
        }

        // Check if we've already completed setup for this exact challenge
        if (setupCompletedRef.current === challengeKey) {
            console.log('🎯 SETUP EFFECT - Setup already completed for this challenge, skipping');
            return;
        }


        // Update grid with setup patterns
        setGrid(currentGrid => {
            const newGrid = currentGrid.map(arr => [...arr]);
            const {centerOffsetX, centerOffsetY} = getCenterOffsets(newGrid);

            for (const setupItem of challenge.setup) {
                const baseBrush = brushes[setupItem.brush];
                if (baseBrush && baseBrush.pattern) {
                    // Apply rotation if specified
                    let brush = baseBrush;
                    if (setupItem.rotate && setupItem.rotate !== 0) {
                        const rotations = Math.floor(setupItem.rotate / 90) % 4;
                        for (let i = 0; i < rotations; i++) {
                            brush = BrushService.transformPattern(brush, 'rotateClockwise');
                        }
                    }

                    // Place rotated brush pattern at specified coordinates
                    for (const [dy, dx] of brush.pattern) {
                        const gridY = centerOffsetY + setupItem.y + dy;
                        const gridX = centerOffsetX + setupItem.x + dx;
                        if (gridY >= 0 && gridY < newGrid.length && gridX >= 0 && gridX < newGrid[0].length) {
                            newGrid[gridY][gridX] = 1;
                        }
                    }
                }
            }

            // Synchronously update setup board state with the challenge patterns
            setSetupBoardState(newGrid.map(arr => [...arr]));
            // Also initialize prePlayBoardState to the setup (will be updated when user places things)
            setPrePlayBoardState(newGrid.map(arr => [...arr]));

            return newGrid;
        });

        // Initialize setup guidance lines (moved outside setGrid callback)
        const setupGuidanceLineObjects = [];
        const currentGridSize = challenge && challenge.width && challenge.height
            ? {width: challenge.width, height: challenge.height}
            : {
                width: Math.floor(calculateCanvasSize(challenge, cellSize).maxWidth / cellSize),
                height: Math.floor(calculateCanvasSize(challenge, cellSize).maxHeight / cellSize)
            };

        // Calculate center offsets correctly
        const centerOffsetX = Math.floor(currentGridSize.width / 2);
        const centerOffsetY = Math.floor(currentGridSize.height / 2);

        for (const setupItem of challenge.setup) {
            const baseBrush = brushes[setupItem.brush];
            console.log('🎯 SETUP EFFECT - Processing setup item:', {
                brushName: setupItem.brush,
                hasBrush: !!baseBrush,
                brushKeys: baseBrush ? Object.keys(baseBrush) : null,
                hasGuidanceLines: !!(baseBrush?.guidanceLines),
                hasGuidanceLine: !!(baseBrush?.guidanceLine),
                guidanceLinesLength: baseBrush?.guidanceLines?.length,
                setupItem
            });

            if (baseBrush) {
                // Apply the same rotation as used for pattern placement
                let brush = baseBrush;
                if (setupItem.rotate && setupItem.rotate !== 0) {
                    const rotations = Math.floor(setupItem.rotate / 90) % 4;
                    for (let i = 0; i < rotations; i++) {
                        brush = BrushService.transformPattern(brush, 'rotateClockwise');
                    }
                }

                // Handle multiple guidance lines from the rotated brush
                const guidanceLines = brush.guidanceLines || (brush.guidanceLine ? [brush.guidanceLine] : []);

                console.log('🎯 SETUP EFFECT - Guidance lines for brush:', {
                    brushName: setupItem.brush,
                    guidanceLinesCount: guidanceLines.length,
                    guidanceLines: guidanceLines.map(gl => ({
                        direction: gl.direction,
                        length: gl.length,
                        startX: gl.startX,
                        startY: gl.startY
                    }))
                });

                for (const guidanceLine of guidanceLines) {
                    // Create guidance line object for this setup pattern
                    const placementX = centerOffsetX + setupItem.x;
                    const placementY = centerOffsetY + setupItem.y;

                    console.log('🎯 SETUP EFFECT - Creating guidance line object:', {
                        brushName: setupItem.brush,
                        guidanceLine,
                        placementX,
                        placementY,
                        centerOffsets: { centerOffsetX, centerOffsetY },
                        setupPosition: { x: setupItem.x, y: setupItem.y }
                    });

                    const guidanceLineObject = createGuidanceLineFromBrush(
                        guidanceLine,
                        0, // Setup guidance lines are at generation 0
                        placementX,
                        placementY
                    );

                    console.log('🎯 SETUP EFFECT - Guidance line object created:', {
                        success: !!guidanceLineObject,
                        guidanceLineObject: guidanceLineObject ? {
                            id: guidanceLineObject.id,
                            direction: guidanceLineObject.direction,
                            generation: guidanceLineObject.generation,
                            originX: guidanceLineObject.originX,
                            originY: guidanceLineObject.originY
                        } : null
                    });

                    if (guidanceLineObject) {
                        setupGuidanceLineObjects.push(guidanceLineObject);
                    }
                }
            }
        }

        // Always reset guidance line objects when loading setup (clear previous level's guidance lines)
        if (onResetGuidanceLineObjects) {
            console.log('🎯 SETUP EFFECT - Resetting guidance line objects before adding setup patterns:', {
                challengeName: challenge?.name,
                hasSetup: !!(challenge?.setup && challenge.setup.length > 0),
                setupLength: challenge?.setup?.length || 0,
                brushesLoaded: brushesLoaded,
                setupGuidanceLineObjectsCount: setupGuidanceLineObjects.length
            });
            onResetGuidanceLineObjects(); // Clear any existing guidance line objects

            // Add setup guidance line objects if any exist
            if (onAddGuidanceLineObject && setupGuidanceLineObjects.length > 0) {
                console.log('🎯 SETUP EFFECT - Adding setup guidance line objects:', {
                    count: setupGuidanceLineObjects.length,
                    objects: setupGuidanceLineObjects.map(obj => ({
                        id: obj.id,
                        direction: obj.direction,
                        originX: obj.originX,
                        originY: obj.originY
                    }))
                });
                setupGuidanceLineObjects.forEach(guidanceLineObject => {
                    onAddGuidanceLineObject(guidanceLineObject);
                });
            } else {
                console.log('🎯 SETUP EFFECT - No guidance line objects to add:', {
                    hasAddFunction: !!onAddGuidanceLineObject,
                    guidanceLineObjectsCount: setupGuidanceLineObjects.length
                });
            }

            // Mark setup as completed for this challenge
            setupCompletedRef.current = challengeKey;
            console.log('🎯 SETUP EFFECT - Setup completed for challenge:', challengeKey);
        }
    }, [challenge, brushes, brushesLoaded, onAddGuidanceLineObject, onResetGuidanceLineObjects]); // Removed cellSize to prevent false triggers
    useEffect(() => {
        // Update setupBoardState and prePlayBoardState based on current grid state
        if (challenge?.setup?.length > 0 && grid.some(row => row.some(cell => cell))) {
            // If this is the first time loading setup patterns, capture as setupBoardState
            if (!setupBoardState || setupBoardState.every(row => row.every(cell => cell === 0))) {
                setSetupBoardState(grid.map(arr => [...arr]));
            }
            // Always update prePlayBoardState when grid changes at generation 0
            if (generation === 0) {
                setPrePlayBoardState(grid.map(arr => [...arr]));
            }
        } else if (!challenge?.setup?.length) {
            // For challenges without setup, ensure both states are empty
            const emptyGrid = GameService.createEmptyGrid(gridSize.width, gridSize.height);
            setSetupBoardState(emptyGrid.map(arr => [...arr]));
            if (generation === 0) {
                setPrePlayBoardState(emptyGrid.map(arr => [...arr]));
            }
        }
    }, [grid, challenge?.setup, gridSize.width, gridSize.height, generation]);

    // Pattern integrity checking - check and update intact flags when grid changes
    useEffect(() => {
        if (placedObjects.length > 0 && brushes && Object.keys(brushes).length > 0) {
            console.log('🎯 INTEGRITY CHECK - Checking integrity of placed objects:', {
                placedObjectsCount: placedObjects.length,
                placedObjects: placedObjects.map(obj => ({
                    id: obj.id,
                    brushName: obj.brushName,
                    intact: obj.intact,
                    guidanceLinesCount: obj.guidanceLines?.length || 0
                }))
            });

            // Check integrity of all placed objects
            const updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(
                placedObjects,
                grid,
                brushes
            );

            console.log('🎯 INTEGRITY CHECK - After checking integrity:', {
                updatedObjects: updatedObjects.map(obj => ({
                    id: obj.id,
                    brushName: obj.brushName,
                    intact: obj.intact,
                    guidanceLinesCount: obj.guidanceLines?.length || 0
                }))
            });

            // Only update state if integrity flags have changed
            const integrityChanged = updatedObjects.some((obj, index) =>
                obj.intact !== placedObjects[index]?.intact
            );

            if (integrityChanged) {
                console.log('🎯 INTEGRITY CHECK - Integrity changed, updating placed objects');
                setPlacedObjects(updatedObjects);
            } else {
                console.log('🎯 INTEGRITY CHECK - No integrity changes detected');
            }
        }
    }, [grid, placedObjects, brushes]);

    // Sync guidance line objects when placed object integrity changes
    useEffect(() => {
        if (!onAddGuidanceLineObject || !onResetGuidanceLineObjects) return;

        // Only run this effect if there are actually placed objects to sync
        if (placedObjects.length === 0) return;

        console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Syncing guidance lines for placed objects:', {
            placedObjectsCount: placedObjects.length,
            hasGuidanceLineObjects: !!(guidanceLineObjects && guidanceLineObjects.length > 0),
            placedObjectsDetails: placedObjects.map(obj => ({
                id: obj.id,
                brushName: obj.brushName,
                intact: obj.intact,
                guidanceLinesCount: obj.guidanceLines?.length || 0,
                guidanceLineIds: obj.guidanceLines?.map(gl => gl.id) || []
            }))
        });

        // Get current guidance lines from placed objects (only intact ones)
        const currentGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(placedObjects);

        console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Current guidance lines from placed objects:', {
            currentGuidanceLinesCount: currentGuidanceLines.length,
            currentGuidanceLines: currentGuidanceLines.map(gl => ({
                id: gl.id,
                direction: gl.direction,
                originX: gl.originX,
                originY: gl.originY
            }))
        });

        // Create a set of current guidance line IDs for comparison
        const currentGuidanceIds = new Set(currentGuidanceLines.map(gl => gl.id));

        // Check if the guidance line objects have changed
        if (guidanceLineObjects) {
            const existingPlacedObjectGuidanceIds = new Set(
                guidanceLineObjects
                    .filter(gl => gl.id && (gl.id.includes('placed_') || gl.id.includes('guidance_')))
                    .map(gl => gl.id)
            );

            // If the sets are different, we need to update the guidance line objects
            const guidanceLinesChanged =
                currentGuidanceIds.size !== existingPlacedObjectGuidanceIds.size ||
                [...currentGuidanceIds].some(id => !existingPlacedObjectGuidanceIds.has(id)) ||
                [...existingPlacedObjectGuidanceIds].some(id => !currentGuidanceIds.has(id));

            console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Checking if guidance lines changed:', {
                currentGuidanceIds: Array.from(currentGuidanceIds),
                existingPlacedObjectGuidanceIds: Array.from(existingPlacedObjectGuidanceIds),
                guidanceLinesChanged
            });

            if (guidanceLinesChanged) {
                console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Updating guidance line objects due to placed object changes');

                // Remove old placed object guidance lines and add new ones
                // Setup guidance lines have IDs starting with 'guidance_' but are NOT from placed objects
                // Placed object guidance lines have IDs starting with 'placed_'
                const setupGuidanceLines = guidanceLineObjects.filter(gl => {
                    if (!gl.id) return true; // Keep objects without IDs (shouldn't happen but be safe)
                    // Keep guidance lines that are NOT from placed objects (i.e., setup guidance lines)
                    return !gl.id.includes('placed_');
                });

                console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Preserving setup guidance lines:', {
                    setupGuidanceLinesCount: setupGuidanceLines.length,
                    setupGuidanceLineIds: setupGuidanceLines.map(gl => gl.id),
                    allGuidanceLineIds: guidanceLineObjects.map(gl => gl.id)
                });

                // Reset guidance lines and restore setup ones + current intact ones
                onResetGuidanceLineObjects();

                // Re-add setup guidance lines
                setupGuidanceLines.forEach(gl => onAddGuidanceLineObject(gl));

                // Add current intact guidance lines
                currentGuidanceLines.forEach(gl => onAddGuidanceLineObject(gl));

                console.log('🎯 PLACED OBJECTS GUIDANCE SYNC - Guidance line objects updated');
            }
        }
    }, [placedObjects, onAddGuidanceLineObject, onResetGuidanceLineObjects]); // Removed guidanceLineObjects dependency

    // Optimized animation loop using requestAnimationFrame
    const animationCallback = useCallback(() => {
        // Prevent double execution in React.StrictMode
        if (animationExecutionRef.current) {
            return;
        }

        animationExecutionRef.current = true;

        let nextGrid;
        let nextGeneration;

        setGrid(currentGrid => {
            setPreviousGrid(currentGrid); // Store previous grid for rendering optimization
            nextGrid = GameService.nextGeneration(currentGrid);
            return nextGrid;
        });

        setGeneration(currentGeneration => {
            nextGeneration = currentGeneration + 1;
            return nextGeneration;
        });

        // Update detectors with the correct grid and generation values
        setDetectors(currentDetectors => {
            return DetectorService.updateDetectors(currentDetectors, nextGrid, nextGeneration);
        });

        // Reset flag for next frame
        animationExecutionRef.current = false;
    }, []); // No dependencies needed as this callback uses local variables

    // Use performance-optimized animation loop
    useAnimationLoop(running, animationCallback, speed);

    // Hide guidance lines when running, show when stopped
    useEffect(() => {
        console.log('🎯 Guidance line visibility effect triggered:', {
            running,
            guidanceLinesVisible,
            hasSetFunction: !!onSetGuidanceLinesVisible
        });

        if (onSetGuidanceLinesVisible) {
            if (running && guidanceLinesVisible) {
                console.log('🎯 Hiding guidance lines because game is running');
                onSetGuidanceLinesVisible(false);
            } else if (!running && !guidanceLinesVisible) {
                console.log('🎯 Showing guidance lines because game is stopped');
                onSetGuidanceLinesVisible(true);
            } else {
                console.log('🎯 No guidance line visibility change needed:', {
                    reason: running ? 'running and already hidden' : 'stopped and already visible'
                });
            }
        } else {
            console.log('🎯 No guidance line visibility function available');
        }
    }, [running, guidanceLinesVisible, onSetGuidanceLinesVisible]);


    // Event handlers
    const handleCanvasClick = useCallback((e) => {
        console.log('🎯 CLICK - Canvas click detected:', {
            running,
            placedObjectsCount: placedObjects.length,
            hasPlacedObjects: placedObjects.length > 0
        });

        if (running) return;

        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const gridX = Math.floor(mouseX / cellSize);
        const gridY = Math.floor(mouseY / cellSize);

        console.log('🎯 CLICK - Click position:', {
            mouseX,
            mouseY,
            gridX,
            gridY,
            cellSize
        });

        // Check for move handle clicks first (highest priority)
        if (!running && placedObjects.length > 0) {
            console.log('🎯 CLICK - Checking for move handle clicks...');
            const handleSize = Math.max(6, Math.min(cellSize / 3, 12));
            const handleClickRadius = handleSize / 2;

            console.log('🎯 CLICK - Handle detection parameters:', {
                handleSize,
                handleClickRadius,
                placedObjectsToCheck: placedObjects.length,
                cellSize
            });

            let foundAnyHandle = false;
            for (const obj of placedObjects) {
                // Get the top-left corner of the placed object (where handle is positioned)
                const minX = Math.min(...obj.pixels.map(p => p.x));
                const minY = Math.min(...obj.pixels.map(p => p.y));
                const handleX = minX * cellSize;
                const handleY = minY * cellSize;

                // Check if click is within handle area
                const distanceX = Math.abs(mouseX - handleX);
                const distanceY = Math.abs(mouseY - handleY);

                console.log('🎯 CLICK - Checking object:', {
                    objectId: obj.id,
                    brushName: obj.brushName,
                    handlePosition: { x: minX, y: minY },
                    handlePixelPosition: { x: handleX, y: handleY },
                    mousePosition: { x: mouseX, y: mouseY },
                    clickDistance: { x: distanceX, y: distanceY },
                    handleClickRadius,
                    isWithinX: distanceX <= handleClickRadius,
                    isWithinY: distanceY <= handleClickRadius,
                    bothWithin: distanceX <= handleClickRadius && distanceY <= handleClickRadius
                });

                if (distanceX <= handleClickRadius && distanceY <= handleClickRadius) {
                    foundAnyHandle = true;
                    console.log('🎯 CLICK - Move handle clicked for object:', {
                        objectId: obj.id,
                        brushName: obj.brushName,
                        handlePosition: { x: minX, y: minY },
                        clickPosition: { x: mouseX, y: mouseY }
                    });

                    // Convert placed object back to brush and select it
                    const brushId = obj.brushId || obj.brushName;
                    const sourceBrush = brushes && brushId ? (brushes[brushId] || brushes[obj.brushName]) : null;
                    if (sourceBrush && onPatternSelectRef.current) {
                        console.log('🎯 CLICK - Converting to brush:', {
                            brushName: obj.brushName,
                            brushId: brushId,
                            hasBrush: !!sourceBrush,
                            hasOnPatternSelect: !!onPatternSelectRef.current,
                            rotation: obj.rotation || 0
                        });

                        let brush = { ...sourceBrush };

                        // Apply rotation if object was rotated
                        if (obj.rotation && obj.rotation !== 0) {
                            const rotations = Math.floor(obj.rotation / 90) % 4;
                            for (let i = 0; i < rotations; i++) {
                                brush = BrushService.transformPattern(brush, 'rotateClockwise');
                            }
                            console.log('🎯 CLICK - Applied rotation:', { rotations, finalBrush: brush.name });
                        }

                        // Select the brush
                        console.log('🎯 CLICK - Selecting brush...');
                        onPatternSelectRef.current(brush);
                        console.log('🎯 CLICK - Brush selected');

                        // Remove the placed object and its guidance lines
                        console.log('🎯 CLICK - Removing placed object...');
                        setPlacedObjects(currentObjects => {
                            const removed = PlacedObjectService.removePlacedObject(currentObjects, obj.id);
                            console.log('🎯 CLICK - Placed objects updated:', {
                                previousCount: currentObjects.length,
                                newCount: removed.length,
                                removedObjectId: obj.id
                            });
                            return removed;
                        });

                        // Remove object pixels from grid
                        console.log('🎯 CLICK - Removing pixels from grid...');
                        setGrid(g => {
                            const newGrid = g.map(arr => [...arr]);
                            let removedPixels = 0;
                            obj.pixels.forEach(pixel => {
                                if (pixel.y >= 0 && pixel.y < newGrid.length &&
                                    pixel.x >= 0 && pixel.x < newGrid[0].length) {
                                    newGrid[pixel.y][pixel.x] = 0;
                                    removedPixels++;
                                }
                            });
                            console.log('🎯 CLICK - Pixels removed from grid:', removedPixels);
                            return newGrid;
                        });

                        console.log('🎯 CLICK - Placed object converted back to brush and removed');
                        return; // Exit early, don't process as grid click
                    } else {
                        console.log('🎯 CLICK - Could not convert to brush:', {
                            hasBrushes: !!brushes,
                            brushExists: brushes ? !!(brushes[obj.brushId || obj.brushName] || brushes[obj.brushName]) : false,
                            brushName: obj.brushName,
                            brushId: brushId,
                            availableBrushes: brushes ? Object.keys(brushes) : [],
                            hasOnPatternSelect: !!onPatternSelectRef.current
                        });
                    }
                }
            }

            if (!foundAnyHandle) {
                console.log('🎯 CLICK - No move handle clicked, continuing with normal click processing');
            }
        } else {
            console.log('🎯 CLICK - Skipping move handle check:', {
                reason: running ? 'game is running' : 'no placed objects',
                running,
                placedObjectsCount: placedObjects.length
            });
        }

        // Check bounds
        const maxGridX = (gridSize.width || gridSize) - 1;
        const maxGridY = (gridSize.height || gridSize) - 1;
        if (gridX < 0 || gridX > maxGridX || gridY < 0 || gridY > maxGridY) {
            return;
        }

        // In admin mode, allow editing everywhere. Otherwise, check editableCell restrictions
        if (!adminMode && !isEditableCell(gridX, gridY)) {
            return;
        }


        // Convert to center-based coordinates if needed for logging
        if (pasting && selectedPattern && selectedPattern.pattern) {
            // Check if this is an eraser pattern
            const isEraser = BrushService.isEraserPattern(selectedPattern);
            // Check if this is a detector pattern
            const isDetector = BrushService.isDetectorPattern(selectedPattern);

            if (isDetector) {
                // Handle detector placement
                setDetectors(currentDetectors => {
                    // Remove any existing detectors at this position first (if erasing)
                    const filteredDetectors = isEraser ?
                        DetectorService.removeDetectorsAtPosition(currentDetectors, {
                            x: gridX,
                            y: gridY
                        }, selectedPattern.pattern) :
                        currentDetectors;

                    // Add new detector if not erasing
                    return isEraser ? filteredDetectors :
                        DetectorService.addDetector(filteredDetectors, selectedPattern, {x: gridX, y: gridY}, {
                            falloffPeriod: challenge?.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
                        });
                });
            } else {
                // Handle normal pattern placement using placed objects system

                if (isEraser) {
                    // Handle erasing: remove placed objects at this position
                    setPlacedObjects(currentObjects => {
                        const objectToRemove = PlacedObjectService.findPlacedObjectAt(currentObjects, gridX, gridY);
                        if (objectToRemove) {
                            // Remove associated guidance lines
                            if (onResetGuidanceLineObjects) {
                                const remainingObjects = PlacedObjectService.removePlacedObject(currentObjects, objectToRemove.id);
                                const remainingGuidanceLines = PlacedObjectService.extractGuidanceLines(remainingObjects);

                                // Reset and restore remaining guidance lines
                                onResetGuidanceLineObjects();
                                remainingGuidanceLines.forEach(guidanceLineObject => {
                                    onAddGuidanceLineObject(guidanceLineObject);
                                });
                            }

                            return PlacedObjectService.removePlacedObject(currentObjects, objectToRemove.id);
                        }
                        return currentObjects;
                    });

                    // Also erase from grid
                    setGrid(g => {
                        const newGrid = g.map(arr => [...arr]);
                        for (const coord of selectedPattern.pattern) {
                            if (Array.isArray(coord) && coord.length === 2) {
                                const [dy, dx] = coord;
                                const ny = gridY + dy, nx = gridX + dx;
                                if (ny >= 0 && ny < (gridSize.height || gridSize) &&
                                    nx >= 0 && nx < (gridSize.width || gridSize) &&
                                    (adminMode || isEditableCell(nx, ny))) {
                                    newGrid[ny][nx] = 0;
                                }
                            }
                        }
                        return newGrid;
                    });
                } else {
                    // Handle pattern placement: create placed object with linked guidance lines
                    console.log('🎯 PLACEMENT - Creating placed object:', {
                        patternName: selectedPattern.name,
                        gridPosition: { x: gridX, y: gridY },
                        generation,
                        hasPattern: !!selectedPattern.pattern,
                        patternSize: selectedPattern.pattern?.length || 0
                    });

                    const placedObject = PlacedObjectService.createPlacedObject(
                        selectedPattern,
                        gridX,
                        gridY,
                        generation,
                        0 // rotation - could be extended later
                    );

                    console.log('🎯 PLACEMENT - Placed object created:', {
                        id: placedObject.id,
                        brushName: placedObject.brushName,
                        pixelCount: placedObject.pixels?.length || 0,
                        guidanceLineCount: placedObject.guidanceLines?.length || 0,
                        pixels: placedObject.pixels?.slice(0, 3), // Show first 3 pixels
                        hasPixels: !!(placedObject.pixels && placedObject.pixels.length > 0)
                    });

                    // Add placed object to tracking
                    setPlacedObjects(currentObjects => {
                        const newObjects = [...currentObjects, placedObject];
                        console.log('🎯 PLACEMENT - Updated placed objects:', {
                            previousCount: currentObjects.length,
                            newCount: newObjects.length,
                            newObject: placedObject.id
                        });
                        return newObjects;
                    });

                    // Add guidance lines to the guidance line system
                    if (onAddGuidanceLineObject && placedObject.guidanceLines.length > 0) {
                        console.log('🎯 Adding guidance line objects from placed pattern:', {
                            patternName: selectedPattern.name,
                            guidanceLineCount: placedObject.guidanceLines.length,
                            guidanceLines: placedObject.guidanceLines.map(gl => ({
                                id: gl.id,
                                direction: gl.direction,
                                generation: gl.generation,
                                originX: gl.originX,
                                originY: gl.originY
                            })),
                            currentlyVisible: guidanceLinesVisible
                        });

                        placedObject.guidanceLines.forEach(guidanceLineObject => {
                            onAddGuidanceLineObject(guidanceLineObject);
                        });

                        // Make sure guidance lines are visible when new ones are created
                        if (onSetGuidanceLinesVisible && !guidanceLinesVisible) {
                            console.log('🎯 Making guidance lines visible after placing pattern with guidance lines');
                            onSetGuidanceLinesVisible(true);
                        }
                    } else {
                        console.log('🎯 No guidance lines to add:', {
                            hasFunction: !!onAddGuidanceLineObject,
                            guidanceLineCount: placedObject.guidanceLines.length,
                            patternName: selectedPattern.name
                        });
                    }

                    // Apply placed object pixels to grid
                    setGrid(g => {
                        const newGrid = g.map(arr => [...arr]);
                        placedObject.pixels.forEach(pixel => {
                            if (pixel.y >= 0 && pixel.y < (gridSize.height || gridSize) &&
                                pixel.x >= 0 && pixel.x < (gridSize.width || gridSize) &&
                                (adminMode || isEditableCell(pixel.x, pixel.y))) {
                                newGrid[pixel.y][pixel.x] = 1;
                            }
                        });
                        return newGrid;
                    });
                }

                // Handle erasing detectors with regular eraser patterns
                if (isEraser) {
                    setDetectors(currentDetectors => {
                        return DetectorService.removeDetectorsAtPosition(currentDetectors, {
                            x: gridX,
                            y: gridY
                        }, selectedPattern.pattern);
                    });
                }
            }

            if (onPatternSelectRef.current) {
                // Only clear selection for non-eraser patterns
                if (!isEraser) {
                    onPatternSelectRef.current(null); // Clear external pattern selection
                }
            }
        } else {
            // Toggle single cell using placed objects system
            const currentState = grid[gridY][gridX];
            const newState = currentState ? 0 : 1;

            if (newState === 1) {
                // Placing a pixel - create a placed object for it
                const singlePixelBrush = {
                    name: 'single-pixel',
                    pattern: [[0, 0]], // Single pixel at origin
                    guidanceLines: [] // No guidance lines for single pixels
                };

                const placedObject = PlacedObjectService.createPlacedObject(
                    singlePixelBrush,
                    gridX,
                    gridY,
                    generation,
                    0 // no rotation
                );

                // Add placed object to tracking
                setPlacedObjects(currentObjects => [...currentObjects, placedObject]);

                // Apply pixel to grid
                setGrid(g => {
                    const newGrid = g.map(arr => [...arr]);
                    newGrid[gridY][gridX] = 1;
                    return newGrid;
                });
            } else {
                // Removing a pixel - find and remove the placed object
                setPlacedObjects(currentObjects => {
                    const objectToRemove = PlacedObjectService.findPlacedObjectAt(currentObjects, gridX, gridY);
                    if (objectToRemove) {
                        return PlacedObjectService.removePlacedObject(currentObjects, objectToRemove.id);
                    }
                    return currentObjects;
                });

                // Remove pixel from grid
                setGrid(g => {
                    const newGrid = g.map(arr => [...arr]);
                    newGrid[gridY][gridX] = 0;
                    return newGrid;
                });
            }
        }
    }, [running, isEditableCell, gridSize, pasting, selectedPattern, generation, adminMode, challenge, grid, cellSize, guidanceLinesVisible, onAddGuidanceLineObject, onSetGuidanceLinesVisible, onResetGuidanceLineObjects, placedObjects, brushes]);

    // Throttled mouse move handler for better performance
    const handleCanvasMouseMoveThrottled = useThrottle(useCallback((e) => {
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const gridX = Math.floor((e.clientX - rect.left) / cellSize);
        const gridY = Math.floor((e.clientY - rect.top) / cellSize);

        // Convert to center-based coordinates for display
        const {centerOffsetX, centerOffsetY} = getCenterOffsets(gridSize);
        const centerX = gridX - centerOffsetX;
        const centerY = gridY - centerOffsetY;

        // Include screen coordinates for floating tooltip
        setMouseCoords({
            x: centerX,
            y: centerY,
            screenX: e.clientX,
            screenY: e.clientY
        });

        if (pasting && selectedPattern) {
            console.log('🎯 Setting hover cell for pasting:', {
                gridX, gridY,
                patternName: selectedPattern.name,
                hasGuidanceLines: !!(selectedPattern.guidanceLines || selectedPattern.guidanceLine),
                guidanceLinesVisible
            });
            setHoverCell({x: gridX, y: gridY});
        } else {
            if (hoverCell) {
                console.log('🎯 Clearing hover cell:', {
                    reason: !pasting ? 'not pasting' : 'no selectedPattern'
                });
            }
            setHoverCell(null);
        }
    }, [gridSize, pasting, selectedPattern, cellSize, hoverCell, guidanceLinesVisible]), 16); // ~60fps throttling

    const handleCanvasMouseLeave = useCallback(() => {
        console.log('🎯 Mouse left canvas - clearing hover cell');
        setHoverCell(null);
        setMouseCoords(null);
    }, []);

    // Handler functions for game controls
    const handlePlay = useCallback(() => {
        if (onRunningChangeRef.current) {
            onRunningChangeRef.current(true);
        }
    }, []);

    const handleStop = useCallback(() => {
        if (onRunningChangeRef.current) {
            onRunningChangeRef.current(false);
        }
    }, []);

    const handleStep = useCallback(() => {
        if (!running) {
            // Perform a single step
            setGrid(currentGrid => {
                const newGrid = GameService.nextGeneration(currentGrid);
                setPreviousGrid(currentGrid);
                return newGrid;
            });
            setGeneration(prev => prev + 1);
        }
    }, [running]);

    const handleReset = useCallback(() => {
        console.log('🔄 RESET BUTTON PRESSED - handleReset called');

        // Stop the game if running
        if (onRunningChangeRef.current) {
            onRunningChangeRef.current(false);
        }

        // Restore placed objects to initial state
        setPlacedObjects(initialPlacedObjects);
        console.log('🔄 Restoring', initialPlacedObjects.length, 'initial placed objects');

        // Restore to prePlayBoardState (the state at generation 0 with user's additions)
        const baseGrid = prePlayBoardState ?
            prePlayBoardState.map(arr => [...arr]) :
            (setupBoardState ? setupBoardState.map(arr => [...arr]) : GameService.createEmptyGrid(gridSize.width, gridSize.height));

        // Apply initial placed objects on top of the pre-play state
        const restoredGrid = PlacedObjectService.applyPlacedObjectsToGrid(baseGrid, initialPlacedObjects);
        setGrid(restoredGrid);
        console.log('🔄 Grid restored to prePlayBoardState (generation 0 with user additions)');

        setPreviousGrid(null);
        setGeneration(0);
        setLevelCompleted(false);
        setLevelFailed(false);

        // Restore challenge detectors if challenge has setup (important for post-clear reset)
        if (challenge?.detectors && challenge.detectors.length > 0) {
            const challengeDetectors = DetectorService.initializeChallengeDetectors(
                challenge.detectors.map(d => {
                    const centerX = Math.floor(gridSize.width / 2);
                    const centerY = Math.floor(gridSize.height / 2);
                    const gridX = centerX + d.x;
                    const gridY = centerY + d.y;
                    return {
                        ...d,
                        x: gridX,
                        y: gridY
                    };
                }),
                challenge.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
            );
            setDetectors(challengeDetectors);
        } else {
            setDetectors([]);
        }

        // Restore guidance lines: challenge setup + initial placed objects
        if (onResetGuidanceLineObjects) {
            onResetGuidanceLineObjects();

            // First restore challenge setup guidance lines if they exist
            if (challenge?.setup && challenge.setup.length > 0 && brushes && Object.keys(brushes).length > 0) {
                const setupGuidanceLineObjects = [];
                const centerOffsetX = Math.floor(gridSize.width / 2);
                const centerOffsetY = Math.floor(gridSize.height / 2);

                for (const setupItem of challenge.setup) {
                    const baseBrush = brushes[setupItem.brush];
                    if (baseBrush) {
                        // Apply rotation to brush
                        let brush = baseBrush;
                        if (setupItem.rotate && setupItem.rotate !== 0) {
                            const rotations = Math.floor(setupItem.rotate / 90) % 4;
                            for (let i = 0; i < rotations; i++) {
                                brush = BrushService.transformPattern(brush, 'rotateClockwise');
                            }
                        }

                        const guidanceLines = brush.guidanceLines || (brush.guidanceLine ? [brush.guidanceLine] : []);
                        for (const guidanceLine of guidanceLines) {
                            const placementX = centerOffsetX + setupItem.x;
                            const placementY = centerOffsetY + setupItem.y;
                            const guidanceLineObject = createGuidanceLineFromBrush(guidanceLine, 0, placementX, placementY);
                            if (guidanceLineObject) {
                                setupGuidanceLineObjects.push(guidanceLineObject);
                            }
                        }
                    }
                }

                // Add setup guidance lines
                setupGuidanceLineObjects.forEach(guidanceLineObject => {
                    onAddGuidanceLineObject(guidanceLineObject);
                });
            }

            // Then add user-placed guidance lines
            const initialGuidanceLines = PlacedObjectService.extractGuidanceLines(initialPlacedObjects);
            initialGuidanceLines.forEach(guidanceLineObject => {
                onAddGuidanceLineObject(guidanceLineObject);
            });
        }

        // Regenerate test scenario preview patterns if not running
        if (!running && brushesLoaded) {
            const previewPatterns = generateTestScenarioPreviewPatterns();
            setTestScenarioPreviewPatterns(previewPatterns);
        }
    }, [prePlayBoardState, setupBoardState, initialPlacedObjects, gridSize, challenge, brushes, onRunningChangeRef, onResetGuidanceLineObjects, onAddGuidanceLineObject, running, brushesLoaded, generateTestScenarioPreviewPatterns]);

    const handleClear = useCallback(() => {
        console.log('🟠 handleClear function ENTERED - TOP OF FUNCTION');
        console.log('🔄 CLEAR BUTTON PRESSED - handleClear called');

        try {
            console.log('🟠 About to stop game if running');
            // Stop the game if running
            if (onRunningChangeRef.current) {
                onRunningChangeRef.current(false);
            }
            console.log('🟠 Game stopped');

            console.log('🟠 About to clear placed objects');
            // Clear all user placed objects
            setPlacedObjects([]);
            setInitialPlacedObjects([]); // Clear initial placed objects since we're clearing everything
            console.log('🔄 User placed objects cleared');

            console.log('🟠 About to restore setup board state');
            // Restore to setupBoardState (original challenge setup from JSON)
            const baseGrid = setupBoardState ?
                setupBoardState.map(arr => [...arr]) :
                GameService.createEmptyGrid(gridSize.width, gridSize.height);

            setGrid(baseGrid);
            // Update prePlayBoardState to match the setup (ready for user to add things)
            setPrePlayBoardState(baseGrid.map(arr => [...arr]));
            console.log('🔄 Grid cleared, restored to setupBoardState (original challenge setup)');

            console.log('🟠 About to reset game state');
            setPreviousGrid(null);
            setGeneration(0);
            setLevelCompleted(false);
            setLevelFailed(false);
            console.log('🟠 Game state reset complete');
        } catch (error) {
            console.error('🟠 Error in handleClear:', error);
        }

        // Clear ALL guidance lines first
        if (onResetGuidanceLineObjects) {
            onResetGuidanceLineObjects();
        }

        // Restore challenge setup guidance lines if they exist
        if (challenge?.setup && challenge.setup.length > 0 && brushes && Object.keys(brushes).length > 0) {
            const setupGuidanceLineObjects = [];
            const centerOffsetX = Math.floor(gridSize.width / 2);
            const centerOffsetY = Math.floor(gridSize.height / 2);

            for (const setupItem of challenge.setup) {
                const baseBrush = brushes[setupItem.brush];
                if (baseBrush) {
                    // Apply the same rotation as used for pattern placement
                    let brush = baseBrush;
                    if (setupItem.rotate && setupItem.rotate !== 0) {
                        const rotations = Math.floor(setupItem.rotate / 90) % 4;
                        for (let i = 0; i < rotations; i++) {
                            brush = BrushService.transformPattern(brush, 'rotateClockwise');
                        }
                    }

                    // Handle multiple guidance lines from the rotated brush
                    const guidanceLines = brush.guidanceLines || (brush.guidanceLine ? [brush.guidanceLine] : []);
                    for (const guidanceLine of guidanceLines) {
                        const placementX = centerOffsetX + setupItem.x;
                        const placementY = centerOffsetY + setupItem.y;
                        const guidanceLineObject = createGuidanceLineFromBrush(guidanceLine, 0, placementX, placementY);
                        if (guidanceLineObject) {
                            setupGuidanceLineObjects.push(guidanceLineObject);
                        }
                    }
                }
            }

            // Add setup guidance line objects
            if (onAddGuidanceLineObject) {
                setupGuidanceLineObjects.forEach(guidanceLineObject => {
                    onAddGuidanceLineObject(guidanceLineObject);
                });
            }
        }

        // Restore challenge detectors
        if (challenge?.detectors && challenge.detectors.length > 0) {
            const challengeDetectors = DetectorService.initializeChallengeDetectors(
                challenge.detectors.map(d => {
                    const centerX = Math.floor(gridSize.width / 2);
                    const centerY = Math.floor(gridSize.height / 2);
                    const gridX = centerX + d.x;
                    const gridY = centerY + d.y;
                    return {
                        ...d,
                        x: gridX,
                        y: gridY
                    };
                }),
                challenge.detectorFalloffPeriod || DETECTOR_CONSTANTS.DEFAULT_FALLOFF_PERIOD
            );
            setDetectors(challengeDetectors);
        } else {
            setDetectors([]);
        }

        // Regenerate test scenario preview patterns if not running
        if (!running && brushesLoaded) {
            const previewPatterns = generateTestScenarioPreviewPatterns();
            setTestScenarioPreviewPatterns(previewPatterns);
        }
    }, [setupBoardState, gridSize, challenge, brushes, onRunningChangeRef, onResetGuidanceLineObjects, onAddGuidanceLineObject, running, brushesLoaded, generateTestScenarioPreviewPatterns]);


    // Update test scenario preview patterns when challenge or brushes change
    useEffect(() => {
        if (brushesLoaded && !running) {
            const previewPatterns = generateTestScenarioPreviewPatterns();
            setTestScenarioPreviewPatterns(previewPatterns);
        } else if (running) {
            // Clear preview patterns when game is running
            setTestScenarioPreviewPatterns([]);
        }
    }, [challenge, brushesLoaded, running, generateTestScenarioPreviewPatterns]);

    // Expose methods and state for external controls and admin mode
    React.useImperativeHandle(ref, () => ({
        getGrid: () => grid.map(arr => [...arr]),
        getGeneration: () => generation,
        isLevelCompleted: () => levelCompleted,
        handlePlay,
        handleStop,
        handleStep,
        handleReset,
        handleClear,
        handleTest,
        getMultiplier: () => multiplier,
        setMultiplier
    }), [grid, generation, levelCompleted, handlePlay, handleStop, handleStep, handleReset, handleClear, handleTest, multiplier, setMultiplier]);

    // Calculate detector render data
    const detectorRenderData = DetectorService.getDetectorRenderData(detectors);

    // Calculate move handle render data for placed objects (only when not running)
    const moveHandleRenderData = React.useMemo(() => {
        if (running || placedObjects.length === 0) {
            return [];
        }

        const handleData = placedObjects.map(obj => {
            // Get the top-left corner of the placed object
            const minX = Math.min(...obj.pixels.map(p => p.x));
            const minY = Math.min(...obj.pixels.map(p => p.y));

            return {
                id: obj.id,
                x: minX,
                y: minY,
                brushName: obj.brushName,
                // Store the original placement position for reconstruction
                originalGridX: obj.gridX,
                originalGridY: obj.gridY,
                rotation: obj.rotation || 0
            };
        });

        return handleData;
    }, [running, placedObjects]);


    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '15px',
            height: '100%',
            position: 'relative'
        }}>
            {canvasSize.needsScrolling ? (
                <div
                    className="game-canvas-scroll-wrapper"
                    style={{
                        maxWidth: `${canvasSize.maxWidth}px`,
                        maxHeight: `${canvasSize.maxHeight}px`,
                        width: 'fit-content',
                        height: 'fit-content'
                    }}
                >
                    <GameCanvas
                        grid={grid}
                        previousGrid={previousGrid}
                        canvasSize={canvasSize}
                        challenge={challenge}
                        running={running}
                        pasting={pasting}
                        selectedPattern={selectedPattern}
                        hoverCell={hoverCell}
                        isEditableCell={isEditableCell}
                        adminMode={adminMode}
                        cellSize={cellSize}
                        detectorRenderData={detectorRenderData}
                        moveHandleRenderData={moveHandleRenderData}
                        guidanceLinesVisible={guidanceLinesVisible}
                        guidanceLineObjects={guidanceLineObjects}
                        generation={generation}
                        testScenarioPreviewPatterns={testScenarioPreviewPatterns}
                        onCanvasClick={handleCanvasClick}
                        onMouseMove={handleCanvasMouseMoveThrottled}
                        onMouseLeave={handleCanvasMouseLeave}
                    />
                </div>
            ) : (
                <GameCanvas
                    grid={grid}
                    previousGrid={previousGrid}
                    canvasSize={canvasSize}
                    challenge={challenge}
                    running={running}
                    pasting={pasting}
                    selectedPattern={selectedPattern}
                    hoverCell={hoverCell}
                    isEditableCell={isEditableCell}
                    adminMode={adminMode}
                    cellSize={cellSize}
                    detectorRenderData={detectorRenderData}
                    moveHandleRenderData={moveHandleRenderData}
                    guidanceLinesVisible={guidanceLinesVisible}
                    guidanceLineObjects={guidanceLineObjects}
                    generation={generation}
                    testScenarioPreviewPatterns={testScenarioPreviewPatterns}
                    onCanvasClick={handleCanvasClick}
                    onMouseMove={handleCanvasMouseMoveThrottled}
                    onMouseLeave={handleCanvasMouseLeave}
                />
            )}

            <GameStatus
                generation={generation}
                mouseCoords={mouseCoords}
                levelCompleted={levelCompleted}
                levelFailed={levelFailed}
                targetTurn={challenge?.targetTurn}
            />
        </div>
    );
});

export default GameOfLife;
