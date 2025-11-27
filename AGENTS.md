# AGENTS.md - Turing's Game of Life Project Guide

## 🎯 Project Overview

**Turing's Game of Life** is an educational React application implementing Conway's Game of Life with interactive challenges, pattern brushes, and administrative tools. Built with modern React 19+ patterns and optimized for performance and maintainability.

### Key Features
- **Interactive Challenges**: Guided exercises for learning Conway's Game of Life
- **Pattern Laboratory**: Experiment with predefined brushes and patterns
- **Admin Tools**: Content creation and management interface
- **Performance**: Optimized for large grids (up to 501x501) with 60 FPS rendering
- **Auto-Zoom**: Intelligent viewport management for different grid sizes

---

## 🧪 Test Scenarios System (In-Game Unit Tests)

### Overview
Test scenarios provide in-game unit testing functionality, allowing challenges to include automated validation of user solutions. Each scenario defines a specific test case with setup patterns, detector configurations, and expected results.

### JSON Structure
```json
{
  "name": "10. Not gate",
  "testScenarios": [
    {
      "name": "Input High (1) → Output Low (0)",
      "description": "When input gun is active, NOT gate output should be disabled",
      "setup": [
        {
          "x": -90,
          "y": 0,
          "brush": "p30GliderGunG",
          "description": "Input signal generator"
        }
      ],
      "detectors": [
        {
          "x": 90,
          "y": 0,
          "state": "inactive",
          "index": 0,
          "description": "Output detector - should remain OFF when input is present"
        }
      ]
    }
  ]
}
```

### Key Components

### Key Components

#### Test Scenario Definition
- **name**: Descriptive name for the test scenario
- **description**: Detailed explanation of what the test validates
- **setup**: Array of patterns/guns to place for this specific test
- **detectors**: Array of detector configurations for this test (includes expected state)

#### Detector Inheritance Model
**Important**: Test scenario detectors inherit positions from the main challenge and only override expected states.

**Main Challenge Detector Definition**:
```json
{
  "detectors": [
    {
      "x": 4, "y": -12,           // Position relative to grid center
      "state": "inactive",         // Default expected state
      "index": 0,                 // Unique identifier
      "description": "Input detector - should be OFF when no input is present"
    }
  ]
}
```

**Test Scenario Detector Override**:
```json
{
  "testScenarios": [
    {
      "name": "Input High (1) → Output Low (0)",
      "detectors": [
        {
          "state": "active",       // Override: expect active instead of default inactive
          "index": 0,             // Reference to main challenge detector by index
          "description": "Input detector - should remain ON when input is present"
        }
      ]
    }
  ]
}
```

**Key Rules**:
- Test scenario detectors **DO NOT** include x, y coordinates
- They **ONLY** specify the expected state for validation
- Detector positions always come from the main challenge definition
- Multiple test scenarios can have different expected states for the same detector index

#### TestScenarioService
- `hasTestScenarios(challenge)`: Check if challenge includes test scenarios
- `getTestScenarios(challenge)`: Extract test scenarios from challenge
- `applyTestScenario(scenario, gameState, brushes, gridSize)`: Apply scenario setup to game state
- `validateScenario(scenario, gameState, generation)`: Validate scenario results
- `runAllScenarios(challenge, gameState, ...)`: Run all scenarios for a challenge

#### TestScenarioPanel Component
- Displays available test scenarios for the current challenge
- "Run All Tests" button to execute all scenarios
- Individual "Run Test" buttons for each scenario
- Real-time validation results with pass/fail indicators
- Detailed failure information showing expected vs actual detector states

#### GameControls TEST Button
- **Integrated TEST Button**: Appears in GameControls panel when challenge has test scenarios
- **One-Click Testing**: Single button to run all test scenarios for the current challenge
- **Visual Feedback**: Shows "Testing..." state with reduced opacity during execution
- **Space Efficient**: CLEAR button reduced to half width to accommodate TEST button
- **Conditional Display**: Only appears when `challenge.testScenarios` exists
- **Automatic Scenario Application**: Applies each scenario setup and validates results
- **Progress Indication**: Sequential execution with delays for visual feedback

### Use Cases

#### Logic Gate Validation
Perfect for validating digital logic constructions:
- NOT gate: Input=1 → Output=0, Input=0 → Output=1
- AND gate: Multiple input combinations
- OR gate: Various input states
- Complex circuits: Multi-stage logic validation

#### Pattern Stability Testing
Validate Conway's Game of Life patterns:
- Still lifes should remain stable over time
- Oscillators should maintain their period
- Spaceships should travel correctly
- Gun patterns should produce gliders at expected intervals

