import { create } from 'zustand';

export interface AIGenerationSettings {
  prompt: string;
  negativePrompt: string;
  model: string;
  width: number;
  height: number;
  steps: number;
  guidanceScale: number;
  seed?: number;
}

interface AIStore {
  // State
  isGenerating: boolean;
  progress: number; // 0-100
  error: string | null;
  lastGeneratedImageUrl: string | null;
  generationAttempt: number; // Current attempt number (1-based)
  maxAttempts: number;
  canCancel: boolean;
  cancelGeneration: (() => void) | null;

  // Settings
  settings: AIGenerationSettings;

  // Actions
  updateSettings: (updates: Partial<AIGenerationSettings>) => void;
  setGenerating: (isGenerating: boolean, cancelFn?: (() => void) | null) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setLastGeneratedImage: (url: string | null) => void;
  setGenerationAttempt: (attempt: number, maxAttempts: number) => void;
  cancel: () => void;
  resetSettings: () => void;
}

const defaultSettings: AIGenerationSettings = {
  prompt: '',
  negativePrompt: '',
  model: 'stable-diffusion-xl',
  width: 1024,
  height: 1024,
  steps: 30,
  guidanceScale: 7.5,
};

export const useAIStore = create<AIStore>((set, get) => ({
  isGenerating: false,
  progress: 0,
  error: null,
  lastGeneratedImageUrl: null,
  generationAttempt: 0,
  maxAttempts: 5,
  canCancel: false,
  cancelGeneration: null,

  settings: { ...defaultSettings },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  setGenerating: (isGenerating, cancelFn = null) => {
    set({ 
      isGenerating, 
      progress: isGenerating ? 0 : 100, 
      error: null,
      generationAttempt: isGenerating ? 0 : get().generationAttempt,
      canCancel: isGenerating && cancelFn !== null,
      cancelGeneration: cancelFn,
    });
  },

  setProgress: (progress) => {
    set({ progress });
  },

  setError: (error) => {
    set({ 
      error, 
      isGenerating: false,
      canCancel: false,
      cancelGeneration: null,
    });
  },

  setLastGeneratedImage: (url) => {
    set({ lastGeneratedImageUrl: url });
  },

  setGenerationAttempt: (attempt, maxAttempts) => {
    set({ generationAttempt: attempt, maxAttempts });
  },

  cancel: () => {
    const { cancelGeneration } = get();
    if (cancelGeneration) {
      cancelGeneration();
      set({ 
        isGenerating: false, 
        canCancel: false, 
        cancelGeneration: null,
        error: 'Generation cancelled',
      });
    }
  },

  resetSettings: () => {
    set({ settings: { ...defaultSettings } });
  },
}));
