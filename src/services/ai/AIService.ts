import type { AIProvider, GenerationParams, GenerationResult, ProviderName, InpaintingParams } from './types';
import { PollinationsProvider } from './providers/PollinationsProvider';
import { TogetherProvider } from './providers/TogetherProvider';
import { HuggingFaceProvider } from './providers/HuggingFaceProvider';

/**
 * AI Service Manager
 * Handles multiple AI providers with easy switching
 */
export class AIService {
  private providers: Map<ProviderName, AIProvider>;
  private currentProviderName: ProviderName;

  constructor() {
    // Initialize all providers
    this.providers = new Map<ProviderName, AIProvider>([
      ['pollinations', new PollinationsProvider()],
      ['together', new TogetherProvider()],
      ['huggingface', new HuggingFaceProvider()],
    ]);

    // Set default provider from environment or use free option
    const envProvider = import.meta.env.VITE_AI_PROVIDER as ProviderName;
    this.currentProviderName = envProvider || 'pollinations';

    // Fallback to pollinations if selected provider is not available
    if (!this.getCurrentProvider().isAvailable()) {
      console.warn(
        `Provider "${this.currentProviderName}" not available, falling back to pollinations`
      );
      this.currentProviderName = 'pollinations';
    }
  }

  /**
   * Get current active provider
   */
  private getCurrentProvider(): AIProvider {
    return this.providers.get(this.currentProviderName)!;
  }

  /**
   * Switch to a different provider
   */
  setProvider(providerName: ProviderName): boolean {
    const provider = this.providers.get(providerName);
    if (!provider) {
      console.error(`Provider "${providerName}" not found`);
      return false;
    }

    if (!provider.isAvailable()) {
      console.error(`Provider "${providerName}" not available (missing API key?)`);
      return false;
    }

    this.currentProviderName = providerName;
    console.log(`Switched to provider: ${provider.name}`);
    return true;
  }

  /**
   * Generate an image using the current provider
   */
  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    const provider = this.getCurrentProvider();
    console.log(`Generating image with ${provider.name}...`);

    try {
      const result = await provider.generateImage(params);
      console.log(`Generation successful in ${result.metadata.generationTime}ms`);
      return result;
    } catch (error) {
      console.error(`Generation failed with ${provider.name}:`, error);
      throw error;
    }
  }

  /**
   * Generate inpainting (fill masked regions with AI)
   * Only supported by providers with inpainting capability
   */
  async generateInpainting(params: InpaintingParams): Promise<GenerationResult> {
    const provider = this.getCurrentProvider();

    // Check if provider supports inpainting
    if (!('generateInpainting' in provider) || typeof (provider as any).generateInpainting !== 'function') {
      throw new Error(`Provider "${provider.name}" does not support inpainting. Please use Hugging Face provider.`);
    }

    console.log(`Generating inpainting with ${provider.name}...`);

    try {
      const result = await (provider as any).generateInpainting(params);
      console.log(`Inpainting successful in ${result.metadata.generationTime}ms`);
      return result;
    } catch (error) {
      console.error(`Inpainting failed with ${provider.name}:`, error);
      throw error;
    }
  }

  /**
   * Check if current provider supports inpainting
   */
  supportsInpainting(): boolean {
    const provider = this.getCurrentProvider();
    return 'generateInpainting' in provider && typeof (provider as any).generateInpainting === 'function';
  }

  /**
   * Get list of all available providers
   */
  getAvailableProviders(): Array<{
    name: ProviderName;
    displayName: string;
    type: 'free' | 'paid';
    available: boolean;
    current: boolean;
  }> {
    return Array.from(this.providers.entries()).map(([name, provider]) => ({
      name,
      displayName: provider.name,
      type: provider.type,
      available: provider.isAvailable(),
      current: name === this.currentProviderName,
    }));
  }

  /**
   * Get current provider name
   */
  getCurrentProviderName(): ProviderName {
    return this.currentProviderName;
  }

  /**
   * Get supported models for current provider
   */
  getSupportedModels() {
    return this.getCurrentProvider().getSupportedModels();
  }

  /**
   * Estimate cost for generation (if available)
   */
  estimateCost(params: GenerationParams): number {
    const provider = this.getCurrentProvider();
    return provider.estimateCost?.(params) || 0;
  }
}

// Export singleton instance
export const aiService = new AIService();