#### Interactive Learning
Provides immediate feedback on user solutions:
- Students can test their constructions instantly
- Clear pass/fail indicators guide learning
- Multiple test cases cover edge conditions
- Automated validation reduces instructor workload

### Benefits

#### For Educators
- **Automated Grading**: Test scenarios provide instant validation of student solutions
- **Comprehensive Testing**: Multiple scenarios can test different aspects of the same problem
- **Clear Feedback**: Students receive immediate, specific feedback on what's working and what isn't
- **Scalable Assessment**: No manual checking required for basic validation

#### For Students
- **Immediate Feedback**: Know instantly if solution is correct
- **Guided Learning**: Failed tests indicate what needs to be fixed
- **Confidence Building**: Passing tests confirm understanding
- **Edge Case Discovery**: Multiple scenarios reveal corner cases

#### For System
- **Quality Assurance**: Ensures challenges work as intended
- **Regression Testing**: Detect if changes break existing functionality
- **Documentation**: Test scenarios serve as executable specifications

### Integration with Existing Systems

#### Challenge System
- Test scenarios are seamlessly integrated into the existing challenge JSON structure
- `ChallengeService.processChallengeData()` automatically includes test scenarios
- Backward compatible: challenges without test scenarios continue to work

#### Detector System
- Leverages existing detector infrastructure
- Test scenarios can define custom detector configurations
- Validation uses the same detector state logic as the main game

#### UI Integration
- TestScenarioPanel appears automatically when challenges have test scenarios
- Integrated into the right panel alongside other game controls
- Consistent styling with existing UI components

---

## 🏗️ Architecture Overview

### Directory Structure
```
src/
├── components/         # React components (admin, game, UI)
├── constants/         # Centralized configuration constants
├── hooks/            # Custom React hooks for reusable logic
├── services/         # Business logic layer (pure functions)
├── state/            # useReducer-based state management
├── types/            # JSDoc type definitions
├── utils/            # Utility functions and helpers
├── App.jsx           # Main application container
├── GameOfLife.jsx    # Core game component
└── main.jsx          # Entry point
```

### Key Architectural Principles
1. **Functional React Patterns**: Modern hooks, functional components, proper useEffect usage
2. **Layered Architecture**: Clear separation between UI, business logic, and state management
3. **Immutable State Management**: Managed via `useReducer` with predictable state transitions
4. **Performance-First Design**: Optimized canvas rendering, memoization, and efficient re-renders
5. **Type Safety**: Comprehensive JSDoc types for maintainability
6. **Clean Code Standards**: No console logging in production, proper dependency arrays, clean functions

### Component Architecture
- **Single Responsibility**: Each component has a clear, focused purpose
- **Proper State Flow**: Challenge object contains all level data, eliminating prop drilling
- **Modern React Patterns**: Proper useCallback/useMemo usage, ref management, effect cleanup
- **Error Boundaries**: Proper error handling and graceful degradation

---

## 🚀 Development Workflow

### Build and Test Commands
```bash
npm install          # Install dependencies
npm test             # Run all tests (423 comprehensive tests)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # Lint codebase (if configured)
```

### Code Quality Standards
- **No Production Logging**: Console statements are development-only and removed from production builds
- **Modern React Patterns**: Proper useEffect dependency arrays, no setTimeout anti-patterns
- **Performance Optimized**: Efficient state updates, proper memoization, clean event handlers
- **Comprehensive Testing**: 423 tests across 48 test suites covering all functionality
- **Clean Code**: No empty else blocks, clear variable naming, proper error handling

### Testing Standards
- **Test Categories**: Services, components, utilities, state management, and integration tests
- **Debug Tests**: Specialized tests for historical bug fixes and user-reported issues
- **Coverage**: Critical functionality including guidance lines, zoom controls, and game mechanics
- **Run Tests**:
  ```bash
  npm test                    # Run all tests
  npm run test:watch          # Watch mode for development
  npm run test:coverage       # Coverage analysis
  ```

### Development Best Practices
- **React 19+ Patterns**: Modern functional components with proper hook usage
- **State Management**: useReducer for complex state, refs for callback stability
- **Performance**: Canvas optimizations, efficient re-renders, proper cleanup
- **Error Handling**: Graceful degradation and proper error boundaries
- **Clean Functions**: Pure functions in services, side-effect isolation in hooks

### Development Server
- **Note**: The development server (`npm run dev`) is managed by the user and should not be started by agents

---

## 🔧 Recent Architectural Improvements

