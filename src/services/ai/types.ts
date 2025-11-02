export interface GenerationProgress {
  attempt: number;
  maxAttempts: number;
  message?: string;
}

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  model?: string;
  onProgress?: (progress: GenerationProgress) => void;
  cancelSignal?: { cancelled: boolean };
}

export interface InpaintingParams extends GenerationParams {
  image: string; // base64 encoded source image
  maskImage: string; // base64 encoded mask (white = inpaint, black = preserve)
}

export interface GenerationResult {
  imageUrl: string;
  metadata: {
    provider: string;
    model: string;
    seed?: number;
    cost?: number;
    generationTime?: number;
    timestamp: string;
  };
}

export interface AIModel {
  id: string;
  name: string;
  description?: string;
  supportedSizes?: Array<{ width: number; height: number }>;
}

export interface AIProvider {
  name: string;
  type: 'free' | 'paid';
  requiresApiKey: boolean;

  generateImage(params: GenerationParams): Promise<GenerationResult>;
  getSupportedModels(): AIModel[];
  isAvailable(): boolean;
  estimateCost?(params: GenerationParams): number;
}

export type ProviderName = 'pollinations' | 'together' | 'huggingface' | 'openai' | 'replicate';
