# Technical Notes & Architecture Issues

**Last Updated:** 2025-10-26
**Version:** 0.0.1

This document tracks technical issues, architectural decisions, and solutions implemented during development. Useful for debugging, handoff, and understanding design choices.

---

## Current Critical Issues

### Issue #1: Frame Group Corruption & Z-Index Problems

**Status:** 🔴 In Progress
**Priority:** Critical
**Affects:** Core canvas rendering

#### Problem Description

Fabric.js Groups used for frame objects become corrupted during transformations (move, resize, rotate):
- `frameObject.getObjects()` method becomes undefined
- Causes crash: `frameObject.getObjects is not a function`
- Z-index gets inverted: frames render ABOVE layers instead of below
- Repeated frame recreation causes infinite loop
- Layers disappear when not selected

#### Root Causes

1. **Fabric.js Group Fragility**
   - Groups can become "ungrouped" during certain transformations
   - Internal structure changes unpredictably
   - `getObjects()` method disappears after group manipulation

2. **Z-Index Management Issues**
   - When frames are recreated, they're added to top of canvas stack
   - No explicit z-index enforcement
   - Layers should always render above frames, but this isn't guaranteed

3. **Reactive Recreation Loop**
   - Frame update failures trigger recreation
   - Recreation happens every render cycle
   - Creates performance issues and visual glitches

#### Attempted Solutions

##### ❌ Attempt 1: Safety Checks Only
```typescript
// Added type checking to prevent crashes
if (!frameObject || typeof frameObject.getObjects !== 'function') {
  return; // Just bail out
}
```
**Result:** Prevented crashes but frames/layers became invisible

##### ❌ Attempt 2: Recreate on Failure
```typescript
if (!updateSuccess) {
  canvas.remove(frameObject);
  const newFrameObject = createFrameObject(frame);
  canvas.add(newFrameObject);
}
```
**Result:** Infinite recreation loop, z-index issues, layers behind frames

#### Proposed Solutions

##### Solution 1: Explicit Z-Index Management (Quick Fix)
**Pros:**
- Minimal code changes
- Addresses z-index immediately
- Can be implemented quickly

**Cons:**
- Doesn't fix root cause (Group corruption)
- Performance overhead from constant reordering
- Still fragile

**Implementation:**
```typescript
function enforceZIndex(canvas: Canvas) {
  // Move all frames to bottom
  const frames = canvas.getObjects().filter(obj => obj.frameId && !obj.layerId);
  frames.forEach(frame => canvas.sendToBack(frame));

  // Layers naturally stay on top
  canvas.renderAll();
}
```

##### Solution 2: Simplify Frame Structure ⭐ **CHOSEN APPROACH**
**Pros:**
- Eliminates Group corruption entirely
- Simpler, more maintainable code
- Better performance
- More predictable behavior

**Cons:**
- Need to move labels to React/HTML overlay
- Moderate refactoring required

**Implementation Plan:**
1. Replace frame Groups with simple Rect objects
2. Remove embedded Text objects (label, dimensions)
3. Create HTML/React overlay for frame labels
4. Position labels absolutely over canvas
5. Update all frame-related helper functions

**Changes Required:**
- `fabricHelpers.ts::createFrameObject()` - Return Rect instead of Group
- `fabricHelpers.ts::updateFrameObject()` - Update Rect properties only
- `InfiniteCanvas.tsx` - Add HTML overlay for labels
- Remove `getObjects()` calls entirely

##### Solution 3: Separate Rendering Layers (Best Long-term)
**Pros:**
- Complete separation of concerns
- Maximum flexibility
- Industry best practice

**Cons:**
- Significant refactoring
- Complexity increase
- May be overkill for current needs

**Implementation:**
- Use StaticCanvas for frames (non-interactive)
- Use Canvas for layers (interactive)
- Or: Make frames completely non-selectable/transformable

#### Decision: Implementing Solution 2

**Rationale:**
- Balances simplicity with robustness
- Eliminates root cause without over-engineering
- Frames don't need to be complex Groups
- HTML labels are actually better UX (always readable, not affected by zoom)
- Sets up good foundation for future features

**Files to Modify:**
1. `src/utils/fabricHelpers.ts` - Simplify frame creation
2. `src/components/canvas/InfiniteCanvas.tsx` - Add label overlay
3. `src/types/index.ts` - Update types if needed

---

## Other Known Issues

### Issue #2: Eraser Tool Implementation
**Status:** ✅ Resolved
**Solution:** Implemented as click-to-delete instead of brush-based eraser
**Note:** Fabric.js doesn't have built-in `EraserBrush` - attempted import caused crashes

