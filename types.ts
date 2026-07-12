
export type MaterialType = 'basic' | 'phong' | 'standard' | 'physical' | 'lambert' | 'toon' | 'normal' | 'depth' | 'matcap';
export type ModelType = 'icosahedron' | 'sphere' | 'box' | 'torus' | 'cylinder' | 'cone' | 'knot' | 'custom';
export type LightType = 'ambient' | 'directional' | 'point' | 'spot' | 'hemisphere' | 'rectArea' | 'lightProbe';
export type ViewMode = 'material' | 'wireframe';

export interface EffectSettings {
  enabled: boolean;
  [key: string]: any;
}

export interface LightSettings {
  id: string;
  type: LightType;
  color: string;
  groundColor?: string; // For Hemisphere
  intensity: number;
  position: [number, number, number];
  rotation?: [number, number, number]; // For RectArea
  width?: number; // For RectArea
  height?: number; // For RectArea
  castShadow: boolean;
  visible: boolean; // Controls if the light actually illuminates
  showShadowHelper?: boolean; // Controls if shadow frustum is visible
}

export interface MaterialSettings {
  id: string;
  name: string;
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
  clearcoat: number;
  clearcoatRoughness: number;
  transmission: number;
  thickness: number;
  ior: number;
  specularIntensity: number;
  shininess: number;
  specular: string;
  depthPacking: boolean;
  matcapUrl?: string;
  map?: string;
  emissiveMap?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalnessMap?: string;
  uvRepeat?: [number, number];
  uvOffset?: [number, number];
  uvRotation?: number;
  uvMirrorX?: boolean;
  uvMirrorY?: boolean;
  useVideoMaterial?: boolean;
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
  showHelpers: boolean;
  environmentPreset: string;
  viewMode: ViewMode;
  screenSpacePanning: boolean;
  autoDepth: boolean;
  zoomSpeed: number;
  normalizeMesh: boolean;
}

export interface AppState {
  materials: Record<string, MaterialSettings>;
  selectedMaterialId: string;
  scene: SceneSettings;
  lights: LightSettings[];
  effects: {
    bloom: EffectSettings;
    glitch: EffectSettings;
    dotScreen: EffectSettings;
    pixelation: EffectSettings;
    depthOfField: EffectSettings;
    noise: EffectSettings;
    vignette: EffectSettings;
    chromaticAberration: EffectSettings;
    scanline: EffectSettings;
    smaa: EffectSettings;
    fxaa: EffectSettings;
    ssao: EffectSettings;
    outline: EffectSettings;
  };
}

export type TabType = 'settings' | 'lights' | 'effects' | 'code';

export type ImportStrategy = 'default' | 'read';

export interface DiscoveredMaterial {
  name: string;
  props?: Partial<MaterialSettings>;
}
