import { create } from 'zustand';
import type { Frame } from '@/types';

interface HistoryState {
  past: Frame[][];
  future: Frame[][];
}

interface HistoryStore extends HistoryState {
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushState: (frames: Frame[]) => void;
  undo: (currentFrames: Frame[]) => Frame[] | null;
  redo: () => Frame[] | null;
  clear: () => void;
}

const MAX_HISTORY_SIZE = 50;

export const useHistoryStore = create<HistoryStore>((set, get) => ({
  past: [],
  future: [],

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  pushState: (frames: Frame[]) => {
    set((state) => {
      // Deep clone frames to prevent reference issues
      const clonedFrames = JSON.parse(JSON.stringify(frames));

      const newPast = [...state.past, clonedFrames];

      // Limit history size
      if (newPast.length > MAX_HISTORY_SIZE) {
        newPast.shift();
      }

      return {
        past: newPast,
        future: [], // Clear future when new action is performed
      };
    });
  },

  undo: (currentFrames: Frame[]) => {
    const { past } = get();
    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set((state) => ({
      past: newPast,
      future: [JSON.parse(JSON.stringify(currentFrames)), ...state.future],
    }));

    return previous;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set((state) => ({
      past: [...state.past, JSON.parse(JSON.stringify(next))],
      future: newFuture,
    }));

    return next;
  },

  clear: () => set({ past: [], future: [] }),
}));
