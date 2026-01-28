
import React from 'react';
import { LightSettings, LightType } from '../types';
import { Lightbulb, Trash2, Plus, Eye, EyeOff, Globe, Sun, Layers } from 'lucide-react';

interface LightsPanelProps {
  lights: LightSettings[];
  onUpdateLights: (lights: LightSettings[]) => void;
  showHelpers: boolean;
  onToggleHelpers: (v: boolean) => void;
  sceneAmbient: number;
  onUpdateSceneAmbient: (v: number) => void;
  envPreset: string;
  onUpdateEnvPreset: (v: string) => void;
}

const ControlGroup: React.FC<React.PropsWithChildren<{ title: string, icon: any, onRemove?: () => void, isVisible?: boolean, onToggleVisible?: () => void }>> = ({ title, icon: Icon, children, onRemove, isVisible, onToggleVisible }) => (
  <div className={`mb-8 p-4 rounded-xl border transition-all duration-300 ${isVisible === false ? 'bg-slate-900/40 border-slate-900 opacity-60' : 'bg-slate-800/20 border-slate-800/50'}`}>
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2 text-slate-300">
        <div className={`p-1.5 rounded-lg transition-colors ${isVisible === false ? 'bg-slate-900 text-slate-600' : 'bg-slate-800 text-amber-400'}`}>
          <Icon size={14} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
        {onToggleVisible && (
          <button 
            onClick={onToggleVisible} 
            className={`transition-colors cursor-pointer ${isVisible === false ? 'text-slate-600 hover:text-blue-400' : 'text-blue-400 hover:text-blue-300'}`}
            title={isVisible === false ? "Enable Light" : "Disable Light"}
          >
            {isVisible === false ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="text-slate-600 hover:text-red-400 transition-colors cursor-pointer" title="Delete Light">
            <Trash2 size={14} />
          </button>
        )}
      </div>
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
      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded tabular-nums">{value}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
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
      className={`w-9 h-4.5 rounded-full transition-all relative cursor-pointer ${value ? 'bg-amber-600' : 'bg-slate-800'}`}
    >
      <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-all shadow-sm ${value ? 'left-5' : 'left-0.5'}`} />
    </button>
  </div>
);

const LightsPanel: React.FC<LightsPanelProps> = ({ 
  lights, 
  onUpdateLights, 
  showHelpers, 
  onToggleHelpers,
  sceneAmbient,
  onUpdateSceneAmbient,
  envPreset,
  onUpdateEnvPreset
}) => {
  const addLight = (type: LightType) => {
    const newLight: LightSettings = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      color: '#ffffff',
      groundColor: type === 'hemisphere' ? '#3b82f6' : undefined,
      intensity: 1,
      position: [5, 5, 5],
      rotation: type === 'rectArea' ? [0, 0, 0] : undefined,
      width: type === 'rectArea' ? 4 : undefined,
      height: type === 'rectArea' ? 4 : undefined,
      castShadow: !['ambient', 'hemisphere', 'rectArea', 'lightProbe'].includes(type),
      visible: true,
      showShadowHelper: false
    };
    onUpdateLights([...lights, newLight]);
  };

  const removeLight = (id: string) => {
    onUpdateLights(lights.filter(l => l.id !== id));
  };

  const updateLight = (id: string, updates: Partial<LightSettings>) => {
    onUpdateLights(lights.map(l => l.id === id ? { ...l, ...updates } : l));
  };

  const envPresets = ['none', 'city', 'apartment', 'lobby', 'night', 'studio', 'warehouse', 'forest'];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Scene Lights</h2>
          <p className="text-[9px] text-slate-600 uppercase mt-1">Configure lighting layers</p>
        </div>
        <button 
          onClick={() => onToggleHelpers(!showHelpers)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
            showHelpers ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'bg-slate-800 border-slate-700 text-slate-500'
          }`}
        >
          {showHelpers ? <Eye size={12} /> : <EyeOff size={12} />}
          {showHelpers ? 'Helpers On' : 'Helpers Off'}
        </button>
      </div>

      <ControlGroup title="Global Scene Defaults" icon={Globe}>
        <div className="space-y-6">
          <Slider 
            label="Base Ambient Intensity" 
            value={sceneAmbient} 
            min={0} 
            max={2} 
            step={0.1} 
            onChange={onUpdateSceneAmbient} 
          />
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-slate-400">Environment Mapping</label>
            <div className="grid grid-cols-4 gap-1">
              {envPresets.map(p => (
                <button
                  key={p}
                  onClick={() => onUpdateEnvPreset(p)}
                  className={`py-1 text-[8px] font-bold uppercase rounded border transition-all cursor-pointer ${
                    envPreset === p ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ControlGroup>

      <div className="flex items-center gap-4 my-8">
        <div className="h-px flex-1 bg-slate-800" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Dynamic Lights</span>
        <div className="h-px flex-1 bg-slate-800" />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-8">
        {(['directional', 'point', 'spot', 'hemisphere', 'rectArea', 'ambient', 'lightProbe'] as LightType[]).map(type => (
          <button
            key={type}
            onClick={() => addLight(type)}
            className="flex flex-col items-center gap-2 p-3 bg-slate-800 hover:bg-amber-600/20 border border-slate-700 hover:border-amber-500/50 rounded-xl transition-all group cursor-pointer"
          >
            <Plus size={14} className="text-slate-500 group-hover:text-amber-400" />
            <span className="text-[8px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-white truncate w-full text-center">{type}</span>
          </button>
        ))}
      </div>

      {lights.map((light) => (
        <ControlGroup 
          key={light.id} 
          title={`${light.type} Light`} 
          icon={Lightbulb}
          onRemove={() => removeLight(light.id)}
          isVisible={light.visible}
          onToggleVisible={() => updateLight(light.id, { visible: !light.visible })}
        >
          <div className="space-y-4">
            <ColorPicker 
              label={light.type === 'hemisphere' ? "Sky Color" : "Light Color"} 
              value={light.color} 
              onChange={(color: string) => updateLight(light.id, { color })} 
            />
            {light.type === 'hemisphere' && (
               <ColorPicker 
                label="Ground Color" 
                value={light.groundColor || '#000000'} 
                onChange={(groundColor: string) => updateLight(light.id, { groundColor })} 
              />
            )}
            <Slider 
              label="Intensity" 
              value={light.intensity} 
              min={0} 
              max={20} 
              step={0.1} 
              onChange={(intensity: number) => updateLight(light.id, { intensity })} 
            />
          </div>
          
          {light.type !== 'ambient' && (
            <>
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Position (X, Y, Z)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map(axis => (
                    <div key={axis} className="flex flex-col gap-1">
                      <span className="text-[9px] text-slate-600 font-mono text-center uppercase">{['x', 'y', 'z'][axis]}</span>
                      <input 
                        type="number"
                        value={light.position[axis]}
                        onChange={(e) => {
                          const newPos = [...light.position] as [number, number, number];
                          newPos[axis] = parseFloat(e.target.value) || 0;
                          updateLight(light.id, { position: newPos });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] font-mono text-amber-400 text-center focus:outline-none focus:border-amber-500/50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {light.type === 'rectArea' && (
                <div className="space-y-4 pt-4 border-t border-slate-800/50">
                   <Slider 
                    label="Width" 
                    value={light.width || 4} 
                    min={0.1} 
                    max={20} 
                    step={0.1} 
                    onChange={(width: number) => updateLight(light.id, { width })} 
                  />
                  <Slider 
                    label="Height" 
                    value={light.height || 4} 
                    min={0.1} 
                    max={20} 
                    step={0.1} 
                    onChange={(height: number) => updateLight(light.id, { height })} 
                  />
                </div>
              )}

              {light.castShadow && (
                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={12} className="text-amber-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shadow Configuration</span>
                  </div>
                  <Toggle 
                    label="Shadow Mapping" 
                    value={light.castShadow} 
                    onChange={(castShadow: boolean) => updateLight(light.id, { castShadow })} 
                  />
                  <Toggle 
                    label="Show Shadow Volume Frustum" 
                    value={light.showShadowHelper || false} 
                    onChange={(v: boolean) => updateLight(light.id, { showShadowHelper: v })} 
                  />
                </div>
              )}
            </>
          )}
        </ControlGroup>
      ))}
    </div>
  );
};

export default LightsPanel;
