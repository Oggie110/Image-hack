import { Canvas, Rect, Text, Group } from 'fabric';
import type { Frame } from '@/types';

interface FrameObject extends Group {
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
