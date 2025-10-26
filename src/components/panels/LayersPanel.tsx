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
} from '@radix-ui/react-icons';
import { pickImageFile, loadImageFromFile, getImageDimensions } from '@/utils/imageHelpers';

export function LayersPanel() {
  const {
    selectedLayerIds,
    getSelectedFrame,
    deleteLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    updateLayer,
    selectLayers,
  } = useFrameStore();

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
      <div className="p-4 border-b">
        <div className="text-sm font-medium mb-2">Frame: {selectedFrame.name}</div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleImportImage}
        >
          <ImageIcon className="mr-2" />
          Import Image
        </Button>
      </div>

      {/* Layers list */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {layers.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No layers yet. Add one above.
            </div>
          ) : (
            layers.map((layer) => {
              const isSelected = selectedLayerIds.includes(layer.id);

              return (
                <div
                  key={layer.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
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

                  {/* Layer thumbnail (placeholder) */}
                  <div className="w-full h-16 bg-muted rounded border mb-2 flex items-center justify-center text-xs text-muted-foreground">
                    {layer.type}
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
