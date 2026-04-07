
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, useMatcapTexture } from '@react-three/drei';
import { MaterialSettings, ModelType, ViewMode } from '../types';

interface SceneModelProps {
  materials: Record<string, MaterialSettings>;
  modelType: ModelType;
  customUrl: string | null;
  override: boolean;
  viewMode: ViewMode;
  onMaterialsFound?: (names: string[]) => void;
}

const MeshComp = 'mesh' as any;
const Primitive = 'primitive' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

const wireframeMaterial = new THREE.MeshBasicMaterial({ color: '#4ade80', wireframe: true });

/**
 * Separated component to handle custom model loading.
 */
const CustomModelInstance = ({ 
  url, 
  onMaterialsFound, 
  nativeMaterials, 
  override,
  viewMode
}: { 
  url: string, 
  onMaterialsFound?: (names: string[]) => void,
  nativeMaterials: Record<string, THREE.Material>,
  override: boolean,
  viewMode: ViewMode
}) => {
  const { scene } = useGLTF(url) as any;

  useEffect(() => {
    if (scene && onMaterialsFound) {
      const foundNames = new Set<string>();
      scene.traverse((child: any) => {
        if (child.isMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any, index: number) => {
            if (m) {
              if (!m.name) {
                m.name = `Material-${m.uuid ? m.uuid.substring(0, 6) : index}`;
              }
              foundNames.add(m.name);
            }
          });
        }
      });
      if (foundNames.size > 0) {
        onMaterialsFound(Array.from(foundNames));
      }
    }
  }, [scene, onMaterialsFound]);

  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = viewMode === 'material';
          child.receiveShadow = viewMode === 'material';
          
          if (viewMode === 'wireframe') {
            child.material = wireframeMaterial;
          } else if (override) {
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
  }, [scene, nativeMaterials, override, viewMode]);

  return <Primitive object={scene} scale={2} />;
};

const SceneModel: React.FC<SceneModelProps> = ({ materials, modelType, customUrl, override, viewMode, onMaterialsFound }) => {
  const [matcapTexture] = useMatcapTexture(0, 256);

  const createMaterial = (settings: MaterialSettings) => {
    if (viewMode === 'wireframe') return wireframeMaterial;

    const isTransparent = settings.opacity < 1 || settings.transmission > 0 || settings.transparent;
    const baseProps: any = {
      color: new THREE.Color(settings.color),
      wireframe: settings.wireframe,
      transparent: isTransparent,
      opacity: settings.opacity,
      side: THREE.DoubleSide,
      name: settings.name
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
  }, [materials, matcapTexture, viewMode]);

  if (modelType === 'custom' && customUrl) {
    return (
      <CustomModelInstance 
        url={customUrl} 
        onMaterialsFound={onMaterialsFound}
        nativeMaterials={nativeMaterials}
        override={override}
        viewMode={viewMode}
      />
    );
  }

  const activeSettings = (Object.values(materials)[0] || materials['default-material']) as MaterialSettings | undefined;

  return (
    <MeshComp castShadow={viewMode === 'material'} receiveShadow={viewMode === 'material'}>
      {modelType === 'box' && <boxGeometry args={[1, 1, 1]} />}
      {modelType === 'sphere' && <sphereGeometry args={[0.7, 64, 64]} />}
      {modelType === 'torus' && <torusGeometry args={[0.5, 0.2, 32, 100]} />}
      {modelType === 'cylinder' && <cylinderGeometry args={[0.5, 0.5, 1, 32]} />}
      {modelType === 'cone' && <coneGeometry args={[0.5, 1, 32]} />}
      {modelType === 'knot' && <torusKnotGeometry args={[0.4, 0.15, 128, 32]} />}
      {modelType === 'icosahedron' && <icosahedronGeometry args={[0.8, 15]} />}
      
      {viewMode === 'wireframe' ? (
        <Primitive object={wireframeMaterial} attach="material" />
      ) : activeSettings ? (
        <Primitive object={createMaterial(activeSettings)} attach="material" />
      ) : (
        <MeshStandardMaterial color="#3b82f6" />
      )}
    </MeshComp>
  );
};

export default SceneModel;
