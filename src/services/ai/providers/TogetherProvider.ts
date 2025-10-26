import type { AIProvider, GenerationParams, GenerationResult, AIModel } from '../types';

/**
 * Together.ai Provider
 * PAID but CHEAP - excellent for production
 * $25 free credits to start, then ~$0.02-0.08 per image
 */
export class TogetherProvider implements AIProvider {
  name = 'Together.ai';
  type = 'paid' as const;
  requiresApiKey = true;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || import.meta.env.VITE_TOGETHER_API_KEY || '';
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    if (!this.isAvailable()) {
      throw new Error('Together.ai API key not configured');
    }

    const startTime = Date.now();
    const model = params.model || 'black-forest-labs/FLUX.1-schnell';

    try {
      const response = await fetch('https://api.together.xyz/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          prompt: params.prompt,
          width: params.width,
          height: params.height,
          steps: params.steps || 4,
          n: 1,
          seed: params.seed,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Together.ai API request failed');
      }

      const data = await response.json();
      const generationTime = Date.now() - startTime;

      return {
        imageUrl: data.data[0].url,
        metadata: {
          provider: 'together',
          model: model,
          seed: params.seed,
          cost: this.estimateCost(params),
          generationTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Together.ai generation error:', error);
      throw error;
    }
  }

  getSupportedModels(): AIModel[] {
    return [
      {
        id: 'black-forest-labs/FLUX.1-schnell',
        name: 'FLUX.1 Schnell',
        description: 'Fast, high-quality image generation (~$0.025/image)',
      },
      {
        id: 'black-forest-labs/FLUX.1-dev',
        name: 'FLUX.1 Dev',
        description: 'Higher quality, slower (~$0.05/image)',
      },
      {
        id: 'stabilityai/stable-diffusion-xl-base-1.0',
        name: 'Stable Diffusion XL',
        description: 'Popular open-source model (~$0.02/image)',
      },
    ];
  }

  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  estimateCost(params: GenerationParams): number {
    const model = params.model || 'black-forest-labs/FLUX.1-schnell';

    // Cost estimates based on Together.ai pricing
    const costs: Record<string, number> = {
      'black-forest-labs/FLUX.1-schnell': 0.025,
      'black-forest-labs/FLUX.1-dev': 0.05,
      'stabilityai/stable-diffusion-xl-base-1.0': 0.02,
    };

    return costs[model] || 0.03;
  }
}
