
import React, { useState, useCallback, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Grid, 
  Environment,
  ContactShadows,
  Float,
  BakeShadows
} from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Settings2, Code, Upload, Loader2 } from 'lucide-react';
import { INITIAL_STATE } from './constants';
import { AppState, TabType } from './types';

// Sub-components
import Sidebar from './components/Sidebar';
import CodePanel from './components/CodePanel';
import SceneModel from './components/SceneModel';

// Fix for missing JSX intrinsic elements types
const AmbientLight = 'ambientLight' as any;
const DirectionalLight = 'directionalLight' as any;
const OrthographicCamera = 'orthographicCamera' as any;
const Group = 'group' as any;
const Mesh = 'mesh' as any;
const PlaneGeometry = 'planeGeometry' as any;
const MeshStandardMaterial = 'meshStandardMaterial' as any;
const Color = 'color' as any;

const LoadingSpinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/20 backdrop-blur-sm pointer-events-none z-50">
    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
  </div>
);

export default function App() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [customModel, setCustomModel] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateState = useCallback(<K extends keyof AppState, S extends keyof AppState[K]>(
    category: K,
    key: S,
    value: AppState[K][S]
  ) => {
    setState(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (customModel) URL.revokeObjectURL(customModel);
      const url = URL.createObjectURL(file);
      setCustomModel(url);
      updateState('scene', 'modelType', 'custom');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".glb,.gltf,.obj"
      />

      <main className="relative flex-1 bg-black">
        <Canvas 
          shadows={{ type: THREE.PCFSoftShadowMap }} 
          dpr={[1, 2]} 
          gl={{ antialias: true, alpha: false }}
        >
          <Color attach="background" args={[state.scene.background]} />
          
          <PerspectiveCamera makeDefault position={[4, 3, 4]} fov={50} />
          <OrbitControls 
            makeDefault 
            autoRotate={state.scene.autoRotate} 
            autoRotateSpeed={0.5} 
            enableDamping 
            target={[0, 0, 0]}
          />
          
          <AmbientLight intensity={state.scene.ambientIntensity} />
          <DirectionalLight 
            position={[5, 10, 5]} 
            intensity={1.5} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          >
            <OrthographicCamera attach="shadow-camera" args={[-10, 10, 10, -10, 0.5, 30]} />
          </DirectionalLight>
          
          <Environment preset="city" />

          <Group position={[0, 0, 0]}>
            <Float speed={1.5} rotationIntensity={0.2} floatIntensity={state.scene.showPlane ? 0 : 0.5}>
              <Suspense fallback={null}>
                <SceneModel 
                  settings={state.material} 
                  modelType={state.scene.modelType} 
                  customUrl={customModel} 
                  override={state.scene.overrideMaterials} 
                />
              </Suspense>
            </Float>
          </Group>

          {state.scene.showPlane && (
            <Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]} receiveShadow>
              <PlaneGeometry args={[100, 100]} />
              <MeshStandardMaterial 
                color={state.scene.planeColor} 
                roughness={state.scene.planeRoughness} 
                metalness={0.1} 
                transparent={state.scene.planeOpacity < 1}
                opacity={state.scene.planeOpacity}
              />
            </Mesh>
          )}

          {state.scene.contactShadows && (
            <ContactShadows 
              position={[0, -0.99, 0]} 
              opacity={state.scene.shadowOpacity} 
              scale={15} 
              blur={state.scene.shadowBlur} 
              far={3} 
            />
          )}

          {state.scene.gridHelper && state.scene.showPlane && (
            <Grid 
              position={[0, -0.995, 0]} 
              args={[20, 20]} 
              sectionColor="#cbd5e1" 
              cellColor="#94a3b8" 
              fadeDistance={25} 
              infiniteGrid
            />
          )}

          <EffectComposer multisampling={4}>
            {state.bloom.enabled && (
              <Bloom 
                luminanceThreshold={state.bloom.threshold} 
                mipmapBlur 
                intensity={state.bloom.intensity} 
                radius={state.bloom.radius} 
              />
            )}
          </EffectComposer>
          <BakeShadows />
        </Canvas>

        <div className="absolute top-6 left-6 pointer-events-none select-none">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400">
            Three.js Studio Pro
          </h1>
          <p className="text-slate-500 text-[10px] tracking-[0.3em] uppercase mt-1">
            {state.scene.modelType === 'custom' ? 'External Asset Live' : 'Internal Geometry'}
          </p>
        </div>

        <button 
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-6 left-6 p-4 bg-blue-600 hover:bg-blue-500 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all hover:scale-110 active:scale-95 group"
          title="Upload GLB/OBJ"
        >
          <Upload size={24} className="text-white" />
        </button>
      </main>

      <div className="w-[440px] h-full bg-slate-900/98 backdrop-blur-xl border-l border-slate-800 flex flex-col shadow-2xl z-10 overflow-hidden">
        <div className="flex border-b border-slate-800">
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-blue-400 border-blue-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            <Settings2 size={16} /> <span className="text-[11px] font-bold uppercase tracking-widest">Properties</span>
          </button>
          <button onClick={() => setActiveTab('code')} className={`flex-1 py-5 transition-all duration-200 border-b-2 flex items-center justify-center gap-2 ${activeTab === 'code' ? 'text-emerald-400 border-emerald-500 bg-slate-800/30' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
            <Code size={16} /> <span className="text-[11px] font-bold uppercase tracking-widest">Live Code</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {activeTab === 'settings' ? <Sidebar state={state} updateState={updateState} /> : <CodePanel state={state} />}
        </div>
      </div>
    </div>
  );
}
