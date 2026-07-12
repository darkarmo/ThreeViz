
import React from 'react';
import { AppState, MaterialSettings, MaterialType, ModelType, ViewMode } from '../types';
import { Palette, Box, Layers, MousePointer2, Sparkles, Target, Grid3X3, Eye, Move } from 'lucide-react';
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
  <div className="hw-panel p-4 mb-4">
    <div className="flex items-center gap-2 mb-4 text-neutral-400">
      <Icon size={12} className="text-neutral-500" />
      <h3 className="text-[10px] font-bold uppercase tracking-widest">{title}</h3>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: any) => {
  const safeValue = value ?? 0;
  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
        <div className="flex items-center">
          <input 
            type="number" 
            value={Number(safeValue).toString()} 
            step={step}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            className="w-16 bg-transparent text-right text-[10px] font-mono text-neutral-400 hw-screen px-1.5 py-0.5 tabular-nums outline-none focus:text-blue-400"
          />
          {unit && <span className="text-[10px] font-mono text-neutral-400 ml-1">{unit}</span>}
        </div>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={safeValue}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-[#111] rounded-none appearance-none cursor-pointer accent-neutral-400"
      />
    </div>
  );
};

const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex justify-between items-center">
    <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-neutral-500 uppercase">{value ?? '#000000'}</span>
      <input 
        type="color" 
        value={value ?? '#000000'}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer hw-screen"
      />
    </div>
  </div>
);

