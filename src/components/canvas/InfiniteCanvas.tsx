import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useFrameStore } from '@/stores/useFrameStore';
import {
  createFrameObject,
  updateFrameObject,
  getFrameFromCanvas,
  removeFrameFromCanvas,
  createLayerObject,
  updateLayerObject,
  getLayerFromCanvas,
  removeLayerFromCanvas,
} from '@/utils/fabricHelpers';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const { viewport, setPan } = useCanvasStore();
  const { frames, selectedFrameId, selectedLayerIds, selectFrame, selectLayers, updateFrame, updateLayer, getFrame } = useFrameStore();

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth - 320, // Account for right panel
      height: window.innerHeight - 56, // Account for toolbar
      backgroundColor: '#fafafa',
      selection: false, // Disable box selection for now
    });

    fabricCanvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 320,
        height: window.innerHeight - 56,
      });
      canvas.renderAll();
    };

    window.addEventListener('resize', handleResize);

    // Handle frame and layer selection
    canvas.on('selection:created', (e) => {
      const target = e.selected?.[0] as any;
      if (target?.layerId) {
        // Layer selected
        selectLayers([target.layerId]);
        selectFrame(target.frameId);
      } else if (target?.frameId) {
        // Frame selected
        selectFrame(target.frameId);
        selectLayers([]);
      }
    });

    canvas.on('selection:updated', (e) => {
      const target = e.selected?.[0] as any;
      if (target?.layerId) {
        // Layer selected
        selectLayers([target.layerId]);
        selectFrame(target.frameId);
      } else if (target?.frameId) {
        // Frame selected
        selectFrame(target.frameId);
        selectLayers([]);
      }
    });

    canvas.on('selection:cleared', () => {
      // Don't clear selection when clicking canvas - keep current selection
    });

    // Handle frame and layer modifications (drag, resize, rotate) - update position and size in store
    canvas.on('object:modified', (e) => {
      const target = e.target as any;

      if (target?.layerId) {
        // Layer modified
        const frame = getFrame(target.frameId);
        if (!frame) return;

        const updates: any = {
          x: Math.round((target.left || 0) - frame.x),
          y: Math.round((target.top || 0) - frame.y),
          scaleX: target.scaleX || 1,
          scaleY: target.scaleY || 1,
          rotation: target.angle || 0,
        };

        updateLayer(target.frameId, target.layerId, updates);
      } else if (target?.frameId) {
        // Frame modified
        const objects = target.getObjects();
        const background = objects[0];

        const updates: any = {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        };

        // If scaled, update dimensions
        if (background && (target.scaleX !== 1 || target.scaleY !== 1)) {
          updates.width = Math.round(background.width * (target.scaleX || 1));
          updates.height = Math.round(background.height * (target.scaleY || 1));
        }

        updateFrame(target.frameId, updates);
      }
    });

    // Canvas panning with Space + drag or Middle mouse button
    canvas.on('mouse:down', (e) => {
      const evt = e.e as MouseEvent;
      // Space bar + left click OR middle mouse button
      if ((evt.shiftKey && evt.button === 0) || evt.button === 1) {
        isPanningRef.current = true;
        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        canvas.selection = false;
        canvas.defaultCursor = 'grab';
        canvas.hoverCursor = 'grab';
      }
    });

    canvas.on('mouse:move', (e) => {
      if (isPanningRef.current) {
        const evt = e.e as MouseEvent;
        const deltaX = evt.clientX - lastPosRef.current.x;
        const deltaY = evt.clientY - lastPosRef.current.y;

        setPan(viewport.panX + deltaX, viewport.panY + deltaY);

        lastPosRef.current = { x: evt.clientX, y: evt.clientY };
        canvas.defaultCursor = 'grabbing';
      }
    });

    canvas.on('mouse:up', () => {
      isPanningRef.current = false;
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
    });

    // Mouse wheel zoom
    canvas.on('mouse:wheel', (e) => {
      const evt = e.e as WheelEvent;
      evt.preventDefault();
      evt.stopPropagation();

      const delta = evt.deltaY;
      let zoom = viewport.zoom;
      zoom = zoom * (1 - delta / 1000);

      const { minZoom, maxZoom } = useCanvasStore.getState().config;
      zoom = Math.max(minZoom, Math.min(maxZoom, zoom));

      // Zoom towards mouse position
      const point = { x: evt.offsetX, y: evt.offsetY };
      const newPanX = point.x - (point.x - viewport.panX) * (zoom / viewport.zoom);
      const newPanY = point.y - (point.y - viewport.panY) * (zoom / viewport.zoom);

      useCanvasStore.getState().setZoom(zoom);
      setPan(newPanX, newPanY);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Apply viewport transformations
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const { zoom, panX, panY } = viewport;

    canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    canvas.renderAll();
  }, [viewport]);

  // Render frames on canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Get current frame IDs on canvas
    const canvasFrameIds = new Set(
      (canvas.getObjects() as any[]).map((obj) => obj.frameId).filter(Boolean)
    );

    // Get frame IDs from store
    const storeFrameIds = new Set(frames.map((f) => f.id));

    // Add new frames
    frames.forEach((frame) => {
      if (!canvasFrameIds.has(frame.id)) {
        const frameObject = createFrameObject(frame);
        canvas.add(frameObject);

        // Select if this is the selected frame
        if (frame.id === selectedFrameId) {
          canvas.setActiveObject(frameObject);
        }
      } else {
        // Update existing frame
        const frameObject = getFrameFromCanvas(canvas, frame.id);
        if (frameObject) {
          updateFrameObject(frameObject, frame);
        }
      }
    });

    // Remove deleted frames
    canvasFrameIds.forEach((frameId) => {
      if (!storeFrameIds.has(frameId as string)) {
        removeFrameFromCanvas(canvas, frameId as string);
      }
    });

    canvas.renderAll();
  }, [frames, selectedFrameId]);

  // Handle frame selection from store (e.g., clicking in frames panel)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !selectedFrameId) return;

    const frameObject = getFrameFromCanvas(canvas, selectedFrameId);
    if (frameObject && canvas.getActiveObject() !== frameObject) {
      canvas.setActiveObject(frameObject);
      canvas.renderAll();
    }
  }, [selectedFrameId]);

  // Render layers on canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Get all layers from all frames
    const allLayers: Array<{ layer: any; frame: any }> = [];
    frames.forEach((frame) => {
      frame.layers.forEach((layer) => {
        allLayers.push({ layer, frame });
      });
    });

    // Get current layer IDs on canvas
    const canvasLayerIds = new Set(
      (canvas.getObjects() as any[])
        .filter((obj) => obj.layerId)
        .map((obj) => obj.layerId)
    );

    // Get layer IDs from store
    const storeLayerIds = new Set(allLayers.map((l) => l.layer.id));

    // Add new layers or update existing ones
    allLayers.forEach(({ layer, frame }) => {
      if (!canvasLayerIds.has(layer.id)) {
        // Add new layer
        if (layer.imageUrl) {
          createLayerObject(layer, frame, layer.imageUrl)
            .then((layerObject) => {
              if (layerObject) {
                canvas.add(layerObject);

                // Select if this is the selected layer
                if (selectedLayerIds.includes(layer.id)) {
                  canvas.setActiveObject(layerObject);
                }

                canvas.renderAll();
              }
            })
            .catch((err) => {
              console.error('Failed to create layer object:', err);
            });
        }
      } else {
        // Update existing layer
        const layerObject = getLayerFromCanvas(canvas, layer.id);
        if (layerObject) {
          updateLayerObject(layerObject, layer, frame);
        }
      }
    });

    // Remove deleted layers
    canvasLayerIds.forEach((layerId) => {
      if (!storeLayerIds.has(layerId as string)) {
        removeLayerFromCanvas(canvas, layerId as string);
      }
    });

    canvas.renderAll();
  }, [frames, selectedLayerIds]);

  // Handle layer selection from store (e.g., clicking in layers panel)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || selectedLayerIds.length === 0) return;

    const layerId = selectedLayerIds[0];
    const layerObject = getLayerFromCanvas(canvas, layerId);
    if (layerObject && canvas.getActiveObject() !== layerObject) {
      canvas.setActiveObject(layerObject);
      canvas.renderAll();
    }
  }, [selectedLayerIds]);

  return (
    <div className="flex-1 relative overflow-hidden bg-muted">
      <canvas ref={canvasRef} />

      {/* Instructions overlay */}
      {frames.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/90 backdrop-blur-sm px-6 py-4 rounded-lg shadow-lg text-center max-w-md">
            <h3 className="text-lg font-semibold mb-2">Welcome to Image Hack!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first frame using the "New Frame" button in the toolbar above.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• <kbd className="px-1.5 py-0.5 bg-muted rounded">Shift + Drag</kbd> to pan canvas</p>
              <p>• <kbd className="px-1.5 py-0.5 bg-muted rounded">Mouse Wheel</kbd> to zoom</p>
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm text-muted-foreground border">
        {Math.round(viewport.zoom * 100)}%
      </div>

      {/* Frame count indicator */}
      {frames.length > 0 && (
        <div className="absolute bottom-4 left-20 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-md text-sm text-muted-foreground border">
          {frames.length} frame{frames.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
