
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
  <div className={`hw-panel p-4 mb-4 transition-all duration-300 ${isVisible === false ? 'opacity-50' : ''}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-neutral-400">
        <Icon size={12} className={isVisible === false ? 'text-neutral-600' : 'text-amber-500'} />
        <h3 className="text-[10px] font-bold uppercase tracking-widest">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
        {onToggleVisible && (
          <button 
            onClick={onToggleVisible} 
            className={`transition-colors cursor-pointer ${isVisible === false ? 'text-neutral-600 hover:text-blue-400' : 'text-blue-400 hover:text-blue-300'}`}
            title={isVisible === false ? "Enable Light" : "Disable Light"}
          >
            {isVisible === false ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="text-neutral-600 hover:text-red-400 transition-colors cursor-pointer" title="Delete Light">
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
    <div className="space-y-4">
      {children}
    </div>
  </div>
);

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: any) => (
  <div className="group">
    <div className="flex justify-between items-center mb-2">
      <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">{label}</label>
      <span className="text-[10px] font-mono text-neutral-400 hw-screen px-1.5 py-0.5 tabular-nums">{value ?? 0}{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value ?? 0}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-[#111] rounded-none appearance-none cursor-pointer accent-neutral-400"
    />
  </div>
);

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
        <div className={`absolute top-0.5 w-2.5 h-2.5 bg-neutral-400 transition-all ${safeValue ? 'left-4.5 bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.5)]' : 'left-0.5 bg-neutral-600'}`} />
      </button>
    </div>
  );
};

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
          <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">Scene Lights</h2>
          <p className="text-[9px] text-neutral-600 uppercase mt-1">Configure lighting layers</p>
        </div>
        <button 
          onClick={() => onToggleHelpers(!showHelpers)}
          className={`hw-button flex items-center gap-2 px-3 py-1.5 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
            showHelpers ? 'active active-accent' : ''
          }`}
        >
          {showHelpers ? <Eye size={12} /> : <EyeOff size={12} />}
          {showHelpers ? 'Helpers On' : 'Helpers Off'}
        </button>
      </div>

      <ControlGroup title="Global Scene Defaults" icon={Globe}>
        <div className="space-y-4">
          <Slider 
            label="Base Ambient Intensity" 
            value={sceneAmbient} 
            min={0} 
            max={2} 
            step={0.1} 
            onChange={onUpdateSceneAmbient} 
          />
          <div className="space-y-2">
            <label className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Environment Mapping</label>
            <div className="hw-grid-container grid grid-cols-4">
              {envPresets.map(p => (
                <button
                  key={p}
                  onClick={() => onUpdateEnvPreset(p)}
                  className={`hw-button hw-grid-item py-1.5 text-[8px] font-bold uppercase transition-all cursor-pointer ${
                    envPreset === p ? 'active active-accent' : ''
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
        <div className="h-px flex-1 bg-[#111]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Dynamic Lights</span>
        <div className="h-px flex-1 bg-[#111]" />
      </div>

      <div className="hw-grid-container grid grid-cols-3 mb-8">
        {(['directional', 'point', 'spot', 'hemisphere', 'rectArea', 'ambient', 'lightProbe'] as LightType[]).map(type => (
          <button
            key={type}
            onClick={() => addLight(type)}
            className="hw-button hw-grid-item flex flex-col items-center gap-2 p-3 transition-all group cursor-pointer"
          >
            <Plus size={14} className="text-neutral-500 group-hover:text-amber-400" />
            <span className="text-[8px] font-bold uppercase tracking-tighter text-neutral-400 group-hover:text-white truncate w-full text-center">{type}</span>
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
              <div className="space-y-4 pt-4 border-t border-[#111]">
                <label className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Position (X, Y, Z)</label>
                <div className="hw-grid-container grid grid-cols-3">
                  {[0, 1, 2].map(axis => (
                    <div key={axis} className="hw-grid-item flex flex-col gap-1 p-2">
                      <span className="text-[9px] text-neutral-600 font-mono text-center uppercase">{['x', 'y', 'z'][axis]}</span>
                      <input 
                        type="number"
                        value={light.position[axis] ?? 0}
                        onChange={(e) => {
                          const newPos = [...light.position] as [number, number, number];
                          newPos[axis] = parseFloat(e.target.value) || 0;
                          updateLight(light.id, { position: newPos });
                        }}
                        className="hw-input px-2 py-1 text-[10px] font-mono text-amber-500 text-center"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {light.type === 'rectArea' && (
                <div className="space-y-4 pt-4 border-t border-[#111]">
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
                <div className="space-y-3 pt-4 border-t border-[#111]">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers size={12} className="text-amber-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Shadow Configuration</span>
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