const Toggle = ({ label, value, onChange }: any) => {
  const safeValue = !!value;
  return (
    <div className="flex justify-between items-center">
      <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
      <button 
        onClick={() => onChange(!safeValue)}
        className={`w-8 h-4 rounded-none transition-all relative cursor-pointer border border-[#111] ${safeValue ? 'bg-[#333] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]' : 'bg-[#1a1a1a] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.8)]'}`}
      >
        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-neutral-400 transition-all ${safeValue ? 'left-4.5 bg-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]' : 'left-0.5 bg-neutral-600'}`} />
      </button>
    </div>
  );
};

const TextureInput = ({ label, value, onChange }: any) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // Tag videos so SceneModel knows how to load them even from blobs
      const isVideoFile = file.type.startsWith('video/') || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
      const taggedUrl = isVideoFile ? `${url}#video` : url;
      onChange(taggedUrl);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
        {value && (
          <button 
            onClick={() => onChange(undefined)}
            className="text-[9px] text-red-500 hover:text-red-400 uppercase tracking-wider cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <input 
          type="text" 
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Image URL..."
          className="flex-1 hw-input text-[10px] py-1.5 px-2"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="hw-button px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
        >
          Upload
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*,video/*" 
          className="hidden" 
        />
      </div>
      {value && (
        <div className="mt-2 h-16 w-full hw-screen rounded overflow-hidden relative">
          {value.includes('#video') || /\.(mp4|webm|ogg|mov)$/i.test(value) ? (
            <video src={value.split('#')[0]} className="w-full h-full object-cover opacity-50" autoPlay muted loop playsInline />
          ) : (
            <img src={value} alt={label} className="w-full h-full object-cover opacity-50" />
          )}
        </div>
      )}
    </div>
  );
};

const Vector2Slider = ({ label, value, min, max, step, onChange }: any) => {
  const safeValue = value || [1, 1];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="flex justify-between items-center text-[9px] text-neutral-500 mb-1">
            <span>X</span>
            <input 
              type="number" 
              value={Number(safeValue[0]).toString()} 
              step={step}
              onChange={e => onChange([parseFloat(e.target.value) || 0, safeValue[1]])}
              className="w-12 bg-transparent text-right font-mono outline-none focus:text-blue-400"
            />
          </div>
          <input type="range" min={min} max={max} step={step} value={safeValue[0]} onChange={e => onChange([parseFloat(e.target.value), safeValue[1]])} className="w-full h-1 bg-[#111] rounded-none appearance-none cursor-pointer accent-neutral-400" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center text-[9px] text-neutral-500 mb-1">
            <span>Y</span>
            <input 
              type="number" 
              value={Number(safeValue[1]).toString()} 
              step={step}
              onChange={e => onChange([safeValue[0], parseFloat(e.target.value) || 0])}
              className="w-12 bg-transparent text-right font-mono outline-none focus:text-blue-400"
            />
          </div>
          <input type="range" min={min} max={max} step={step} value={safeValue[1]} onChange={e => onChange([safeValue[0], parseFloat(e.target.value)])} className="w-full h-1 bg-[#111] rounded-none appearance-none cursor-pointer accent-neutral-400" />
        </div>
      </div>
    </div>
  );
};

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
      
      <ControlGroup title="Viewport Options" icon={Eye}>
        <div className="hw-grid-container flex">
          {(['material', 'wireframe'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => updateState('scene', 'viewMode', mode)}
              className={`hw-button hw-grid-item flex-1 py-2 text-[9px] font-bold uppercase transition-all cursor-pointer ${
                state.scene.viewMode === mode 
                ? 'active active-accent' 
                : ''
              }`}
            >
              {mode === 'material' ? 'Material View' : 'Wireframe View'}
            </button>
          ))}
        </div>
        <div className="px-2">
          <p className="text-[9px] text-neutral-600 uppercase leading-relaxed text-center mt-2">
            {state.scene.viewMode === 'wireframe' 
              ? 'Preview Mode: Post-processing and heavy scene calculations are bypassed for maximum performance.' 
              : 'Production Mode: Full fidelity active.'}
          </p>
        </div>
      </ControlGroup>

      <div className="h-px bg-[#111] my-6" />

      <ControlGroup title="Model Geometry" icon={Box}>
        <div className="hw-grid-container grid grid-cols-4">
          {modelTypes.map((type) => (
            <button
              key={type}
              onClick={() => updateState('scene', 'modelType', type)}
              className={`hw-button hw-grid-item py-2 text-[8px] font-bold uppercase transition-all cursor-pointer ${
                state.scene.modelType === type 
                ? 'active active-accent' 
                : ''
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {state.scene.modelType === 'custom' && (
          <div className="mt-4 pt-4 border-t border-[#111]">
            <Toggle 
              label="Normalize (Center & Scale)" 
              value={state.scene.normalizeMesh} 
              onChange={(v: boolean) => updateState('scene', 'normalizeMesh', v)} 
            />
          </div>
        )}
      </ControlGroup>

      <div className="h-px bg-[#111] my-6" />

      {state.scene.viewMode === 'material' && (
        <div className="animate-in fade-in duration-300">
          <ControlGroup title="Material Focus" icon={Target}>
            <div className="space-y-4">
              <label className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Select Sub-Material</label>
              <select 
                value={state.selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full hw-input text-xs py-2 px-3 focus:ring-0 cursor-pointer"
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

          <div className="h-px bg-[#111] my-6" />

          <ControlGroup title="Material Engine" icon={MousePointer2}>
            <div className="hw-grid-container grid grid-cols-3 mb-6">
              {materialTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => updateMaterial('type', t)}
                  className={`hw-button hw-grid-item py-1.5 text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    activeMat.type === t ? 'active active-accent' : ''
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="hw-grid-container grid grid-cols-2">
              {Object.entries(MATERIAL_PRESETS_DATA).map(([name, data]) => (
                <button
                  key={name}
                  onClick={() => applyPreset(data)}
                  className="hw-button hw-grid-item px-3 py-2 text-[9px] font-bold transition-all cursor-pointer"
                >
                  {name}
                </button>
              ))}
            </div>
          </ControlGroup>

          <div className="h-px bg-[#111] my-6" />

          <ControlGroup title="Visual Properties" icon={Palette}>
            {supportsColor && (
              <ColorPicker label="Base Color" value={activeMat.color} onChange={(v: string) => updateMaterial('color', v)} />
            )}
            
            {supportsEmissive && (
              <div className="space-y-4 pt-4 border-t border-[#111]">
                <ColorPicker label="Emissive" value={activeMat.emissive} onChange={(v: string) => updateMaterial('emissive', v)} />
                <Slider label="Emissive Intensity" value={activeMat.emissiveIntensity} min={0} max={100} step={1} onChange={(v: number) => updateMaterial('emissiveIntensity', v)} />
              </div>
            )}

            {supportsSpecular && (
              <div className="space-y-4 pt-4 border-t border-[#111]">
                <h4 className="text-[9px] text-blue-400 uppercase font-black tracking-widest flex items-center gap-2">
                   <Sparkles size={10} /> Phong Highlights
                </h4>
                <ColorPicker label="Specular Color" value={activeMat.specular} onChange={(v: string) => updateMaterial('specular', v)} />
                <Slider label="Shininess" value={activeMat.shininess} min={0} max={100} step={1} onChange={(v: number) => updateMaterial('shininess', v)} />
              </div>
            )}

            {supportsPBR && (
              <div className="space-y-4 pt-4 border-t border-[#111]">
                <Slider label="Metalness" value={activeMat.metalness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('metalness', v)} />
                <Slider label="Roughness" value={activeMat.roughness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('roughness', v)} />
                <Slider label="Env Map Intensity" value={activeMat.envMapIntensity} min={0} max={5} step={0.1} onChange={(v: number) => updateMaterial('envMapIntensity', v)} />
              </div>
            )}

            <div className="pt-4 border-t border-[#111] space-y-4">
              <Slider label="Opacity (Alpha)" value={activeMat.opacity} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('opacity', v)} />
              <Toggle label="Wireframe" value={activeMat.wireframe} onChange={(v: boolean) => updateMaterial('wireframe', v)} />
            </div>
          </ControlGroup>

          <div className="h-px bg-[#111] my-6" />

          <ControlGroup title="Texture Maps" icon={Layers}>
            <div className="space-y-6">
              <TextureInput label="Color Map (Diffuse)" value={activeMat.map} onChange={(v: string | undefined) => updateMaterial('map', v)} />
              <div className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded">
                <Toggle label="Video Preset Optimization" value={activeMat.useVideoMaterial || false} onChange={(v: boolean) => updateMaterial('useVideoMaterial', v)} />
              </div>
              <TextureInput label="Normal Map" value={activeMat.normalMap} onChange={(v: string | undefined) => updateMaterial('normalMap', v)} />
              {supportsPBR && (
                <>
                  <TextureInput label="Roughness Map" value={activeMat.roughnessMap} onChange={(v: string | undefined) => updateMaterial('roughnessMap', v)} />
                  <TextureInput label="Metalness Map" value={activeMat.metalnessMap} onChange={(v: string | undefined) => updateMaterial('metalnessMap', v)} />
                </>
              )}
            </div>
          </ControlGroup>

          <div className="h-px bg-[#111] my-6" />

          <ControlGroup title="UV Mapping" icon={Grid3X3}>
            <div className="space-y-4">
              <Vector2Slider label="Repeat (Tiling)" value={activeMat.uvRepeat || [1, 1]} min={0.1} max={20} step={0.1} onChange={(v: [number, number]) => updateMaterial('uvRepeat', v)} />
              <Vector2Slider label="Offset" value={activeMat.uvOffset || [0, 0]} min={-2} max={2} step={0.01} onChange={(v: [number, number]) => updateMaterial('uvOffset', v)} />
              <Slider label="Rotation" value={activeMat.uvRotation || 0} min={0} max={Math.PI * 2} step={0.01} onChange={(v: number) => updateMaterial('uvRotation', v)} />
              <div className="pt-2 border-t border-[#111] space-y-3">
                <Toggle label="Mirror Repeat X" value={activeMat.uvMirrorX || false} onChange={(v: boolean) => updateMaterial('uvMirrorX', v)} />
                <Toggle label="Mirror Repeat Y" value={activeMat.uvMirrorY || false} onChange={(v: boolean) => updateMaterial('uvMirrorY', v)} />
              </div>
            </div>
          </ControlGroup>

          {supportsClearcoat && (
            <>
              <div className="h-px bg-[#111] my-6" />
              <ControlGroup title="Clearcoat & Transmission" icon={Layers}>
                <Slider label="Clearcoat" value={activeMat.clearcoat} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('clearcoat', v)} />
                <Slider label="Clearcoat Roughness" value={activeMat.clearcoatRoughness} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('clearcoatRoughness', v)} />
                <Slider label="Transmission" value={activeMat.transmission} min={0} max={1} step={0.01} onChange={(v: number) => updateMaterial('transmission', v)} />
                <Slider label="Thickness" value={activeMat.thickness} min={0} max={5} step={0.1} onChange={(v: number) => updateMaterial('thickness', v)} />
                <Slider label="IOR" value={activeMat.ior} min={1} max={2.3} step={0.01} onChange={(v: number) => updateMaterial('ior', v)} />
              </ControlGroup>
            </>
          )}

          <div className="h-px bg-[#111] my-6" />
        </div>
      )}

      <div className="h-px bg-[#111] my-6" />

      <ControlGroup title="Navigation" icon={Move}>
        <div className="space-y-4">
          <Toggle 
            label="Auto Depth (Focus)" 
            value={state.scene.autoDepth} 
            onChange={(v: boolean) => updateState('scene', 'autoDepth', v)} 
          />
          <Toggle 
            label="Screen Space Panning" 
            value={state.scene.screenSpacePanning} 
            onChange={(v: boolean) => updateState('scene', 'screenSpacePanning', v)} 
          />
          <Slider 
            label="Zoom Speed" 
            value={state.scene.zoomSpeed} 
            min={0.1} 
            max={5} 
            step={0.1} 
            onChange={(v: number) => updateState('scene', 'zoomSpeed', v)} 
          />
        </div>
      </ControlGroup>

      <div className="h-px bg-[#111] my-6" />

      <ControlGroup title="Scene & Environment" icon={Grid3X3}>
        <Toggle label="Show Floor Plane" value={state.scene.showPlane} onChange={(v: boolean) => updateState('scene', 'showPlane', v)} />
        {state.scene.showPlane && (
          <div className="space-y-4 pt-4 border-t border-[#111]">
            <ColorPicker label="Floor Color" value={state.scene.planeColor} onChange={(v: string) => updateState('scene', 'planeColor', v)} />
            <Slider label="Floor Roughness" value={state.scene.planeRoughness} min={0} max={1} step={0.01} onChange={(v: number) => updateState('scene', 'planeRoughness', v)} />
            <Slider label="Floor Opacity" value={state.scene.planeOpacity} min={0} max={1} step={0.01} onChange={(v: number) => updateState('scene', 'planeOpacity', v)} />
            <Toggle label="Show Grid" value={state.scene.gridHelper} onChange={(v: boolean) => updateState('scene', 'gridHelper', v)} />
          </div>
        )}
        <div className="pt-4 border-t border-[#111] space-y-4">
          <ColorPicker label="Background" value={state.scene.background} onChange={(v: string) => updateState('scene', 'background', v)} />
          <Toggle label="Auto-Rotate" value={state.scene.autoRotate} onChange={(v: boolean) => updateState('scene', 'autoRotate', v)} />
        </div>
      </ControlGroup>
    </div>
  );
};

export default Sidebar;
