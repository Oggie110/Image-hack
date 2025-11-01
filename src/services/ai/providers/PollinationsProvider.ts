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

    // Retry logic with exponential backoff
    const maxRetries = 5;
    const initialTimeout = 35000; // Start with 35 seconds
    let lastError: Error | null = null;
    const cancelSignal = params.cancelSignal || { cancelled: false };

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Check for cancellation
      if (cancelSignal.cancelled) {
        throw new Error('Generation cancelled by user');
      }

      // Report progress
      if (params.onProgress) {
        params.onProgress({
          attempt: attempt + 1,
          maxAttempts: maxRetries,
          message: attempt === 0 ? 'Generating image...' : `Retrying... (Attempt ${attempt + 1}/${maxRetries})`,
        });
      }

      try {
        // Increase timeout slightly with each attempt (up to 50s)
        const timeout = Math.min(initialTimeout + attempt * 5000, 50000);
        await this.verifyImageLoads(imageUrl, timeout, cancelSignal);

        // Success!
        const generationTime = Date.now() - startTime;

        if (attempt > 0) {
          console.log(`Generation succeeded on attempt ${attempt + 1} after ${generationTime}ms`);
        }

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
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === maxRetries - 1;

        if (isLastAttempt) {
          // Log detailed error on final failure
          console.error(
            `Pollinations.ai generation failed after ${maxRetries} attempts:`,
            lastError.message
          );
          throw new Error(
            `Failed to generate image after ${maxRetries} attempts. ${lastError.message}`
          );
        }

        // Exponential backoff: wait 1s, 2s, 4s, 8s between retries
        const backoffDelay = Math.min(1000 * Math.pow(2, attempt), 8000);
        console.warn(
          `Generation attempt ${attempt + 1} failed (${lastError.message}). Retrying in ${backoffDelay}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }

    // Should never reach here, but TypeScript needs it
    throw lastError || new Error('Failed to generate image with Pollinations.ai');
  }

  private async verifyImageLoads(url: string, timeoutMs: number = 35000, cancelSignal?: { cancelled: boolean }): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timeoutId: ReturnType<typeof setTimeout>;
      let resolved = false;

      const cleanup = () => {
        resolved = true;
        img.onload = null;
        img.onerror = null;
        if (timeoutId) clearTimeout(timeoutId);
      };

      img.onload = () => {
        if (!resolved) {
          // Check for cancellation before resolving
          if (cancelSignal?.cancelled) {
            cleanup();
            reject(new Error('Generation cancelled by user'));
            return;
          }

          // Verify image actually loaded (has dimensions)
          if (img.width > 0 && img.height > 0) {
            cleanup();
            resolve();
          } else {
            cleanup();
            reject(new Error('Image loaded but has invalid dimensions (0x0)'));
          }
        }
      };

      img.onerror = (event) => {
        if (!resolved) {
          cleanup();
          
          // Better error detection
          // Check if it's a network/CORS issue vs server error
          let errorType = 'UNKNOWN';
          let errorMsg = 'Image failed to load from Pollinations.ai';
          
          try {
            // Try to fetch the URL to get more info
            // This will help distinguish network errors
            fetch(url, { method: 'HEAD', mode: 'no-cors' }).catch(() => {
              // If we can't even fetch, it's likely a network/CORS issue
              errorType = 'NETWORK';
              errorMsg = 'Network error: Unable to reach Pollinations.ai (check your connection or CORS settings)';
            });
          } catch {
            errorType = 'NETWORK';
            errorMsg = 'Network error: Unable to reach Pollinations.ai';
          }
          
          // If we got here from img.onerror, it's likely a server response issue
          if (errorType === 'UNKNOWN') {
            errorType = 'SERVER_ERROR';
            errorMsg = 'Server error: Pollinations.ai returned an invalid image response. The server may be overloaded.';
          }
          
          reject(new Error(errorMsg));
        }
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          cleanup();
          // Check for cancellation
          if (cancelSignal?.cancelled) {
            reject(new Error('Generation cancelled by user'));
          } else {
            reject(new Error(`Timeout: Image generation took longer than ${Math.round(timeoutMs / 1000)} seconds. The server may be slow or overloaded.`));
          }
        }
      }, timeoutMs);

      // Start loading
      img.src = url;
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