### Code Quality Refactoring (Latest)
1. **Removed Production Logging**: Eliminated all console.log statements from production code
2. **Fixed React Anti-patterns**: 
   - Replaced setTimeout workarounds with proper useEffect patterns
   - Added missing dependency arrays to useEffect hooks
   - Fixed state timing issues with proper React patterns
3. **Cleaned Dead Code**: Removed empty else blocks and unnecessary debugging code
4. **Modern React Compliance**: Ensured all patterns follow React 19+ best practices
5. **Code Consolidation**: 
   - Extracted duplicate grid size calculation logic into helper functions
   - Consolidated duplicate useEffect hooks for better maintainability
   - Removed unnecessary and outdated comments
   - Fixed ESLint errors and warnings for production-ready code

### Performance Optimizations
- **Animation Loop**: Proper requestAnimationFrame usage without setTimeout anti-patterns  
- **State Updates**: Efficient grid updates with proper React state management
- **Memory Management**: Proper cleanup and ref management for long-running components
- **Helper Functions**: Centralized grid size calculations to reduce code duplication

---

### Pattern Integrity Tracking

**Feature**: Guidance lines automatically disappear when patterns are modified and reappear when patterns are restored to their original state.

**Implementation**: Each placed object tracks an `intact` flag that indicates whether the pattern matches its original brush definition.

#### Key Components

##### PlacedObjectService - Integrity Methods
- `checkPatternIntegrity(placedObject, grid, brushes)`: Checks if a pattern matches its original brush
- `updatePlacedObjectsIntegrity(placedObjects, grid, brushes)`: Updates intact flags for all placed objects
- `getVisibleGuidanceLines(placedObjects)`: Returns guidance lines only from intact patterns
- Supports rotated patterns by applying the same rotation to the original brush for comparison

##### GameOfLife Integration
- **Pattern Integrity Effect**: Automatically checks integrity when grid changes:
  ```javascript
  useEffect(() => {
    const updatedObjects = PlacedObjectService.updatePlacedObjectsIntegrity(placedObjects, grid, brushes);
    // Only update if integrity flags changed
    if (integrityChanged) setPlacedObjects(updatedObjects);
  }, [grid, placedObjects, brushes]);
  ```
- **Guidance Line Sync Effect**: Updates guidance line objects when integrity changes:
  ```javascript
  useEffect(() => {
    const currentGuidanceLines = PlacedObjectService.getVisibleGuidanceLines(placedObjects);
    // Update guidance line system to show only intact pattern guidance lines
  }, [placedObjects, guidanceLineObjects]);
  ```

#### User Experience
- **Pattern Placement**: New patterns start with `intact: true`
- **Pixel Modification**: Removing/adding pixels triggers integrity check
- **Guidance Line Visibility**: 
  - ✅ **Visible** when pattern exactly matches original brush
  - ❌ **Hidden** when any pixel is missing or extra pixels added to pattern area
- **Pattern Restoration**: Adding back missing pixels restores `intact: true` and shows guidance lines again

#### Technical Details
- **Rotation Support**: Integrity checking applies same rotation to original brush as was used during placement
- **Performance**: Integrity checks only run when grid or placed objects change
- **Memory Efficiency**: Uses existing guidance line object system, no additional rendering overhead
- **Backward Compatibility**: Existing patterns without integrity tracking continue to work

#### Edge Cases Handled
- Missing brushes return `intact: false`
- Out-of-bounds pixels return `intact: false`
- Empty placed object arrays handled gracefully
- Objects without guidance lines work correctly (no visual change)

#### Testing Coverage
- Pattern integrity checking with various brush shapes
- Rotation integrity verification
- Guidance line visibility filtering
- Edge case handling (missing brushes, bounds checking)
- Integration with existing placed object system

**Benefits**: Provides immediate visual feedback when patterns are modified, helping users understand when their constructions match expected patterns vs when they've been altered.

### Guidance Lines System

### Overview
Guidance lines are visual aids that help users understand pattern movement and timing in Conway's Game of Life. The system uses generation-based tracking for precise control and game state integration.

### Core Mechanics
- **Generation Tracking**: Lines are tagged with creation generation for proper lifecycle management
- **Visibility Logic**: Lines only appear when current generation >= line's creation generation
- **Reset Behavior**: Generation 0 lines (setup + initial user placement) persist through resets
- **Clear Behavior**: Clear removes all lines, then restores only challenge setup lines
- **Auto-Creation**: Lines automatically created when placing brushes with guidance specifications

