export interface ViewportState {
  zoom: number; // 0.1 to 64 (10% to 6400%)
  panX: number; // X offset in pixels
  panY: number; // Y offset in pixels
}

export interface CanvasConfig {
  minZoom: number;
  maxZoom: number;
  gridSize: number;
  gridColor: string;
}
