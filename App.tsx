
import React, { useState, useCallback, useRef, Suspense, useTransition, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { set, get, del } from 'idb-keyval';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Grid, 
  Environment,
  ContactShadows,
  Float,
  BakeShadows,
  useHelper
} from '@react-three/drei';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper';
import { 
  EffectComposer, 
  Bloom, 
  Glitch, 
  DotScreen, 
  Pixelation, 
  DepthOfField, 
  Noise, 
  Vignette, 
  ChromaticAberration, 
  SMAA, 
  FXAA, 
  SSAO,
  Outline,
  Scanline
} from '@react-three/postprocessing';
import { Settings2, Code, Upload, Loader2, Package, Lightbulb, Wand2, Trash2, RotateCcw, Target, Crosshair, Maximize, AlertTriangle } from 'lucide-react';
import { INITIAL_STATE, createDefaultMaterial } from './constants';
import { AppState, TabType, LightSettings, MaterialSettings, ImportStrategy, DiscoveredMaterial } from './types';

// Sub-components
import Sidebar from './components/Sidebar';
import CodePanel from './components/CodePanel';
import SceneModel from './components/SceneModel';
import LightsPanel from './components/LightsPanel';
import EffectsPanel from './components/EffectsPanel';

// Initialize RectAreaLight uniforms
RectAreaLightUniformsLib.init();

const AmbientLightComp = 'ambientLight' as any;
const DirectionalLightComp = 'directionalLight' as any;
const PointLightComp = 'pointLight' as any;
const SpotLightComp = 'spotLight' as any;
const HemisphereLightComp = 'hemisphereLight' as any;
const RectAreaLightComp = 'rectAreaLight' as any;
const LightProbeComp = 'lightProbe' as any;
const OrthographicCameraComp = 'orthographicCamera' as any;
const GroupComp = 'group' as any;
const MeshComp = 'mesh' as any;
const PlaneGeometryComp = 'planeGeometry' as any;
const MeshStandardMaterialComp = 'meshStandardMaterial' as any;
const ColorComp = 'color' as any;

