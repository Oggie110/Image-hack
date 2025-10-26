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
import { FRAME_PRESETS } from '@/types';
import { PlusIcon, MagicWandIcon, GearIcon } from '@radix-ui/react-icons';

export function Toolbar() {
  const { viewport, zoomIn, zoomOut, resetZoom } = useCanvasStore();
  const { addFrame } = useFrameStore();
  // const [showAIDialog, setShowAIDialog] = useState(false); // Will be used for AI dialog

  const handleAddFrame = (presetName?: string) => {
    const preset = FRAME_PRESETS.find((p) => p.name === presetName);
    addFrame(preset);
  };

  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="h-14 border-b bg-background px-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-semibold">Image Hack</h1>
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
        <Button variant="default" size="sm" onClick={() => console.log('AI Generate - Coming soon')}>
          <MagicWandIcon className="mr-2" />
          AI Generate
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
    </div>
  );
}