### Object Structure
```javascript
{
  id: 'unique_identifier',
  type: 'guidanceLine', 
  generation: 0,           // Creation generation
  originX: 10, originY: 15, // Grid coordinates
  direction: 'SE',         // 8-direction compass
  length: 'infinite',      // Length or 'infinite'
  speed: 3                 // Color alternation speed
}
```

### Brush Integration
- **RLE Format**: `#P direction/startX/startY/length/speed` lines in brush files
- **Multiple Lines**: Support for multiple `#P` entries per brush
- **Rotation Support**: Direction and coordinates rotate with brush transformations
- **Backward Compatibility**: Single `guidanceLine` property alongside new `guidanceLines` array

### Rendering Priority
1. **Detectors** (always visible)
2. **Grid Pixels** (player-placed patterns) 
3. **Challenge Patterns** (target patterns)
4. **Guidance Lines** (lowest priority, hidden during play)

---

## 🔧 Key Bug Fixes & Lessons Learned

### Zoom Canvas Corruption Bugs
**Issue**: Zooming in/out caused extra pixels to appear on the grid that weren't there before  
**Root Cause**: Multiple issues with canvas rendering during zoom operations:
1. **Canvas Size Mismatch**: CSS width/height styles vs canvas buffer size caused browser scaling artifacts
2. **Renderer State Corruption**: Stale ImageData and dirty region tracking across zoom operations  
3. **previousGrid Timing**: Incorrect dirty region comparisons during canvas size changes
**Solution**: 
- Removed CSS width/height styles to prevent browser scaling
- Added `imageRendering: 'pixelated'` to prevent anti-aliasing artifacts
- Force full redraw when canvas dimensions change by clearing renderer state
- Enhanced renderer recreation logic in GameCanvas component
**Lesson**: Canvas buffer size must exactly match display size; browser scaling causes pixel corruption

### Zoom Operation Bugs (React Strict Mode)
**Issue**: Zooming during running simulation caused patterns like p30 glider gun to "destroy themselves"  
**Root Cause**: Window resize handler was triggering on `cellSize` changes, causing grid resize operations during zoom in React Strict Mode  
**Solution**: Separated window resize handler from cellSize effects - zoom operations now only update rendering dimensions  
**Lesson**: React Strict Mode double-execution requires careful effect dependency management

does### Board State Management Refactoring
**Problem**: The `initialBoardState` was confusing because it was used for two different purposes  
**Solution**: Split into two clear, distinct states:
- `setupBoardState`: Original challenge setup from JSON (immutable after level load)
- `prePlayBoardState`: State at generation 0 with user additions (captured for reset functionality)
**Clear vs Reset Distinction**:
- **Clear**: Restores to `setupBoardState` (original challenge setup only)
- **Reset**: Restores to `prePlayBoardState` (setup + user additions from when play was last pressed at gen 0)
**Benefits**: Eliminates confusion, makes button behavior predictable, improves code maintainability
**Critical Fix**: Resolved ReferenceError where `setInitialBoardState` was still being called after refactoring - replaced with proper `setSetupBoardState` and `setPrePlayBoardState` calls

### Infinite Loop Fix (Critical React Bug)
**Problem**: "Maximum update depth exceeded" error caused by circular dependency in useEffect
**Root Cause**: The effect that sets `setupBoardState` had `setupBoardState` in its dependency array:
```javascript
// ❌ BROKEN - Circular dependency
useEffect(() => {
  setSetupBoardState(newState);
}, [grid, challenge?.setup, generation, setupBoardState]); // setupBoardState causes infinite loop
```
**Solution**: Remove `setupBoardState` from dependency array since the effect sets this state:
```javascript
// ✅ FIXED - No circular dependency  
useEffect(() => {
  setSetupBoardState(newState);
}, [grid, challenge?.setup, generation]); // Only depend on external factors
```
**Lesson**: Never include state setters or the state they set in useEffect dependency arrays - this creates infinite re-render loops
**Testing**: Added comprehensive test suite to prevent regression and validate React optimization patterns

### Placed Objects System (Unified Pixel & Guidance Line Management)
**Architecture**: Created unified object system where user-placed patterns are tracked as "placed objects" that link pixels and guidance lines together  
**Key Components**:
- `PlacedObjectService`: Manages creation, movement, rotation, and deletion of placed objects
- `placedObjects` state: Tracks all user-placed patterns with their associated guidance lines
- Linked movement: When a placed object moves, its guidance lines move with it automatically
**Clear vs Reset Distinction**:
- **Clear**: Restores board to initial challenge setup (removes all user actions, preserves setup patterns/guidance/detectors)
- **Reset**: Restores board to exact state when user last pressed play at generation 0 (challenge setup + user-placed objects)
**Benefits**: Solves reset issues by treating pixels and guidance lines as unified entities, enables future features like pattern movement/editing  

