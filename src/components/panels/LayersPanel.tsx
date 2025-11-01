import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  GroupIcon,
  UngroupIcon,
} from '@radix-ui/react-icons';
import { pickImageFile, loadImageFromFile, getImageDimensions } from '@/utils/imageHelpers';

export function LayersPanel() {
  const {
    selectedLayerIds,
    getSelectedFrame,
    addLayer,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayer,
    selectLayers,
    reorderLayers,
    groupLayers,
    ungroupLayers,
    getLayer,
  } = useFrameStore();

  const [draggedLayerId, setDraggedLayerId] = useState<string | null>(null);
  const [dragOverLayerId, setDragOverLayerId] = useState<string | null>(null);

  const handleCreateNewLayer = () => {
    const selectedFrame = getSelectedFrame();
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

    const file = await pickImageFile();
    if (!file) return;

    try {
      const imageUrl = await loadImageFromFile(file);
      const { width, height } = await getImageDimensions(imageUrl);

      // Scale image to fit within frame if it's larger
      let layerWidth = width;
      let layerHeight = height;
      const maxDimension = Math.min(selectedFrame.width * 0.8, selectedFrame.height * 0.8);

      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        layerWidth = width * scale;
        layerHeight = height * scale;
      }

      // Add layer at center of frame
      useFrameStore.getState().addLayer(selectedFrame.id, {
        name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
        type: 'image',
        imageUrl,
        width: layerWidth,
        height: layerHeight,
        x: (selectedFrame.width - layerWidth) / 2,
        y: (selectedFrame.height - layerHeight) / 2,
      });
    } catch (error) {
      console.error('Failed to import image:', error);
    }
  };

  const handleGroupLayers = () => {
    const selectedFrame = getSelectedFrame();
    if (!selectedFrame || selectedLayerIds.length < 2) return;

    try {
      groupLayers(selectedFrame.id, selectedLayerIds);
    } catch (error) {
      console.error('Failed to group layers:', error);
    }
  };

  const handleUngroupLayers = () => {
    const selectedFrame = getSelectedFrame();
    if (!selectedFrame || selectedLayerIds.length !== 1) return;

    const layer = getLayer(selectedFrame.id, selectedLayerIds[0]);
    if (!layer || layer.type !== 'group') return;

    try {
      ungroupLayers(selectedFrame.id, layer.id);
    } catch (error) {
      console.error('Failed to ungroup layers:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, layerId: string) => {
    setDraggedLayerId(layerId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, layerId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLayerId(layerId);
  };

  const handleDragLeave = () => {
    setDragOverLayerId(null);
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();

    const selectedFrame = getSelectedFrame();
    if (!selectedFrame || !draggedLayerId || draggedLayerId === targetLayerId) {
      setDraggedLayerId(null);
      setDragOverLayerId(null);
      return;
    }

    // Get the current layer order (remember layers is reversed for display)
    const layerIds = [...selectedFrame.layers].map(l => l.id);
    const draggedIndex = layerIds.indexOf(draggedLayerId);
    const targetIndex = layerIds.indexOf(targetLayerId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged item and insert at target position
    const newOrder = [...layerIds];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedLayerId);

    // Reorder layers in store
    reorderLayers(selectedFrame.id, newOrder);

    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const handleDragEnd = () => {
    setDraggedLayerId(null);
    setDragOverLayerId(null);
  };

  const selectedFrame = getSelectedFrame();

  if (!selectedFrame) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-sm text-muted-foreground p-8 text-center">
        Select a frame to view and edit its layers
      </div>
    );
  }

  const layers = [...selectedFrame.layers].reverse(); // Display in reverse order (top to bottom)

  return (
    <div className="flex flex-col h-full">
      {/* Layer controls */}
      <div className="p-4 border-b space-y-2">
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
          <PlusIcon className="mr-2" />
          New Layer
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleImportImage}
        >
          <ImageIcon className="mr-2" />
          Import Image
        </Button>

        {/* Group/Ungroup Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleGroupLayers}
            disabled={selectedLayerIds.length < 2}
            title={selectedLayerIds.length < 2 ? 'Select at least 2 layers to group' : 'Group selected layers'}
          >
            <GroupIcon className="mr-2" />
            Group
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleUngroupLayers}
            disabled={
              selectedLayerIds.length !== 1 ||
              !getLayer(selectedFrame.id, selectedLayerIds[0]) ||
              getLayer(selectedFrame.id, selectedLayerIds[0])?.type !== 'group'
            }
            title={
              selectedLayerIds.length !== 1
                ? 'Select a single group to ungroup'
                : getLayer(selectedFrame.id, selectedLayerIds[0])?.type !== 'group'
                ? 'Selected layer is not a group'
                : 'Ungroup selected group'
            }
          >
            <UngroupIcon className="mr-2" />
            Ungroup
          </Button>
        </div>
      </div>

      {/* Layers list */}
      <ScrollArea className="flex-1">
        <div className="px-4 py-4 space-y-2">
          {layers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No layers yet. Add one above.
            </div>
          ) : (
            layers.map((layer) => {
              const isSelected = selectedLayerIds.includes(layer.id);
              const isDragging = draggedLayerId === layer.id;
              const isDragOver = dragOverLayerId === layer.id;

              return (
                <div
                  key={layer.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, layer.id)}
                  onDragOver={(e) => handleDragOver(e, layer.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, layer.id)}
                  onDragEnd={handleDragEnd}
                  className={`border rounded-lg p-3 cursor-move transition-colors ${
                    isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  } ${isDragging ? 'opacity-50' : ''} ${
                    isDragOver ? 'border-blue-500 border-2' : ''
                  }`}
                  onClick={() => selectLayers([layer.id])}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{layer.name}</div>
                      {layer.type === 'ai-generated' && (
                        <Badge variant="secondary" className="text-xs">
                          <MagicWandIcon className="mr-1 h-3 w-3" />
                          AI
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(selectedFrame.id, layer.id);
                        }}
                      >
                        {layer.visible ? (
                          <EyeOpenIcon className="h-3 w-3" />
                        ) : (
                          <EyeNoneIcon className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerLock(selectedFrame.id, layer.id);
                        }}
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
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLayer(selectedFrame.id, layer.id);
                        }}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Layer thumbnail */}
                  <div className="w-full h-16 bg-muted rounded border mb-2 flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                    {layer.imageUrl ? (
                      <img
                        src={layer.imageUrl}
                        alt={layer.name}
                        className="w-full h-full object-contain"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-muted-foreground">{layer.type}</span>
                    )}
                  </div>

                  {/* Opacity slider */}
                  {isSelected && (
                    <div className="space-y-2">
                      <Separator />
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Opacity</span>
                          <span className="text-muted-foreground">{layer.opacity}%</span>
                        </div>
                        <Slider
                          value={[layer.opacity]}
                          onValueChange={([value]) =>
                            updateLayer(selectedFrame.id, layer.id, { opacity: value })
                          }
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
