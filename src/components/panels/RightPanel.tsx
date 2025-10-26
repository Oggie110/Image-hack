import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FramesPanel } from './FramesPanel';
import { LayersPanel } from './LayersPanel';

export function RightPanel() {
  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <Tabs defaultValue="layers" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="layers" className="flex-1">
            Layers
          </TabsTrigger>
          <TabsTrigger value="frames" className="flex-1">
            Frames
          </TabsTrigger>
        </TabsList>
        <TabsContent value="layers" className="flex-1 m-0 p-0">
          <LayersPanel />
        </TabsContent>
        <TabsContent value="frames" className="flex-1 m-0 p-0">
          <FramesPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