### Issue #3: Frame Content Movement
**Status:** ✅ Resolved
**Solution:** Added `object:moving` event handler to sync layer positions during frame drag

### Issue #4: Export Bottom Cutoff
**Status:** ✅ Resolved
**Solution:** Fixed layer transformation handling in export service (scale, rotation)

### Issue #5: Undo/Redo Visibility
**Status:** ✅ Resolved
**Solution:** Added undo/redo buttons to toolbar with proper history store integration

### Issue #6: Layer Reordering
**Status:** ✅ Resolved
**Solution:** Implemented drag-and-drop layer reordering in LayersPanel with z-index sync

---

## Architecture Decisions

### State Management: Zustand
**Why:** Simpler than Redux, TypeScript-friendly, minimal boilerplate
**Stores:**
- `useFrameStore` - Frame and layer data
- `useCanvasStore` - Canvas viewport, zoom, pan state
- `useDrawingStore` - Drawing tool state
- `useHistoryStore` - Undo/redo state

### Canvas Library: Fabric.js
**Why:** Powerful, widely used, good TypeScript support
**Gotchas:**
- Groups are fragile (see Issue #1)
- Z-index management requires manual enforcement
- Event handling can be tricky with custom properties

### Component Library: shadcn/ui
**Why:** Accessible, customizable, not a package dependency
**Note:** Components copied into project, fully owned

---

## Best Practices & Patterns

### Canvas Object Custom Properties
All canvas objects should have these custom properties:
```typescript
interface FrameObject extends Rect {
  frameId: string;
}

interface LayerObject extends FabricImage {
  layerId: string;
  frameId: string;
}
```

### Bidirectional Sync Pattern
1. User interacts with canvas → updates store
2. Store updates → reflected on canvas
3. Use `object:modified`, `object:moving` events
4. Debounce updates to prevent loops

### Z-Index Convention
**Order (bottom to top):**
1. Frames (background)
2. Layers within frames (by layer.order)
3. Selection indicators

### Error Handling
- Always validate canvas objects before manipulation
- Check for required methods/properties
- Provide fallbacks for corrupted objects
- Log warnings, don't crash

---

## Future Refactoring Opportunities

1. **Canvas Abstraction Layer**
   - Wrap Fabric.js in custom service
   - Isolate canvas-specific code
   - Easier to swap libraries if needed

2. **Worker Thread for Export**
   - Offload export rendering to Web Worker
   - Prevent UI freezing during export
   - Better user experience

3. **Viewport Culling**
   - Only render objects in viewport
   - Massive performance gains for large projects
   - See ROADMAP.md Performance section

4. **Layer Caching**
   - Cache rendered layer images
   - Only re-render on actual changes
   - Reduce CPU/GPU usage

---

## Debugging Tips

### Inspecting Canvas Objects
```typescript
// Get all objects
const objects = canvas.getObjects();

// Find specific object
const frame = canvas.getObjects().find(obj => obj.frameId === 'id');

// Check object type
console.log(obj.type); // 'rect', 'image', 'group', etc.

// Check custom properties
console.log(obj.frameId, obj.layerId);
```

### React DevTools
Install React DevTools browser extension to inspect:
- Zustand store state
- Component re-renders
- Props and state values

### Fabric.js Events
Useful for debugging:
```typescript
canvas.on('object:modified', (e) => console.log('Modified:', e.target));
canvas.on('object:moving', (e) => console.log('Moving:', e.target));
canvas.on('object:added', (e) => console.log('Added:', e.target));
canvas.on('object:removed', (e) => console.log('Removed:', e.target));
```

---

## Version History

### v0.0.1 (2025-10-26)
- Initial project setup
- Fixed import errors (DrawingTool, LineIcon)
- Fixed eraser implementation
- Fixed frame content movement
- Fixed export bottom cutoff
- Added undo/redo buttons
- Added layer reordering
- Identified frame Group corruption issue
- Documented architectural problems and solutions

---

## Contributors & Handoff Notes

### Current State
- Core functionality working but frame rendering has critical issues
- Frame Group corruption causing crashes and z-index problems
- Solution 2 (Simplify Frame Structure) ready to implement
- See Issue #1 above for full context

### Next Steps
1. Implement Solution 2 (simplify frame structure)
2. Test frame transformations thoroughly
3. Verify z-index remains correct
4. Add unit tests for frame/layer rendering
5. Document new architecture

### Key Files to Understand
- `src/components/canvas/InfiniteCanvas.tsx` - Main canvas logic
- `src/utils/fabricHelpers.ts` - Frame/layer rendering
- `src/stores/useFrameStore.ts` - Frame/layer state
- `src/stores/useCanvasStore.ts` - Canvas viewport state

---

**Questions?** See README.md or open an issue on GitHub.
