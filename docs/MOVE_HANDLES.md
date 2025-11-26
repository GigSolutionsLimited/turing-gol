# Move Handle Feature

This document describes the move handle functionality added to user-placed objects in the Game of Life application.

## Overview

Move handles are visual indicators that appear on the top-left corner of user-placed objects (patterns/brushes) when the game is not running. Clicking on a move handle converts the placed object back into a selected brush, allowing users to easily modify or relocate their placed patterns.

## Implementation

### Components Modified

1. **GameOfLife.jsx**
   - Added `moveHandleRenderData` generation using `useMemo`
   - Modified click handler (`handleCanvasClick`) to detect move handle clicks
   - Added move handle click detection logic with pixel-perfect accuracy

2. **GameCanvas.jsx**
   - Added `moveHandleRenderData` prop to component interface
   - Updated render options to include move handle data
   - Updated dependency arrays to include new move handle data

3. **canvasRenderer.js**
   - Added `renderMoveHandles()` method for drawing move handles
   - Updated `renderOptimized()` to call move handle rendering
   - Updated `shouldRedraw` condition to include move handles

### Move Handle Rendering

- **Position**: Top-left corner of placed objects (minimum X and Y coordinates)
- **Size**: Dynamic sizing based on cell size
  - Minimum: 6px
  - Maximum: 12px  
  - Default: 1/3 of cell size
- **Appearance**: 
  - Semi-transparent dark background (`rgba(0, 0, 0, 0.7)`)
  - Bright blue border (`#3EC6FF`)
  - Cross/plus icon indicating move functionality

### Click Detection

- **Hit Area**: Square area around handle center
- **Hit Radius**: Half of handle size
- **Priority**: Move handle clicks are processed before grid clicks
- **Accuracy**: Pixel-perfect detection using distance calculation

## User Experience

### When Move Handles Appear
- Game is not running (`running = false`)
- User has placed objects on the grid
- Objects are rendered with small blue handles at their top-left corners

### When User Clicks Move Handle
1. Placed object is removed from the grid and placed objects array
2. Object's pixels are cleared from the game grid
3. Object's guidance lines are automatically removed
4. Original brush (with any applied rotation) is selected as the current pattern
5. User can immediately place the brush elsewhere or modify it

### Benefits
- **Easy Editing**: Quickly pick up and modify placed patterns
- **Rotation Preservation**: Maintains any rotation applied to the original brush
- **Clean Removal**: Automatically handles cleanup of pixels and guidance lines
- **Intuitive Interface**: Visual feedback makes it clear which objects can be moved

## Technical Details

### Move Handle Data Structure
```javascript
{
  id: string,           // Unique identifier of placed object
  x: number,            // Top-left X coordinate (grid units)
  y: number,            // Top-left Y coordinate (grid units)
  brushName: string,    // Name of original brush
  originalGridX: number, // Original placement X coordinate
  originalGridY: number, // Original placement Y coordinate  
  rotation: number      // Applied rotation (0, 90, 180, 270 degrees)
}
```

### Click Detection Algorithm
```javascript
const handleSize = Math.max(6, Math.min(cellSize / 3, 12));
const handleClickRadius = handleSize / 2;
const distanceX = Math.abs(mouseX - handleX);
const distanceY = Math.abs(mouseY - handleY);
const isWithinHandle = distanceX <= handleClickRadius && distanceY <= handleClickRadius;
```

## Future Enhancements

Potential improvements for the move handle feature:

1. **Drag and Drop**: Allow dragging handles to move objects without re-selection
2. **Handle Theming**: Customize handle colors based on object type or state
3. **Keyboard Shortcuts**: Add keyboard shortcuts for handle operations
4. **Batch Operations**: Select multiple handles for bulk operations
5. **Handle Tooltips**: Show brush name and properties on hover

## Testing

Comprehensive tests are included in `tests/components/moveHandles.test.js` covering:

- Move handle data generation logic
- Click detection accuracy
- Handle sizing calculations
- Edge cases and boundary conditions

Run tests with:
```bash
npm test -- tests/components/moveHandles.test.js
```
