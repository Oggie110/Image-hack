import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useDrawingStore, type DrawingTool } from '@/stores/useDrawingStore';
import {
  CursorArrowIcon,
  Pencil2Icon,
  MinusIcon,
  SquareIcon,
  CircleIcon,
  EraserIcon,
} from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

export function DrawingToolbar() {
  const { currentTool, setTool, settings, setStrokeColor, setStrokeWidth, setFill } =
    useDrawingStore();

  const tools: Array<{
    id: DrawingTool;
    icon: React.ReactNode;
    label: string;
  }> = [
    { id: 'select', icon: <CursorArrowIcon />, label: 'Select' },
    { id: 'pen', icon: <Pencil2Icon />, label: 'Pen' },
    { id: 'line', icon: <MinusIcon />, label: 'Line' },
    { id: 'rectangle', icon: <SquareIcon />, label: 'Rectangle' },
    { id: 'circle', icon: <CircleIcon />, label: 'Circle' },
    { id: 'eraser', icon: <EraserIcon />, label: 'Eraser' },
  ];

  return (
    <div className="absolute left-4 top-20 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 space-y-4 w-48">
      {/* Drawing Tools */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">Tools</Label>
        <div className="grid grid-cols-3 gap-1">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={currentTool === tool.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTool(tool.id)}
              className={cn(
                'h-10 w-full flex flex-col items-center justify-center gap-0.5',
                currentTool === tool.id && 'bg-primary text-primary-foreground'
              )}
              title={tool.label}
            >
              <span className="text-base">{tool.icon}</span>
              <span className="text-[9px] leading-none">{tool.label}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Stroke Color */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold text-muted-foreground">Stroke</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.strokeColor}
            onChange={(e) => setStrokeColor(e.target.value)}
            className="h-8 w-full rounded border cursor-pointer"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-muted-foreground">Width</Label>
          <span className="text-xs text-muted-foreground">{settings.strokeWidth}px</span>
        </div>
        <Slider
          value={[settings.strokeWidth]}
          onValueChange={(value) => setStrokeWidth(value[0])}
          min={1}
          max={50}
          step={1}
          className="w-full"
        />
      </div>

      {/* Fill Color */}
      {(currentTool === 'rectangle' || currentTool === 'circle') && (
        <>
          <Separator />
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground">Fill</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.fill || '#ffffff'}
                onChange={(e) => setFill(e.target.value)}
                className="h-8 w-20 rounded border cursor-pointer"
                disabled={!settings.fill}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFill(settings.fill ? null : '#ffffff')}
                className="flex-1 text-xs"
              >
                {settings.fill ? 'Remove' : 'Add Fill'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Separator />
      <div className="space-y-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setStrokeColor('#000000');
            setStrokeWidth(2);
            setFill(null);
          }}
          className="w-full text-xs"
        >
          Reset Settings
        </Button>
      </div>
    </div>
  );
}
