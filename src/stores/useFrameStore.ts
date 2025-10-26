import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Frame, Layer, FramePreset } from '@/types';

interface FrameStore {
  // State
  frames: Frame[];
  selectedFrameId: string | null;
  selectedLayerIds: string[];

  // Frame actions
  addFrame: (preset?: FramePreset, position?: { x: number; y: number }) => string;
  deleteFrame: (frameId: string) => void;
  updateFrame: (frameId: string, updates: Partial<Frame>) => void;
  selectFrame: (frameId: string | null) => void;
  duplicateFrame: (frameId: string) => void;

  // Layer actions
  addLayer: (frameId: string, layer: Partial<Layer>) => string;
  deleteLayer: (frameId: string, layerId: string) => void;
  updateLayer: (frameId: string, layerId: string, updates: Partial<Layer>) => void;
  reorderLayers: (frameId: string, layerIds: string[]) => void;
  selectLayers: (layerIds: string[]) => void;
  toggleLayerVisibility: (frameId: string, layerId: string) => void;
  toggleLayerLock: (frameId: string, layerId: string) => void;

  // Utilities
  getFrame: (frameId: string) => Frame | undefined;
  getLayer: (frameId: string, layerId: string) => Layer | undefined;
  getSelectedFrame: () => Frame | undefined;
}

export const useFrameStore = create<FrameStore>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  selectedLayerIds: [],

  addFrame: (preset, position) => {
    const frameId = nanoid();
    const newFrame: Frame = {
      id: frameId,
      name: preset?.name || 'Frame ' + (get().frames.length + 1),
      x: position?.x || 100,
      y: position?.y || 100,
      width: preset?.width || 1920,
      height: preset?.height || 1080,
      backgroundColor: '#ffffff',
      layers: [],
      visible: true,
      locked: false,
      clipContent: true,
      exportSettings: {
        format: 'png',
        scale: 1,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      frames: [...state.frames, newFrame],
      selectedFrameId: frameId,
    }));

    return frameId;
  },

  deleteFrame: (frameId) => {
    set((state) => ({
      frames: state.frames.filter((f) => f.id !== frameId),
      selectedFrameId: state.selectedFrameId === frameId ? null : state.selectedFrameId,
    }));
  },

  updateFrame: (frameId, updates) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? { ...f, ...updates, updatedAt: new Date().toISOString() }
          : f
      ),
    }));
  },

  selectFrame: (frameId) => {
    set({ selectedFrameId: frameId, selectedLayerIds: [] });
  },

  duplicateFrame: (frameId) => {
    const frame = get().getFrame(frameId);
    if (!frame) return;

    const newFrameId = nanoid();
    const newFrame: Frame = {
      ...frame,
      id: newFrameId,
      name: frame.name + ' (Copy)',
      x: frame.x + 50,
      y: frame.y + 50,
      layers: frame.layers.map((layer) => ({
        ...layer,
        id: nanoid(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      frames: [...state.frames, newFrame],
      selectedFrameId: newFrameId,
    }));
  },

  addLayer: (frameId, layerData) => {
    const layerId = nanoid();
    const newLayer: Layer = {
      id: layerId,
      name: layerData.name || 'Layer ' + ((get().getFrame(frameId)?.layers.length || 0) + 1),
      type: layerData.type || 'image',
      visible: layerData.visible !== undefined ? layerData.visible : true,
      locked: layerData.locked || false,
      opacity: layerData.opacity || 100,
      blendMode: layerData.blendMode || 'normal',
      x: layerData.x || 0,
      y: layerData.y || 0,
      width: layerData.width || 100,
      height: layerData.height || 100,
      rotation: layerData.rotation || 0,
      scaleX: layerData.scaleX || 1,
      scaleY: layerData.scaleY || 1,
      imageUrl: layerData.imageUrl,
      aiMetadata: layerData.aiMetadata,
    };

    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? { ...f, layers: [...f.layers, newLayer], updatedAt: new Date().toISOString() }
          : f
      ),
      selectedLayerIds: [layerId],
    }));

    return layerId;
  },

  deleteLayer: (frameId, layerId) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? {
              ...f,
              layers: f.layers.filter((l) => l.id !== layerId),
              updatedAt: new Date().toISOString(),
            }
          : f
      ),
      selectedLayerIds: state.selectedLayerIds.filter((id) => id !== layerId),
    }));
  },

  updateLayer: (frameId, layerId, updates) => {
    set((state) => ({
      frames: state.frames.map((f) =>
        f.id === frameId
          ? {
              ...f,
              layers: f.layers.map((l) => (l.id === layerId ? { ...l, ...updates } : l)),
              updatedAt: new Date().toISOString(),
            }
          : f
      ),
    }));
  },

  reorderLayers: (frameId, layerIds) => {
    set((state) => ({
      frames: state.frames.map((f) => {
        if (f.id !== frameId) return f;
        const newLayers = layerIds.map((id) => f.layers.find((l) => l.id === id)!).filter(Boolean);
        return { ...f, layers: newLayers, updatedAt: new Date().toISOString() };
      }),
    }));
  },

  selectLayers: (layerIds) => {
    set({ selectedLayerIds: layerIds });
  },

  toggleLayerVisibility: (frameId, layerId) => {
    const layer = get().getLayer(frameId, layerId);
    if (layer) {
      get().updateLayer(frameId, layerId, { visible: !layer.visible });
    }
  },

  toggleLayerLock: (frameId, layerId) => {
    const layer = get().getLayer(frameId, layerId);
    if (layer) {
      get().updateLayer(frameId, layerId, { locked: !layer.locked });
    }
  },

  getFrame: (frameId) => {
    return get().frames.find((f) => f.id === frameId);
  },

  getLayer: (frameId, layerId) => {
    const frame = get().getFrame(frameId);
    return frame?.layers.find((l) => l.id === layerId);
  },

  getSelectedFrame: () => {
    const { selectedFrameId, getFrame } = get();
    return selectedFrameId ? getFrame(selectedFrameId) : undefined;
  },
}));
