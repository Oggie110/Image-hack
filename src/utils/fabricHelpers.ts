import { Canvas, Rect, Text, Group, FabricImage } from 'fabric';
import type { Frame, Layer } from '@/types';

interface FrameObject extends Group {
  frameId: string;
}

interface LayerObject extends FabricImage {
  layerId: string;
  frameId: string;
}

export function createFrameObject(frame: Frame): FrameObject {
  // Create frame background
  const background = new Rect({
    width: frame.width,
    height: frame.height,
    fill: frame.backgroundColor,
    stroke: '#3b82f6', // Blue border
    strokeWidth: 2,
    rx: 0,
    ry: 0,
  });

  // Create frame label
  const label = new Text(frame.name, {
    fontSize: 14,
    fill: '#3b82f6',
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '500',
    top: -24,
    left: 0,
  });

  // Create dimension label
  const dimensions = new Text(`${frame.width} × ${frame.height}`, {
    fontSize: 12,
    fill: '#6b7280',
    fontFamily: 'system-ui, sans-serif',
    top: -24,
    left: label.width! + 8,
  });

  // Group all elements
  const group = new Group([background, label, dimensions], {
    left: frame.x,
    top: frame.y,
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

  group.frameId = frame.id;

  return group;
}

export function updateFrameObject(frameObject: FrameObject, frame: Frame) {
  const [background, label, dimensions] = frameObject.getObjects();

  // Update background
  if (background instanceof Rect) {
    background.set({
      width: frame.width,
      height: frame.height,
      fill: frame.backgroundColor,
    });
  }

  // Update label
  if (label instanceof Text) {
    label.set({ text: frame.name });
  }

  // Update dimensions
  if (dimensions instanceof Text) {
    dimensions.set({
      text: `${frame.width} × ${frame.height}`,
      left: label.width! + 8,
    });
  }

  // Update position
  frameObject.set({
    left: frame.x,
    top: frame.y,
  });

  frameObject.setCoords();
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
