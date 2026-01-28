
import React from 'react';
import { AppState, MaterialSettings, MaterialType, ModelType } from '../types';
import { Palette, Box, Layers, MousePointer2, Sparkles, Target, Grid3X3 } from 'lucide-react';
import { MATERIAL_PRESETS_DATA } from '../constants';

interface SidebarProps {
  state: AppState;
  updateState: <K extends keyof AppState, S extends keyof AppState[K]>(
    category: K,
    key: S,
    value: AppState[K][S]
  ) => void;
  updateMaterial: <S extends keyof MaterialSettings>(key: S, value: MaterialSettings[S]) => void;
  setSelectedMaterialId: (id: string) => void;
}

const ControlGroup = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
  <div className="mb-10 last:mb-0">
    <div className="flex items-center gap-2 mb-5 text-slate-300">
      <div className="p-1.5 bg-slate-800 rounded-lg">
        <Icon size={14} className="text-blue-400" />
      </div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
    </div>
    <div className="space-y-6">
      {children}
    </div>
  </div>
);

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: any) => (
  <div className="group">
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-[11px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">{label}</label>
      <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded tabular-nums">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex justify-between items-center">
    <label className="text-[11px] font-medium text-slate-400">{label}</label>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-slate-500 uppercase">{value}</span>
      <input 
        type="color" 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-5 h-5 rounded bg-transparent border-none cursor-pointer ring-1 ring-slate-700 overflow-hidden"
      />
    </div>
  </div>
);

const Toggle = ({ label, value, onChange }: any) => (
  <div className="flex justify-between items-center">
    <label className="text-[11px] font-medium text-slate-400">{label}</label>
    <button 
      onClick={() => onChange(!value)}
      className={`w-9 h-4.5 rounded-full transition-all relative cursor-pointer ${value ? 'bg-blue-600' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ state, updateState, updateMaterial, setSelectedMaterialId }) => {
  const activeMat = (state.materials[state.selectedMaterialId] || Object.values(state.materials)[0]) as MaterialSettings | undefined;

  const applyPreset = (presetData: any) => {
    Object.entries(presetData).forEach(([key, value]) => {
      updateMaterial(key as any, value as any);
    });
  };

  const materialTypes: MaterialType[] = ['basic', 'phong', 'lambert', 'standard', 'physical', 'toon', 'normal', 'depth', 'matcap'];
  const modelTypes: ModelType[] = ['icosahedron', 'sphere', 'box', 'torus', 'cylinder', 'cone', 'knot'];

  if (!activeMat) return <div className="text-slate-500 text-xs py-10 text-center">Initializing...</div>;

  const supportsColor = activeMat.type !== 'normal' && activeMat.type !== 'depth';
  const supportsEmissive = ['phong', 'lambert', 'standard', 'physical'].includes(activeMat.type);
  const supportsSpecular = activeMat.type === 'phong';
  const supportsPBR = ['standard', 'physical'].includes(activeMat.type);
  const supportsClearcoat = activeMat.type === 'physical';

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <ControlGroup title="Model Geometry" icon={Box}>
        <div className="grid grid-cols-4 gap-2">
          {modelTypes.map((type) => (
            <button
              key={type}
              onClick={() => updateState('scene', 'modelType', type)}
              className={`py-2 text-[8px] font-bold uppercase rounded-lg border transition-all cursor-pointer ${
                state.scene.modelType === type 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </ControlGroup>

      <div className="h-px bg-slate-800/50 my-8" />

      <ControlGroup title="Material Focus" icon={Target}>
        <div className="space-y-3">
          <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Select Sub-Material</label>
          <select 
            value={state.selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs py-2 px-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
          >
            {(Object.entries(state.materials) as [string, MaterialSettings][]).map(([id, mat]) => (
              <option key={id} value={id}>{mat.name}</option>
            ))}
          </select>
          <Toggle 
            label="Override GLTF materials" 
            value={state.scene.overrideMaterials} 
            onChange={(v: boolean) => updateState('scene', 'overrideMaterials', v)} 
          />
        </div>
      </ControlGroup>

      <div className="h-px bg-slate-800/50 my-8" />

      <ControlGroup title="Material Engine" icon={MousePointer2}>
        <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-lg mb-6">
          {materialTypes.map((t) => (
            <button
              key={t}
              onClick={() => updateMaterial('type', t)}
              className={`py-1.5 text-[8px] font-black uppercase rounded transition-all cursor-pointer ${
                activeMat.type === t ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(MATERIAL_PRESETS_DATA).map(([name, data]) => (
            <button
              key={name}
              onClick={() => applyPreset(data)}
              className="px-3 py-2 text-[9px] font-bold bg-slate-800 hover:bg-blue-600/20 border border-slate-700 hover:border-blue-500/50 rounded-lg transition-all text-slate-400 hover:text-white cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>
      </ControlGroup>

      <div className="h-px bg-slate-800/50 my-8" />

      <ControlGroup title="Visual Properties" icon={Palette}>
        {supportsColor && (
          <ColorPicker label="Base Color" value={activeMat.color} onChange={(v: string) => updateMaterial('color', v)} />
        )}
        
        {supportsEmissive && (
          <div className="space-y-6 pt-4 border-t border-slate-800/50">
            <ColorPicker label="Emissive" value={activeMat.emissive} onChange={(v: string) => updateMaterial('emissive', v)} />
            <Slider label="Emissive Intensity" value={activeMat.emissiveIntensity} min={0} max={100} step={1} onChange={(v: number) => updateMaterial('emissiveIntensity', v)} />
          </div>
        )}

        {supportsSpecular && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <h4 className="text-[9px] text-blue-400 uppercase font-black tracking-widest flex items-center gap-2">
               <Sparkles size={10} /> Phong Highlights
            </h4>
            <ColorPicker label="Specular Color" value={activeMat.specular} onChange={(v: string) => updateMaterial('specular', v)} />
            <Slider label="Shininess" value={activeMat.shininess} min={0} max={100} step={1} onChange={(v: number) => updateMaterial('shininess', v)} />
          </div>
        )}

        {supportsPBR && (
          <div className="space-y-6 pt-4 border-t border-slate-800">
            <Slider label="Metalness" value={activeMat.metalness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('metalness', v)} />
            <Slider label="Roughness" value={activeMat.roughness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('roughness', v)} />
            <Slider label="Env Map Intensity" value={activeMat.envMapIntensity} min={0} max={5} step={0.1} onChange={(v: number) => updateMaterial('envMapIntensity', v)} />
          </div>
        )}

        <div className="pt-4 border-t border-slate-800 space-y-6">
          <Slider label="Opacity (Alpha)" value={activeMat.opacity} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('opacity', v)} />
          <Toggle label="Wireframe" value={activeMat.wireframe} onChange={(v: boolean) => updateMaterial('wireframe', v)} />
        </div>
      </ControlGroup>

      {supportsClearcoat && (
        <>
          <div className="h-px bg-slate-800/50 my-8" />
          <ControlGroup title="Clearcoat & Transmission" icon={Layers}>
            <Slider label="Clearcoat" value={activeMat.clearcoat} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('clearcoat', v)} />
            <Slider label="Clearcoat Roughness" value={activeMat.clearcoatRoughness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('clearcoatRoughness', v)} />
            <Slider label="Transmission" value={activeMat.transmission} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('transmission', v)} />
            <Slider label="Thickness" value={activeMat.thickness} min={0} max={5} step={0.1} onChange={(v: number) => updateMaterial('thickness', v)} />
            <Slider label="IOR" value={activeMat.ior} min={1} max={2.3} step={0.01} onChange={(v: number) => updateMaterial('ior', v)} />
          </ControlGroup>
        </>
      )}

      <div className="h-px bg-slate-800/50 my-8" />

      <ControlGroup title="Scene & Environment" icon={Grid3X3}>
        <Toggle label="Show Floor Plane" value={state.scene.showPlane} onChange={(v: boolean) => updateState('scene', 'showPlane', v)} />
        {state.scene.showPlane && (
          <div className="space-y-6 pt-4 border-t border-slate-800/50">
            <ColorPicker label="Floor Color" value={state.scene.planeColor} onChange={(v: string) => updateState('scene', 'planeColor', v)} />
            <Slider label="Floor Roughness" value={state.scene.planeRoughness} min={0} max={1} step={0.01} onChange={(v: number) => updateState('scene', 'planeRoughness', v)} />
            <Slider label="Floor Opacity" value={state.scene.planeOpacity} min={0} max={1} step={0.01} onChange={(v: number) => updateState('scene', 'planeOpacity', v)} />
            <Toggle label="Show Grid" value={state.scene.gridHelper} onChange={(v: boolean) => updateState('scene', 'gridHelper', v)} />
          </div>
        )}
        <div className="pt-4 border-t border-slate-800/50 space-y-6">
          <ColorPicker label="Background" value={state.scene.background} onChange={(v: string) => updateState('scene', 'background', v)} />
          <Toggle label="Auto-Rotate" value={state.scene.autoRotate} onChange={(v: boolean) => updateState('scene', 'autoRotate', v)} />
        </div>
      </ControlGroup>
    </div>
  );
};

export default Sidebar;
