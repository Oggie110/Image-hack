import { create } from 'zustand';

export type DrawingTool = 'select' | 'pen' | 'line' | 'rectangle' | 'circle' | 'eraser';

interface DrawingSettings {
  strokeColor: string;
  strokeWidth: number;
  fill: string | null;
  opacity: number; // 0 to 100
}

interface DrawingStore {
  // Current state
  currentTool: DrawingTool;
  isDrawingMode: boolean;
  settings: DrawingSettings;

  // Actions
  setTool: (tool: DrawingTool) => void;
  setDrawingMode: (enabled: boolean) => void;
  updateSettings: (settings: Partial<DrawingSettings>) => void;

  // Quick presets
  setStrokeColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFill: (fill: string | null) => void;
  setOpacity: (opacity: number) => void;
}

export const useDrawingStore = create<DrawingStore>((set) => ({
  currentTool: 'select',
  isDrawingMode: false,
  settings: {
    strokeColor: '#000000',
    strokeWidth: 2,
    fill: null,
    opacity: 100,
  },

  setTool: (tool) => set({ currentTool: tool }),

  setDrawingMode: (enabled) => set({ isDrawingMode: enabled }),

  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setStrokeColor: (color) =>
    set((state) => ({
      settings: { ...state.settings, strokeColor: color },
    })),

  setStrokeWidth: (width) =>
    set((state) => ({
      settings: { ...state.settings, strokeWidth: width },
    })),

  setFill: (fill) =>
    set((state) => ({
      settings: { ...state.settings, fill },
    })),

  setOpacity: (opacity) =>
    set((state) => ({
      settings: { ...state.settings, opacity },
    })),
}));
