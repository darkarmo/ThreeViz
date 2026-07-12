
import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF, useMatcapTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { MaterialSettings, ModelType, ViewMode, DiscoveredMaterial } from '../types';

// Simple global texture cache to prevent video resets and redundant loads
const textureCache = new Map<string, THREE.Texture>();
const videoElementCache = new Map<string, HTMLVideoElement>();

interface SceneModelProps {
  materials: Record<string, MaterialSettings>;
  modelType: ModelType;
  customUrl: string | null;
  override: boolean;
  viewMode: ViewMode;
  onMaterialsFound?: (materials: DiscoveredMaterial[]) => void;
  normalizeMesh: boolean;
}

const MeshComp = 'mesh' as any;
const Primitive = 'primitive' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;

const serializeTex = (map: any): string | undefined => {
  if (!map) return undefined;
  
  const src = map.source?.data?.src || map.image?.src || map.image?.currentSrc;
  if (src) return src;

  const img = map.source?.data || map.image;
  if (img && (img instanceof ImageBitmap || img instanceof HTMLCanvasElement || img instanceof HTMLVideoElement)) {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        return canvas.toDataURL();
      }
    } catch(e) {
      console.warn('Could not serialize texture', e);
    }
  }
  return undefined;
};

const wireframeMaterial = new THREE.MeshBasicMaterial({ color: '#4ade80', wireframe: true });

/**
 * Separated component to handle custom model loading.
 */
const CustomModelInstance = ({ 
  url, 
  onMaterialsFound, 
  nativeMaterials, 
  override,
  viewMode,
  normalizeMesh
}: { 
  url: string, 
  onMaterialsFound?: (materials: DiscoveredMaterial[]) => void,
  nativeMaterials: Record<string, THREE.Material>,
  override: boolean,
  viewMode: ViewMode,
  normalizeMesh: boolean
}) => {
  const { scene } = useGLTF(url) as any;

  useEffect(() => {
    if (scene && onMaterialsFound) {
      const discovered: DiscoveredMaterial[] = [];
      const seenIds = new Set<string>();
      const seenNames = new Set<string>();

      scene.traverse((child: any) => {
        if (child.isMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m: any, index: number) => {
            if (m && !seenIds.has(m.uuid)) {
              seenIds.add(m.uuid);
              
              let baseName = m.name;
              if (!baseName) {
                baseName = child.name ? `Mat-${child.name}` : (child.parent?.name ? `Mat-${child.parent.name}` : `Material-${m.uuid ? m.uuid.substring(0, 6) : index}`);
              }

              let uniqueName = baseName;
              let counter = 1;
              while (seenNames.has(uniqueName)) {
                uniqueName = `${baseName}-${counter}`;
                counter++;
              }
              
              m.name = uniqueName;
              seenNames.add(uniqueName);
              
              const props: any = {
                color: m.color ? `#${m.color.getHexString()}` : undefined,
                metalness: m.metalness ?? undefined,
                roughness: m.roughness ?? undefined,
                opacity: m.opacity ?? undefined,
                transparent: m.transparent ?? undefined,
                emissive: m.emissive ? `#${m.emissive.getHexString()}` : undefined,
                emissiveIntensity: m.emissiveIntensity ?? undefined,
                wireframe: m.wireframe ?? undefined,
                ior: m.ior ?? undefined,
                thickness: m.thickness ?? undefined,
                transmission: m.transmission ?? undefined,
                shininess: m.shininess ?? undefined,
                specular: (m.specular && m.specular.isColor) ? `#${m.specular.getHexString()}` : undefined,
                map: serializeTex(m.map),
                emissiveMap: serializeTex(m.emissiveMap),
                normalMap: serializeTex(m.normalMap),
                roughnessMap: serializeTex(m.roughnessMap),
                metalnessMap: serializeTex(m.metalnessMap),
                clearcoat: m.clearcoat ?? undefined,
                clearcoatRoughness: m.clearcoatRoughness ?? undefined,
                envMapIntensity: m.envMapIntensity ?? undefined,
                uvRepeat: m.map?.repeat ? [m.map.repeat.x, m.map.repeat.y] : undefined,
                uvOffset: m.map?.offset ? [m.map.offset.x, m.map.offset.y] : undefined,
                uvRotation: m.map?.rotation,
                type: m.type?.replace('Mesh', '').replace('Material', '').toLowerCase() || 'standard'
              };

              // Clean up undefined props
              const filteredProps = Object.fromEntries(
                Object.entries(props).filter(([_, v]) => v !== undefined)
              );

              discovered.push({ name: m.name, props: filteredProps });
            }
          });
        }
      });

      if (discovered.length > 0) {
        onMaterialsFound(discovered);
      }
    }
  }, [scene, onMaterialsFound]);

  useEffect(() => {
    if (scene) {
      if (normalizeMesh) {
        // Reset transform to get raw bounding box
        scene.position.set(0, 0, 0);
        scene.scale.set(1, 1, 1);
        scene.rotation.set(0, 0, 0);
        scene.updateMatrixWorld(true);

        const box = new THREE.Box3();
        scene.traverse((obj: any) => {
          if (obj.isMesh) {
            obj.updateMatrixWorld(true);
            box.expandByObject(obj);
          }
        });

        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
          box.getCenter(center);
          
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 2 / (maxDim || 1);
          
          scene.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
          scene.scale.set(scale, scale, scale);
        }
      } else {
        scene.position.set(0, 0, 0);
        scene.scale.set(1, 1, 1);
      }

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
  }, [scene, nativeMaterials, override, viewMode, normalizeMesh]);

  return <Primitive object={scene} />;
};

