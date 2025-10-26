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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAIStore } from '@/stores/useAIStore';
import { useFrameStore } from '@/stores/useFrameStore';
import { aiService } from '@/services/ai/AIService';
import {
  GENERATION_MODES,
  applyModeToPrompt,
  getModeNegativePrompt,
  type GenerationMode
} from '@/services/ai/generationModes';
import { Loader2Icon, SparklesIcon } from 'lucide-react';

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIGenerateDialog({ open, onOpenChange }: AIGenerateDialogProps) {
  const { settings, updateSettings, isGenerating, setGenerating, setError, error } = useAIStore();
  const { getSelectedFrame, addLayer } = useFrameStore();
  const [localPrompt, setLocalPrompt] = useState(settings.prompt);
  const [localNegativePrompt, setLocalNegativePrompt] = useState(settings.negativePrompt);
  const [selectedMode, setSelectedMode] = useState<GenerationMode>(GENERATION_MODES[6]); // Default to 'custom'

  const selectedFrame = getSelectedFrame();
  const providers = aiService.getAvailableProviders();
  const currentProvider = providers.find((p) => p.current);
  const models = aiService.getSupportedModels();

  // Apply mode settings when mode changes
  useEffect(() => {
    if (selectedMode.id === 'custom') return;

    if (selectedMode.guidanceScale !== undefined) {
      updateSettings({ guidanceScale: selectedMode.guidanceScale });
    }
    if (selectedMode.steps !== undefined) {
      updateSettings({ steps: selectedMode.steps });
    }
  }, [selectedMode]);

  const handleGenerate = async () => {
    if (!localPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!selectedFrame) {
      setError('Please select a frame first');
      return;
    }

    setError(null);
    setGenerating(true);

    try {
      // Update settings
      updateSettings({
        prompt: localPrompt,
        negativePrompt: localNegativePrompt,
      });

      // Apply mode prompt template
      const finalPrompt = applyModeToPrompt(selectedMode, localPrompt);
      const finalNegativePrompt = getModeNegativePrompt(selectedMode, localNegativePrompt);

      // Generate image
      const result = await aiService.generateImage({
        prompt: finalPrompt,
        negativePrompt: finalNegativePrompt,
        width: settings.width,
        height: settings.height,
        steps: settings.steps,
        guidanceScale: settings.guidanceScale,
        seed: settings.seed,
        model: settings.model,
      });

      // Add as layer to selected frame
      addLayer(selectedFrame.id, {
        name: `AI: ${localPrompt.slice(0, 30)}...`,
        type: 'ai-generated',
        imageUrl: result.imageUrl,
        width: settings.width,
        height: settings.height,
        x: (selectedFrame.width - settings.width) / 2,
        y: (selectedFrame.height - settings.height) / 2,
        aiMetadata: {
          prompt: localPrompt,
          negativePrompt: localNegativePrompt,
          model: result.metadata.model,
          seed: result.metadata.seed,
          steps: settings.steps,
          guidanceScale: settings.guidanceScale,
          width: settings.width,
          height: settings.height,
          generatedAt: result.metadata.timestamp,
        },
      });

      // Close dialog on success
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Failed to generate image');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            AI Image Generation
          </DialogTitle>
          <DialogDescription>
            Generate images using AI and add them as layers to your frame
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Provider Info */}
          <div className="rounded-lg bg-muted p-3 text-sm">
            <div className="font-medium">Current Provider: {currentProvider?.displayName}</div>
            <div className="text-muted-foreground text-xs">
              {currentProvider?.type === 'free' ? '✓ Free' : '💰 Paid'} •
              {selectedFrame ? ` Adding to: ${selectedFrame.name}` : ' No frame selected'}
            </div>
          </div>

          {/* Generation Mode */}
          <div className="space-y-2">
            <Label>Generation Mode</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GENERATION_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedMode.id === mode.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(mode)}
                  className="h-auto py-3 px-3 flex flex-col items-start gap-1"
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="text-lg">{mode.icon}</span>
                    <span className="text-xs font-semibold flex-1 text-left">{mode.name}</span>
                  </div>
                  <span className="text-[10px] opacity-70 text-left leading-tight">
                    {mode.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt *</Label>
            <Textarea
              id="prompt"
              placeholder="A beautiful sunset over mountains, photorealistic, 4k"
              value={localPrompt}
              onChange={(e) => setLocalPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Negative Prompt */}
          <div className="space-y-2">
            <Label htmlFor="negative-prompt">Negative Prompt (Optional)</Label>
            <Textarea
              id="negative-prompt"
              placeholder="blurry, low quality, distorted"
              value={localNegativePrompt}
              onChange={(e) => setLocalNegativePrompt(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Model Selection */}
          {models.length > 1 && (
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={settings.model}
                onValueChange={(value) => updateSettings({ model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div>
                        <div>{model.name}</div>
                        {model.description && (
                          <div className="text-xs text-muted-foreground">
                            {model.description}
                          </div>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={settings.width}
                onChange={(e) => updateSettings({ width: parseInt(e.target.value) })}
                min={256}
                max={2048}
                step={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={settings.height}
                onChange={(e) => updateSettings({ height: parseInt(e.target.value) })}
                min={256}
                max={2048}
                step={64}
              />
            </div>
          </div>

          {/* Quick Size Presets - Mode-specific or default */}
          <div className="flex gap-2 flex-wrap">
            {selectedMode.recommendedSizes && selectedMode.recommendedSizes.length > 0 ? (
              selectedMode.recommendedSizes.map((size) => (
                <Button
                  key={size.label}
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ width: size.width, height: size.height })}
                >
                  {size.label}
                </Button>
              ))
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ width: 1024, height: 1024 })}
                >
                  Square (1024×1024)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ width: 1024, height: 768 })}
                >
                  Landscape (1024×768)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSettings({ width: 768, height: 1024 })}
                >
                  Portrait (768×1024)
                </Button>
              </>
            )}
          </div>

          {/* Advanced Settings */}
          <details className="space-y-4">
            <summary className="cursor-pointer text-sm font-medium">
              Advanced Settings
            </summary>
            <div className="space-y-4 pt-4">
              {/* Steps */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Steps</Label>
                  <span className="text-sm text-muted-foreground">{settings.steps}</span>
                </div>
                <Slider
                  value={[settings.steps]}
                  onValueChange={([value]) => updateSettings({ steps: value })}
                  min={1}
                  max={50}
                  step={1}
                />
              </div>

              {/* Guidance Scale */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Guidance Scale</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.guidanceScale}
                  </span>
                </div>
                <Slider
                  value={[settings.guidanceScale]}
                  onValueChange={([value]) => updateSettings({ guidanceScale: value })}
                  min={1}
                  max={20}
                  step={0.5}
                />
              </div>

              {/* Seed */}
              <div className="space-y-2">
                <Label htmlFor="seed">Seed (optional)</Label>
                <Input
                  id="seed"
                  type="number"
                  placeholder="Random"
                  value={settings.seed || ''}
                  onChange={(e) =>
                    updateSettings({ seed: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                />
              </div>
            </div>
          </details>

          {/* Error Display */}
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={isGenerating || !selectedFrame}>
            {isGenerating ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
