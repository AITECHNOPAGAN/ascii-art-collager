# ASCII Art Generator

A modern, React-based ASCII art generator with layer support, parallax effects, and HTML export capabilities.

## Features

- 🎨 **Multi-Layer Support**: Create complex compositions with multiple ASCII art or image layers
- 🖼️ **Multiple Content Types**: 
  - Convert images to ASCII art
  - Use hi-resolution images
  - Add custom ASCII text
- ✨ **Parallax Effects**: Add depth with customizable parallax motion
- 🎯 **Flexible Positioning**: Position layers with anchors, offsets, and scaling
- 📤 **HTML Export**: Export your creations as standalone HTML files
- 🎨 **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **MobX** - State management (without decorators)
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

### Deploy to GitHub Pages

The project is configured for GitHub Pages deployment at `/ascii-converter-help/`.

```bash
# Build the project
npm run build

# The dist/ folder can be deployed to GitHub Pages
```

## Project Structure

```
src/
├── features/          # Feature-based modules
│   ├── canvas/       # Canvas rendering components
│   ├── layers/       # Layer management UI
│   ├── export/       # HTML export functionality
│   └── effects/      # Parallax effects
├── stores/           # MobX stores
│   ├── LayerStore.ts
│   ├── CanvasStore.ts
│   └── EffectsStore.ts
├── utils/            # Utility functions
│   ├── imageToAscii.ts
│   └── htmlExporter.ts
├── types/            # TypeScript definitions
└── components/       # Reusable components
    └── ui/           # shadcn components
```

## Usage

1. **Create a Layer**: Click "+ New Layer" to add a new layer
2. **Choose Content Type**: Select between ASCII Image, Hi-Res Image, or ASCII Text
3. **Upload/Input Content**: Upload an image or paste ASCII art
4. **Adjust Settings**: Modify position, scale, colors, and parallax strength
5. **Save Layer**: Click "Save Layer" to commit changes
6. **Enable Effects**: Toggle parallax effect for interactive motion
7. **Export**: Choose resolution and export as HTML

## Configuration

The Vite config is set up for GitHub Pages deployment. To change the base path, edit `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/your-repo-name/',  // Change this to your repo name
  // ...
})
```

## License

MIT