### TEST Button Missing Issue (useAppState Hook Bug)
**Problem**: TEST button not appearing despite test scenarios being loaded correctly from localStorage and passed through setChallengeData  
**Root Cause**: The `useAppState` hook's challenge object derivation was missing the `testScenarios` field in both the object creation and dependency array:
```javascript
// ❌ BROKEN - Missing testScenarios field
const challenge = useMemo(() => {
  return state.hasStoredChallenge ? {
    name: state.challenge.name,
    // ...other fields...
    description: state.challenge.description
    // testScenarios: state.challenge.testScenarios ← MISSING!
  } : null;
}, [
  // ...other dependencies...
  state.challenge.description
  // state.challenge.testScenarios ← MISSING FROM DEPENDENCIES!
]);
```
**Solution**: Add missing `testScenarios` field to both object creation and dependency array:
```javascript
// ✅ FIXED - Complete challenge object
const challenge = useMemo(() => {
  return state.hasStoredChallenge ? {
    name: state.challenge.name,
    // ...other fields...
    description: state.challenge.description,
    testScenarios: state.challenge.testScenarios // ← ADDED!
  } : null;
}, [
  // ...other dependencies...
  state.challenge.description,
  state.challenge.testScenarios // ← ADDED TO DEPENDENCIES!
]);
```
**Lesson**: The challenge object flows through multiple layers (ChallengeService → App.jsx setChallengeData → useAppState → GameControls). A missing field in any layer breaks the entire chain  
**Prevention**: Added comprehensive test coverage for challenge object field completeness in useAppState hook  

### Critical Patterns to Avoid
1. **Console Logging in Production**: All logging must be removed from production builds
2. **setTimeout Anti-patterns**: Never use setTimeout to work around React state timing
3. **Missing Dependency Arrays**: All useEffect hooks must have proper dependency arrays
4. **Circular Dependencies in useEffect**: Never include state setters or the state they set in dependency arrays
5. **Unused Variables**: Remove all unused variables to maintain clean code
6. **Duplicate Code**: Extract common patterns into helper functions
7. **Empty Control Blocks**: Remove empty else blocks and unnecessary conditional structures
8. **Outdated Comments**: Remove comments that no longer reflect current code behavior

### Code Quality Standards  
- **ESLint Compliance**: All code must pass ESLint without errors or warnings
- **React Hook Rules**: Proper dependency arrays and hook usage throughout
- **Clean Functions**: Single responsibility principle with clear, focused functions
- **Helper Functions**: Extract common calculations into reusable functions
- **Consistent Patterns**: Use the same patterns for similar operations throughout codebase
3. **Missing useEffect Dependencies**: Always include proper dependency arrays
4. **Empty Else Blocks**: Remove unnecessary empty code blocks

### Reset-After-Clear Bug Pattern
**Issue**: Setup patterns disappeared when reset was pressed after clear
**Root Cause**: setTimeout anti-pattern caused initialBoardState to be saved before grid was populated
**Solution**: Replaced with proper useEffect that watches grid changes after setup
**Lesson**: React state timing issues require proper React solutions, not JavaScript workarounds

### Performance Patterns
- **Animation Loops**: Use requestAnimationFrame with refs, not setTimeout
- **State Updates**: Batch related state changes, avoid multiple rapid updates
- **Memory Management**: Always cleanup effects and remove event listeners

### Testing Approach
- **Bug-Driven Testing**: Each bug fix comes with comprehensive test coverage
- **Integration Tests**: Complex interactions (clear→reset, level switching) need integration tests
- **Debug Test Files**: Maintain historical tests for critical bug fixes to prevent regressions

---

## 🧪 Testing Guidelines

### JSX Testing Limitations
**Important**: Due to Babel configuration constraints in the Jest environment, avoid JSX syntax in test files.

#### Problem
```javascript
// ❌ This will fail with Babel parsing errors
const { render } = render(<GameOfLife {...props} />);
```

#### Solution
```javascript
// ✅ Test the logic directly without JSX
const simulateEffect = (running, visible) => {
  if (running && visible) {
    mockSetVisible(false);
  }
};
```

#### Best Practices for Testing
1. **Test Logic, Not Rendering**: Focus on testing the business logic and state transitions
2. **Simulate Effects**: Create functions that simulate useEffect and handler logic
3. **Mock Functions**: Use Jest mocks to verify function calls and state changes
4. **Avoid Component Rendering**: Test components indirectly through their logic functions

