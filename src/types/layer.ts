export type LayerType = 'image' | 'ai-generated' | 'shape' | 'text';

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

  // Position and size within frame
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  scaleX: number;
  scaleY: number;
}
