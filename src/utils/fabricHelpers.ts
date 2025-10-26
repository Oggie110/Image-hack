import { Canvas, Rect, FabricImage } from 'fabric';
import type { Frame, Layer } from '@/types';

interface FrameObject extends Rect {
  frameId: string;
}

interface LayerObject extends FabricImage {
  layerId: string;
  frameId: string;
}

export function createFrameObject(frame: Frame): FrameObject {
  // Create simple frame rectangle (no labels - those will be in HTML overlay)
  const rect = new Rect({
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    fill: frame.backgroundColor,
    stroke: '#3b82f6', // Blue border
    strokeWidth: 2,
    rx: 0,
    ry: 0,
    selectable: true,
    hasControls: true,
    hasBorders: true,
    lockScalingX: false,
    lockScalingY: false,
    borderColor: '#3b82f6',
    cornerColor: '#3b82f6',
    cornerSize: 8,
    transparentCorners: false,
  }) as FrameObject;

  rect.frameId = frame.id;

  return rect;
}

export function updateFrameObject(frameObject: FrameObject, frame: Frame): boolean {
  // Safety check: ensure frameObject exists and is a Rect
  if (!frameObject) {
    console.warn('Invalid frame object passed to updateFrameObject');
    return false;
  }

  // Update frame rectangle properties
  frameObject.set({
    left: frame.x,
    top: frame.y,
    width: frame.width,
    height: frame.height,
    fill: frame.backgroundColor,
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
        visible: layer.visible,
      });

      // Add custom properties
      layerObj.layerId = layer.id;
      layerObj.frameId = frame.id;

      resolve(layerObj);
    }).catch(reject);
  });
}

/**
 * Update layer object properties
 */
export function updateLayerObject(layerObj: LayerObject, layer: Layer, frame: Frame) {
  layerObj.set({
    left: frame.x + layer.x,
    top: frame.y + layer.y,
    scaleX: layer.scaleX,
    scaleY: layer.scaleY,
    angle: layer.rotation,
    opacity: layer.opacity / 100,
    selectable: !layer.locked,
    hasControls: !layer.locked,
    visible: layer.visible,
  });

  layerObj.setCoords();
}

/**
 * Get layer object from canvas by layer ID
 */
export function getLayerFromCanvas(canvas: Canvas, layerId: string): LayerObject | null {
  const objects = canvas.getObjects() as LayerObject[];
  return objects.find((obj) => obj.layerId === layerId) || null;
}

/**
 * Remove layer from canvas
 */
export function removeLayerFromCanvas(canvas: Canvas, layerId: string) {
  const layerObj = getLayerFromCanvas(canvas, layerId);
  if (layerObj) {
    canvas.remove(layerObj);
  }
}

/**
 * Get all layer objects for a specific frame
 */
export function getFrameLayersFromCanvas(canvas: Canvas, frameId: string): LayerObject[] {
  const objects = canvas.getObjects() as LayerObject[];
  return objects.filter((obj) => obj.frameId === frameId && obj.layerId);
}
