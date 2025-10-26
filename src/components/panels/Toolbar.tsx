import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useFrameStore } from '@/stores/useFrameStore';
import { useHistoryStore } from '@/stores/useHistoryStore';
import { FRAME_PRESETS } from '@/types';
import { PlusIcon, MagicWandIcon, GearIcon, DownloadIcon, CounterClockwiseClockIcon, ClockIcon } from '@radix-ui/react-icons';
import { AIGenerateDialog } from '@/components/ai/AIGenerateDialog';
import { ExportDialog } from '@/components/export/ExportDialog';

export function Toolbar() {
  const { viewport, zoomIn, zoomOut, resetZoom, fabricCanvas } = useCanvasStore();
  const { frames, addFrame, restoreFrames } = useFrameStore();
  const { canUndo, canRedo, undo, redo } = useHistoryStore();
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const handleAddFrame = (presetName?: string) => {
    const preset = FRAME_PRESETS.find((p) => p.name === presetName);
    addFrame(preset);
  };

  const handleUndo = () => {
    const previousState = undo(frames);
    if (previousState) {
      restoreFrames(previousState);
    }
  };

  const handleRedo = () => {
    const nextState = redo();
    if (nextState) {
      restoreFrames(nextState);
    }
  };

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="h-14 border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Image Hack</h1>

        {/* Undo/Redo */}
        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            disabled={!canUndo()}
            title="Undo (Cmd+Z)"
          >
            <CounterClockwiseClockIcon />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            disabled={!canRedo()}
            title="Redo (Cmd+Shift+Z)"
          >
            <ClockIcon />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Frame Creation */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <PlusIcon className="mr-2" />
              New Frame
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Mobile</DropdownMenuLabel>
            {FRAME_PRESETS.filter((p) => p.category === 'mobile').map((preset) => (
              <DropdownMenuItem key={preset.name} onClick={() => handleAddFrame(preset.name)}>
                {preset.name} ({preset.width}×{preset.height})
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Desktop</DropdownMenuLabel>
            {FRAME_PRESETS.filter((p) => p.category === 'desktop').map((preset) => (
              <DropdownMenuItem key={preset.name} onClick={() => handleAddFrame(preset.name)}>
                {preset.name} ({preset.width}×{preset.height})
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>Social</DropdownMenuLabel>
            {FRAME_PRESETS.filter((p) => p.category === 'social').map((preset) => (
              <DropdownMenuItem key={preset.name} onClick={() => handleAddFrame(preset.name)}>
                {preset.name} ({preset.width}×{preset.height})
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleAddFrame()}>
              Custom Size
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* AI Generation */}
        <Button variant="default" size="sm" onClick={() => setShowAIDialog(true)}>
          <MagicWandIcon className="mr-2" />
          AI Generate
        </Button>

        {/* Export */}
        <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
          <DownloadIcon className="mr-2" />
          Export
        </Button>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={zoomOut}>
            -
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-20">
                {zoomPercent}%
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => useCanvasStore.getState().setZoom(0.25)}>
                25%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useCanvasStore.getState().setZoom(0.5)}>
                50%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useCanvasStore.getState().setZoom(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useCanvasStore.getState().setZoom(2)}>
                200%
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => useCanvasStore.getState().setZoom(4)}>
                400%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" onClick={zoomIn}>
            +
          </Button>
          <Button variant="outline" size="sm" onClick={resetZoom}>
            Fit
          </Button>
        </div>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="ml-2">
          <GearIcon />
        </Button>
      </div>

      {/* AI Generation Dialog */}
      <AIGenerateDialog open={showAIDialog} onOpenChange={setShowAIDialog} />

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        fabricCanvas={fabricCanvas}
      />
    </div>
  );
}
