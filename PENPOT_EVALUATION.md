# Penpot Evaluation: Should We Switch?

**Date:** October 27, 2025
**Decision:** Continue with Image Hack, do not switch to Penpot
**Status:** Evaluated and decided

---

## Context

Evaluated whether to switch from our current React/TypeScript Image Hack project to building on top of Penpot, an open-source Figma clone, or starting fresh with Penpot as the base.

**Repository evaluated:** https://github.com/Oggie110/penpot (fork of https://github.com/penpot/penpot)

---

## What is Penpot?

**Penpot** is a **production-ready, full-featured open-source design tool** (like Figma):
- 40.9k GitHub stars, 2.3k forks, 212+ releases
- Built with **Clojure/ClojureScript** (79.6% of codebase)
- Complete design suite: artboards, components, design systems, prototyping
- Plugin system for extensions
- Can call third-party APIs via plugins
- Self-hostable or cloud SaaS
- Mozilla Public License 2.0 (MPL-2.0)

The fork (Oggie110/penpot) appears to be a recent fork with no significant changes from the main repo.

---

## Detailed Analysis

### ✅ PROS of Using Penpot

#### 1. Complete Design Tool Foundation
- Fully-featured Figma-like interface out of the box
- Frames, layers, components, design systems already built
- Professional-grade canvas rendering
- Real-time collaboration already implemented
- Production-tested by thousands of users

#### 2. Plugin Architecture
- Plugins can create shapes, images, and layouts
- Can integrate external APIs (including AI services)
- Examples show plugins can fetch from third-party APIs and add to canvas
- TypeScript-based plugin development
- Perfect architecture for adding AI image generation in specific regions

#### 3. Production-Ready
- Battle-tested codebase
- Active maintenance and regular updates
- Comprehensive documentation
- Large community (40.9k stars)

#### 4. Enterprise Features
- Self-hosting capability
- Design tokens and systems
- Advanced prototyping
- Code generation (SVG, CSS, HTML)
- Real-time multi-user collaboration

---

### ❌ CONS of Using Penpot

#### 1. Tech Stack Complexity
- **Clojure/ClojureScript** (79.6% of codebase) - completely different from our React/TypeScript stack
- Steep learning curve if unfamiliar with Clojure functional programming
- Plugin development is in TypeScript, but **core modifications require Clojure knowledge**
- Would need to learn entire Clojure ecosystem

#### 2. Heavy Infrastructure Requirements
- Full backend required (current Image Hack is lightweight frontend-only)
- Backend services in Clojure
- Database requirements
- More complex deployment (Docker, Kubernetes, etc.)
- Significant hosting costs vs. static site hosting
- Overkill if only need AI image generation features

#### 3. Development Overhead
- Large, complex codebase to understand
- Current Image Hack v0.3 already has working AI integration
- Would need to **rewrite everything as Penpot plugins** vs. integrated approach
- Loss of control over core features
- Months of learning before productive development

#### 4. Lost Progress
- Current project has working features:
  - Export system (PNG/JPG/WEBP, multi-frame ZIP, scales)
  - Undo/redo system
  - Drawing tools
  - AI generation with multiple providers
  - Keyboard shortcuts
  - Layer thumbnails
- Would lose all this work and have to rebuild as plugins

---

## Comparison: Image Hack vs Penpot Approach

| Aspect | Image Hack (Current) | Penpot Approach |
|--------|---------------------|-----------------|
| **Tech Stack** | React + TypeScript | Clojure/ClojureScript |
| **Learning Curve** | Familiar | Steep (Clojure) |
| **Deployment** | Static hosting (Vercel, Netlify) | Docker, backend services |
| **Infrastructure** | None (frontend-only) | Database, backend, WASM |
| **Development Speed** | Fast (familiar stack) | Slow (learning required) |
| **AI Integration** | Direct, built-in | Plugin-based |
| **Control** | Full control | Limited to plugin API |
| **Progress Lost** | None | All current work |
| **Time to Market** | Immediate | 3-6 months learning |
| **Maintenance** | Simple | Complex |
| **Cost** | Free static hosting | Server hosting required |

---

## Plugin System Analysis

### What Penpot Plugins Can Do

Based on the sample plugins repository:

- **create-shape** & **create-text** - Generate design elements
- **create-flexlayout** & **create-gridlayout** - Layout systems
- **colors-library** & **components-library** - Asset management
- **third-party-api** - External service integration
- **create-comments** - Annotation functionality
- **group-ungroup** - Object manipulation

### Relevant for AI Image Generation

