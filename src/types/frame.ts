import type { Layer } from './layer';

export type ExportFormat = 'png' | 'jpg' | 'webp';

export interface ExportSettings {
  format: ExportFormat;
  scale: 1 | 2 | 3; // 1x, 2x, 3x
  quality?: number; // 0-100 for JPG
}

export interface FramePreset {
  name: string;
  width: number;
  height: number;
  category: 'mobile' | 'tablet' | 'desktop' | 'social' | 'custom';
}

export interface Frame {
  id: string;
  name: string;

  // Position on infinite canvas
  x: number;
  y: number;

  // Frame dimensions
  width: number;
  height: number;

  // Background
  backgroundColor: string;

  // Layers within this frame
  layers: Layer[];

  // Display options
  visible: boolean;
  locked: boolean;
  clipContent: boolean; // If true, layers outside frame are hidden

  // Export settings
  exportSettings: ExportSettings;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Predefined frame presets
export const FRAME_PRESETS: FramePreset[] = [
  // Mobile
  { name: 'iPhone 14 Pro', width: 393, height: 852, category: 'mobile' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, category: 'mobile' },
  { name: 'iPhone SE', width: 375, height: 667, category: 'mobile' },
  { name: 'Android (Medium)', width: 360, height: 800, category: 'mobile' },

  // Tablet
  { name: 'iPad Pro 11"', width: 834, height: 1194, category: 'tablet' },
  { name: 'iPad Pro 12.9"', width: 1024, height: 1366, category: 'tablet' },

  // Desktop
  { name: 'Desktop (1080p)', width: 1920, height: 1080, category: 'desktop' },
  { name: 'Desktop (1440p)', width: 2560, height: 1440, category: 'desktop' },
  { name: 'Desktop (4K)', width: 3840, height: 2160, category: 'desktop' },

  // Social
  { name: 'Instagram Post', width: 1080, height: 1080, category: 'social' },
  { name: 'Instagram Story', width: 1080, height: 1920, category: 'social' },
  { name: 'Twitter Post', width: 1200, height: 675, category: 'social' },
  { name: 'Facebook Cover', width: 820, height: 312, category: 'social' },

  // Custom
  { name: 'Icon (512x512)', width: 512, height: 512, category: 'custom' },
  { name: 'Icon (1024x1024)', width: 1024, height: 1024, category: 'custom' },
];