#### Example Pattern
```javascript
// Instead of testing component rendering, test the underlying logic
test('should handle state transition correctly', () => {
  const mockHandler = jest.fn();
  const simulateLogic = (condition) => {
    if (condition) mockHandler(true);
  };
  
  simulateLogic(true);
  expect(mockHandler).toHaveBeenCalledWith(true);
});
```

This approach provides robust testing coverage while avoiding Babel configuration issues.

---

## 🐛 Debugging Guidelines

### Console Logging System
The project includes comprehensive console logging for debugging complex operations:

#### Reset/Clear Operations
The GameOfLife component includes detailed logging for reset and clear operations with 🔄 prefixes:
- `🔄 RESET BUTTON PRESSED` - Tracks reset functionality
- `🔄 CLEAR BUTTON PRESSED` - Tracks clear functionality  
- `🔄 Restoring challenge setup` - Setup pattern restoration
- `🔄 Found guidance lines` - Guidance line detection and creation
- `🔄 Adding guidance line object` - Object-based guidance line system tracking

#### Setup Effect Logging
Setup pattern loading includes detailed logging with 🏗️ prefixes:
- `🏗️ Setup effect running` - Tracks when setup effects execute
- `🏗️ Processing setup patterns` - Pattern placement tracking
- `🏗️ Created guidance line object` - Guidance line object creation

#### Challenge Transitions
Level switching includes detailed logging with 🔄 prefixes:
- `🔄 Challenge changed from 'X' to 'Y'` - Level transition tracking
- `🔄 Clearing guidance lines for challenge change` - Cleanup operations

#### How to Debug Issues
1. **Open browser console** when running the development server
2. **Perform the problematic action** (reset, clear, level switch)
3. **Look for warning logs** with ⚠️ prefixes indicating missing functions or failed operations
4. **Follow the sequence of logs** to identify where the flow breaks

#### Common Debug Patterns
```javascript
console.log('🔄 Current state:', { 
  hasChallenge: !!challenge,
  setupLength: challenge?.setup?.length || 0,
  brushesLoaded: !!brushes
});
```

All critical operations include before/after state logging to help identify timing and dependency issues.

#### Zoom vs Level Change Issues
If guidance lines disappear unexpectedly:
1. **Check if it happens during zoom** → Look for `cellSize` in wrong dependency arrays
2. **Check if it happens during level switch** → Normal behavior (guidance lines should clear between levels)
3. **Check console logs** for `🔄 Cell size changed` vs `🔄 Challenge changed` to distinguish the cause

### Reset vs Clear Behavior
**Reset** preserves the "initial state" including:
- Grid state: Restored from `initialBoardState` (includes user-placed patterns at generation 0)
- Guidance lines: **Only generation 0 guidance lines are preserved** (includes both setup guidance lines AND user-placed guidance lines at generation 0)

**Clear** creates a fresh start:
- Grid state: Cleared to empty, then setup patterns are restored
- Guidance lines: All cleared, then only setup guidance lines are restored

This ensures user-placed brushes and their guidance lines at generation 0 become part of the "initial state" and persist through reset operations.

#### Critical Synchronization Fix
**Issue**: `setGrid()` and `setInitialBoardState()` are asynchronous React state updates. If they're called separately, there can be timing mismatches where reset uses outdated `initialBoardState`.

**Solution**: Setup patterns now update both grid and initialBoardState synchronously within the same `setGrid()` callback:
```javascript
setGrid(currentGrid => {
  const newGrid = /* ...setup patterns applied... */;
  setInitialBoardState(newGrid.map(arr => [...arr])); // Sync update
  return newGrid;
});
```

This ensures consistent state between current grid and reset target.

#### Zoom Operations Fix
**Issue**: Zoom in/out operations were clearing all guidance lines because `cellSize` was included in the challenge change effect dependencies.

**Problem**: 
```javascript
useEffect(() => {
  if (challenge && onResetGuidanceLineObjects) {
    onResetGuidanceLineObjects(); // Cleared guidance lines on EVERY cellSize change
  }
}, [challenge, cellSize, onResetGuidanceLineObjects]); // cellSize caused the issue
```

**Solution**: Separated concerns into two effects:
1. **Challenge change effect**: Handles actual challenge transitions (clears guidance lines when switching levels)
2. **Zoom effect**: Handles `cellSize` changes for canvas/grid resizing (preserves guidance lines)

```javascript
// Challenge changes (clears guidance lines when switching levels)
useEffect(() => { /* ... */ }, [challenge, onResetGuidanceLineObjects]);

// Zoom changes (updates canvas/grid size, preserves guidance lines)  
useEffect(() => { /* ... */ }, [cellSize, challenge]);
```