const NavigationHelper = ({ enabled }: { enabled: boolean }) => {
  const { camera, raycaster, mouse, scene, gl } = useThree();
  const controls = useThree((state) => state.controls) as any;
  
  const updateTargetUnderMouse = useCallback(() => {
    if (!enabled || !controls) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    const validHit = intersects.find((hit: any) => {
      // Ignore non-mesh or hidden objects
      if (!hit.object.visible || hit.object.type !== 'Mesh') return false;
      
      const name = (hit.object.name || "").toLowerCase();
      const isHelper = name.includes('helper') || hit.object.type.includes('Helper') || hit.object.material?.type === 'MeshBasicMaterial';
      const isGround = name.includes('grid') || name.includes('plane') || (hit.object.geometry && hit.object.geometry.type === 'PlaneGeometry' && hit.object.scale.x > 5);
      
      return !isHelper && !isGround;
    });
    
    if (validHit) {
      // Deep target update for better zooming
      controls.target.copy(validHit.point);
      controls.update();
    }
  }, [enabled, controls, camera, raycaster, mouse, scene]);

  // Handle mesh-based auto-centering
  useEffect(() => {
    if (!controls) return;
    
    const handleLongPressOrCenter = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === '.') {
        const box = new THREE.Box3();
        scene.traverse((obj: any) => {
          if (obj.isMesh && obj.visible && !obj.name.toLowerCase().includes('grid') && !obj.name.toLowerCase().includes('plane')) {
            obj.updateMatrixWorld(true);
            box.expandByObject(obj);
          }
        });

        if (box.isEmpty()) return;
        
        const center = new THREE.Vector3();
        box.getCenter(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
        let cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2));
        cameraDistance *= 1.2; // tighter framing
        
        const startTarget = controls.target.clone();
        const startPos = camera.position.clone();
        
        // Direction from camera to center
        let dir = new THREE.Vector3().subVectors(startPos, center).normalize();
        if (dir.length() === 0) dir.set(1, 1, 1).normalize();

        const endPos = new THREE.Vector3().copy(center).add(dir.multiplyScalar(cameraDistance));
        
        let alpha = 0;
        const animate = () => {
          alpha += 0.08;
          if (alpha <= 1) {
            controls.target.lerpVectors(startTarget, center, alpha);
            camera.position.lerpVectors(startPos, endPos, alpha);
            controls.update();
            requestAnimationFrame(animate);
          } else {
            controls.target.copy(center);
            camera.position.copy(endPos);
            controls.update();
          }
        };
        animate();
      }
    };

    window.addEventListener('keydown', handleLongPressOrCenter);
    return () => window.removeEventListener('keydown', handleLongPressOrCenter);
  }, [controls, scene, camera]);

  useEffect(() => {
    if (!gl.domElement || !controls) return;

    const handlePointerDown = (e: PointerEvent) => {
      // Blender bindings: Shift + Middle Mouse = Pan
      if (e.shiftKey && e.button === 1) {
        controls.mouseButtons.MIDDLE = THREE.MOUSE.PAN;
      } else {
        controls.mouseButtons.MIDDLE = THREE.MOUSE.ROTATE;
      }

      if (enabled && (e.button === 1 || e.button === 0)) {
        updateTargetUnderMouse();
      }
    };

    const handleWheel = () => {
      if (enabled) {
        updateTargetUnderMouse();
      }
    };

    gl.domElement.addEventListener('pointerdown', handlePointerDown);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: true });
    
    return () => {
      gl.domElement.removeEventListener('pointerdown', handlePointerDown);
      gl.domElement.removeEventListener('wheel', handleWheel);
    };
  }, [enabled, gl.domElement, controls, updateTargetUnderMouse]);

  const handleDoubleClick = useCallback(() => {
    if (!controls) return;
    
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);
    const validIntersects = intersects.filter((hit: any) => hit.object.type === 'Mesh');
    
    if (validIntersects.length > 0) {
      const point = validIntersects[0].point;
      const startTarget = controls.target.clone();
      const startPos = camera.position.clone();
      const dist = startPos.distanceTo(point);
      
      // Frame selection distance
      const targetDist = Math.min(dist * 0.4, 4);
      const dir = new THREE.Vector3().subVectors(startPos, point).normalize();
      const endPos = new THREE.Vector3().copy(point).add(dir.multiplyScalar(targetDist));
      
      let alpha = 0;
      const animate = () => {
        alpha += 0.1;
        if (alpha <= 1) {
          controls.target.lerpVectors(startTarget, point, alpha);
          camera.position.lerpVectors(startPos, endPos, alpha);
          controls.update();
          requestAnimationFrame(animate);
        } else {
          controls.target.copy(point);
          camera.position.copy(endPos);
          controls.update();
        }
      };
      animate();
    }
  }, [controls, camera, raycaster, mouse, scene]);

  useEffect(() => {
    window.addEventListener('dblclick', handleDoubleClick);
    return () => window.removeEventListener('dblclick', handleDoubleClick);
  }, [handleDoubleClick]);

  return null;
};

