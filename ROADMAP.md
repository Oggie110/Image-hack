# Image Hack Roadmap

## ✅ Completed (v0.1 - MVP Foundation)

### Core Foundation
- [x] React + TypeScript + Vite setup
- [x] shadcn/ui component library integration
- [x] Tailwind CSS styling
- [x] Fabric.js canvas rendering
- [x] Zustand state management

### Infinite Canvas System
- [x] Pan and zoom controls (10%-6400%)
- [x] Frame system with presets (mobile, tablet, desktop, social)
- [x] Frame rendering with labels
- [x] Frame selection and highlighting
- [x] Frame dragging and resizing
- [x] Bidirectional sync (canvas ↔ store)

### Layer Management
- [x] Layer system within frames
- [x] Image import (file picker)
- [x] Layer rendering on canvas
- [x] Layer selection and highlighting
- [x] Layer dragging, scaling, rotating
- [x] Layer visibility, opacity, lock controls
- [x] Layer transformations sync to store

### AI Image Generation
- [x] Multi-provider architecture
- [x] Pollinations.ai integration (free)
- [x] Together.ai integration (paid)
- [x] Hugging Face integration
- [x] AI generation dialog UI
- [x] Generate images as layers
- [x] AI metadata storage
- [x] Provider switching system

## ✅ Completed (v0.2 - v0.3 - Core Features)

### Export Functionality
- [x] Export single frame as PNG/JPG/WEBP
- [x] Multi-frame export (ZIP)
- [x] Export with different scales (1x, 2x, 3x)
- [x] Export settings per frame
- [x] Flatten layers option

### User Experience
- [x] Keyboard shortcuts
  - [x] Delete - Remove selected layer/frame
  - [x] Ctrl+Z - Undo
  - [x] Ctrl+Y - Redo
  - [x] Ctrl+D - Duplicate
  - [x] F - Zoom to fit
  - [x] Many more shortcuts
- [x] Undo/redo system
- [x] Auto-save to localStorage
- [x] Layer thumbnails in panel
- [x] Frame thumbnails in panel
- [x] Real-time z-order enforcement for layers

### Wireframe/Sketching Tools
- [x] Built-in drawing tool for sketching
- [x] Simple drawing tools (pen, line, rectangle, circle)
- [x] Sketch directly on canvas
- [x] Drawing layer support

### AI Enhancements
- [x] AI generation modes for specialized use cases
- [x] Enhanced prompt system

## ✅ Completed (v0.4 - UX & Layer Management)

### Layer Management Improvements
- [x] Tree-based layer panel with expandable frames
- [x] Drag-and-drop layer reordering within frames
- [x] Visual borders around layers in tree
- [x] Always-visible layer action buttons (no hover required)
- [x] Auto-expand newly created/duplicated frames

### Drawing Tools Enhancements
- [x] Eraser tool with custom circular cursor
- [x] Custom eraser size setting (default 15px)
- [x] Tool-specific cursor feedback for all drawing tools
- [x] Fixed object selectability during drawing (CRITICAL FIX)
- [x] Objects only movable with select tool, not during drawing
- [x] Triple-layer protection against accidental object movement

### User Experience Improvements
- [x] Auto-switch to select tool after AI generation
- [x] First frame auto-centered on canvas
- [x] Frame positioning improvements
- [x] Enhanced visual feedback throughout UI

## 🔄 In Progress (v0.5 - Phase 1 Complete)

### Generative Fill / Inpainting (Phase 1: Backend - ✅ Complete)
- [x] Hugging Face inpainting provider integration
- [x] InpaintingParams type definitions
- [x] AI Service inpainting methods
- [x] Layer metadata for inpainting tracking
- [ ] **Phase 2: UI Components** (Next)
  - [ ] AIInpaintDialog component
  - [ ] MaskOverlay canvas component
  - [ ] Rectangle mask drawing tool
  - [ ] Symmetry helper system (4-corner mirroring)
  - [ ] Toolbar integration and keyboard shortcuts

## 🚀 Next Steps (v0.5)

### AI Enhancements
- [ ] **Generative Fill UI** - Complete Phase 2 (mask tools, symmetry helpers, dialog)
- [ ] **Sketch-to-image AI model integration** - Use sketches as guides for AI generation (ControlNet)
- [ ] AI image-to-image editing
- [ ] AI inpainting (edit parts of images)
- [ ] AI background removal
- [ ] AI upscaling
- [ ] Batch generation (multiple variations)
- [ ] Prompt history and favorites
- [ ] Model selection in UI

