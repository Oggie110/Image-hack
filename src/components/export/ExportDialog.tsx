import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useFrameStore } from '@/stores/useFrameStore';
import { downloadFrame, exportAllFrames, estimateExportSize } from '@/services/exportService';
import type { ExportFormat } from '@/types';
import { DownloadIcon, Loader2Icon, FileIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fabricCanvas: any; // Fabric.js canvas instance
}

export function ExportDialog({ open, onOpenChange, fabricCanvas }: ExportDialogProps) {
  const { frames, getSelectedFrame } = useFrameStore();
  const selectedFrame = getSelectedFrame();

  const [format, setFormat] = useState<ExportFormat>('png');
  const [scale, setScale] = useState<1 | 2 | 3>(1);
  const [quality, setQuality] = useState(90);
  const [exportMode, setExportMode] = useState<'current' | 'all'>('current');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Reset to current frame if no frame selected
  useEffect(() => {
    if (!selectedFrame && exportMode === 'current') {
      setExportMode('all');
    }
  }, [selectedFrame, exportMode]);

  const handleExport = async () => {
    if (!fabricCanvas) return;

    setIsExporting(true);

    try {
      const options = {
        format,
        scale,
        quality: quality / 100,
        transparentBackground: format === 'png',
      };

      if (exportMode === 'current' && selectedFrame) {
        // Export single frame
        await downloadFrame(fabricCanvas, selectedFrame, options);
      } else {
        // Export all frames
        await exportAllFrames(fabricCanvas, frames, options, (current, total) => {
          setProgress({ current, total });
        });
      }

      // Close dialog on success
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const estimatedSize = selectedFrame
    ? estimateExportSize(selectedFrame, { format, scale, quality: quality / 100 })
    : '—';

  const frameCount = exportMode === 'current' ? 1 : frames.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DownloadIcon className="w-5 h-5" />
            Export
          </DialogTitle>
          <DialogDescription>
            Export your frames as high-quality images
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Export Mode */}
          <div className="space-y-2">
            <Label>Export</Label>
            <Select
              value={exportMode}
              onValueChange={(value: 'current' | 'all') => setExportMode(value)}
              disabled={!selectedFrame}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current" disabled={!selectedFrame}>
                  Current Frame
                  {selectedFrame && ` (${selectedFrame.name})`}
                </SelectItem>
                <SelectItem value="all">
                  All Frames ({frames.length} frame{frames.length !== 1 ? 's' : ''})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Format</Label>
            <Select
              value={format}
              onValueChange={(value: ExportFormat) => setFormat(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">
                  <div>
                    <div>PNG</div>
                    <div className="text-xs text-muted-foreground">
                      Lossless, supports transparency
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="jpg">
                  <div>
                    <div>JPG</div>
                    <div className="text-xs text-muted-foreground">
                      Smaller file size, no transparency
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="webp">
                  <div>
                    <div>WebP</div>
                    <div className="text-xs text-muted-foreground">
                      Modern format, best compression
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <Label>Scale</Label>
            <div className="flex gap-2">
              <Button
                variant={scale === 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScale(1)}
                className="flex-1"
              >
                1x
              </Button>
              <Button
                variant={scale === 2 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScale(2)}
                className="flex-1"
              >
                2x (Retina)
              </Button>
              <Button
                variant={scale === 3 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScale(3)}
                className="flex-1"
              >
                3x
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Higher scales create sharper images for high-DPI displays
            </div>
          </div>

          {/* Quality (only for JPG) */}
          {format === 'jpg' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Quality</Label>
                <span className="text-sm text-muted-foreground">{quality}%</span>
              </div>
              <Slider
                value={[quality]}
                onValueChange={([value]) => setQuality(value)}
                min={1}
                max={100}
                step={1}
              />
            </div>
          )}

          <Separator />

          {/* Export Info */}
          <div className="rounded-lg bg-muted p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frames:</span>
              <span className="font-medium">{frameCount}</span>
            </div>
            {selectedFrame && exportMode === 'current' && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Size:</span>
                  <span className="font-medium">
                    {selectedFrame.width * scale} × {selectedFrame.height * scale}px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated:</span>
                  <span className="font-medium">{estimatedSize}</span>
                </div>
              </>
            )}
            {exportMode === 'all' && (
              <div className="text-xs text-muted-foreground pt-1">
                Exports will be saved as a ZIP file
              </div>
            )}
          </div>

          {/* Progress */}
          {isExporting && progress.total > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                Exporting frame {progress.current} of {progress.total}...
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || frames.length === 0}>
            {isExporting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <FileIcon className="mr-2 h-4 w-4" />
                Export {exportMode === 'all' && 'All'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
