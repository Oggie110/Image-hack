import { useEffect } from 'react';
import { useFrameStore } from '@/stores/useFrameStore';
import { useDrawingStore } from '@/stores/useDrawingStore';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function useKeyboardShortcuts() {
  const { selectedFrameId, selectedLayerIds, deleteLayer, deleteFrame } = useFrameStore();
  const { setTool } = useDrawingStore();
  const { zoomIn, zoomOut, resetZoom } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const ctrl = e.ctrlKey || e.metaKey; // Support both Ctrl and Cmd
      const shift = e.shiftKey;

      // Delete key - delete selected layer or frame
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (selectedLayerIds.length > 0 && selectedFrameId) {
          selectedLayerIds.forEach((layerId) => {
            deleteLayer(selectedFrameId, layerId);
          });
        } else if (selectedFrameId) {
          deleteFrame(selectedFrameId);
        }
      }

      // Escape key - switch to select tool
      if (e.key === 'Escape') {
        e.preventDefault();
        setTool('select');
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        setTool('select');
      }

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setTool('pen');
      }

      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setTool('line');
      }

      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        setTool('rectangle');
      }

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setTool('circle');
      }

      // Zoom shortcuts
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
      }

      if (ctrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
      }

      if (ctrl && e.key === '0') {
        e.preventDefault();
        resetZoom();
      }

      // TODO: Undo/Redo will be implemented later
      // if (ctrl && !shift && e.key === 'z') {
      //   e.preventDefault();
      //   undo();
      // }

      // if (ctrl && shift && e.key === 'z') {
      //   e.preventDefault();
      //   redo();
      // }

      // if (ctrl && e.key === 'y') {
      //   e.preventDefault();
      //   redo();
      // }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    selectedFrameId,
    selectedLayerIds,
    deleteLayer,
    deleteFrame,
    setTool,
    zoomIn,
    zoomOut,
    resetZoom,
  ]);
}
