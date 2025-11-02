import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { aiService } from '@/services/ai/AIService';
import { useFrameStore } from '@/stores/useFrameStore';
import { createMaskFromRectangles, type MaskRect, type SymmetrySettings } from '@/utils/maskHelpers';
import { Loader2Icon, SparklesIcon, InfoIcon } from 'lucide-react';

interface AIInpaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIInpaintDialog({ open, onOpenChange }: AIInpaintDialogProps) {
  const { selectedLayerIds, getActiveFrame, getLayer, updateLayer } = useFrameStore();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For MVP: simple edge mask preset
  const [maskPreset, setMaskPreset] = useState<'edges' | 'center' | 'custom'>('edges');
  const [symmetry, setSymmetry] = useState<SymmetrySettings>({
    enabled: true,
    type: '4-corner',
  });

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Check if inpainting is supported
    if (!aiService.supportsInpainting()) {
      setError('Current AI provider does not support inpainting. Please switch to Hugging Face provider.');
      return;
    }

    // Get active frame and selected layer
    const frame = getActiveFrame();
    if (!frame) {
      setError('Please select a frame');
      return;
    }

    if (selectedLayerIds.length === 0) {
      setError('Please select a layer to inpaint');
      return;
    }

    const layerId = selectedLayerIds[0];
    const layer = getLayer(frame.id, layerId);

    if (!layer || !layer.imageUrl) {
      setError('Selected layer must have an image');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      // Create mask based on preset
      const maskRects: MaskRect[] = [];

      if (maskPreset === 'edges') {
        // Create rectangles around the edges (for frame borders)
        const borderWidth = Math.min(layer.width, layer.height) * 0.15; // 15% of smallest dimension

        // Top edge
        maskRects.push({
          x: 0,
          y: 0,
          width: layer.width,
          height: borderWidth,
        });

        // With 4-corner symmetry, only need top-left corner
        // The symmetry helper will mirror to all 4 corners
        if (!symmetry.enabled || symmetry.type !== '4-corner') {
          // Manual edges if no symmetry
          // Bottom edge
          maskRects.push({
            x: 0,
            y: layer.height - borderWidth,
            width: layer.width,
            height: borderWidth,
          });

          // Left edge
          maskRects.push({
            x: 0,
            y: 0,
            width: borderWidth,
            height: layer.height,
          });

          // Right edge
          maskRects.push({
            x: layer.width - borderWidth,
            y: 0,
            width: borderWidth,
            height: layer.height,
          });
        }
      } else if (maskPreset === 'center') {
        // Center square
        const size = Math.min(layer.width, layer.height) * 0.5;
        maskRects.push({
          x: (layer.width - size) / 2,
          y: (layer.height - size) / 2,
          width: size,
          height: size,
        });
      }

      // Create mask canvas
      const maskCanvas = createMaskFromRectangles(
        maskRects,
        layer.width,
        layer.height,
        symmetry
      );

      // Convert to base64
      const maskBase64 = maskCanvas.toDataURL('image/png');

      console.log('Generating inpainting with mask preset:', maskPreset);

      // Generate inpainting
      const result = await aiService.generateInpainting({
        prompt: prompt,
        image: layer.imageUrl,
        maskImage: maskBase64,
        width: layer.width,
        height: layer.height,
      });

      // Update layer with inpainted result
      updateLayer(frame.id, layerId, {
        imageUrl: result.imageUrl,
        aiMetadata: {
          prompt: prompt,
          model: result.metadata.model,
          width: layer.width,
          height: layer.height,
          generatedAt: result.metadata.timestamp,
          isInpainting: true,
          originalImageUrl: layer.imageUrl,
          maskData: maskBase64,
        },
      });

      console.log('Inpainting successful!');
      onOpenChange(false);
      setPrompt('');
    } catch (err: any) {
      console.error('Inpainting failed:', err);
      setError(err.message || 'Failed to generate inpainting');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            AI Generative Fill (Inpainting)
          </DialogTitle>
          <DialogDescription>
            Fill selected regions of your layer with AI-generated content
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info */}
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm flex gap-2">
            <InfoIcon className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-blue-700 dark:text-blue-300">
              <strong>MVP Version:</strong> Select a layer with an image, then enter a prompt to fill
              the edges (perfect for creating UI frames and borders).
            </div>
          </div>

          {/* Mask Preset */}
          <div className="space-y-2">
            <Label>Mask Area</Label>
            <div className="flex gap-2">
              <Button
                variant={maskPreset === 'edges' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMaskPreset('edges')}
              >
                Edges/Frame
              </Button>
              <Button
                variant={maskPreset === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMaskPreset('center')}
              >
                Center
              </Button>
            </div>
          </div>

          {/* Symmetry */}
          <div className="space-y-2">
            <Label>Symmetry</Label>
            <div className="flex gap-2">
              <Button
                variant={symmetry.enabled && symmetry.type === '4-corner' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSymmetry({ enabled: true, type: '4-corner' })}
              >
                4-Corner
              </Button>
              <Button
                variant={!symmetry.enabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSymmetry({ enabled: false, type: 'none' })}
              >
                None
              </Button>
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="inpaint-prompt">Prompt *</Label>
            <Textarea
              id="inpaint-prompt"
              placeholder="cyberpunk tech frame, glowing neon edges, holographic overlay..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error Display */}
          {error && !isGenerating && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Generation Progress */}
          {isGenerating && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <div className="font-medium mb-1">Generating inpainting...</div>
              <div className="text-muted-foreground text-xs">
                This may take 10-30 seconds. The model processes your image and mask.
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 h-4 w-4" />
                Generate Fill
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
