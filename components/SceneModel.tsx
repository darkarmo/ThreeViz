import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, useMatcapTexture } from '@react-three/drei';
import { MaterialSettings, ModelType } from '../types';

interface SceneModelProps {
  materials: Record<string, MaterialSettings>;
  modelType: ModelType;
  customUrl: string | null;
  override: boolean;
  onMaterialsFound?: (names: string[]) => void;
}

const MeshComp = 'mesh' as any;
const Primitive = 'primitive' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

// Fix: Define geometry components as constants to avoid JSX intrinsic element errors.
const BoxGeometryComp = 'boxGeometry' as any;
const SphereGeometryComp = 'sphereGeometry' as any;
const TorusGeometryComp = 'torusGeometry' as any;
const CylinderGeometryComp = 'cylinderGeometry' as any;
const ConeGeometryComp = 'coneGeometry' as any;
const TorusKnotGeometryComp = 'torusKnotGeometry' as any;
const IcosahedronGeometryComp = 'icosahedronGeometry' as any;

/**
 * Separated component to handle custom model loading.
 * This prevents the 'useGLTF' hook from being called with an empty string
 * when the user is viewing built-in geometries.
 */
const CustomModelInstance = ({ 
  url, 
  onMaterialsFound, 
  nativeMaterials, 
  override 
}: { 
  url: string, 
  onMaterialsFound?: (names: string[]) => void,
  nativeMaterials: Record<string, THREE.Material>,
  override: boolean
}) => {
  const { scene } = useGLTF(url) as any;

  // Scan for materials only when the scene is loaded/changed
  useEffect(() => {
    if (scene && onMaterialsFound) {
      const foundNames = new Set<string>();
      scene.traverse((child: any) => {
        if (child.isMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any) => {
            if (m && m.name) foundNames.add(m.name);
          });
        }
      });
      if (foundNames.size > 0) {
        onMaterialsFound(Array.from(foundNames));
      }
    }
  }, [scene, onMaterialsFound]);

  // Apply visual settings and overrides
  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (override) {
            if (Array.isArray(child.material)) {
              child.material = child.material.map((orig: any) => {
                const name = orig?.name;
                return (name && nativeMaterials[name]) || orig;
              });
            } else if (child.material) {
              const name = child.material.name;
              const matched = name && nativeMaterials[name];
              if (matched) child.material = matched;
            }
          }
        }
      });
    }
  }, [scene, nativeMaterials, override]);

  return <Primitive object={scene} scale={2} />;
};

const SceneModel: React.FC<SceneModelProps> = ({ materials, modelType, customUrl, override, onMaterialsFound }) => {
  const [matcapTexture] = useMatcapTexture(0, 256);

  const createMaterial = (settings: MaterialSettings) => {
    const isTransparent = settings.opacity < 1 || settings.transmission > 0 || settings.transparent;
    const baseProps: any = {
      color: new THREE.Color(settings.color),
      wireframe: settings.wireframe,
      transparent: isTransparent,
      opacity: settings.opacity,
      side: THREE.DoubleSide,
      name: settings.name // CRITICAL: This allows subsequent overrides to find the right mesh
    };

    if (['phong', 'lambert', 'standard', 'physical'].includes(settings.type)) {
      baseProps.emissive = new THREE.Color(settings.emissive);
      baseProps.emissiveIntensity = settings.emissiveIntensity;
    }

    let material: THREE.Material;
    switch (settings.type) {
      case 'basic': material = new THREE.MeshBasicMaterial(baseProps); break;
      case 'lambert': material = new THREE.MeshLambertMaterial(baseProps); break;
      case 'phong': material = new THREE.MeshPhongMaterial({ ...baseProps, specular: new THREE.Color(settings.specular), shininess: settings.shininess }); break;
      case 'toon': material = new THREE.MeshToonMaterial(baseProps); break;
      case 'normal': material = new THREE.MeshNormalMaterial({ wireframe: settings.wireframe, name: settings.name }); break;
      case 'depth': material = new THREE.MeshDepthMaterial({ wireframe: settings.wireframe, name: settings.name }); break;
      case 'matcap': material = new THREE.MeshMatcapMaterial({ ...baseProps, matcap: matcapTexture }); break;
      case 'physical': material = new THREE.MeshPhysicalMaterial({
        ...baseProps,
        metalness: settings.metalness,
        roughness: settings.roughness,
        clearcoat: settings.clearcoat,
        clearcoatRoughness: settings.clearcoatRoughness,
        transmission: settings.transmission,
        thickness: settings.thickness,
        ior: settings.ior,
        envMapIntensity: settings.envMapIntensity
      }); break;
      case 'standard':
      default:
        material = new THREE.MeshStandardMaterial({ ...baseProps, metalness: settings.metalness, roughness: settings.roughness, envMapIntensity: settings.envMapIntensity });
    }
    return material;
  };

  const nativeMaterials = useMemo(() => {
    const map: Record<string, THREE.Material> = {};
    (Object.entries(materials) as [string, MaterialSettings][]).forEach(([_, settings]) => {
      map[settings.name] = createMaterial(settings);
    });
    return map;
  }, [materials, matcapTexture]);

  if (modelType === 'custom' && customUrl) {
    return (
      <CustomModelInstance 
        url={customUrl} 
        onMaterialsFound={onMaterialsFound}
        nativeMaterials={nativeMaterials}
        override={override}
      />
    );
  }

  const activeSettings = (Object.values(materials)[0] || materials['default-material']) as MaterialSettings | undefined;

  return (
    <MeshComp castShadow receiveShadow>
      {/* Fix: Use defined geometry components instead of lowercase intrinsic elements to satisfy TypeScript. */}
      {modelType === 'box' && <BoxGeometryComp args={[1, 1, 1]} />}
      {modelType === 'sphere' && <SphereGeometryComp args={[0.7, 64, 64]} />}
      {modelType === 'torus' && <TorusGeometryComp args={[0.5, 0.2, 32, 100]} />}
      {modelType === 'cylinder' && <CylinderGeometryComp args={[0.5, 0.5, 1, 32]} />}
      {modelType === 'cone' && <ConeGeometryComp args={[0.5, 1, 32]} />}
      {modelType === 'knot' && <TorusKnotGeometryComp args={[0.4, 0.15, 128, 32]} />}
      {modelType === 'icosahedron' && <IcosahedronGeometryComp args={[0.8, 15]} />}
      
      {activeSettings ? (
        <Primitive object={createMaterial(activeSettings)} attach="material" />
      ) : (
        <MeshStandardMaterial color="#3b82f6" />
      )}
    </MeshComp>
  );
};

export default SceneModel;