const DynamicLight: React.FC<{ light: LightSettings, globalShowHelpers: boolean }> = ({ light, globalShowHelpers }) => {
  const lightRef = useRef<any>(null);
  
  // Fix: Corrected useHelper calls to pass valid constructors and handle types for custom helpers
  useHelper(globalShowHelpers && light.type === 'directional' ? lightRef : null, THREE.DirectionalLightHelper, 1, 'white');
  useHelper(globalShowHelpers && light.type === 'point' ? lightRef : null, THREE.PointLightHelper, 0.5, light.color);
  useHelper(globalShowHelpers && light.type === 'spot' ? lightRef : null, THREE.SpotLightHelper, 'white');
  useHelper(globalShowHelpers && light.type === 'hemisphere' ? lightRef : null, THREE.HemisphereLightHelper, 2, light.color);
  // @ts-ignore: RectAreaLightHelper types can be strict in @react-three/drei
  useHelper(globalShowHelpers && light.type === 'rectArea' ? lightRef : null, RectAreaLightHelper, 'white');
  useHelper(globalShowHelpers && light.showShadowHelper && lightRef.current?.shadow?.camera ? lightRef : null, THREE.CameraHelper);

  switch (light.type) {
    case 'directional':
      return (
        <DirectionalLightComp ref={lightRef} position={light.position} intensity={light.intensity} color={light.color} castShadow={light.castShadow} visible={light.visible}>
          <OrthographicCameraComp attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 30]} />
        </DirectionalLightComp>
      );
    case 'point':
      return <PointLightComp ref={lightRef} position={light.position} intensity={light.intensity} color={light.color} castShadow={light.castShadow} visible={light.visible} />;
    case 'spot':
      return <SpotLightComp ref={lightRef} position={light.position} intensity={light.intensity} color={light.color} castShadow={light.castShadow} visible={light.visible} angle={0.3} penumbra={1} />;
    case 'hemisphere':
      return <HemisphereLightComp ref={lightRef} position={light.position} args={[light.color, light.groundColor, light.intensity]} visible={light.visible} />;
    case 'rectArea':
      return <RectAreaLightComp ref={lightRef} position={light.position} rotation={light.rotation || [0, 0, 0]} intensity={light.intensity} width={light.width || 4} height={light.height || 4} color={light.color} visible={light.visible} />;
    case 'ambient':
      return <AmbientLightComp intensity={light.intensity} color={light.color} visible={light.visible} />;
    case 'lightProbe':
      return <LightProbeComp ref={lightRef} intensity={light.intensity} visible={light.visible} />;
    default: return null;
  }
};

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [customModel, setCustomModel] = useState<string | null>(null);
  const [customModelName, setCustomModelName] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [hasCachedModel, setHasCachedModel] = useState(false);
  const [isStateLoaded, setIsStateLoaded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('default');
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      get('cached-model'),
      get('cached-model-name'),
      get('app-state')
    ]).then(([file, nameVal, savedState]) => {
      startTransition(() => {
        if (savedState) {
          setState(savedState as AppState);
        }
        if (file) {
          const url = URL.createObjectURL(file as File);
          setCustomModel(url);
          setCustomModelName((nameVal as string) || (file as File).name || 'model.glb');
          setHasCachedModel(true);
          if (!savedState) {
            setState(prev => ({ ...prev, scene: { ...prev.scene, modelType: 'custom' } }));
          }
        }
        setIsStateLoaded(true);
      });
    }).catch((err) => {
      console.error(err);
      setIsStateLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isStateLoaded) {
      const timeout = setTimeout(() => {
        set('app-state', state).catch(console.error);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [state, isStateLoaded]);

  const resetState = () => {
    del('app-state').then(() => {
      setState(INITIAL_STATE);
      setShowResetConfirm(false);
    }).catch(console.error);
  };

  const updateState = useCallback(<K extends keyof AppState, S extends keyof AppState[K]>(category: K, key: S, value: AppState[K][S]) => {
    setState(prev => ({ ...prev, [category]: { ...(prev[category] as any), [key]: value } }));
  }, []);

  const updateEffect = useCallback(<S extends keyof AppState['effects'], P extends keyof AppState['effects'][S]>(effect: S, prop: P, value: any) => {
    setState(prev => ({
      ...prev,
      effects: {
        ...prev.effects,
        [effect]: { ...prev.effects[effect], [prop]: value }
      }
    }));
  }, []);

  const updateMaterial = useCallback(<S extends keyof MaterialSettings>(key: S, value: MaterialSettings[S]) => {
    setState(prev => {
      const currentId = prev.selectedMaterialId;
      if (!prev.materials[currentId]) return prev;
      return {
        ...prev,
        materials: { ...prev.materials, [currentId]: { ...prev.materials[currentId], [key]: value } }
      };
    });
  }, []);

  const setTopState = useCallback(<K extends keyof AppState>(key: K, value: AppState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPendingFile(file);
      setShowUploadModal(true);
    }
  };

  const confirmUpload = (strategy: ImportStrategy) => {
    if (!pendingFile) return;
    
    setImportStrategy(strategy);
    setShowUploadModal(false);
    setModelError(null);
    
    if (customModel) URL.revokeObjectURL(customModel);
    const url = URL.createObjectURL(pendingFile);
    
    startTransition(() => {
      setCustomModel(url);
      setCustomModelName(pendingFile.name);
      setHasCachedModel(true);
      setState(prev => ({ 
        ...prev, 
        scene: { ...prev.scene, modelType: 'custom' },
        // If strategy is read, we might want to default override to false initially or handle it in discovered
        // But the user usually wants to see the effect of their choice.
      }));
    });
    
    // Save to IndexedDB
    set('cached-model', pendingFile).catch(console.error);
    set('cached-model-name', pendingFile.name).catch(console.error);
    setPendingFile(null);
  };

  const clearCache = () => {
    Promise.all([
      del('cached-model'),
      del('cached-model-name')
    ]).then(() => {
      if (customModel) URL.revokeObjectURL(customModel);
      startTransition(() => {
        setCustomModel(null);
        setCustomModelName(null);
        setHasCachedModel(false);
        setModelError(null);
        setState(prev => ({ ...prev, scene: { ...prev.scene, modelType: 'icosahedron' } }));
      });
    }).catch(console.error);
  };

  const onMaterialsDiscovered = useCallback((discovered: DiscoveredMaterial[]) => {
    setState(prev => {
      const newMaterials = { ...prev.materials };
      let firstId = prev.selectedMaterialId;
      
      discovered.forEach((item, index) => {
        const { name, props } = item;
        const id = `mat-${name || index}`;
        
        if (!newMaterials[id]) {
          const defaultMat = createDefaultMaterial(id, name || `Material ${index + 1}`);
          
          if (importStrategy === 'read' && props) {
            // Merge discovered props into default material
            newMaterials[id] = {
              ...defaultMat,
              ...props
            };
          } else {
            newMaterials[id] = defaultMat;
          }
        }
        
        if (index === 0 && (prev.selectedMaterialId === 'default-material' || !prev.materials[prev.selectedMaterialId])) {
          firstId = id;
        }
      });
      
      return { ...prev, materials: newMaterials, selectedMaterialId: firstId };
    });
  }, [importStrategy]);

  const handleUpdateLights = (lights: LightSettings[]) => setState(prev => ({ ...prev, lights }));

  // Helper boolean to toggle heavy logic in viewport
  const isMaterialMode = state.scene.viewMode === 'material';

  const activeEffects = [];
  if (state.effects.smaa.enabled) activeEffects.push(<SMAA key="smaa" />);
  if (state.effects.fxaa.enabled) activeEffects.push(<FXAA key="fxaa" />);
  if (state.effects.bloom.enabled) activeEffects.push(<Bloom key="bloom" luminanceThreshold={state.effects.bloom.threshold} intensity={state.effects.bloom.intensity} radius={state.effects.bloom.radius} mipmapBlur />);
  if (state.effects.glitch.enabled) activeEffects.push(<Glitch key="glitch" delay={state.effects.glitch.delay} duration={state.effects.glitch.duration} strength={state.effects.glitch.strength} mode={state.effects.glitch.mode} />);
  if (state.effects.dotScreen.enabled) activeEffects.push(<DotScreen key="dotscreen" angle={state.effects.dotScreen.angle} scale={state.effects.dotScreen.scale} />);
  if (state.effects.pixelation.enabled) activeEffects.push(<Pixelation key="pixelation" granularity={state.effects.pixelation.granularity} />);
  if (state.effects.depthOfField.enabled) activeEffects.push(<DepthOfField key="dof" focusDistance={state.effects.depthOfField.focusDistance} focalLength={state.effects.depthOfField.focalLength} bokehScale={state.effects.depthOfField.bokehScale} height={state.effects.depthOfField.height} />);
  if (state.effects.noise.enabled) activeEffects.push(<Noise key="noise" opacity={state.effects.noise.opacity} />);
  if (state.effects.vignette.enabled) activeEffects.push(<Vignette key="vignette" offset={state.effects.vignette.offset} darkness={state.effects.vignette.darkness} />);
  if (state.effects.chromaticAberration.enabled) activeEffects.push(<ChromaticAberration key="chroma" offset={new THREE.Vector2(...state.effects.chromaticAberration.offset)} />);
  if (state.effects.scanline.enabled) activeEffects.push(<Scanline key="scanline" density={state.effects.scanline.density} opacity={state.effects.scanline.opacity} />);
  if (state.effects.ssao.enabled) activeEffects.push(
    // @ts-ignore: SSAO types in @react-three/postprocessing can be strict about missing optional props
    <SSAO key="ssao" samples={state.effects.ssao.samples} radius={state.effects.ssao.radius} intensity={state.effects.ssao.intensity} />
  );
  if (state.effects.outline.enabled) activeEffects.push(<Outline key="outline" edgeStrength={state.effects.outline.edgeStrength} pulseSpeed={state.effects.outline.pulseSpeed} visibleEdgeColor={parseInt(state.effects.outline.visibleEdgeColor.replace('#', '0x'))} hiddenEdgeColor={parseInt(state.effects.outline.hiddenEdgeColor.replace('#', '0x'))} />);

  return (
    <div className="flex h-screen w-full bg-[#262626] text-neutral-300 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".glb,.gltf,.obj" />
      <main className="relative flex-1 bg-[#1a1a1a]">
        {isPending && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 pointer-events-none"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>}
        <Canvas shadows={{ type: THREE.PCFSoftShadowMap }} dpr={[1, 2]} gl={{ antialias: isMaterialMode, alpha: false, stencil: false }}>
          <ColorComp attach="background" args={[state.scene.background]} />
          <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} near={0.01} far={10000} />
          <OrbitControls 
            makeDefault 
            autoRotate={state.scene.autoRotate} 
            autoRotateSpeed={0.5} 
            enableDamping 
            dampingFactor={0.08}
            screenSpacePanning={state.scene.screenSpacePanning}
            zoomSpeed={state.scene.zoomSpeed}
            minDistance={0.001}
            maxDistance={10000}
            mouseButtons={{
              LEFT: THREE.MOUSE.ROTATE,
              MIDDLE: THREE.MOUSE.ROTATE,
              RIGHT: THREE.MOUSE.PAN
            }}
          />
          <NavigationHelper enabled={state.scene.autoDepth} />
          
          <AmbientLightComp intensity={state.scene.ambientIntensity} />
          {state.lights.map((light) => <DynamicLight key={light.id} light={light} globalShowHelpers={state.scene.showHelpers} />)}
          
          {/* Only render cost-heavy environment mapping in Material View */}
          {isMaterialMode && state.scene.environmentPreset !== 'none' && <Environment preset={state.scene.environmentPreset as any} />}
          
          <GroupComp position={[0, 0, 0]}>
            <Suspense fallback={null}>
              <SceneModel 
                materials={state.materials} 
                modelType={state.scene.modelType} 
                customUrl={customModel} 
                customModelName={customModelName}
                override={state.scene.overrideMaterials} 
                viewMode={state.scene.viewMode} 
                onMaterialsFound={onMaterialsDiscovered} 
                onLoadError={(err) => setModelError(err.message)}
                normalizeMesh={state.scene.normalizeMesh}
              />
            </Suspense>
          </GroupComp>

          {state.scene.showPlane && (
            <MeshComp rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
              <PlaneGeometryComp args={[100, 100]} />
              <MeshStandardMaterialComp 
                color={state.scene.planeColor} 
                roughness={state.scene.planeRoughness} 
                metalness={0.1} 
                transparent={state.scene.planeOpacity < 1} 
                opacity={state.scene.planeOpacity} 
              />
            </MeshComp>
          )}

          {/* Lightweight Mode Disables Shadows and Grid fading logic if needed, but Grid is usually fine */}
          {isMaterialMode && state.scene.contactShadows && <ContactShadows position={[0, -0.99, 0]} opacity={state.scene.shadowOpacity} scale={15} blur={state.scene.shadowBlur} far={3} />}
          {state.scene.gridHelper && state.scene.showPlane && <Grid position={[0, -0.995, 0]} args={[20, 20]} sectionColor="#444" cellColor="#222" fadeDistance={25} infiniteGrid />}
          
          {isMaterialMode && activeEffects.length > 0 && (
            <EffectComposer multisampling={4}>
              {activeEffects}
            </EffectComposer>
          )}
          <BakeShadows />
        </Canvas>
        <div className="absolute top-6 left-6 pointer-events-none select-none hw-panel p-4 flex flex-col gap-2">
          <h1 className="text-sm font-medium text-neutral-300 tracking-widest uppercase">ThreeViz</h1>
          <div className="hw-screen px-3 py-1 flex items-center justify-center">
            <p className="text-[#60a5fa] text-[10px] tracking-[0.2em] uppercase flex items-center gap-2"><Package size={10} /> {state.scene.modelType === 'custom' ? 'Custom Asset' : 'Internal Geometry'}</p>
          </div>
        </div>
        {modelError && (
          <div className="absolute top-28 left-6 hw-panel p-4 border border-red-500/20 bg-red-500/5 max-w-xs pointer-events-auto flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 z-[60]">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle size={14} />
              <span className="text-[10px] font-bold uppercase tracking-wider">Model Error</span>
            </div>
            <p className="text-[9px] text-neutral-400 uppercase tracking-wide leading-relaxed">
              {modelError.includes('JSON.parse') 
                ? 'Failed to parse file. Make sure your GLTF/GLB is valid. If this is an OBJ file, ensure its extension is exactly .obj.'
                : modelError}
            </p>
            <button 
              onClick={() => setModelError(null)}
              className="text-[9px] text-neutral-500 hover:text-white uppercase tracking-widest text-left mt-1 font-bold cursor-pointer transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
        <div className="absolute bottom-6 left-6 flex flex-col gap-3">
          {showResetConfirm && (
            <div className="hw-panel p-3 flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-left-2">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest text-center font-bold">Reset all?</span>
              <div className="flex gap-2">
                <button onClick={resetState} className="hw-button px-3 py-1.5 text-[10px] text-red-400 font-bold uppercase">Yes</button>
                <button onClick={() => setShowResetConfirm(false)} className="hw-button px-3 py-1.5 text-[10px] font-bold uppercase">No</button>
              </div>
            </div>
          )}
          <button 
            onClick={() => setShowResetConfirm(!showResetConfirm)} 
            className={`hw-button p-3 flex items-center justify-center ${showResetConfirm ? 'active active-accent' : ''}`} 
            title="Reset Settings"
          >
            <RotateCcw size={16} />
          </button>
          {hasCachedModel && (
            <button 
              onClick={clearCache} 
              className="hw-button p-3 flex items-center justify-center text-red-400" 
              title="Delete Local Cache"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button 
            onClick={() => {
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
            }} 
            className="hw-button p-3 flex items-center justify-center" 
            title="Frame Selection (F)"
          >
            <Target size={16} />
          </button>
          <button 
            onClick={() => {
              const newValue = !state.scene.normalizeMesh;
              updateState('scene', 'normalizeMesh', newValue);
              if (newValue) {
                // Wait for mesh to reposition, then frame
                setTimeout(() => {
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
                }, 100);
              }
            }} 
            className={`hw-button p-3 flex items-center justify-center ${state.scene.normalizeMesh ? 'active active-accent text-blue-400 font-bold' : ''}`} 
            title="Normalize Mesh (Center/Scale)"
          >
            <Maximize size={16} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="hw-button p-3 flex items-center justify-center" 
            title="Upload GLB/OBJ"
          >
            <Upload size={16} />
          </button>
        </div>

        {showUploadModal && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="hw-panel max-w-sm w-full p-8 flex flex-col gap-8 shadow-2xl border-white/5">
              <div className="space-y-2 text-center">
                <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-white">Import Configuration</h2>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest leading-relaxed">Choose how to process the meshes in <span className="text-blue-400">{pendingFile?.name}</span></p>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => confirmUpload('default')}
                  className="hw-button group flex flex-col items-center gap-4 p-6 transition-all hover:bg-white/[0.03]"
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <Package size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-white">Default Material</span>
                    <span className="block text-[8px] text-neutral-500 uppercase tracking-wider">Strip original data and use engine defaults</span>
                  </div>
                </button>

                <button 
                  onClick={() => confirmUpload('read')}
                  className="hw-button group flex flex-col items-center gap-4 p-6 transition-all hover:bg-white/[0.03]"
                >
                  <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                    <Wand2 size={20} />
                  </div>
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-white">Read Material Data</span>
                    <span className="block text-[8px] text-neutral-500 uppercase tracking-wider text-center">Attempt to translate GLTF/OBJ material nodes</span>
                  </div>
                </button>
              </div>

              <button 
                onClick={() => { setShowUploadModal(false); setPendingFile(null); }}
                className="text-[9px] text-neutral-600 uppercase tracking-widest hover:text-neutral-400 transition-colors"
              >
                Cancel Import
              </button>
            </div>
          </div>
        )}
      </main>
      <div className="w-[400px] h-full bg-[#262626] border-l border-[#111] flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.8)] z-10 overflow-hidden relative">
        <div className="flex p-3 gap-2 bg-[#222] border-b border-[#111]">
          <button onClick={() => setActiveTab('settings')} className={`hw-button flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'active active-accent' : ''}`}><Settings2 size={14} /><span className="text-[10px] font-medium uppercase tracking-widest">Props</span></button>
          <button onClick={() => setActiveTab('lights')} className={`hw-button flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'lights' ? 'active active-accent' : ''}`}><Lightbulb size={14} /><span className="text-[10px] font-medium uppercase tracking-widest">Lights</span></button>
          <button onClick={() => setActiveTab('effects')} className={`hw-button flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'effects' ? 'active active-accent' : ''}`}><Wand2 size={14} /><span className="text-[10px] font-medium uppercase tracking-widest">FX</span></button>
          <button onClick={() => setActiveTab('code')} className={`hw-button flex-1 py-3 flex items-center justify-center gap-2 ${activeTab === 'code' ? 'active active-accent' : ''}`}><Code size={14} /><span className="text-[10px] font-medium uppercase tracking-widest">Code</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'settings' && <Sidebar state={state} updateState={updateState} updateMaterial={updateMaterial} setSelectedMaterialId={(id) => setTopState('selectedMaterialId', id)} />}
          {activeTab === 'lights' && <LightsPanel lights={state.lights} onUpdateLights={handleUpdateLights} showHelpers={state.scene.showHelpers} onToggleHelpers={(v) => updateState('scene', 'showHelpers', v)} sceneAmbient={state.scene.ambientIntensity} onUpdateSceneAmbient={(v) => updateState('scene', 'ambientIntensity', v)} envPreset={state.scene.environmentPreset} onUpdateEnvPreset={(v) => updateState('scene', 'environmentPreset', v)} />}
          {activeTab === 'effects' && <EffectsPanel effects={state.effects} onUpdateEffect={updateEffect} />}
          {activeTab === 'code' && <CodePanel state={state} setState={setState} />}
        </div>
      </div>
    </div>
  );
}
