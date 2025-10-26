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

  // Settings
  settings: AIGenerationSettings;

  // Actions
  updateSettings: (updates: Partial<AIGenerationSettings>) => void;
  setGenerating: (isGenerating: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setLastGeneratedImage: (url: string | null) => void;
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

export const useAIStore = create<AIStore>((set) => ({
  isGenerating: false,
  progress: 0,
  error: null,
  lastGeneratedImageUrl: null,

  settings: { ...defaultSettings },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  setGenerating: (isGenerating) => {
    set({ isGenerating, progress: isGenerating ? 0 : 100, error: null });
  },

  setProgress: (progress) => {
    set({ progress });
  },

  setError: (error) => {
    set({ error, isGenerating: false });
  },

  setLastGeneratedImage: (url) => {
    set({ lastGeneratedImageUrl: url });
  },

  resetSettings: () => {
    set({ settings: { ...defaultSettings } });
  },
}));
