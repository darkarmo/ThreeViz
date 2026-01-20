
import { AppState, MaterialSettings } from './types';

const BASE_MATERIAL: MaterialSettings = {
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
};

export const MATERIAL_PRESETS: Record<string, MaterialSettings> = {
  'Cyber Glow': {
    ...BASE_MATERIAL,
    type: 'physical',
    color: '#1a1a1a',
    emissive: '#10b981',
    emissiveIntensity: 15.0,
    metalness: 0.9,
    roughness: 0.1,
    envMapIntensity: 2.0,
  },
  'Toon Style': {
    ...BASE_MATERIAL,
    type: 'toon',
    color: '#fb7185',
    emissive: '#000000',
    wireframe: false,
  },
  'Frosted Glass': {
    ...BASE_MATERIAL,
    type: 'physical',
    color: '#ffffff',
    metalness: 0,
    roughness: 0.05,
    transmission: 0.95,
    thickness: 1.5,
    ior: 1.45,
    transparent: true,
    opacity: 1.0,
  },
  'Hologram': {
    ...BASE_MATERIAL,
    type: 'phong',
    color: '#38bdf8',
    emissive: '#0ea5e9',
    emissiveIntensity: 2.0,
    opacity: 0.4,
    transparent: true,
    wireframe: true,
  }
};

export const INITIAL_STATE: AppState = {
  bloom: {
    intensity: 1.5,
    threshold: 0.8,
    radius: 0.5,
    enabled: true,
  },
  material: MATERIAL_PRESETS['Cyber Glow'],
  scene: {
    exposure: 1.0,
    background: '#0f172a',
    autoRotate: true,
    gridHelper: true,
    ambientIntensity: 0.6,
    contactShadows: true,
    shadowOpacity: 0.4,
    shadowBlur: 2.0,
    showPlane: true,
    planeColor: '#e2e8f0',
    planeRoughness: 0.8,
    planeOpacity: 1.0,
    modelType: 'icosahedron',
    overrideMaterials: true,
  },
};
