import { TooltipProvider } from '@/components/ui/tooltip';
import { Toolbar } from '@/components/panels/Toolbar';
import { RightPanel } from '@/components/panels/RightPanel';
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';

function App() {
  return (
    <TooltipProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        {/* Toolbar */}
        <Toolbar />

        {/* Main content area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas */}
          <InfiniteCanvas />

          {/* Right panel */}
          <RightPanel />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default App;
