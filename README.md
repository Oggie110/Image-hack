# Image Hack

**AI-Powered Design Tool with Infinite Canvas**

An open-source web-based design and prototyping tool that combines infinite canvas editing with AI image generation. Create wireframes, design mockups, and generate AI images all in one place.

## Features

### Infinite Canvas System
- Pan and zoom controls (10%-6400%)
- Multi-frame workflow with presets (mobile, tablet, desktop, social)
- Frame selection, dragging, and resizing
- Frame labels and highlighting

### Layer Management
- Full layer system within frames
- Tree-based layer panel with expandable frames
- Drag-and-drop layer reordering within frames
- Image import via file picker
- Layer drag, scale, and rotate
- Layer visibility, opacity, and lock controls
- Layer thumbnails in panel
- Z-order management with real-time enforcement

### AI Image Generation
- Multi-provider architecture (Pollinations.ai, Together.ai, Hugging Face)
- Text-to-image generation
- **Generative Fill / Inpainting** (NEW in v0.0.5!)
  - Fill masked regions with AI-generated content
  - Perfect for creating UI frames, borders, and decorative elements
  - Edge/frame mask preset with 4-corner symmetry
  - Center mask preset for focal content
  - Context-aware generation using surrounding image
  - Hugging Face integration (FREE with API key)
  - Layer replacement workflow
- Multiple AI generation modes for specialized use cases
- AI metadata storage per layer
- Easy provider switching

### Wireframe & Sketching Tools
- Built-in drawing tools for wireframing
- Pen, line, rectangle, circle, and eraser tools
- Custom eraser cursor showing brush size
- Sketch directly on canvas
- Tool-specific cursor feedback
- Precise object selectability control (objects only movable with select tool)
- Convert sketches to designs with AI

### Export System
- Export frames as PNG/JPG/WEBP
- Multi-frame export (ZIP)
- Multiple scale options (1x, 2x, 3x)
- Flatten layers option
- Per-frame export settings

### User Experience
- Comprehensive keyboard shortcuts
- Undo/redo system (Ctrl+Z, Ctrl+Y)
- Auto-save to localStorage
- Layer and frame thumbnails with visual borders
- Real-time z-order enforcement
- Auto-switch to select tool after AI generation
- Auto-expand newly created frames in tree
- First frame auto-centered on canvas
- Always-visible layer action buttons (hide, lock, delete)

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## AI Provider Setup

Image Hack works out of the box with **Pollinations.ai** (free, no API key required).

For production use, configure **Together.ai** for faster, higher-quality results:

1. Sign up at [together.ai](https://together.ai) (get $25 free credits)
2. Create a `.env` file:
   ```env
   VITE_AI_PROVIDER=together
   VITE_TOGETHER_API_KEY=your_api_key_here
   ```

See [AI_PROVIDERS.md](./AI_PROVIDERS.md) for detailed provider comparison and setup.

## Tech Stack

- **React 19** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Fabric.js** - Canvas rendering
- **Zustand** - State management
- **shadcn/ui** - Component library
- **Tailwind CSS** - Styling

## Project Structure

```
src/
├── components/        # React components
│   ├── canvas/       # Canvas-related components
│   ├── dialogs/      # Modal dialogs
│   └── panels/       # Side panels (layers, frames, tools)
├── services/         # Business logic
│   └── ai/          # AI provider integrations
├── stores/          # Zustand state stores
├── types/           # TypeScript types
└── lib/             # Utilities and helpers
```

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for planned features and priorities.

## Contributing

Contributions are welcome! Please check the roadmap for feature ideas or open an issue to discuss new features.

## License

MIT

## Built With

- React 19.1
- TypeScript 5.9
- Vite 7.1
- Fabric.js 6.7
- Zustand 5.0
