export type LayerType = 'image' | 'ai-generated' | 'shape' | 'text' | 'sketch' | 'group';

export type BlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';

export interface AIMetadata {
  prompt: string;
  negativePrompt?: string;
  model: string;
  seed?: number;
  steps?: number;
  guidanceScale?: number;
  width: number;
  height: number;
  generatedAt: string;
  // Inpainting-specific metadata
  isInpainting?: boolean;
  originalImageUrl?: string; // URL of the source image before inpainting
  maskData?: string; // base64 mask used for inpainting (for reference/redo)
}

export interface SketchMetadata {
  strokeColor: string;
  strokeWidth: number;
  fill?: string;
  pathData?: string; // SVG path data for vector sketches
  fabricObjectData?: string; // Serialized Fabric.js object JSON
  createdAt: string;
}

export interface Layer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 100
  blendMode: BlendMode;

  // Fabric.js object reference (will be stored separately, not in state)
  fabricObjectId?: string;

  // Image data
  imageUrl?: string;

  // AI metadata (only for AI-generated layers)
  aiMetadata?: AIMetadata;

  // Sketch metadata (only for sketch layers)
  sketchMetadata?: SketchMetadata;

  // Group children (only for group layers)
  children?: Layer[];

  // Position and size within frame
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
}
