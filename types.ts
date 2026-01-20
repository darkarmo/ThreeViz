
export type MaterialType = 'basic' | 'phong' | 'standard' | 'physical' | 'lambert' | 'toon' | 'normal' | 'depth' | 'matcap';
export type ModelType = 'icosahedron' | 'sphere' | 'box' | 'torus' | 'cylinder' | 'cone' | 'knot' | 'custom';

export interface BloomSettings {
  intensity: number;
  threshold: number;
  radius: number;
  enabled: boolean;
}

export interface MaterialSettings {
  type: MaterialType;
  color: string;
  emissive: string;
  emissiveIntensity: number;
  metalness: number;
  roughness: number;
  wireframe: boolean;
  opacity: number;
  transparent: boolean;
  envMapIntensity: number;
  // Physical Material specific
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  specularIntensity: number;
  // Phong specific
  shininess: number;
  specular: string;
  // Depth specific
  depthPacking: boolean;
  // Matcap specific
  matcapUrl?: string;
}

export interface SceneSettings {
  exposure: number;
  background: string;
  autoRotate: boolean;
  gridHelper: boolean;
  ambientIntensity: number;
  contactShadows: boolean;
  shadowOpacity: number;
  shadowBlur: number;
  showPlane: boolean;
  planeColor: string;
  planeRoughness: number;
  planeOpacity: number;
  modelType: ModelType;
  overrideMaterials: boolean;
}

export interface AppState {
  bloom: BloomSettings;
  material: MaterialSettings;
  scene: SceneSettings;
}

export type TabType = 'settings' | 'code';
