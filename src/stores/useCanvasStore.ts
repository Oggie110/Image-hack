import { create } from 'zustand';
import type { Canvas } from 'fabric';
import type { ViewportState, CanvasConfig } from '@/types';

interface CanvasStore {
  // Viewport state
  viewport: ViewportState;

  // Canvas configuration
  config: CanvasConfig;

  // Fabric canvas instance
  fabricCanvas: Canvas | null;

  // Actions
  setFabricCanvas: (canvas: Canvas | null) => void;
  setZoom: (zoom: number) => void;
  setPan: (panX: number, panY: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  zoomToFit: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  viewport: {
    zoom: 1,
    panX: 0,
    panY: 0,
  },

  config: {
    minZoom: 0.1,
    maxZoom: 64,
    gridSize: 20,
    gridColor: '#e5e7eb',
  },

  fabricCanvas: null,

  setFabricCanvas: (canvas) => {
    set({ fabricCanvas: canvas });
  },

  setZoom: (zoom) => {
    const { config } = get();
    const clampedZoom = Math.max(config.minZoom, Math.min(config.maxZoom, zoom));
    set((state) => ({
      viewport: { ...state.viewport, zoom: clampedZoom },
    }));
  },

  setPan: (panX, panY) => {
    set((state) => ({
      viewport: { ...state.viewport, panX, panY },
    }));
  },

  zoomIn: () => {
    const { viewport, setZoom } = get();
    setZoom(viewport.zoom * 1.2);
  },

  zoomOut: () => {
    const { viewport, setZoom } = get();
    setZoom(viewport.zoom / 1.2);
  },

  resetZoom: () => {
    set((state) => ({
      viewport: { ...state.viewport, zoom: 1 },
    }));
  },

  zoomToFit: () => {
    // Will be implemented later based on selected frame
    set((state) => ({
      viewport: { ...state.viewport, zoom: 1, panX: 0, panY: 0 },
    }));
  },
}));
