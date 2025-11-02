import type { AIProvider, GenerationParams, GenerationResult, AIModel, InpaintingParams } from '../types';

/**
 * Hugging Face Inference API Provider
 * FREE tier with rate limits
 * Good for testing different open-source models
 * Supports inpainting via stable-diffusion-inpainting model
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

  /**
   * Generate inpainting - fill masked regions with AI-generated content
   * Uses runwayml/stable-diffusion-inpainting model
   */
  async generateInpainting(params: InpaintingParams): Promise<GenerationResult> {
    if (!this.apiKey) {
      throw new Error('Hugging Face API key is required for inpainting. Sign up at https://huggingface.co');
    }

    const startTime = Date.now();
    // Try diffusers' official SDXL inpainting model
    const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';

    try {
      // Convert base64 to Blob
      const imageBlob = await this.base64ToBlob(params.image);
      const maskBlob = await this.base64ToBlob(params.maskImage);

      // Create FormData with proper structure for HuggingFace inpainting API
      const formData = new FormData();
      formData.append('inputs', params.prompt);
      formData.append('image', imageBlob, 'image.png');
      formData.append('mask_image', maskBlob, 'mask.png');

      // Add parameters as JSON
      const parameters = {
        negative_prompt: params.negativePrompt,
        num_inference_steps: params.steps || 25,
        guidance_scale: params.guidanceScale || 7.5,
      };
      if (params.seed !== undefined) {
        parameters.seed = params.seed;
      }
      formData.append('parameters', JSON.stringify(parameters));

      const response = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        // Provide helpful error messages
        if (response.status === 503) {
          throw new Error('Inpainting model is loading. Please wait a moment and try again.');
        }
        if (response.status === 401) {
          throw new Error('Invalid API key. Please check your Hugging Face token.');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before trying again.');
        }

        const error = await response.text();
        throw new Error(error || 'Inpainting API request failed');
      }

      // HuggingFace returns a blob
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      const generationTime = Date.now() - startTime;

      return {
        imageUrl,
        metadata: {
          provider: 'huggingface-inpainting',
          model: model,
          seed: params.seed,
          cost: 0,
          generationTime,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      console.error('Hugging Face inpainting error:', error);
      throw error;
    }
  }

  /**
   * Convert base64 data URL to Blob for FormData upload
   */
  private async base64ToBlob(base64: string): Promise<Blob> {
    // Strip data URL prefix if present
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');

    // Convert base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return new Blob([bytes], { type: 'image/png' });
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
