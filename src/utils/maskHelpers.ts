import { fabric } from 'fabric';

export interface MaskRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SymmetrySettings {
  enabled: boolean;
  type: 'horizontal' | 'vertical' | '4-corner' | 'none';
  centerX?: number;
  centerY?: number;
}

/**
 * Convert a fabric canvas/object to base64 image
 */
export function canvasToBase64(canvas: fabric.Canvas, format: 'png' | 'jpeg' = 'png', quality = 1.0): string {
  return canvas.toDataURL({
    format,
    quality,
    multiplier: 1,
  });
}

/**
 * Export a specific layer object to base64
 */
export function layerObjectToBase64(
  fabricObject: fabric.Object,
  width: number,
  height: number,
  format: 'png' | 'jpeg' = 'png'
): string {
  // Create temporary canvas
  const tempCanvas = new fabric.Canvas(document.createElement('canvas'), {
    width,
    height,
  });

  // Clone object and add to temp canvas
  fabricObject.clone((cloned: fabric.Object) => {
    tempCanvas.add(cloned);
    tempCanvas.centerObject(cloned);
  });

  tempCanvas.renderAll();
  const base64 = tempCanvas.toDataURL({ format, quality: 1.0 });

  // Cleanup
  tempCanvas.dispose();

  return base64;
}

/**
 * Create a grayscale mask canvas from rectangles
 * White (255) = areas to inpaint
 * Black (0) = areas to preserve
 */
export function createMaskFromRectangles(
  rectangles: MaskRect[],
  width: number,
  height: number,
  symmetry?: SymmetrySettings
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill with black (preserve everything by default)
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, width, height);

  // Draw white rectangles (inpaint these areas)
  ctx.fillStyle = 'white';

  const allRects = [...rectangles];

  // Apply symmetry
  if (symmetry?.enabled && symmetry.type !== 'none') {
    const centerX = symmetry.centerX ?? width / 2;
    const centerY = symmetry.centerY ?? height / 2;

    rectangles.forEach((rect) => {
      if (symmetry.type === 'horizontal' || symmetry.type === '4-corner') {
        // Mirror horizontally
        allRects.push({
          x: 2 * centerX - rect.x - rect.width,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }

      if (symmetry.type === 'vertical' || symmetry.type === '4-corner') {
        // Mirror vertically
        allRects.push({
          x: rect.x,
          y: 2 * centerY - rect.y - rect.height,
          width: rect.width,
          height: rect.height,
        });
      }

      if (symmetry.type === '4-corner') {
        // Mirror both ways (diagonal)
        allRects.push({
          x: 2 * centerX - rect.x - rect.width,
          y: 2 * centerY - rect.y - rect.height,
          width: rect.width,
          height: rect.height,
        });
      }
    });
  }

  // Draw all rectangles
  allRects.forEach((rect) => {
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  });

  return canvas;
}

/**
 * Convert mask canvas to grayscale base64
 */
export function maskCanvasToBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Create a preview overlay for the mask (semi-transparent red)
 */
export function createMaskPreviewOverlay(
  maskCanvas: HTMLCanvasElement,
  overlayColor = 'rgba(255, 0, 0, 0.3)'
): HTMLCanvasElement {
  const preview = document.createElement('canvas');
  preview.width = maskCanvas.width;
  preview.height = maskCanvas.height;
  const ctx = preview.getContext('2d')!;

  // Get mask data
  const maskCtx = maskCanvas.getContext('2d')!;
  const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const data = imageData.data;

  // Create preview
  ctx.fillStyle = overlayColor;

  for (let i = 0; i < data.length; i += 4) {
    // If pixel is white (mask area), draw overlay
    if (data[i] > 128) { // White threshold
      const x = (i / 4) % maskCanvas.width;
      const y = Math.floor(i / 4 / maskCanvas.width);
      ctx.fillRect(x, y, 1, 1);
    }
  }

  return preview;
}

/**
 * Resize image to fit within max dimensions while preserving aspect ratio
 */
export function resizeImageToFit(
  imageUrl: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let targetWidth = img.width;
      let targetHeight = img.height;

      if (targetWidth > maxWidth || targetHeight > maxHeight) {
        if (aspectRatio > 1) {
          // Landscape
          targetWidth = maxWidth;
          targetHeight = maxWidth / aspectRatio;
        } else {
          // Portrait
          targetHeight = maxHeight;
          targetWidth = maxHeight * aspectRatio;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = reject;
    img.src = imageUrl;
  });
}
