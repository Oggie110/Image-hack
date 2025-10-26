import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useFrameStore } from '@/stores/useFrameStore';
import { TrashIcon, CopyIcon } from '@radix-ui/react-icons';

export function FramesPanel() {
  const { frames, selectedFrameId, selectFrame, deleteFrame, duplicateFrame } = useFrameStore();

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {frames.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-8">
              No frames yet. Create one from the toolbar.
            </div>
          ) : (
            frames.map((frame) => (
              <div
                key={frame.id}
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedFrameId === frame.id
                    ? 'border-primary bg-accent'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => selectFrame(frame.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{frame.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {frame.width} × {frame.height}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {frame.layers.length} layer{frame.layers.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
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
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFrame(frame.id);
                      }}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Frame thumbnail preview (placeholder) */}
                <div className="mt-2 w-full aspect-video bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                  Preview
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
