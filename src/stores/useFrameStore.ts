import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Frame, Layer, FramePreset } from '@/types';
import { useHistoryStore } from './useHistoryStore';
import { useCanvasStore } from './useCanvasStore';
import { removeLayerFromCanvas, getLayerFromCanvas } from '@/utils/fabricHelpers';

interface FrameStore {
  // State
  frames: Frame[];
  selectedFrameId: string | null;
  selectedLayerIds: string[];
  expandedFrameIds: Set<string>; // Track which frames are expanded in tree view

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
  groupLayers: (frameId: string, layerIds: string[]) => string;
  ungroupLayers: (frameId: string, groupId: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  restoreFrames: (frames: Frame[]) => void;

  // Utilities
  getFrame: (frameId: string) => Frame | undefined;
  getLayer: (frameId: string, layerId: string) => Layer | undefined;
  getSelectedFrame: () => Frame | undefined;
  
  // Context system
  getActiveFrame: () => Frame | null;
  ensureActiveFrame: () => Frame;
  getContextForOperation: () => { frame: Frame; layerIds: string[] };
  
  // Tree view state
  toggleFrameExpansion: (frameId: string) => void;
  isFrameExpanded: (frameId: string) => boolean;
}

// Load expanded frames from localStorage
const loadExpandedFrames = (): Set<string> => {
  try {
    const stored = localStorage.getItem('image-hack:expandedFrames');
    if (stored) {
      const ids = JSON.parse(stored) as string[];
      return new Set(ids);
    }
  } catch (e) {
    console.warn('Failed to load expanded frames from localStorage', e);
  }
  return new Set<string>();
};

// Save expanded frames to localStorage
const saveExpandedFrames = (expandedIds: Set<string>) => {
  try {
    localStorage.setItem('image-hack:expandedFrames', JSON.stringify(Array.from(expandedIds)));
  } catch (e) {
    console.warn('Failed to save expanded frames to localStorage', e);
  }
};

export const useFrameStore = create<FrameStore>((set, get) => ({
  frames: [],
  selectedFrameId: null,
  selectedLayerIds: [],
  expandedFrameIds: loadExpandedFrames(),

  addFrame: (preset, position) => {
    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

    const frameId = nanoid();
    const frameWidth = preset?.width || 1920;
    const frameHeight = preset?.height || 1080;

    // Center the first frame if no position is provided
    let frameX = position?.x || 100;
    let frameY = position?.y || 100;

    if (!position && get().frames.length === 0) {
      // Center the first frame in the canvas container (matching welcome sign position)
      // The canvas is the flex-1 element, so we need to account for the right panel
      const canvasContainer = document.querySelector('.flex-1.relative.overflow-hidden') as HTMLElement;

      if (canvasContainer) {
        // Use actual canvas container dimensions
        const canvasWidth = canvasContainer.clientWidth;
        const canvasHeight = canvasContainer.clientHeight;
        frameX = Math.max(50, (canvasWidth - frameWidth) / 2);
        frameY = Math.max(50, (canvasHeight - frameHeight) / 2);
      } else {
        // Fallback: estimate canvas width (window width minus right panel ~320px)
        const estimatedCanvasWidth = window.innerWidth - 320;
        const viewportHeight = window.innerHeight - 56; // minus toolbar
        frameX = Math.max(50, (estimatedCanvasWidth - frameWidth) / 2);
        frameY = Math.max(50, (viewportHeight - frameHeight) / 2);
      }
    }

    const newFrame: Frame = {
      id: frameId,
      name: preset?.name || 'Frame ' + (get().frames.length + 1),
      x: frameX,
      y: frameY,
      width: frameWidth,
      height: frameHeight,
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

    set((state) => {
      // Auto-expand newly created frame
      const newExpanded = new Set(state.expandedFrameIds);
      newExpanded.add(frameId);
      saveExpandedFrames(newExpanded);

      return {
        frames: [...state.frames, newFrame],
        selectedFrameId: frameId,
        expandedFrameIds: newExpanded,
      };
    });

    return frameId;
  },

  deleteFrame: (frameId) => {
    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

    set((state) => {
      const newFrames = state.frames.filter((f) => f.id !== frameId);
      const wasSelected = state.selectedFrameId === frameId;
      
      // Remove from expanded frames
      const newExpanded = new Set(state.expandedFrameIds);
      newExpanded.delete(frameId);
      saveExpandedFrames(newExpanded);
      
      return {
        frames: newFrames,
        selectedFrameId: wasSelected ? null : state.selectedFrameId,
        // Clear layer selection if deleted frame was selected
        selectedLayerIds: wasSelected ? [] : state.selectedLayerIds,
        expandedFrameIds: newExpanded,
      };
    });
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
    // Validate frame exists if provided
    if (frameId !== null) {
      const frame = get().getFrame(frameId);
      if (!frame) {
        console.warn(`Frame ${frameId} not found, clearing selection`);
        set({ selectedFrameId: null, selectedLayerIds: [] });
        return;
      }
    }
    // When frame selected, clear layer selection but keep frame
    set({ selectedFrameId: frameId, selectedLayerIds: [] });
  },

  duplicateFrame: (frameId) => {
    const frame = get().getFrame(frameId);
    if (!frame) return;

    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

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

    set((state) => {
      // Auto-expand duplicated frame
      const newExpanded = new Set(state.expandedFrameIds);
      newExpanded.add(newFrameId);
      saveExpandedFrames(newExpanded);

      return {
        frames: [...state.frames, newFrame],
        selectedFrameId: newFrameId,
        expandedFrameIds: newExpanded,
      };
    });
  },

  addLayer: (frameId, layerData) => {
    // Validate frame exists before adding layer
    const frame = get().getFrame(frameId);
    if (!frame) {
      throw new Error(`Cannot add layer: Frame ${frameId} not found`);
    }

    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

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
    // Validate frame and layer exist
    const frame = get().getFrame(frameId);
    if (!frame) {
      throw new Error(`Cannot delete layer: Frame ${frameId} not found`);
    }
    const layer = get().getLayer(frameId, layerId);
    if (!layer) {
      throw new Error(`Cannot delete layer: Layer ${layerId} not found in frame ${frameId}`);
    }

    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

    // Remove from canvas immediately if canvas is available
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      removeLayerFromCanvas(canvas, layerId);
    }

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
    // Validate frame and layer exist
    const frame = get().getFrame(frameId);
    if (!frame) {
      throw new Error(`Cannot update layer: Frame ${frameId} not found`);
    }
    const layer = get().getLayer(frameId, layerId);
    if (!layer) {
      throw new Error(`Cannot update layer: Layer ${layerId} not found in frame ${frameId}`);
    }

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
    const { selectedFrameId } = get();
    
    // Validate layers belong to currently selected frame
    if (selectedFrameId && layerIds.length > 0) {
      const frame = get().getFrame(selectedFrameId);
      if (frame) {
        const frameLayerIds = new Set(frame.layers.map(l => l.id));
        const validLayerIds = layerIds.filter(id => frameLayerIds.has(id));
        
        // Filter out invalid layer IDs
        if (validLayerIds.length !== layerIds.length) {
          console.warn('Some layer IDs do not belong to selected frame, filtering them out');
        }
        
        set({ selectedLayerIds: validLayerIds });
        return;
      }
    }
    
    // If no frame selected or invalid, clear layer selection
    set({ selectedLayerIds: layerIds.length === 0 ? [] : [] });
  },

  toggleLayerVisibility: (frameId, layerId) => {
    const layer = get().getLayer(frameId, layerId);
    const frame = get().getFrame(frameId);
    if (!layer || !frame) return;

    // Before toggling visibility, sync current canvas position to store
    // This prevents position reset when visibility changes
    const canvas = useCanvasStore.getState().fabricCanvas;
    if (canvas) {
      const layerObject = getLayerFromCanvas(canvas, layerId);
      if (layerObject) {
        // Get current canvas position and sync to store
        const currentLeft = layerObject.left || 0;
        const currentTop = layerObject.top || 0;
        const currentX = Math.round(currentLeft - frame.x);
        const currentY = Math.round(currentTop - frame.y);
        
        // Only update position if it actually differs (allows for rounding)
        if (Math.abs(currentX - layer.x) > 0.5 || Math.abs(currentY - layer.y) > 0.5) {
          get().updateLayer(frameId, layerId, {
            x: currentX,
            y: currentY,
            visible: !layer.visible,
          });
          return;
        }
      }
    }

    // If no canvas or position is same, just toggle visibility
    get().updateLayer(frameId, layerId, { visible: !layer.visible });
  },

  toggleLayerLock: (frameId, layerId) => {
    const layer = get().getLayer(frameId, layerId);
    if (layer) {
      get().updateLayer(frameId, layerId, { locked: !layer.locked });
    }
  },

  groupLayers: (frameId, layerIds) => {
    const frame = get().getFrame(frameId);
    if (!frame || layerIds.length < 2) {
      throw new Error('Cannot group: Need at least 2 layers to group');
    }

    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

    // Get the layers to group
    const layersToGroup = layerIds
      .map(id => frame.layers.find(l => l.id === id))
      .filter(Boolean) as Layer[];

    if (layersToGroup.length < 2) {
      throw new Error('Cannot group: Selected layers not found');
    }

    // Calculate bounds of all layers
    const bounds = {
      left: Math.min(...layersToGroup.map(l => l.x)),
      top: Math.min(...layersToGroup.map(l => l.y)),
      right: Math.max(...layersToGroup.map(l => l.x + l.width)),
      bottom: Math.max(...layersToGroup.map(l => l.y + l.height)),
    };

    const groupId = nanoid();
    const groupLayer: Layer = {
      id: groupId,
      name: 'Group ' + (frame.layers.filter(l => l.type === 'group').length + 1),
      type: 'group',
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      x: bounds.left,
      y: bounds.top,
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      children: layersToGroup.map(layer => ({
        ...layer,
        // Convert coordinates to be relative to group
        x: layer.x - bounds.left,
        y: layer.y - bounds.top,
      })),
    };

    set((state) => ({
      frames: state.frames.map((f) => {
        if (f.id !== frameId) return f;

        // Remove grouped layers and add group
        const remainingLayers = f.layers.filter(l => !layerIds.includes(l.id));
        // Insert group at the position of the first grouped layer
        const firstLayerIndex = f.layers.findIndex(l => l.id === layerIds[0]);
        remainingLayers.splice(firstLayerIndex, 0, groupLayer);

        return {
          ...f,
          layers: remainingLayers,
          updatedAt: new Date().toISOString(),
        };
      }),
      selectedLayerIds: [groupId],
    }));

    return groupId;
  },

  ungroupLayers: (frameId, groupId) => {
    const frame = get().getFrame(frameId);
    const groupLayer = get().getLayer(frameId, groupId);

    if (!frame || !groupLayer || groupLayer.type !== 'group' || !groupLayer.children) {
      throw new Error('Cannot ungroup: Invalid group');
    }

    // Push current state to history before modifying
    useHistoryStore.getState().pushState(get().frames);

    const ungroupedLayers = groupLayer.children.map(child => ({
      ...child,
      // Convert coordinates back to frame-relative
      x: child.x + groupLayer.x,
      y: child.y + groupLayer.y,
    }));

    set((state) => ({
      frames: state.frames.map((f) => {
        if (f.id !== frameId) return f;

        // Replace group with its children
        const groupIndex = f.layers.findIndex(l => l.id === groupId);
        const newLayers = [...f.layers];
        newLayers.splice(groupIndex, 1, ...ungroupedLayers);

        return {
          ...f,
          layers: newLayers,
          updatedAt: new Date().toISOString(),
        };
      }),
      selectedLayerIds: ungroupedLayers.map(l => l.id),
    }));
  },

  getFrame: (frameId) => {
    return get().frames.find((f) => f.id === frameId);
  },

  getLayer: (frameId, layerId) => {
    const frame = get().getFrame(frameId);
    if (!frame) return undefined;

    // Recursive search for layer (including within groups)
    const findLayer = (layers: Layer[]): Layer | undefined => {
      for (const layer of layers) {
        if (layer.id === layerId) return layer;
        if (layer.children) {
          const found = findLayer(layer.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    return findLayer(frame.layers);
  },

  getSelectedFrame: () => {
    const { selectedFrameId, getFrame } = get();
    return selectedFrameId ? getFrame(selectedFrameId) : undefined;
  },

  // Context system methods
  getActiveFrame: () => {
    const { selectedFrameId, getFrame } = get();
    if (!selectedFrameId) return null;
    const frame = getFrame(selectedFrameId);
    // If selected frame doesn't exist, clear selection
    if (!frame) {
      set({ selectedFrameId: null, selectedLayerIds: [] });
      return null;
    }
    return frame;
  },

  ensureActiveFrame: () => {
    const frame = get().getActiveFrame();
    if (!frame) {
      throw new Error('No active frame. Please select a frame first.');
    }
    return frame;
  },

  getContextForOperation: () => {
    const frame = get().ensureActiveFrame();
    const { selectedLayerIds } = get();
    
    // Filter layer IDs to only include those that belong to the active frame
    const frameLayerIds = new Set(frame.layers.map(l => l.id));
    const validLayerIds = selectedLayerIds.filter(id => frameLayerIds.has(id));
    
    // Update selection if invalid layers were filtered
    if (validLayerIds.length !== selectedLayerIds.length) {
      set({ selectedLayerIds: validLayerIds });
    }
    
    return { frame, layerIds: validLayerIds };
  },

  // History actions
  undo: () => {
    const frames = get().frames;
    const previousState = useHistoryStore.getState().undo(frames);
    if (previousState) {
      set({ frames: previousState });
    }
  },

  redo: () => {
    const nextState = useHistoryStore.getState().redo();
    if (nextState) {
      set({ frames: nextState });
    }
  },

  canUndo: () => useHistoryStore.getState().canUndo(),
  canRedo: () => useHistoryStore.getState().canRedo(),

  restoreFrames: (frames: Frame[]) => {
    set({ frames });
  },

  // Tree view state
  toggleFrameExpansion: (frameId) => {
    set((state) => {
      const newExpanded = new Set(state.expandedFrameIds);
      if (newExpanded.has(frameId)) {
        newExpanded.delete(frameId);
      } else {
        newExpanded.add(frameId);
      }
      saveExpandedFrames(newExpanded);
      return { expandedFrameIds: newExpanded };
    });
  },

  isFrameExpanded: (frameId) => {
    return get().expandedFrameIds.has(frameId);
  },
}));
