import { LayersTreePanel } from './LayersTreePanel';

export function RightPanel() {
  return (
    <div className="w-96 border-l bg-background flex flex-col">
      <LayersTreePanel />
    </div>
  );
}
