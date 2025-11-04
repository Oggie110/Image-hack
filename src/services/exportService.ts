import { Canvas } from 'fabric';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Frame, ExportFormat } from '@/types';
import { getFrameLayersFromCanvas } from '@/utils/fabricHelpers';

export interface ExportOptions {
  format: ExportFormat;
  scale: 1 | 2 | 3;
  quality?: number; // 0-1 for JPG
  transparentBackground?: boolean;
}

/**
 * Export a single frame as an image
 */
export async function exportFrame(
  canvas: Canvas,
  frame: Frame,
  options: ExportOptions
): Promise<Blob> {
  const { format, scale, quality = 0.9, transparentBackground = false } = options;

  // Create a temporary canvas for this frame
  const tempCanvas = document.createElement('canvas');
  const ctx = tempCanvas.getContext('2d')!;

  // Set canvas size with scale
  tempCanvas.width = frame.width * scale;
  tempCanvas.height = frame.height * scale;

  // Fill background (unless transparent PNG)
  if (!transparentBackground || format !== 'png') {
    ctx.fillStyle = frame.backgroundColor;
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
  }

  // Get all layers for this frame
  const layers = getFrameLayersFromCanvas(canvas, frame.id);

  // Sort layers by z-index (render order)
  const sortedLayers = [...layers].sort((a, b) => {
    const aIndex = canvas.getObjects().indexOf(a as any);
    const bIndex = canvas.getObjects().indexOf(b as any);
    return aIndex - bIndex;
  });

  // Render each layer
  for (const layer of sortedLayers) {
    if (!layer.visible) continue;

    // Get layer position relative to frame
    const layerX = (layer.left || 0) - frame.x;
    const layerY = (layer.top || 0) - frame.y;

    // Create image from layer
    const layerCanvas = layer.toCanvasElement({
      multiplier: scale,
    });

    // Draw layer with opacity
    ctx.globalAlpha = layer.opacity || 1;
    ctx.drawImage(
      layerCanvas,
      layerX * scale,
      layerY * scale,
      layerCanvas.width,
      layerCanvas.height
    );
    ctx.globalAlpha = 1;
  }

  // Convert to blob
  const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
  return new Promise((resolve, reject) => {
    tempCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      mimeType,
      quality
    );
  });
}

/**
 * Download a single frame
 */
export async function downloadFrame(
  canvas: Canvas,
  frame: Frame,
  options: ExportOptions
): Promise<void> {
  const blob = await exportFrame(canvas, frame, options);
  const filename = sanitizeFilename(
    `${frame.name}${options.scale > 1 ? `@${options.scale}x` : ''}.${options.format}`
  );
  saveAs(blob, filename);
}

/**
 * Export multiple frames as a ZIP file
 */
export async function exportMultipleFrames(
  canvas: Canvas,
  frames: Frame[],
  options: ExportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('frames')!;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, frames.length);
    }

    // Export frame
    const blob = await exportFrame(canvas, frame, options);

    // Add to zip
    const filename = sanitizeFilename(
      `${frame.name}${options.scale > 1 ? `@${options.scale}x` : ''}.${options.format}`
    );
    folder.file(filename, blob);
  }

  // Generate zip file
  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Download
  const timestamp = new Date().toISOString().split('T')[0];
  saveAs(zipBlob, `image-hack-export-${timestamp}.zip`);
}

/**
 * Export all frames in the project
 */
export async function exportAllFrames(
  canvas: Canvas,
  frames: Frame[],
  options: ExportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  return exportMultipleFrames(canvas, frames, options, onProgress);
}

/**
 * Sanitize filename to remove invalid characters
 */
function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-z0-9@._-]/gi, '_');
}

/**
 * Get the estimated file size for an export (rough estimate)
 */
export function estimateExportSize(frame: Frame, options: ExportOptions): string {
  const pixels = frame.width * frame.height * options.scale * options.scale;

  let bytesPerPixel = 4; // PNG

  if (options.format === 'jpg') {
    bytesPerPixel = 1; // JPG is compressed
  } else if (options.format === 'webp') {
    bytesPerPixel = 1.5; // WebP compression
  }

  const bytes = pixels * bytesPerPixel;

  // Convert to human readable
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
