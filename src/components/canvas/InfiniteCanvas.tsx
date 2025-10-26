import { useEffect, useRef } from 'react';
import { Canvas } from 'fabric';
import { useCanvasStore } from '@/stores/useCanvasStore';

export function InfiniteCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const { viewport } = useCanvasStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Fabric.js canvas
    const canvas = new Canvas(canvasRef.current, {
      width: window.innerWidth - 320, // Account for right panel
      height: window.innerHeight - 56, // Account for toolbar
      backgroundColor: '#f5f5f5',
    });

    fabricCanvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      canvas.setDimensions({
        width: window.innerWidth - 320,
        height: window.innerHeight - 56,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  // Apply viewport transformations
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    const canvas = fabricCanvasRef.current;
    const { zoom, panX, panY } = viewport;

    canvas.setViewportTransform([zoom, 0, 0, zoom, panX, panY]);
    canvas.renderAll();
  }, [viewport]);

  return (
    <div className="flex-1 relative overflow-hidden bg-muted">
      <canvas ref={canvasRef} />

      {/* Grid background will be added here */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1 rounded text-sm text-muted-foreground">
        {Math.round(viewport.zoom * 100)}% zoom
      </div>
    </div>
  );
}
