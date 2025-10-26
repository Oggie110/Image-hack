# Image Hack Roadmap

## ✅ Completed (MVP v0.1)

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

## 🚀 Next Steps (v0.2)

### Export Functionality
- [ ] Export single frame as PNG/JPG/WEBP
- [ ] Multi-frame export (ZIP)
- [ ] Export with different scales (1x, 2x, 3x)
- [ ] Export settings per frame
- [ ] Flatten layers option

### User Experience
- [ ] Keyboard shortcuts
  - [ ] Delete - Remove selected layer/frame
  - [ ] Ctrl+Z - Undo
  - [ ] Ctrl+Y - Redo
  - [ ] Ctrl+D - Duplicate
  - [ ] F - Zoom to fit
- [ ] Undo/redo system
- [ ] Auto-save to localStorage
- [ ] Layer thumbnails in panel
- [ ] Frame thumbnails in panel

### AI Enhancements
- [ ] **Wireframe/Sketch to Image** ⭐ NEW
  - [ ] Built-in drawing tool for sketching
  - [ ] Convert sketches to wireframes
  - [ ] Use sketch + prompt for AI generation
  - [ ] Sketch layer type
  - [ ] Simple drawing tools (pen, line, rectangle, circle)
  - [ ] Sketch-to-image AI model integration
- [ ] AI image-to-image editing
- [ ] AI inpainting (edit parts of images)
- [ ] AI background removal
- [ ] AI upscaling
- [ ] Batch generation (multiple variations)
- [ ] Prompt history and favorites
- [ ] Model selection in UI

## 📋 Future Features (v0.3+)

### Advanced Editing
- [ ] Text layers with AI text generation
- [ ] Shape layers (rectangle, circle, polygon)
- [ ] Drawing/brush tools
- [ ] Filters (blur, brightness, contrast, saturation)
- [ ] Layer effects (drop shadow, glow, stroke)
- [ ] Blend modes for all layers
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

## 🎯 Prioritization

### High Priority (Next 2-4 weeks)
1. Export functionality
2. Wireframe/sketching tools
3. Keyboard shortcuts
4. Undo/redo
5. Layer thumbnails

### Medium Priority (1-2 months)
1. Advanced AI features (image-to-image, inpainting)
2. Cloud save
3. More AI providers
4. Drawing tools
5. Text layers

### Low Priority (Future)
1. Collaboration features
2. Animation
3. Mobile apps
4. Plugin system

## 📝 Notes

### Wireframe/Sketching Feature Details

The wireframe/sketching feature will enable users to:

1. **Sketch directly on canvas** - Use simple drawing tools to create rough wireframes
2. **Convert to AI images** - Use the sketch as a guide for AI generation
3. **Hybrid workflow** - Combine sketching with prompt-based generation
4. **Sketch layers** - Treat sketches as a special layer type
5. **ControlNet integration** - Use advanced AI models that understand sketches

**Implementation approach:**
- Add drawing tools (pen, line, shapes) to toolbar
- Create sketch layer type that stores vector paths
- Integrate with ControlNet-compatible AI models
- Allow sketch + text prompt combined generation
- Option to hide/show sketch layer after generation

**Use cases:**
- Quick wireframe mockups → high-fidelity designs
- Rough composition sketches → polished images
- Logo concepts → final logos
- UI layouts → realistic mockups

---

**Want to contribute?** Check out issues labeled `good-first-issue` or `help-wanted`!

**Have ideas?** Open an issue with your feature request!
