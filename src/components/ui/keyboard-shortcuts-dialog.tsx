import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + / to toggle shortcuts dialog
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // Escape to close
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const shortcuts = [
    {
      category: 'General',
      items: [
        { keys: ['Ctrl', '/'], description: 'Show/hide keyboard shortcuts' },
        { keys: ['Delete'], description: 'Delete selected layer or frame' },
        { keys: ['Esc'], description: 'Switch to select tool' },
        { keys: ['Ctrl', 'Z'], description: 'Undo' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo' },
        { keys: ['Ctrl', 'Y'], description: 'Redo (alternative)' },
      ],
    },
    {
      category: 'Tools',
      items: [
        { keys: ['V'], description: 'Select tool' },
        { keys: ['P'], description: 'Pen/brush tool' },
        { keys: ['L'], description: 'Line tool' },
        { keys: ['R'], description: 'Rectangle tool' },
        { keys: ['C'], description: 'Circle tool' },
      ],
    },
    {
      category: 'Zoom',
      items: [
        { keys: ['Ctrl', '+'], description: 'Zoom in' },
        { keys: ['Ctrl', '-'], description: 'Zoom out' },
        { keys: ['Ctrl', '0'], description: 'Reset zoom to 100%' },
        { keys: ['Mouse Wheel'], description: 'Zoom in/out' },
      ],
    },
    {
      category: 'Canvas Navigation',
      items: [
        { keys: ['Shift', 'Drag'], description: 'Pan canvas' },
        { keys: ['Middle Mouse', 'Drag'], description: 'Pan canvas' },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50"
                  >
                    <span className="text-sm">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, j) => (
                        <span key={j} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border border-border">
                            {key}
                          </kbd>
                          {j < item.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground text-center pb-2">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">Ctrl</kbd> +{' '}
          <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">/</kbd> to toggle
          this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}
