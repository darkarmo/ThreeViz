
import React, { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { MaterialSettings, ModelType } from '../types';

interface SceneModelProps {
  settings: MaterialSettings;
  modelType: ModelType;
  customUrl: string | null;
  override: boolean;
}

// Fix for missing JSX intrinsic elements types in some environments by using local constant definitions
const Mesh = 'mesh' as any;
const BoxGeometry = 'boxGeometry' as any;
const SphereGeometry = 'sphereGeometry' as any;
const TorusGeometry = 'torusGeometry' as any;
const CylinderGeometry = 'cylinderGeometry' as any;
const ConeGeometry = 'coneGeometry' as any;
const TorusKnotGeometry = 'torusKnotGeometry' as any;
const IcosahedronGeometry = 'icosahedronGeometry' as any;

const MeshBasicMaterial = 'meshBasicMaterial' as any;
const MeshLambertMaterial = 'meshLambertMaterial' as any;
const MeshPhongMaterial = 'meshPhongMaterial' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const MeshPhysicalMaterial = 'meshPhysicalMaterial' as any;
const MeshToonMaterial = 'meshToonMaterial' as any;
const MeshNormalMaterial = 'meshNormalMaterial' as any;
const MeshDepthMaterial = 'meshDepthMaterial' as any;
const MeshMatcapMaterial = 'meshMatcapMaterial' as any;
const Primitive = 'primitive' as any;

/**
 * CustomModel component handles loading external GLTF assets
 * It is separated to allow Suspense to work correctly with useGLTF
 */
const CustomModel = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url) as any;
  return <Primitive object={scene} scale={2} />;
};

/**
 * SceneModel component renders either a built-in geometry or a custom loaded model
 * It applies the material settings defined in the studio properties
 */
const SceneModel: React.FC<SceneModelProps> = ({ settings, modelType, customUrl }) => {
  // Memoize geometry based on model type selection
  const geometry = useMemo(() => {
    switch (modelType) {
      case 'box': return <BoxGeometry args={[1, 1, 1]} />;
      case 'sphere': return <SphereGeometry args={[0.7, 64, 64]} />;
      case 'torus': return <TorusGeometry args={[0.5, 0.2, 32, 100]} />;
      case 'cylinder': return <CylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      case 'cone': return <ConeGeometry args={[0.5, 1, 32]} />;
      case 'knot': return <TorusKnotGeometry args={[0.4, 0.15, 128, 32]} />;
      case 'icosahedron':
      default:
        return <IcosahedronGeometry args={[0.8, 15]} />;
    }
  }, [modelType]);

  // Memoize material parameters based on the current material settings
  const material = useMemo(() => {
    const params: any = {
      color: settings.color,
      wireframe: settings.wireframe,
      transparent: settings.transparent || settings.opacity < 1 || settings.transmission > 0,
      opacity: settings.opacity,
    };

    // Add properties for materials that support lighting/PBR
    if (['phong', 'lambert', 'standard', 'physical'].includes(settings.type)) {
      params.emissive = settings.emissive;
      params.emissiveIntensity = settings.emissiveIntensity;
    }

    if (settings.type === 'phong') {
      params.specular = settings.specular;
      params.shininess = settings.shininess;
    }

    if (['standard', 'physical'].includes(settings.type)) {
      params.metalness = settings.metalness;
      params.roughness = settings.roughness;
      params.envMapIntensity = settings.envMapIntensity;
    }

    if (settings.type === 'physical') {
      params.clearcoat = settings.clearcoat;
      params.clearcoatRoughness = settings.clearcoatRoughness;
      params.transmission = settings.transmission;
      params.thickness = settings.thickness;
      params.ior = settings.ior;
    }

    // Return the specific material component based on the engine type
    switch (settings.type) {
      case 'basic': return <MeshBasicMaterial {...params} />;
      case 'lambert': return <MeshLambertMaterial {...params} />;
      case 'phong': return <MeshPhongMaterial {...params} />;
      case 'toon': return <MeshToonMaterial {...params} />;
      case 'normal': return <MeshNormalMaterial wireframe={settings.wireframe} />;
      case 'depth': return <MeshDepthMaterial wireframe={settings.wireframe} />;
      case 'physical': return <MeshPhysicalMaterial {...params} />;
      case 'matcap': return <MeshMatcapMaterial {...params} />;
      case 'standard':
      default:
        return <MeshStandardMaterial {...params} />;
    }
  }, [settings]);

  // If a custom model is active and a URL is provided, render it instead of basic geometry
  if (modelType === 'custom' && customUrl) {
    return <CustomModel url={customUrl} />;
  }

  // Default mesh rendering with chosen geometry and material
  return (
    <Mesh castShadow receiveShadow>
      {geometry}
      {material}
    </Mesh>
  );
};

export default SceneModel;