This ensures zoom operations only update rendering dimensions without affecting game state.

### Auto-Zoom on Level Load

**Feature**: When a new challenge loads, the game automatically calculates the optimal zoom level to display the entire grid.

**Implementation**: 
- `calculateAutoZoomCellSize()` in `src/utils/canvasUtils.js` calculates optimal cell size based on:
  - Challenge grid dimensions (`width` x `height`)
  - Available viewport space (accounting for UI panels)
  - 25% minimum constraint (never zooms out more than 75%)

**Behavior**:
- If the grid fits comfortably with default cell size (8px), use default
- For larger grids, calculate smaller cell size to fit viewport
- Minimum cell size is 25% of default (2px) to maintain readability
- Auto-zoom only triggers on challenge load, manual zoom controls remain functional

**Integration**: Auto-zoom executes in the challenge loading effect in `App.jsx`, using `setZoomLevel()` to update the zoom state without interfering with manual controls.

**Boundary Enforcement**: The `SET_ZOOM_LEVEL` action in the app reducer now enforces min/max cell size constraints (`MIN_CELL_SIZE` to `MAX_CELL_SIZE`) just like the manual zoom controls, ensuring consistency across all zoom operations.

### Auto-Zoom Button

**Feature**: Manual auto-zoom button allows users to manually trigger auto-zoom calculation at any time.

**Implementation**:
- **UI Component**: Added "Auto Fit" button to `ZoomControls` component (shown when `onAutoZoom` prop provided)
- **Handler**: `handleAutoZoom()` in `App.jsx` calculates optimal zoom for current challenge
- **Integration**: Uses same `calculateAutoZoomCellSize()` logic as automatic level loading

**User Interaction**:
- Button appears in zoom controls panel
- Click triggers immediate auto-zoom calculation
- Works independently of automatic level loading
- Respects same 25% minimum constraint
- Doesn't interfere with manual zoom controls

## 🔧 Key Bug Fixes & Patterns

### Clear/Reset Button Behavior

**Issue**: Reset after Clear was not preserving setup patterns due to missing detector restoration.

**Root Cause**: The clear operation correctly restored setup patterns and updated `initialBoardState`, but reset operation only restored grid from `initialBoardState` without restoring challenge detectors.

**Solution**: Enhanced reset function to restore challenge detectors when they exist, ensuring complete restoration of challenge setup state.

**Key Pattern**: 
- **Clear**: Restores setup patterns + detectors + guidance lines, updates `initialBoardState`
- **Reset**: Restores from `initialBoardState` + restores challenge detectors + preserves generation 0 guidance lines

---

## 📚 Additional Information

### Data Formats
- **Challenges**: JSON files defining patterns, editable areas, and win conditions.
- **Brushes**: RLE files for predefined patterns.

### Key Services
- **GameService**: Core Conway's Game of Life logic.
- **BrushService**: Pattern management and transformations.
- **DetectorService**: Interactive detector patterns.
- **ChallengeService**: Challenge discovery and loading.

### Styling
- **CSS Variables**: Consistent theming.
- **Responsive Design**: Adapts to various screen sizes.

### Performance Optimizations
- **Dirty Region Tracking**: Redraw only changed areas.
- **RequestAnimationFrame**: Smooth animations.
- **Memoization**: Reduce unnecessary re-renders.

---

### Rendering Priority Order
- **Canvas Rendering**: Optimized canvas renderer with dirty region tracking
- **Rendering Priority Order**:
  1. **Grid Pixels** - Live cells from user interaction (white)
  2. **Guidance Lines** - Visual aids, rendered early so they can be overwritten
  3. **Challenge Patterns** - Challenge target patterns that overlay on top:
     - **Green** when overlapping with a live cell (indicates correct placement)
     - **Blue** when no live cell is present (indicates missing cell)
     - **Overwrites guidance lines** when they occupy the same coordinates
  4. **Editor Overlays** - Hover effects, paste preview, editable area highlights
  5. **Detectors** (highest priority) - Interactive detector patterns, **always visible and never obscured**
- **Visual Overlay**: Challenge patterns show green when there's a live cell at that position, blue otherwise

---

## 🟡 Test Scenario Preview with Gold Guidance Lines

### Overview
Test scenarios are visually previewed on the grid using gold-colored pixels and guidance lines, giving users immediate feedback about what will be tested when they run scenarios.

