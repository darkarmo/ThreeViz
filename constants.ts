
import { AppState, MaterialSettings } from './types';

export const createDefaultMaterial = (id: string, name: string): MaterialSettings => ({
  id,
  name,
  type: 'standard',
  color: '#3b82f6',
  emissive: '#000000',
  emissiveIntensity: 0,
  metalness: 0.5,
  roughness: 0.5,
  wireframe: false,
  opacity: 1.0,
  transparent: false,
  envMapIntensity: 1.0,
  clearcoat: 0,
  clearcoatRoughness: 0,
  transmission: 0,
  thickness: 0,
  ior: 1.5,
  specularIntensity: 1.0,
  shininess: 30,
  specular: '#111111',
  depthPacking: false,
});

const DEFAULT_MAT_ID = 'default-material';

export const INITIAL_STATE: AppState = {
  selectedMaterialId: DEFAULT_MAT_ID,
  materials: {
    [DEFAULT_MAT_ID]: createDefaultMaterial(DEFAULT_MAT_ID, 'Primary Material'),
  },
  scene: {
    exposure: 1.0,
    background: '#0f172a',
    autoRotate: true,
    gridHelper: true,
    ambientIntensity: 0.4,
    contactShadows: true,
    shadowOpacity: 0.4,
    shadowBlur: 2.0,
    showPlane: true,
    planeColor: '#e2e8f0',
    planeRoughness: 0.8,
    planeOpacity: 1.0,
    modelType: 'icosahedron',
    overrideMaterials: true,
    showHelpers: true,
    environmentPreset: 'city'
  },
  lights: [
    {
      id: 'initial-dir-light',
      type: 'directional',
      color: '#ffffff',
      intensity: 1.5,
      position: [5, 10, 5],
      castShadow: true,
      visible: true,
      showShadowHelper: false
    }
  ],
  effects: {
    bloom: { enabled: true, intensity: 1.5, threshold: 0.8, radius: 0.5 },
    glitch: { enabled: false, delay: [1.5, 3.5], duration: [0.6, 1.0], strength: [0.3, 1.0], mode: 0 },
    dotScreen: { enabled: false, angle: 1.57, scale: 1.0 },
    pixelation: { enabled: false, granularity: 10 },
    depthOfField: { enabled: false, focusDistance: 0, focalLength: 0.02, bokehScale: 2, height: 480 },
    noise: { enabled: false, opacity: 0.1 },
    vignette: { enabled: false, offset: 0.5, darkness: 0.5 },
    chromaticAberration: { enabled: false, offset: [0.002, 0.002] },
    scanline: { enabled: false, density: 1.2, opacity: 0.3 },
    smaa: { enabled: true },
    fxaa: { enabled: false },
    ssao: { enabled: false, samples: 32, radius: 20, intensity: 10 },
    outline: { enabled: false, edgeStrength: 2.5, pulseSpeed: 0, visibleEdgeColor: '#ffffff', hiddenEdgeColor: '#111111' }
  }
};

export const MATERIAL_PRESETS_DATA = {
  'Cyber Glow': {
    type: 'physical',
    color: '#1a1a1a',
    emissive: '#10b981',
    emissiveIntensity: 15.0,
    metalness: 0.9,
    roughness: 0.1,
  },
  'Frosted Glass': {
    type: 'physical',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.05,
    transmission: 0.95,
    thickness: 1.5,
    ior: 1.45,
    transparent: true,
  },
  'Hologram': {
    type: 'phong',
    color: '#38bdf8',
    emissive: '#0ea5e9',
    emissiveIntensity: 2.0,
    opacity: 0.4,
    transparent: true,
    wireframe: true,
  }
};