The **third-party-api** plugin example demonstrates:
- ✅ Can call external APIs (AI services)
- ✅ Can add images to canvas
- ✅ Can create shapes in specific regions
- ✅ TypeScript-based development

**This proves AI image generation in specific regions is possible as a Penpot plugin.**

---

## Decision Matrix

### Use Cases: When to Choose Penpot

✅ **Choose Penpot if you need:**
- Complete Figma clone with professional features
- Real-time collaboration with teams
- Enterprise self-hosting requirements
- Design systems and component libraries
- Advanced prototyping and interactions
- Design-to-code workflows
- Team has Clojure expertise

### Use Cases: When to Choose Image Hack

✅ **Choose Image Hack if you need:**
- Lightweight AI-focused design tool
- Rapid development and iteration
- Simple deployment (static hosting)
- Full control over AI integration
- Familiar React/TypeScript stack
- Solo developer or small team
- **Primary focus on AI image generation**

---

## Decision: Continue with Image Hack

### Rationale

1. **Tech Stack Alignment**
   - Team is proficient in React/TypeScript
   - Zero Clojure knowledge
   - Months of learning would delay project

2. **Scope Alignment**
   - Goal is "Figma clone with AI generation in specific regions"
   - Don't need full Figma feature parity
   - AI features are the differentiator, not general design tools

3. **Progress Preservation**
   - v0.3 already has significant features working
   - Export, undo/redo, drawing tools, AI integration
   - Would lose all progress by switching

4. **Development Velocity**
   - Can add region-based AI generation to current project quickly
   - Familiar stack = fast iteration
   - No infrastructure overhead

5. **Deployment Simplicity**
   - Static site hosting (free/cheap)
   - No backend required
   - Easy scaling

### What We Gain by Staying

- ✅ Keep all current progress (v0.3 features)
- ✅ Maintain development velocity
- ✅ Simple deployment and hosting
- ✅ Full control over AI features
- ✅ Lighter, faster application
- ✅ Can iterate rapidly on AI features

### What We Would Lose by Switching

- ❌ 3-6 months learning Clojure
- ❌ All current v0.3 features (rebuild as plugins)
- ❌ Simple static deployment
- ❌ Development speed
- ❌ Full control over architecture

---

## Hybrid Approach: Learn from Penpot

### Strategy

**Keep Image Hack AND study Penpot's plugin patterns**

1. ✅ **Continue with Image Hack** - simpler and already works
2. 📚 **Study Penpot plugin examples** - especially `third-party-api` and `create-shape`
3. 🎯 **Implement region-based AI generation** - let users select canvas regions for AI
4. 🚀 **Stay lightweight** - don't need full Figma features

### Specific Learnings from Penpot

- **Plugin architecture patterns** - how they structure third-party API calls
- **Canvas region selection** - how to define and manipulate specific areas
- **Image placement API** - how to add generated images to precise locations
- **UI/UX patterns** - how professional design tools handle AI workflows

---

## Next Steps for Image Hack (v0.4)

### High Priority Features

Based on this evaluation, focus on:

1. **Region-based AI generation**
   - Let users draw rectangles/shapes to define AI generation regions
   - Generate AI images that fill specific areas
   - Preview and adjust before finalizing

2. **Sketch-to-image with ControlNet**
   - Use existing drawing tools as AI guides
   - Implement ControlNet integration
   - Sketch + prompt combined generation

3. **Advanced AI features**
   - Image-to-image editing
   - Inpainting specific regions
   - Background removal

4. **Text layers**
   - Add text editing capabilities
   - AI-assisted text generation

### Learning from Penpot

- Review third-party-api plugin implementation
- Study shape creation and manipulation patterns
- Understand region selection UX
- Apply lessons to Image Hack architecture

---

## Conclusion

**Penpot is an excellent tool, but NOT the right choice for this project.**

### Bottom Line

- **Time saved by switching:** ❌ None - would lose months learning Clojure and rebuilding
- **Time saved by continuing:** ✅ Massive - keep building AI features on existing foundation
- **Best path forward:** Focus on what makes Image Hack unique: **AI-powered design**

### Key Insight

We don't need to rebuild a Figma clone. We need to add AI superpowers to a design canvas. Our current React/TypeScript foundation is perfect for this.

---

## References

- Main Penpot repository: https://github.com/penpot/penpot
- Plugin samples: https://github.com/penpot/penpot-plugins-samples
- Plugin documentation: https://help.penpot.app/plugins/
- Plugin API docs: https://penpot-plugins-api-doc.pages.dev

---

**Decision made:** October 27, 2025
**Review date:** When/if requirements change significantly
**Status:** ✅ Confirmed - Continue with Image Hack