### Visual Design
- **Gold Pixels** (#FFD700): Show where test scenario gun patterns will appear
- **Gold Guidance Lines**: Alternating dark gold (#DAA520) and light gold (#FFD700) showing firing directions
- **Rendering Order**: Gold elements render below normal guidance lines, ensuring user-placed patterns are clearly visible

### Technical Implementation

#### Preview Pattern Generation
- `generateTestScenarioPreviewPatterns()` extracts pixels and guidance lines from test scenario brushes
- Applies rotations and flips specified in test scenario setup
- Uses proper guidance line offsets (`startX`, `startY`) from brush specifications
- Returns structured data: `{ patterns: [...], guidanceLines: [...] }`

#### Guidance Line Truncation
Gold guidance lines follow the same truncation rules as normal guidance lines:
- **Intersection Detection**: Lines stop when they would intersect for 2+ consecutive pixels
- **Distance Priority**: The line whose origin is further from the intersection point stops
- **Performance Optimization**: Single gold line uses fast path without intersection calculations

#### Rendering Priority Order
1. Grid background
2. **Gold preview patterns** (test scenario pixels)
3. **Gold guidance lines** (test scenario directions)
4. **Normal guidance lines** (user-placed patterns) ← Appears on top
5. Live cells (player-placed pixels)
6. Challenge patterns
7. Editor overlays
8. Detectors (always visible)

### User Experience
- **Level Load**: Gold preview appears automatically when test scenarios exist
- **Visual Hierarchy**: Clear distinction between test preview (gold) and user patterns (blue)
- **Pattern Matching**: Users can visually align their solutions with test requirements
- **Guidance Visibility**: Normal blue guidance lines overlay gold ones, keeping user patterns prominent

### Benefits
- **Immediate Feedback**: Users see what tests will validate before running them
- **Visual Learning**: Gold patterns show expected gun placements and firing directions
- **Reduced Guesswork**: Clear visual indication of test scenario requirements
- **Non-Intrusive**: Gold elements serve as background hints without obscuring user work

---

## 📐 Coordinate System and Transformations
- **Web Coordinate System**: Uses Y-down orientation where Y increases downward
- **Rotation Matrices**: 
  - **Clockwise 90°**: `[x, y] → [-y, x]`
  - **Counterclockwise 90°**: `[x, y] → [y, -x]`
- **Consistency**: Pattern coordinates `[y, x]` and guidance line coordinates `[x, y]` both use the same rotation principles
- **Legacy Compatibility**: All existing guidance line patterns work correctly after coordinate system fix

---

## 🏁 Challenges

### Overview
Challenges are structured scenarios with specific goals and initial conditions. They guide users in learning and mastering Conway's Game of Life concepts.

### Challenge Structure
Challenges support both target patterns and initial setup patterns with rotation capabilities:

```json
{
  "name": "Challenge Name",
  "description": "Challenge description",
  "patterns": [
    // Target patterns that should be achieved
    { "x": 10, "y": 10, "rle": "3o!" }
  ],
  "setup": [
    // Initial setup patterns placed at the start
    { "x": -5, "y": 0, "brush": "test-guidance" },
    // Setup patterns with rotation (in degrees)
    { "x": 24, "y": -44, "brush": "eater1G", "rotate": 270 }
  ],
  "width": 61,
  "height": 61,
  "targetTurn": 189,
  "editableSpace": { "minX": -30, "maxX": 0, "minY": -30, "maxY": 0 },
  "brushes": ["block", "glider", "test-guidance", "eater1G"]
}
```

- **patterns**: Target patterns to achieve (shown in blue/green overlay)
- **setup**: Initial patterns placed on grid start and restored on clear
- **rotate**: Optional rotation in degrees (0, 90, 180, 270) applied to setup patterns
- **Guidance Lines**: Setup patterns with guidance lines are rotated correctly, including their direction and coordinates

#### Setup Pattern Rotation
- **Syntax**: Add `"rotate": degrees` to any setup pattern
- **Supported Rotations**: Multiples of 90 degrees (0, 90, 180, 270, 360, etc.)
- **Behavior**: Both the brush pattern and its guidance lines are rotated before placement
- **Example**: `"rotate": 270` rotates the brush 270 degrees clockwise (equivalent to 90 degrees counterclockwise)
- **Guidance Line Rotation**: Direction vectors and start coordinates are automatically transformed to match the rotation
- **Normalization**: After rotation, patterns are automatically normalized so they always "hang" from the top-left corner (0,0), ensuring consistent placement regardless of rotation
- **Clear Button**: Clear button correctly applies rotation when restoring setup patterns (fixed)
- **Reset Button**: Reset preserves rotated setup patterns that were applied during initial setup
