import type { AIProvider, GenerationParams, GenerationResult, AIModel } from '../types';

/**
 * Hugging Face Inference API Provider
 * FREE tier with rate limits
 * Good for testing different open-source models
 */
export class HuggingFaceProvider implements AIProvider {
  name = 'Hugging Face';
  type = 'free' as const;
  requiresApiKey = true; // Optional - free tier available
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_HUGGINGFACE_API_KEY || '';
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = params.model || 'stabilityai/stable-diffusion-xl-base-1.0';

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': this.apiKey ? `Bearer ${this.apiKey}` : '',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: params.prompt,
            parameters: {
              negative_prompt: params.negativePrompt,
              width: params.width,
              height: params.height,
              num_inference_steps: params.steps || 30,
              guidance_scale: params.guidanceScale || 7.5,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Model is loading, please try again in a few seconds');
        }
        const error = await response.text();
        throw new Error(error || 'Hugging Face API request failed');
      }

      // HuggingFace returns a blob
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      const generationTime = Date.now() - startTime;

      return {
        imageUrl,
        metadata: {
          provider: 'huggingface',
          model: model.split('/')[1] || model,
          seed: params.seed,
          cost: 0,
          generationTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Hugging Face generation error:', error);
      throw error;
    }
  }

  getSupportedModels(): AIModel[] {
    return [
      {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'High-quality open-source model',
      },
      {
        id: 'runwayml/stable-diffusion-v1-5',
        name: 'Stable Diffusion 1.5',
        description: 'Faster, lighter model',
      },
    ];
  }

  isAvailable(): boolean {
    // Works without API key but with heavy rate limits
    return true;
  }

  estimateCost(): number {
    return 0; // Free tier
  }
}
