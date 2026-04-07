
import React, { useState, useCallback, useRef, Suspense, useTransition, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
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
import { Settings2, Code, Upload, Loader2, Package, Lightbulb, Wand2 } from 'lucide-react';
import { INITIAL_STATE, createDefaultMaterial } from './constants';
import { AppState, TabType, LightSettings, MaterialSettings } from './types';

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
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (customModel) URL.revokeObjectURL(customModel);
      const url = URL.createObjectURL(file);
      startTransition(() => {
        setCustomModel(url);
        setState(prev => ({ ...prev, scene: { ...prev.scene, modelType: 'custom' } }));
      });
    }
  };

  const onMaterialsDiscovered = useCallback((discoveredMaterials: string[]) => {
    setState(prev => {
      const newMaterials = { ...prev.materials };
      let firstId = prev.selectedMaterialId;
      discoveredMaterials.forEach((name, index) => {
        const id = `mat-${name || index}`;
        if (!newMaterials[id]) newMaterials[id] = createDefaultMaterial(id, name || `Material ${index + 1}`);
        if (index === 0 && (prev.selectedMaterialId === 'default-material' || !prev.materials[prev.selectedMaterialId])) firstId = id;
      });
      return { ...prev, materials: newMaterials, selectedMaterialId: firstId };
    });
  }, []);

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
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".glb,.gltf,.obj" />
      <main className="relative flex-1 bg-black">
        {isPending && <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 pointer-events-none"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>}
        <Canvas shadows={{ type: THREE.PCFSoftShadowMap }} dpr={[1, 2]} gl={{ antialias: isMaterialMode, alpha: false, stencil: false }}>
          <ColorComp attach="background" args={[state.scene.background]} />
          <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />
          <OrbitControls makeDefault autoRotate={state.scene.autoRotate} autoRotateSpeed={0.5} enableDamping />
          
          <AmbientLightComp intensity={state.scene.ambientIntensity} />
          {state.lights.map((light) => <DynamicLight key={light.id} light={light} globalShowHelpers={state.scene.showHelpers} />)}
          
          {/* Only render cost-heavy environment mapping in Material View */}
          {isMaterialMode && state.scene.environmentPreset !== 'none' && <Environment preset={state.scene.environmentPreset as any} />}
          
          <GroupComp position={[0, 0, 0]}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={state.scene.showPlane ? 0 : 0.5}>
              <Suspense fallback={null}>
                <SceneModel 
                  materials={state.materials} 
                  modelType={state.scene.modelType} 
                  customUrl={customModel} 
                  override={state.scene.overrideMaterials} 
                  viewMode={state.scene.viewMode} 
                  onMaterialsFound={onMaterialsDiscovered} 
                />
              </Suspense>
            </Float>
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
          {state.scene.gridHelper && state.scene.showPlane && <Grid position={[0, -0.995, 0]} args={[20, 20]} sectionColor="#cbd5e1" cellColor="#94a3b8" fadeDistance={25} infiniteGrid />}
          
          {isMaterialMode && activeEffects.length > 0 && (
            <EffectComposer multisampling={4}>
              {activeEffects}
            </EffectComposer>
          )}
          <BakeShadows />
        </Canvas>
        <div className="absolute top-6 left-6 pointer-events-none select-none">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">Three.js Master Control</h1>
          <p className="text-slate-500 text-[10px] tracking-[0.3em] uppercase mt-1 flex items-center gap-2"><Package size={10} /> {state.scene.modelType === 'custom' ? 'Complex Multi-Mesh Asset' : 'Internal Geometry'}</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-6 left-6 p-4 bg-blue-600 hover:bg-blue-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-110 active:scale-95 group cursor-pointer" title="Upload GLB/OBJ"><Upload size={24} className="text-white" /></button>
      </main>
      <div className="w-[440px] h-full bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl z-10 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'settings' ? 'text-blue-400 border-blue-500 bg-slate-800/30' : 'text-slate-50 border-transparent hover:text-slate-300'}`}><Settings2 size={16} /><span className="text-[11px] font-bold uppercase tracking-widest">Props</span></button>
          <button onClick={() => setActiveTab('lights')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'lights' ? 'text-amber-400 border-amber-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><Lightbulb size={16} /><span className="text-[11px] font-bold uppercase tracking-widest">Lights</span></button>
          <button onClick={() => setActiveTab('effects')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'effects' ? 'text-purple-400 border-purple-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><Wand2 size={16} /><span className="text-[11px] font-bold uppercase tracking-widest">FX</span></button>
          <button onClick={() => setActiveTab('code')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'code' ? 'text-emerald-400 border-emerald-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}><Code size={16} /><span className="text-[11px] font-bold uppercase tracking-widest">Code</span></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'settings' && <Sidebar state={state} updateState={updateState} updateMaterial={updateMaterial} setSelectedMaterialId={(id) => setTopState('selectedMaterialId', id)} />}
          {activeTab === 'lights' && <LightsPanel lights={state.lights} onUpdateLights={handleUpdateLights} showHelpers={state.scene.showHelpers} onToggleHelpers={(v) => updateState('scene', 'showHelpers', v)} sceneAmbient={state.scene.ambientIntensity} onUpdateSceneAmbient={(v) => updateState('scene', 'ambientIntensity', v)} envPreset={state.scene.environmentPreset} onUpdateEnvPreset={(v) => updateState('scene', 'environmentPreset', v)} />}
          {activeTab === 'effects' && <EffectsPanel effects={state.effects} onUpdateEffect={updateEffect} />}
          {activeTab === 'code' && <CodePanel state={state} />}
        </div>
      </div>
    </div>
  );
}
