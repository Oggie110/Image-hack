import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFrameStore } from '@/stores/useFrameStore';
import {
  TrashIcon,
  EyeOpenIcon,
  EyeNoneIcon,
  LockClosedIcon,
  LockOpen1Icon,
  MagicWandIcon,
  ImageIcon,
  PlusIcon,
  CopyIcon,
  ChevronRightIcon,
  ChevronDownIcon,
} from '@radix-ui/react-icons';
import { pickImageFile, loadImageFromFile, getImageDimensions } from '@/utils/imageHelpers';
import type { Frame, Layer } from '@/types';

function FrameTreeItem({ frame }: { frame: Frame }) {
  const {
    selectedFrameId,
    selectedLayerIds,
    selectFrame,
    selectLayers,
    deleteFrame,
    duplicateFrame,
    toggleFrameExpansion,
    isFrameExpanded,
  } = useFrameStore();

  const isSelected = selectedFrameId === frame.id;
  const isExpanded = isFrameExpanded(frame.id);
  const layers = [...frame.layers].reverse(); // Display in reverse order (top to bottom)

  const handleArrowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFrameExpansion(frame.id);
  };

  const handleFrameClick = () => {
    selectFrame(frame.id);
  };

  return (
    <div className="select-none group">
      {/* Frame Row */}
      <div
        className={`
          flex items-center gap-1 px-2 py-1.5 rounded-sm cursor-pointer transition-colors group-hover:bg-muted/50
          ${isSelected ? 'bg-accent text-accent-foreground' : ''}
        `}
        onClick={handleFrameClick}
      >
        {/* Expand/Collapse Arrow */}
        <button
          onClick={handleArrowClick}
          className="w-4 h-4 flex items-center justify-center hover:bg-muted-foreground/20 rounded flex-shrink-0 transition-transform"
          onMouseDown={(e) => e.stopPropagation()}
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3 transition-transform" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 transition-transform" />
          )}
        </button>

        {/* Frame Name */}
        <span className="flex-1 font-medium text-sm truncate">{frame.name}</span>

        {/* Layer Count Badge */}
        <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0">
          {frame.layers.length}
        </Badge>

        {/* Frame Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5"
            onClick={(e) => {
              e.stopPropagation();
              duplicateFrame(frame.id);
            }}
          >
            <CopyIcon className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-destructive hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              deleteFrame(frame.id);
            }}
          >
            <TrashIcon className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Layers (nested) */}
      {isExpanded && (
        <div className="ml-4 space-y-0.5 border-l border-border/50 pl-1">
          {layers.length === 0 ? (
            <div className="px-2 py-1 text-xs text-muted-foreground italic">
              No layers
            </div>
          ) : (
            layers.map((layer) => (
              <LayerTreeItem key={layer.id} layer={layer} frameId={frame.id} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function LayerTreeItem({ layer, frameId }: { layer: Layer; frameId: string }) {
  const {
    selectedLayerIds,
    selectedFrameId,
    selectLayers,
    selectFrame,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    reorderLayers,
    getFrame,
  } = useFrameStore();

  const [isDragging, setIsDragging] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const isSelected = selectedLayerIds.includes(layer.id);

  const handleLayerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectLayers([layer.id]);
    // Also select parent frame if not already selected
    if (selectedFrameId !== frameId) {
      selectFrame(frameId);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/layer-id', layer.id);
    e.dataTransfer.setData('application/frame-id', frameId);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedLayerId = e.dataTransfer.getData('application/layer-id');
    const draggedFrameId = e.dataTransfer.getData('application/frame-id');

    // Only allow reordering within the same frame
    if (draggedLayerId && draggedLayerId !== layer.id && draggedFrameId === frameId) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const draggedLayerId = e.dataTransfer.getData('application/layer-id');
    const draggedFrameId = e.dataTransfer.getData('application/frame-id');

    if (!draggedLayerId || draggedLayerId === layer.id || draggedFrameId !== frameId) {
      return;
    }

    const frame = getFrame(frameId);
    if (!frame) return;

    // Get current layer order (reversed for display)
    const currentLayers = [...frame.layers];
    const draggedIndex = currentLayers.findIndex((l) => l.id === draggedLayerId);
    const targetIndex = currentLayers.findIndex((l) => l.id === layer.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder layers
    const newLayers = [...currentLayers];
    const [removed] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, removed);

    // Update store with new order
    reorderLayers(
      frameId,
      newLayers.map((l) => l.id)
    );
  };

  const getLayerIcon = () => {
    if (layer.type === 'ai-generated') {
      return <MagicWandIcon className="h-3 w-3" />;
    }
    return <ImageIcon className="h-3 w-3" />;
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group flex items-center gap-1 px-2 py-1 rounded-sm cursor-move transition-all text-sm
        border border-border/70
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${isDragOver ? 'border-primary border-2 bg-primary/5' : ''}
        ${isSelected ? 'bg-primary/10 text-primary font-medium border-primary/60' : 'hover:bg-muted hover:border-border'}
      `}
      onClick={handleLayerClick}
    >
      {/* Layer Icon */}
      <div className="w-4 h-4 flex items-center justify-center text-muted-foreground">
        {getLayerIcon()}
      </div>

      {/* Layer Name */}
      <span className="flex-1 truncate">{layer.name}</span>

      {/* Layer Controls */}
      <div className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerVisibility(frameId, layer.id);
          }}
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? (
            <EyeOpenIcon className="h-3 w-3" />
          ) : (
            <EyeNoneIcon className="h-3 w-3 text-muted-foreground" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => {
            e.stopPropagation();
            toggleLayerLock(frameId, layer.id);
          }}
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        >
          {layer.locked ? (
            <LockClosedIcon className="h-3 w-3" />
          ) : (
            <LockOpen1Icon className="h-3 w-3" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            deleteLayer(frameId, layer.id);
          }}
          title="Delete layer"
        >
          <TrashIcon className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function LayersTreePanel() {
  const {
    frames,
    getSelectedFrame,
    addLayer,
    selectedFrameId,
  } = useFrameStore();

  const selectedFrame = getSelectedFrame();

  const handleCreateNewLayer = () => {
    if (!selectedFrame) return;

    // Create a blank layer with default size
    const layerWidth = Math.min(400, selectedFrame.width * 0.6);
    const layerHeight = Math.min(400, selectedFrame.height * 0.6);

    addLayer(selectedFrame.id, {
      name: `Layer ${selectedFrame.layers.length + 1}`,
      type: 'image',
      width: layerWidth,
      height: layerHeight,
      x: (selectedFrame.width - layerWidth) / 2,
      y: (selectedFrame.height - layerHeight) / 2,
    });
  };

  const handleImportImage = async () => {
    const selectedFrame = getSelectedFrame();
    if (!selectedFrame) return;

    try {
      const file = await pickImageFile();
      if (!file) return;

      const imageUrl = await loadImageFromFile(file);
      const dimensions = await getImageDimensions(imageUrl);

      // Calculate position to center the image in the frame
      const scale = Math.min(
        selectedFrame.width / dimensions.width,
        selectedFrame.height / dimensions.height,
        1
      );

      const width = dimensions.width * scale;
      const height = dimensions.height * scale;
      const x = (selectedFrame.width - width) / 2;
      const y = (selectedFrame.height - height) / 2;

      addLayer(selectedFrame.id, {
        name: file.name || 'Imported Image',
        type: 'image',
        imageUrl,
        width,
        height,
        x,
        y,
      });
    } catch (error) {
      console.error('Failed to import image:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with Actions */}
      <div className="p-4 border-b space-y-2">
        {selectedFrame ? (
          <>
            <div className="mb-2">
              <div className="text-xs text-muted-foreground mb-1">Active Frame</div>
              <div className="text-sm font-semibold text-primary">{selectedFrame.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedFrame.width} × {selectedFrame.height} • {selectedFrame.layers.length} layer{selectedFrame.layers.length !== 1 ? 's' : ''}
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleCreateNewLayer}
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              New Layer
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleImportImage}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Import Image
            </Button>
          </>
        ) : (
          <div className="text-center text-sm text-muted-foreground py-4">
            Select a frame to add layers
          </div>
        )}
      </div>

      {/* Tree View */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {frames.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8 px-4">
              No frames yet. Create one from the toolbar.
            </div>
          ) : (
            frames.map((frame) => (
              <FrameTreeItem key={frame.id} frame={frame} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

