import type { AIProvider, GenerationParams, GenerationResult, AIModel } from '../types';

/**
 * Pollinations.ai Provider
 * FREE image generation - no API key required
 * Perfect for MVP and development
 */
export class PollinationsProvider implements AIProvider {
  name = 'Pollinations.ai';
  type = 'free' as const;
  requiresApiKey = false;

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const startTime = Date.now();

    // Pollinations uses a simple URL-based API
    const seed = params.seed || Math.floor(Math.random() * 1000000);
    const model = params.model || 'flux';

    const url = new URL('https://image.pollinations.ai/prompt/' + encodeURIComponent(params.prompt));
    url.searchParams.set('width', params.width.toString());
    url.searchParams.set('height', params.height.toString());
    url.searchParams.set('seed', seed.toString());
    url.searchParams.set('model', model);
    url.searchParams.set('nologo', 'true');

    if (params.negativePrompt) {
      url.searchParams.set('negative', params.negativePrompt);
    }

    const imageUrl = url.toString();

    // Verify the image loads
    try {
      await this.verifyImageLoads(imageUrl);
    } catch (error) {
      throw new Error('Failed to generate image with Pollinations.ai');
    }

    const generationTime = Date.now() - startTime;

    return {
      imageUrl,
      metadata: {
        provider: 'pollinations',
        model: model,
        seed: seed,
        cost: 0,
        generationTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async verifyImageLoads(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.src = url;

      // Timeout after 30 seconds
      setTimeout(() => reject(new Error('Image loading timeout')), 30000);
    });
  }

  getSupportedModels(): AIModel[] {
    return [
      {
        id: 'flux',
        name: 'FLUX',
        description: 'Fast and high-quality image generation',
      },
      {
        id: 'turbo',
        name: 'Turbo',
        description: 'Faster generation with good quality',
      },
    ];
  }

  isAvailable(): boolean {
    // Always available - no API key needed
    return true;
  }

  estimateCost(): number {
    return 0; // Always free!
  }
}