const SceneModel: React.FC<SceneModelProps> = ({ materials, modelType, customUrl, override, viewMode, onMaterialsFound, normalizeMesh }) => {
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
    const textureLoader = new THREE.TextureLoader();

    const applyUVs = (texture: THREE.Texture, settings: MaterialSettings) => {
      if (settings.uvRepeat) texture.repeat.set(settings.uvRepeat[0], settings.uvRepeat[1]);
      if (settings.uvOffset) texture.offset.set(settings.uvOffset[0], settings.uvOffset[1]);
      if (settings.uvRotation) {
        texture.rotation = settings.uvRotation;
        texture.center.set(0.5, 0.5);
      }
      return texture;
    };

    const isVideo = (url: string) => url.includes('#video') || /\.(mp4|webm|ogg|mov)$/i.test(url);

    const loadTexture = (url?: string, settings?: MaterialSettings) => {
      if (!url) return null;
      
      const cleanUrl = url.split('#')[0];
      const cacheKey = `${url}_${settings?.uvMirrorX}_${settings?.uvMirrorY}`;
      if (textureCache.has(cacheKey)) {
        const cached = textureCache.get(cacheKey)!;
        if (settings) applyUVs(cached, settings);
        return cached;
      }

      if (isVideo(url)) {
        let video = videoElementCache.get(cleanUrl);
        if (!video) {
          video = document.createElement('video');
          video.src = cleanUrl;
          video.crossOrigin = 'anonymous';
          video.loop = true;
          video.muted = true;
          video.playsInline = true;
          video.autoplay = true;
          video.preload = 'auto';
          
          // Debugging
          console.log(`Initializing video for: ${cleanUrl}`);
          
          video.load();
          video.onerror = (err) => {
            console.error("Video element error event:", err, video?.error);
          };
          video.play().then(() => {
            console.log("Playback started successfully");
          }).catch(e => {
            console.warn("Video auto-play failed:", e);
          });
          videoElementCache.set(cleanUrl, video);
        }

        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = settings?.uvMirrorX ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        texture.wrapT = settings?.uvMirrorY ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        if (settings) applyUVs(texture, settings);
        textureCache.set(cacheKey, texture);
        return texture;
      }

      const texture = textureLoader.load(url);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = settings?.uvMirrorX ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      texture.wrapT = settings?.uvMirrorY ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      if (settings) applyUVs(texture, settings);
      textureCache.set(cacheKey, texture);
      return texture;
    };

    const loadDataTexture = (url?: string, settings?: MaterialSettings) => {
      if (!url) return null;
      const texture = textureLoader.load(url);
      texture.wrapS = settings?.uvMirrorX ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      texture.wrapT = settings?.uvMirrorY ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
      if (settings) applyUVs(texture, settings);
      return texture;
    };

    (Object.entries(materials) as [string, MaterialSettings][]).forEach(([_, settings]) => {
      const material = createMaterial(settings);
      
      if (settings.map) (material as any).map = loadTexture(settings.map, settings);
      
      // Video optimization: boost visibility for screen-like materials
      if (settings.useVideoMaterial && settings.map) {
        // Enforce basic white color so texture isn't tinted
        (material as any).color = new THREE.Color('#ffffff');
        
        if ((material as any).emissive) {
          (material as any).emissiveMap = (material as any).map;
          (material as any).emissive = new THREE.Color('#ffffff');
          (material as any).emissiveIntensity = 1.0;
        }
        
        // For physical materials, make it look like a screen
        if (settings.type === 'physical' || settings.type === 'standard') {
          (material as any).roughness = 0.1;
          (material as any).metalness = 0.1;
        }

        // Disable tone mapping so the "screen" looks bright and uncompensated
        (material as any).toneMapped = false;
      }

      if (settings.normalMap) (material as any).normalMap = loadDataTexture(settings.normalMap, settings);
      if (settings.roughnessMap) (material as any).roughnessMap = loadDataTexture(settings.roughnessMap, settings);
      if (settings.metalnessMap) (material as any).metalnessMap = loadDataTexture(settings.metalnessMap, settings);
      
      material.needsUpdate = true;
      map[settings.name] = material;
    });
    return map;
  }, [materials, matcapTexture, viewMode]);

  useEffect(() => {
    // Satisfy browser autoplay policies by trying to play all cached videos on first user interaction
    const handleInteraction = () => {
      videoElementCache.forEach(video => {
        if (video.paused) {
          video.play().catch(() => {});
        }
      });
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, []);

  useFrame(() => {
    // Explicitly update video textures per frame
    videoElementCache.forEach((video, videoUrl) => {
      if (video.readyState >= video.HAVE_CURRENT_DATA) {
        textureCache.forEach((texture, cacheKey) => {
          // Precise match: the cacheKey starts with the specific videoUrl but followed immediately by the video marker
          if (cacheKey.startsWith(videoUrl + '#') && texture instanceof THREE.VideoTexture) {
            texture.needsUpdate = true;
          }
        });
      }
    });
  });

  const activeMaterial = useMemo(() => {
    const firstMatName = Object.keys(nativeMaterials)[0];
    return nativeMaterials[firstMatName];
  }, [nativeMaterials]);

  if (modelType === 'custom' && customUrl) {
    return (
      <CustomModelInstance 
        url={customUrl} 
        onMaterialsFound={onMaterialsFound}
        nativeMaterials={nativeMaterials}
        override={override}
        viewMode={viewMode}
        normalizeMesh={normalizeMesh}
      />
    );
  }

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
      ) : activeMaterial ? (
        <Primitive object={activeMaterial} attach="material" />
      ) : (
        <MeshStandardMaterial color="#3b82f6" />
      )}
    </MeshComp>
  );
};

export default SceneModel;
