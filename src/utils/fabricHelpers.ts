import { Canvas, Rect, FabricImage } from 'fabric';
import type { Frame, Layer } from '@/types';

interface FrameObject extends Rect {
  frameId: string;
}

interface LayerObject extends FabricImage {
  layerId: string;
  frameId: string;
}

export function createFrameObject(frame: Frame, isSelected: boolean = false): FrameObject {
  // Different styling for selected vs unselected frames
  const strokeColor = isSelected ? '#2563eb' : '#94a3b8'; // Brighter blue when selected
  const strokeWidth = isSelected ? 3 : 2; // Thicker border when selected

  // Create simple frame rectangle (no labels - those will be in HTML overlay)
  const rect = new Rect({
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    fill: frame.backgroundColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    rx: 0,
    ry: 0,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockScalingX: false,
    lockScalingY: false,
    borderColor: strokeColor,
    cornerColor: strokeColor,
    cornerSize: 8,
    transparentCorners: false,
    opacity: isSelected ? 1 : 0.9, // Slightly dimmed when not selected
  }) as FrameObject;

  rect.frameId = frame.id;

  return rect;
}

export function updateFrameObject(frameObject: FrameObject, frame: Frame, isSelected: boolean = false): boolean {
  // Safety check: ensure frameObject exists and is a Rect
  if (!frameObject) {
    console.warn('Invalid frame object passed to updateFrameObject');
    return false;
  }

  // Different styling for selected vs unselected frames
  const strokeColor = isSelected ? '#2563eb' : '#94a3b8';
  const strokeWidth = isSelected ? 3 : 2;

  // Update frame rectangle properties
  frameObject.set({
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    fill: frame.backgroundColor,
    stroke: strokeColor,
    strokeWidth: strokeWidth,
    borderColor: strokeColor,
    cornerColor: strokeColor,
    opacity: isSelected ? 1 : 0.9,
  });

  frameObject.setCoords();
  return true;
}

export function getFrameFromCanvas(canvas: Canvas, frameId: string): FrameObject | null {
  const objects = canvas.getObjects() as FrameObject[];
  return objects.find((obj) => obj.frameId === frameId) || null;
}

export function removeFrameFromCanvas(canvas: Canvas, frameId: string) {
  const frameObject = getFrameFromCanvas(canvas, frameId);
  if (frameObject) {
    canvas.remove(frameObject);
  }
}

// ===== LAYER RENDERING =====

/**
 * Create a layer object on the canvas
 */
export async function createLayerObject(
  layer: Layer,
  frame: Frame,
  imageUrl?: string
): Promise<LayerObject | null> {
  if (!imageUrl && !layer.imageUrl) {
    return null;
  }

  return new Promise((resolve, reject) => {
    const url = imageUrl || layer.imageUrl!;

    FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    }).then((img) => {
      const layerObj = img as LayerObject;

      // Set layer properties
      layerObj.set({
        left: frame.x + layer.x,
        top: frame.y + layer.y,
        scaleX: layer.scaleX,
        scaleY: layer.scaleY,
        angle: layer.rotation,
        opacity: layer.opacity / 100,
        selectable: !layer.locked,
        hasControls: !layer.locked,
        hasBorders: true,
        borderColor: '#10b981',
        cornerColor: '#10b981',
        cornerSize: 8,
        transparentCorners: false,
        visible: layer.visible !== false, // Ensure visible is properly set
      });
      
      // Explicitly set visibility to ensure it's respected
      layerObj.set('visible', layer.visible !== false);

      // Add custom properties
      layerObj.layerId = layer.id;
      layerObj.frameId = frame.id;

      resolve(layerObj);
    }).catch(reject);
  });
}

/**
 * Update layer object properties
 * Only updates position if it differs significantly from canvas position
 * This prevents position reset when only visibility/lock/opacity changes
 */
export function updateLayerObject(layerObj: LayerObject, layer: Layer, frame: Frame) {
  // Calculate expected position from store
  const expectedLeft = frame.x + layer.x;
  const expectedTop = frame.y + layer.y;
  
  // Get current canvas position
  const currentLeft = layerObj.left || 0;
  const currentTop = layerObj.top || 0;
  
  // Only update position if it differs significantly (more than 1px)
  // This allows the canvas position to be preserved when only visibility/lock/opacity changes
  // but still updates position when frame is moved or layer position is explicitly changed
  const positionDiffers = 
    Math.abs(currentLeft - expectedLeft) > 1 ||
    Math.abs(currentTop - expectedTop) > 1;
  
  // Always update visibility - CRITICAL: must be boolean, not undefined
  // Use !== false to treat undefined as visible (default state)
  const shouldBeVisible = layer.visible !== false;
  
  // Always update visibility and other properties
  const updates: any = {
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    angle: layer.rotation,
    opacity: layer.opacity / 100,
    selectable: !layer.locked,
    hasControls: !layer.locked,
    visible: shouldBeVisible, // Explicit boolean
  };
  
  // Only update position if it differs significantly
  if (positionDiffers) {
    updates.left = expectedLeft;
    updates.top = expectedTop;
  }
  
  // Apply all updates
  layerObj.set(updates);
  layerObj.setCoords();

  // CRITICAL: Restore custom properties after set() call
  // Fabric.js's set() method can sometimes lose custom properties
  layerObj.layerId = layer.id;
  layerObj.frameId = frame.id;

  // CRITICAL: Force visibility update multiple ways - Fabric.js can be finicky
  // Direct property assignment
  layerObj.visible = shouldBeVisible;
  // Using set() method
  layerObj.set('visible', shouldBeVisible);
  // Force dirty state to ensure re-render
  layerObj.set('dirty', true);

  // IMPORTANT: Always force render regardless of visibility state
  // This ensures both hiding and unhiding are reflected immediately
  layerObj.setCoords();
  if (layerObj.canvas) {
    layerObj.canvas.renderAll();
  }

  // Verify custom properties are still set
  if (!layerObj.layerId || !layerObj.frameId) {
    console.error(`Custom properties lost after update! layerId: ${layerObj.layerId}, frameId: ${layerObj.frameId}`);
  }

  console.log(`Layer ${layer.id} visibility updated to: ${shouldBeVisible}`);
}

/**
 * Get layer object from canvas by layer ID
 */
export function getLayerFromCanvas(canvas: Canvas, layerId: string): LayerObject | null {
  const objects = canvas.getObjects() as LayerObject[];
  const found = objects.find((obj) => obj.layerId === layerId) || null;

  // Debug logging
  if (found) {
    console.log(`Found layer ${layerId} on canvas, visible: ${found.visible}`);
  } else {
    console.log(`Layer ${layerId} NOT found on canvas. Total objects: ${objects.length}, with layerId: ${objects.filter(o => o.layerId).length}`);
  }

  return found;
}

/**
 * Remove layer from canvas
 */
export function removeLayerFromCanvas(canvas: Canvas, layerId: string) {
  const layerObj = getLayerFromCanvas(canvas, layerId);
  if (layerObj) {
    canvas.remove(layerObj);
    // Dispose of the object to free memory (important for image objects)
    if (layerObj.dispose) {
      layerObj.dispose();
    }
    canvas.renderAll();
  }
}

/**
 * Get all layer objects for a specific frame
 */
export function getFrameLayersFromCanvas(canvas: Canvas, frameId: string): LayerObject[] {
  const objects = canvas.getObjects() as LayerObject[];
  return objects.filter((obj) => obj.frameId === frameId && obj.layerId);
}
