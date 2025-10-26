export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  model?: string;
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