### Advanced Editing
- [ ] Text layers
- [ ] Filters (blur, brightness, contrast, saturation)
- [ ] Layer effects (drop shadow, glow, stroke)
- [ ] Blend modes for all layers

## 📋 Future Features (v0.5+)

### Advanced Editing
- [ ] Text layers with AI text generation
- [ ] Shape layers (rectangle, circle, polygon)
- [ ] Advanced drawing/brush tools
- [ ] Layer masks
- [ ] Adjustment layers

### Collaboration & Cloud
- [ ] Cloud save/sync
- [ ] Project sharing
- [ ] Real-time collaboration
- [ ] Version history
- [ ] Comments on frames/layers
- [ ] Team workspaces

### AI Provider Expansion
- [ ] OpenAI DALL-E integration
- [ ] Replicate integration
- [ ] Stability AI official API
- [ ] Midjourney API (when available)
- [ ] Self-hosted models (ComfyUI, Automatic1111)
- [ ] Custom model endpoints

### Professional Features
- [ ] Component library (save/reuse frames)
- [ ] Design systems
- [ ] Frame templates
- [ ] Style guides
- [ ] Asset management
- [ ] Animation/prototyping
- [ ] Responsive design preview

### Performance
- [ ] Viewport culling (only render visible objects)
- [ ] Layer caching
- [ ] Lazy loading of images
- [ ] Web Workers for heavy operations
- [ ] Virtual scrolling for large layer lists

### Platform
- [ ] Desktop app (Electron/Tauri)
- [ ] Mobile app (React Native)
- [ ] Offline mode
- [ ] Plugin system
- [ ] API/CLI for automation

## 💡 Feature Ideas (Under Consideration)

### AI-Powered Features
- [ ] **AI-assisted wireframing** - Describe layout, get wireframe
- [ ] **Sketch recognition** - Draw rough shapes, AI makes them perfect
- [ ] **Style transfer** - Apply art styles to images
- [ ] **Smart object removal** - Remove unwanted elements
- [ ] **Perspective correction** - Fix image distortion
- [ ] **AI color palette generation**
- [ ] **AI layout suggestions**

### Design Tools
- [ ] Grid and guide system
- [ ] Rulers and measurements
- [ ] Alignment tools
- [ ] Snap to grid/guides
- [ ] Design tokens
- [ ] Color picker with palettes
- [ ] Typography tools

### Integration
- [ ] Figma plugin
- [ ] Sketch plugin
- [ ] Adobe XD integration
- [ ] Export to HTML/CSS
- [ ] Notion integration
- [ ] GitHub integration for design reviews

## 🎯 Current Priorities

### High Priority (v0.4 - Next 2-4 weeks)
1. Sketch-to-image AI integration (ControlNet)
2. AI image-to-image editing
3. AI inpainting and background removal
4. Text layers
5. Model selection in UI

### Medium Priority (v0.5 - 1-2 months)
1. Advanced filters and effects
2. Cloud save/sync
3. More AI providers (OpenAI DALL-E, Replicate)
4. Layer masks
5. Blend modes

### Low Priority (Future)
1. Collaboration features
2. Animation/prototyping
3. Mobile apps
4. Plugin system
5. Desktop app (Electron/Tauri)

## 📝 Notes

### Current Development Status (v0.4)

**Completed in this version:**
- ✅ Tree-based layer panel with drag-and-drop reordering
- ✅ Enhanced drawing tools with custom cursors
- ✅ CRITICAL FIX: Objects no longer movable during drawing operations
- ✅ Auto-switch to select tool after AI generation
- ✅ First frame auto-centered on canvas
- ✅ Always-visible layer actions for better UX
- ✅ Auto-expand new frames in tree view

**Next up for v0.5:**
- 🎯 ControlNet/Sketch-to-image AI integration
- 🎯 AI image-to-image editing capabilities
- 🎯 Enhanced AI features (inpainting, background removal)
- 🎯 Text layers with AI assistance

### Sketch-to-Image AI Integration (v0.5 Focus)

The next major feature will enhance the existing drawing tools with AI:

**Planned capabilities:**
1. **ControlNet integration** - Use sketches as precise guides for AI generation
2. **Sketch + prompt workflow** - Combine hand-drawn wireframes with text prompts
3. **Multiple sketch modes** - Canny edge, depth, pose, scribble
4. **Preview before generate** - See how sketch influences AI output

**Use cases:**
- Wireframe mockups → High-fidelity designs
- Rough sketches → Polished illustrations
- Logo concepts → Final logos
- UI layouts → Realistic mockups

---

**Want to contribute?** Check out issues labeled `good-first-issue` or `help-wanted`!

**Have ideas?** Open an issue with your feature request!
