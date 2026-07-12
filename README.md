# ThreeViz

ThreeViz is a visual middleware program and interactive studio that allows you to configure Three.js canvases visually and export production-ready code directly to your project. It serves as a comprehensive 3D model viewer and post-processing studio, offering real-time control over Bloom effects, Material properties, and Scene settings with dynamic Three.js code generation.

> **Note:** Currently supports robust customization and export features for material properties and post-processing.

---

## Core Features

- 🎨 **Visual Material Configuration**: Fine-tune materials interactively (including color, emissive maps, normal maps, roughness, metalness, and parented material hierarchies).
- 🚀 **Real-Time Post-Processing**: Direct visual control over camera and render effects like Bloom, Tone Mapping, and Scene-wide properties.
- ⚙️ **Comprehensive 3D Model Viewer**: Load internal geometries or import custom 3D assets to preview them under customized environments immediately.
- 💻 **Dynamic Code Export**: Automatically generates and highlights clean, optimized Three.js code reflecting your visual parameters, ready to be copy-pasted into your React Three Fiber or vanilla Three.js projects.
- 🛠️ **Refined Design Interface**: An eye-safe, responsive dark control panel with detailed sliders, color pickers, and immediate visual feedback.

---

## Tech Stack

- **Framework**: [React](https://react.dev/) 19 & [Vite](https://vitejs.dev/)
- **3D Engine**: [Three.js](https://threejs.org/) & [@react-three/fiber](https://r3f.docs.pmnd.rs/getting-started/introduction)
- **Helpers & Postprocessing**: [@react-three/drei](https://github.com/pmndrs/drei) & [@react-three/postprocessing](https://github.com/pmndrs/postprocessing)
- **Styling**: Tailwind CSS
- **Iconography**: Lucide React

---

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) installed on your machine.

### Installation

Clone or download the project, then install the dependencies:

```bash
npm install
```

### Development Server

Launch the local development server:

```bash
npm run dev
```

The app will run on `http://localhost:3000` or the port allocated by Vite.

### Production Build

To build a minimized, production-ready bundle of the visualizer:

```bash
npm run build
```

This generates optimized static files inside the `dist/` directory.

### Preview Build

Preview the built application locally:

```bash
npm run preview
```

---

## How to Use

1. **Upload or Select a Model**: Use the Sidebar to upload a custom 3D model or choose one of the built-in geometries.
2. **Configure Materials**: Navigate the Material panel to tweak textures, roughness, metallic values, colors, or assign custom videos and images as maps.
3. **Adjust Post-Processing & Scene**: Apply effects like Bloom intensity, change background colors, or adjust studio lights in real-time.
4. **Export Code**: Click the **Code Export** tab to grab the automatically generated, perfectly synchronized Three.js code snippet for your custom scene!
