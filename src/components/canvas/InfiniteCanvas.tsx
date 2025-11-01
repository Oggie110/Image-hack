import { useEffect, useRef } from 'react';
import { Canvas, PencilBrush, Line, Rect, Circle, Path, FabricImage } from 'fabric';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useFrameStore } from '@/stores/useFrameStore';
import { useDrawingStore } from '@/stores/useDrawingStore';
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
import { DrawingToolbar } from './DrawingToolbar';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const { viewport, setPan, setFabricCanvas } = useCanvasStore();
  const { frames, selectedFrameId, selectedLayerIds, selectFrame, selectLayers, updateFrame, updateLayer, addLayer, getFrame, getActiveFrame, ensureActiveFrame, getLayer } = useFrameStore();
  const { currentTool, settings } = useDrawingStore();

  // Helper: Create a new drawing layer for each shape (Figma-style)
  const createNewDrawingLayer = (
    frameId: string,
    tool: 'pen' | 'line' | 'rectangle' | 'circle'
  ): string => {
    const frame = getFrame(frameId);
    if (!frame) throw new Error('Frame not found');

    // Create new layer with appropriate name
    const toolNames: Record<typeof tool, string> = {
      pen: 'Pen',
      line: 'Line',
      rectangle: 'Rectangle',
      circle: 'Circle',
    };

    const baseName = toolNames[tool];
    const existingLayers = frame.layers.filter(l => l.name.startsWith(baseName));
    const nextNumber = existingLayers.length + 1;
    const layerName = `${baseName} ${nextNumber}`;

    const layerId = addLayer(frameId, {
      name: layerName,
      type: 'sketch',
      x: 0,
      y: 0,
      width: frame.width,
      height: frame.height,
      visible: true,
      locked: false,
      opacity: 100,
      blendMode: 'normal',
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      sketchMetadata: {
        strokeColor: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        fill: settings.fill,
        createdAt: new Date().toISOString(),
      },
    });

    selectLayers([layerId]);
    return layerId;
  };

  // Enforce correct z-order for all objects on canvas
  // Order: Frames first (lowest), then layers in order (per frame)
  const enforceZOrder = (canvas: Canvas, currentFrames: typeof frames) => {
    // Collect objects in the desired order
    const orderedObjects: any[] = [];

    // Step 1: Add all frames first (lowest layer)
    currentFrames.forEach((frame) => {
      const frameObj = getFrameFromCanvas(canvas, frame.id);
      if (frameObj) {
        orderedObjects.push(frameObj);
      }
    });

    // Step 2: Add all layers in order (per frame)
    // frame.layers[0] should render FIRST (behind)
    // frame.layers[1] should render SECOND (in front of 0)
    currentFrames.forEach((frame) => {
      frame.layers.forEach((layer) => {
        const layerObj = getLayerFromCanvas(canvas, layer.id);
        if (layerObj) {
          orderedObjects.push(layerObj);
        }
      });
    });

    // Rebuild the canvas._objects array with correct order
    const canvasObjects = canvas.getObjects();

    // Only reorder if we have all objects accounted for
    if (orderedObjects.length === canvasObjects.length) {
      (canvas as any)._objects = orderedObjects;
      canvas.renderAll();
    }
  };

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth - 384, // Account for right panel (w-96)
      height: window.innerHeight - 56, // Account for toolbar
      backgroundColor: '#fafafa',
      selection: false, // Disable box selection for now
      preserveObjectStacking: true, // Prevent auto-bring-to-front on selection
    });

    // Clear any existing objects from previous sessions (orphaned drawings, etc.)
    // This ensures a clean canvas on initialization
    canvas.clear();

    fabricCanvasRef.current = canvas;
    setFabricCanvas(canvas); // Store in global store for export

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 384,
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
      // Deselect layers but keep frame selected (Figma-like behavior)
      selectLayers([]);
      // Keep selectedFrameId unchanged
    });

    // Handle mouse down on empty canvas
    canvas.on('mouse:down', (e) => {
      const target = e.target;
      // If clicking empty space (no target or target is canvas background)
      if (!target || target === canvas.backgroundImage || (target as any).type === 'rect' && !(target as any).frameId && !(target as any).layerId) {
        // Deselect layers but keep frame selected
        selectLayers([]);
        canvas.discardActiveObject();
      }
    });

    // Handle real-time frame movement - move layers with frame
    canvas.on('object:moving', (e) => {
      const target = e.target as any;

      if (target?.frameId && !target.layerId) {
        // Frame is being moved - update all its layers in real-time
        const frame = getFrame(target.frameId);
        if (!frame) return;

        const deltaX = (target.left || 0) - frame.x;
        const deltaY = (target.top || 0) - frame.y;

        // Get all layer objects for this frame
        const layerObjects = canvas.getObjects().filter((obj: any) =>
          obj.frameId === target.frameId && obj.layerId
        );

        // Move each layer by the same delta
        layerObjects.forEach((layerObj: any) => {
          const layer = frame.layers.find(l => l.id === layerObj.layerId);
          if (layer) {
            layerObj.set({
              left: frame.x + deltaX + layer.x,
              top: frame.y + deltaY + layer.y,
            });
            layerObj.setCoords();
          }
        });

        canvas.renderAll();
      }

      // Enforce z-order in real-time during any object movement
      // This ensures layers maintain correct stacking while being dragged
      enforceZOrder(canvas, frames);
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
        // Frame modified (frame is now a simple Rect, not a Group)
        const updates: any = {
          x: Math.round(target.left || 0),
          y: Math.round(target.top || 0),
        };

        // If scaled, update dimensions
        if (target.scaleX !== 1 || target.scaleY !== 1) {
          updates.width = Math.round((target.width || 0) * (target.scaleX || 1));
          updates.height = Math.round((target.height || 0) * (target.scaleY || 1));

          // Reset scale to 1 after applying it to dimensions
          target.set({
            scaleX: 1,
            scaleY: 1,
            width: updates.width,
            height: updates.height,
          });
          target.setCoords();
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
      const isSelected = frame.id === selectedFrameId;
      
      if (!canvasFrameIds.has(frame.id)) {
        const frameObject = createFrameObject(frame, isSelected);
        canvas.add(frameObject);

        // Select if this is the selected frame
        if (isSelected) {
          canvas.setActiveObject(frameObject);
        }
      } else {
        // Update existing frame
        const frameObject = getFrameFromCanvas(canvas, frame.id);
        if (frameObject) {
          const updateSuccess = updateFrameObject(frameObject, frame, isSelected);

          // If update failed, recreate the frame
          if (!updateSuccess) {
            console.log('Recreating corrupted frame object for:', frame.name);
            canvas.remove(frameObject);
            const newFrameObject = createFrameObject(frame, isSelected);
            canvas.add(newFrameObject);

            // Re-select if this was the selected frame
            if (isSelected) {
              canvas.setActiveObject(newFrameObject);
            }
          }
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
  // Unified layer manager - handles visibility and cleanup only
  // Drawing objects are kept as native Fabric objects, not converted to images
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Debounce canvas updates to avoid excessive re-renders
    const rafId = requestAnimationFrame(async () => {
      const canvasObjects = canvas.getObjects() as any[];

      // Build a map of layer IDs that should exist (from store)
      const storeLayerIds = new Set<string>();
      const layerVisibilityMap = new Map<string, boolean>();

      frames.forEach((frame) => {
        frame.layers.forEach((layer) => {
          storeLayerIds.add(layer.id);
          layerVisibilityMap.set(layer.id, layer.visible !== false);
        });
      });

      // Build a set of layer IDs that already exist on canvas
      const canvasLayerIds = new Set<string>();
      canvasObjects.forEach((obj) => {
        if (obj.layerId) {
          canvasLayerIds.add(obj.layerId);
        }
      });

      // Update visibility for existing objects
      canvasObjects.forEach((obj) => {
        if (obj.layerId && obj.frameId) {
          const shouldBeVisible = layerVisibilityMap.get(obj.layerId);

          if (shouldBeVisible !== undefined && obj.visible !== shouldBeVisible) {
            console.log(`Updating visibility for ${obj.layerId}: ${obj.visible} → ${shouldBeVisible}`);
            obj.visible = shouldBeVisible;
            obj.set('visible', shouldBeVisible);
            obj.setCoords();
          }

          // Remove layer if deleted from store
          if (!storeLayerIds.has(obj.layerId)) {
            console.log(`Removing deleted layer ${obj.layerId}`);
            canvas.remove(obj);
            if (obj.dispose) obj.dispose();
          }
        }
      });

      // Create canvas objects for layers that don't have them yet (e.g., AI-generated images)
      for (const frame of frames) {
        for (const layer of frame.layers) {
          // Skip if layer already has a canvas object
          if (canvasLayerIds.has(layer.id)) continue;

          // Skip sketch layers (they create their own objects during drawing)
          if (layer.type === 'sketch') continue;

          // Skip group layers (they don't render directly)
          if (layer.type === 'group') continue;

          // Create canvas object for image/AI-generated layers
          if (layer.imageUrl && (layer.type === 'image' || layer.type === 'ai-generated')) {
            try {
              const layerObj = await createLayerObject(layer, frame, layer.imageUrl);
              if (layerObj) {
                canvas.add(layerObj);
                console.log(`Created canvas object for layer ${layer.id} (${layer.type})`);
              }
            } catch (error) {
              console.error(`Failed to create canvas object for layer ${layer.id}:`, error);
            }
          }
        }
      }

      // Remove orphaned objects without layer IDs (shouldn't happen with new approach)
      canvasObjects.forEach((obj) => {
        if (!obj.layerId && !obj.frameId && obj.type !== 'rect') {
          // Don't remove frame objects or other system objects
          const isDrawingType = obj.type === 'path' || obj.type === 'line' ||
                                obj.type === 'circle';
          if (isDrawingType) {
            console.warn(`Found orphaned ${obj.type} object, this shouldn't happen`);
          }
        }
      });

      canvas.renderAll();
    });

    return () => cancelAnimationFrame(rafId);
  }, [frames, selectedLayerIds]);

  // Handle layer z-order when layers are reordered
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    enforceZOrder(canvas, frames);
  }, [frames]);

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

  // Handle drawing mode and tool changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Check if we have an active frame for drawing operations
    const activeFrame = getActiveFrame();

    // Helper: Set frame selectability
    const setFramesSelectable = (selectable: boolean) => {
      canvas.getObjects().forEach((obj: any) => {
        if (obj.frameId && !obj.layerId) {
          // This is a frame object
          // Only set selectable, keep evented true so mouse events still fire
          obj.set('selectable', selectable);
        }
      });
    };

    // Helper: Set all objects selectability (frames AND layers)
    const setAllObjectsSelectable = (selectable: boolean) => {
      canvas.getObjects().forEach((obj: any) => {
        obj.set({
          selectable: selectable,
          evented: selectable,
          hasControls: selectable,
          hasBorders: selectable,
        });
      });
      canvas.renderAll();
    };

    if (currentTool === 'select') {
      // Disable drawing mode
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';

      // Make all objects selectable (frames AND layers)
      setAllObjectsSelectable(true);

      canvas.renderAll();
      return;
    }

    if (currentTool === 'pen') {
      // Check for active frame before enabling drawing
      if (!activeFrame) {
        console.warn('Please select a frame before drawing');
        // Show alert as fallback until we have toast component
        alert('Please select a frame before drawing');
        canvas.isDrawingMode = false;
        canvas.renderAll();
        return;
      }

      // Enable free drawing mode
      canvas.isDrawingMode = true;
      canvas.selection = false;

      // Make all objects non-selectable during pen drawing
      setAllObjectsSelectable(false);

      const brush = new PencilBrush(canvas);
      brush.color = settings.strokeColor;
      brush.width = settings.strokeWidth;
      canvas.freeDrawingBrush = brush;

      // Handle path creation (when pen stroke completes)
      const handlePathCreated = async (e: any) => {
        const path = e.path as Path;
        if (!path || !activeFrame) return;

        try {
          // Get FRESH frame data (not the captured one) to ensure correct positioning
          const currentFrame = getFrame(activeFrame.id);
          if (!currentFrame) {
            console.error('Active frame not found in store');
            return;
          }

          // Create new layer for this pen stroke
          const layerId = createNewDrawingLayer(
            currentFrame.id,
            'pen'
          );

          // Set custom properties on the path object to link it to the layer
          (path as any).layerId = layerId;
          (path as any).frameId = currentFrame.id;

          // Make custom properties non-enumerable and non-configurable to prevent loss
          Object.defineProperty(path, 'layerId', {
            value: layerId,
            writable: false,
            enumerable: false,
            configurable: false
          });
          Object.defineProperty(path, 'frameId', {
            value: currentFrame.id,
            writable: false,
            enumerable: false,
            configurable: false
          });

          // Serialize the Fabric object to JSON
          const fabricObjectData = JSON.stringify(path.toObject(['layerId', 'frameId']));

          // Get path bounds for layer dimensions
          const bounds = path.getBoundingRect();

          // Update layer with Fabric object data
          updateLayer(currentFrame.id, layerId, {
            sketchMetadata: {
              ...getLayer(currentFrame.id, layerId)?.sketchMetadata,
              fabricObjectData,
              strokeColor: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              createdAt: new Date().toISOString(),
            },
            x: Math.round(bounds.left - currentFrame.x),
            y: Math.round(bounds.top - currentFrame.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
          });

          // Keep path non-selectable (only select tool can select objects)
          // Style will be applied when user switches to select tool
          path.set({
            borderColor: '#10b981',
            cornerColor: '#10b981',
            cornerSize: 8,
            transparentCorners: false,
          });

          console.log(`Pen path created for layer ${layerId}`);
          canvas.renderAll();
        } catch (error) {
          console.error('Failed to process path:', error);
        }
      };

      canvas.on('path:created', handlePathCreated);

      return () => {
        canvas.off('path:created', handlePathCreated);
      };
    }

    if (currentTool === 'eraser') {
      // Enable eraser mode - click to delete objects
      canvas.isDrawingMode = false;
      canvas.selection = false;

      // Create custom circular cursor for eraser
      const eraserSize = settings.eraserSize;
      const cursorRadius = eraserSize / 2;

      // Create SVG cursor with circle
      const svg = `<svg width="${eraserSize}" height="${eraserSize}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${cursorRadius}" cy="${cursorRadius}" r="${cursorRadius - 2}"
                fill="none" stroke="black" stroke-width="2"/>
        <circle cx="${cursorRadius}" cy="${cursorRadius}" r="${cursorRadius - 3}"
                fill="none" stroke="white" stroke-width="1"/>
      </svg>`;

      const encodedSvg = btoa(svg);
      const cursorUrl = `data:image/svg+xml;base64,${encodedSvg}`;

      canvas.defaultCursor = `url("${cursorUrl}") ${cursorRadius} ${cursorRadius}, crosshair`;
      canvas.hoverCursor = `url("${cursorUrl}") ${cursorRadius} ${cursorRadius}, crosshair`;

      // Make all objects non-selectable during erasing (we delete by clicking, not selecting)
      setAllObjectsSelectable(false);

      // Add click handler for eraser
      const handleEraserClick = (e: any) => {
        const target = e.target;
        if (target && !target.frameId) {
          // Only delete drawable objects, not frames
          canvas.remove(target);
          canvas.renderAll();
        }
      };

      canvas.on('mouse:down', handleEraserClick);
      canvas.renderAll();

      return () => {
        canvas.off('mouse:down', handleEraserClick);
      };
    }

    // Other tools (line, rectangle, circle) - will be handled by mouse events
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';

    // Disable object selection and interaction at canvas level
    canvas.skipTargetFind = false; // We need to find targets to draw on the canvas
    canvas.perPixelTargetFind = false; // Disable precise target finding
    canvas.targetFindTolerance = 0; // No tolerance for target finding

    // Make all objects non-selectable to prevent dragging during shape drawing
    setAllObjectsSelectable(false);

    canvas.renderAll();
  }, [currentTool, settings, getActiveFrame, selectedLayerIds, getFrame, getLayer, addLayer, updateLayer, selectLayers]);

  // Handle shape drawing (line, rectangle, circle)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Only register handlers for shape tools
    if (currentTool !== 'line' && currentTool !== 'rectangle' && currentTool !== 'circle') {
      return;
    }

    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentShape: Line | Rect | Circle | null = null;

    const handleMouseDown = (e: any) => {
      // Ignore clicks on existing objects - we only want to draw on empty canvas
      if (e.target && e.target !== canvas) {
        console.log('Ignoring click on existing object during shape drawing');
        return;
      }

      // Check for active frame before allowing drawing
      try {
        const activeFrame = ensureActiveFrame();
      } catch (error: any) {
        console.warn(error.message);
        // Show alert as fallback until we have toast component
        alert(error.message || 'Please select a frame before drawing');
        return;
      }

      console.log(`Starting ${currentTool} drawing at`, e.pointer);

      const pointer = canvas.getPointer(e.e);
      isDrawing = true;
      startX = pointer.x;
      startY = pointer.y;

      const commonProps = {
        stroke: settings.strokeColor,
        strokeWidth: settings.strokeWidth,
        fill: settings.fill || 'transparent',
        selectable: false,
      };

      if (currentTool === 'line') {
        currentShape = new Line([startX, startY, startX, startY], commonProps);
        canvas.add(currentShape);
      } else if (currentTool === 'rectangle') {
        currentShape = new Rect({
          left: startX,
          top: startY,
          width: 0,
          height: 0,
          ...commonProps,
        });
        canvas.add(currentShape);
      } else if (currentTool === 'circle') {
        currentShape = new Circle({
          left: startX,
          top: startY,
          radius: 0,
          ...commonProps,
        });
        canvas.add(currentShape);
      }
    };

    const handleMouseMove = (e: any) => {
      if (!isDrawing || !currentShape) return;

      const pointer = canvas.getPointer(e.e);

      if (currentTool === 'line' && currentShape instanceof Line) {
        currentShape.set({ x2: pointer.x, y2: pointer.y });
      } else if (currentTool === 'rectangle' && currentShape instanceof Rect) {
        const width = pointer.x - startX;
        const height = pointer.y - startY;
        currentShape.set({
          width: Math.abs(width),
          height: Math.abs(height),
          left: width > 0 ? startX : pointer.x,
          top: height > 0 ? startY : pointer.y,
        });
      } else if (currentTool === 'circle' && currentShape instanceof Circle) {
        const radius = Math.sqrt(
          Math.pow(pointer.x - startX, 2) + Math.pow(pointer.y - startY, 2)
        );
        currentShape.set({ radius });
      }

      canvas.renderAll();
    };

    const handleMouseUp = async () => {
      if (!isDrawing) return;
      isDrawing = false;

      if (currentShape) {
        // Get active frame
        try {
          const activeFrame = ensureActiveFrame();
          if (!activeFrame) return;

          // Get FRESH frame data (not the captured one) to ensure correct positioning
          const currentFrame = getFrame(activeFrame.id);
          if (!currentFrame) {
            console.error('Active frame not found in store');
            return;
          }

          // Determine tool name
          let toolName: 'line' | 'rectangle' | 'circle' = 'line';
          if (currentShape instanceof Rect) toolName = 'rectangle';
          else if (currentShape instanceof Circle) toolName = 'circle';

          // Create new layer for this shape
          const layerId = createNewDrawingLayer(
            currentFrame.id,
            toolName
          );

          // Set custom properties on the shape object to link it to the layer
          (currentShape as any).layerId = layerId;
          (currentShape as any).frameId = currentFrame.id;

          // Make custom properties non-enumerable and non-configurable to prevent loss
          Object.defineProperty(currentShape, 'layerId', {
            value: layerId,
            writable: false,
            enumerable: false,
            configurable: false
          });
          Object.defineProperty(currentShape, 'frameId', {
            value: currentFrame.id,
            writable: false,
            enumerable: false,
            configurable: false
          });

          // Serialize the Fabric object to JSON
          const fabricObjectData = JSON.stringify(currentShape.toObject(['layerId', 'frameId']));

          // Get shape bounds for layer dimensions
          const bounds = currentShape.getBoundingRect();

          // Update layer with Fabric object data
          updateLayer(currentFrame.id, layerId, {
            sketchMetadata: {
              ...getLayer(currentFrame.id, layerId)?.sketchMetadata,
              fabricObjectData,
              strokeColor: settings.strokeColor,
              strokeWidth: settings.strokeWidth,
              fill: settings.fill,
              createdAt: new Date().toISOString(),
            },
            x: Math.round(bounds.left - currentFrame.x),
            y: Math.round(bounds.top - currentFrame.y),
            width: Math.round(bounds.width),
            height: Math.round(bounds.height),
          });

          // Keep shape non-selectable (only select tool can select objects)
          // Style will be applied when user switches to select tool
          currentShape.set({
            borderColor: '#10b981',
            cornerColor: '#10b981',
            cornerSize: 8,
            transparentCorners: false,
          });

          console.log(`Shape (${toolName}) created for layer ${layerId}`);
        } catch (error: any) {
          console.error('Failed to save shape to layer:', error);
          // Keep shape on canvas if layer creation fails (still non-selectable)
        }

        currentShape = null;
      }

      canvas.renderAll();
    };

      canvas.on('mouse:down', handleMouseDown);
      canvas.on('mouse:move', handleMouseMove);
      canvas.on('mouse:up', handleMouseUp);

      return () => {
        canvas.off('mouse:down', handleMouseDown);
        canvas.off('mouse:move', handleMouseMove);
        canvas.off('mouse:up', handleMouseUp);
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTool, settings]);

  return (
    <div className="flex-1 relative overflow-hidden bg-muted">
      <canvas ref={canvasRef} />

      {/* Frame labels overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {frames.map((frame) => (
          <div
            key={frame.id}
            className="absolute text-sm font-medium"
            style={{
              left: `${frame.x}px`,
              top: `${frame.y - 24}px`,
            }}
          >
            <span className="text-blue-600">{frame.name}</span>
            <span className="text-gray-500 ml-2 text-xs">
              {frame.width} × {frame.height}
            </span>
          </div>
        ))}
      </div>

      {/* Drawing Toolbar */}
      <DrawingToolbar />

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
