# Debug Logging Guide for Level 8 to 9 Guidance Line Issue

## Overview
Comprehensive debug logging has been added to track guidance line behavior during level transitions, specifically to debug the issue where guidance lines from level 8 persist when switching to level 9.

## Debug Logging Added

### 1. Challenge Loading (App.jsx)
**Location**: Challenge loading effect in App.jsx
**Purpose**: Track when levels are loaded and auto-zoom is applied

**Console Output**:
```
🎯 Loading challenge: 9
🎯 Challenge data loaded: { name: "9. Phases", hasSetup: false, setupLength: 0, width: 201, height: 101 }
🔍 Auto-zoom calculation: { originalCellSize: 8, calculatedCellSize: 4, willAutoZoom: true }
🔍 Applying auto-zoom to cellSize: 4
```

### 2. Challenge Change Effect (GameOfLife.jsx)
**Location**: Challenge change effect in GameOfLife.jsx  
**Purpose**: Track when challenge changes and guidance lines should be cleared

**Console Output**:
```
🔄 Challenge change effect running: { challengeChanged: true, previousChallenge: "8. Detectors", currentChallenge: "9. Phases", hasResetFunction: true, cellSize: 8 }
🔄 Challenge changed - clearing guidance lines from 8. Detectors to 9. Phases
```

### 3. CellSize Change Effect (GameOfLife.jsx)
**Location**: CellSize change effect in GameOfLife.jsx
**Purpose**: Track when zoom changes and confirm it doesn't clear guidance lines

**Console Output**:
```
🔍 CellSize change effect running: { hasChallenge: true, challengeName: "9. Phases", cellSize: 4 }
🔍 Updating canvas/grid sizes for cellSize change: { cellSize: 4, newCanvasSize: {...}, newGridSize: {...} }
```

### 4. Setup Effect (GameOfLife.jsx)
**Location**: Setup pattern loading effect in GameOfLife.jsx
**Purpose**: Track guidance line management during setup pattern loading

**Console Output**:
```
🏗️ Setup effect running: { hasChallenge: true, challengeName: "9. Phases", setupLength: 0, brushesLoaded: true, cellSize: 4, hasResetFunction: true, hasAddFunction: true }
🔄 Empty setup - clearing guidance lines for challenge: 9. Phases
🔄 Setup effect - clearing guidance lines for challenge: 9. Phases
🔄 Setup effect - no guidance line objects to add
```

### 5. State Management (appReducer.js)
**Location**: Guidance line actions in appReducer.js
**Purpose**: Track when guidance lines are actually cleared/added in the state

**Console Output**:
```
🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered - clearing 2 guidance line objects
🔄 ADD_GUIDANCE_LINE_OBJECT action triggered - adding: setup_guidance_123 total will be: 1
```

### 6. Level Selection (LevelSelector.jsx)
**Location**: Level selection handlers in LevelSelector.jsx
**Purpose**: Track when users switch between levels

**Console Output**:
```
🎯 User selected level: 9. Phases from current level: 8. Detectors
🎯 User clicked next arrow
```

## Expected Debug Flow for Level 8 → 9 Transition

When switching from level 8 to level 9, you should see this sequence:

1. **User Action**:
   ```
   🎯 User selected level: 9. Phases from current level: 8. Detectors
   ```

2. **Challenge Loading**:
   ```
   🎯 Loading challenge: 9
   🎯 Challenge data loaded: { name: "9. Phases", hasSetup: false, setupLength: 0, ... }
   ```

3. **Auto-Zoom Calculation**:
   ```
   🔍 Auto-zoom calculation: { originalCellSize: 8, calculatedCellSize: 4, willAutoZoom: true }
   🔍 Applying auto-zoom to cellSize: 4
   ```

4. **Challenge Change Effect**:
   ```
   🔄 Challenge change effect running: { challengeChanged: true, previousChallenge: "8. Detectors", currentChallenge: "9. Phases", ... }
   🔄 Challenge changed - clearing guidance lines from 8. Detectors to 9. Phases
   🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered - clearing X guidance line objects
   ```

5. **CellSize Change Effect** (due to auto-zoom):
   ```
   🔍 CellSize change effect running: { hasChallenge: true, challengeName: "9. Phases", cellSize: 4 }
   🔍 Updating canvas/grid sizes for cellSize change: { cellSize: 4, ... }
   ```

6. **Setup Effect**:
   ```
   🏗️ Setup effect running: { hasChallenge: true, challengeName: "9. Phases", setupLength: 0, ... }
   🔄 Empty setup - clearing guidance lines for challenge: 9. Phases
   🔄 Setup effect - clearing guidance lines for challenge: 9. Phases
   🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered - clearing 0 guidance line objects
   ```

## Troubleshooting Guide

### Root Cause Identified and Fixed ✅

**Issue**: Guidance lines were persisting during level transitions because challenge change detection was failing.

**Root Cause**: The challenge object was missing the `name` property, which caused:
1. `challenge?.name` to always be `undefined` 
2. Challenge change detection (`previousChallenge !== currentChallenge`) to fail
3. `challengeChanged` to always be `false`
4. Guidance line clearing logic to never execute

**Fix Applied**: 
- Added `name` property to challenge object construction in `useAppState.js`
- Added `name` property to `setChallengeData()` call in `App.jsx`
- Added `name` property to initial state and clear action in `appReducer.js`

**Expected Behavior After Fix**:
```
🎯 Challenge data loaded: { name: "9. Phases", hasSetup: false, setupLength: 0, ... }
🔄 Challenge change effect running: { challengeChanged: true, previousChallenge: "8. Detectors", currentChallenge: "9. Phases", ... }
🔄 Challenge changed - clearing guidance lines from 8. Detectors to 9. Phases
```

### If Guidance Lines Persist After Level Switch:

1. **Check if RESET_GUIDANCE_LINE_OBJECTS is called**:
   - Look for `🔄 RESET_GUIDANCE_LINE_OBJECTS action triggered` in console
   - If missing: Issue is in GameOfLife.jsx effects
   - If present: Issue is in state management or rendering

2. **Check challenge name in logs**:
   - Look for `currentChallenge: "9. Phases"` (not `"null"` or `undefined`)
   - If showing null/undefined: Challenge object construction issue
   - If showing correct name: Look for `challengeChanged: true`

3. **Check the sequence of effects**:
   - Challenge change effect should run first
   - Setup effect should run after challenge change
   - Both should clear guidance lines for level 9

4. **Check challenge data**:
   - Level 9 should show `setupLength: 0`
   - If setupLength > 0: Challenge data is incorrect

5. **Check timing issues**:
   - CellSize effect should NOT clear guidance lines
   - Look for proper effect ordering in console logs

### Warning Signs to Look For:

- ⚠️ `Setup effect - onResetGuidanceLineObjects function not available`
- ⚠️ Setup effect shows `setupLength > 0` for level 9
- ⚠️ Missing `RESET_GUIDANCE_LINE_OBJECTS action triggered` messages
- ⚠️ CellSize effect running before challenge change effect

## How to Use This Debug Info

1. **Open Browser Console** during development
2. **Switch from Level 8 to Level 9** in the application
3. **Compare console output** to the expected flow above
4. **Identify where the flow breaks** to pinpoint the issue
5. **Report findings** with specific console messages that are missing or incorrect

This comprehensive logging will help identify exactly where the guidance line persistence issue occurs during level transitions.
