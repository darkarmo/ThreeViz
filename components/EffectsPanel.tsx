
import React, { useState } from 'react';
import { AppState } from '../types';
import { Wand2, ChevronDown, ChevronUp, Zap, Radio, Grid3X3, Camera, Layers, Eye } from 'lucide-react';

interface EffectsPanelProps {
  effects: AppState['effects'];
  onUpdateEffect: (effect: keyof AppState['effects'], prop: string, value: any) => void;
}

const ControlGroup = ({ title, icon: Icon, enabled, onToggle, children }: any) => {
  const [isExpanded, setIsExpanded] = useState(enabled);
  return (
    <div className={`mb-4 rounded-xl border transition-all duration-300 ${enabled ? 'bg-slate-800/40 border-purple-500/50 shadow-lg shadow-purple-500/5' : 'bg-slate-900/40 border-slate-800 opacity-70'}`}>
      <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg transition-colors ${enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
            <Icon size={14} />
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">{title}</h3>
        </div>
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onToggle} 
            className={`w-8 h-4 rounded-full transition-all relative cursor-pointer ${enabled ? 'bg-purple-600' : 'bg-slate-800'}`}
          >
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${enabled ? 'left-4.5' : 'left-0.5'}`} />
          </button>
          <div className="text-slate-600">
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 pt-0 space-y-5 animate-in slide-in-from-top-2 duration-300">
          <div className="h-px bg-slate-800/50 mb-4" />
          {children}
        </div>
      )}
    </div>
  );
};

const Slider = ({ label, value, min, max, step, onChange, unit = "" }: any) => (
  <div className="group">
    <div className="flex justify-between items-center mb-1.5">
      <label className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">{label}</label>
      <span className="text-[10px] font-mono text-purple-400 tabular-nums">{Array.isArray(value) ? `${value[0].toFixed(2)}, ${value[1].toFixed(2)}` : `${value}${unit}`}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={Array.isArray(value) ? value[0] : value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
    />
  </div>
);

const ColorPicker = ({ label, value, onChange }: any) => (
  <div className="flex justify-between items-center">
    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
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

export default function EffectsPanel({ effects, onUpdateEffect }: EffectsPanelProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Post-Processing</h2>
          <p className="text-[9px] text-slate-600 uppercase mt-1">Enhance visual fidelity</p>
        </div>
        <Wand2 size={16} className="text-purple-500 opacity-50" />
      </div>

      <ControlGroup title="Bloom" icon={Zap} enabled={effects.bloom.enabled} onToggle={() => onUpdateEffect('bloom', 'enabled', !effects.bloom.enabled)}>
        <Slider label="Intensity" value={effects.bloom.intensity} min={0} max={10} step={0.1} onChange={(v: any) => onUpdateEffect('bloom', 'intensity', v)} />
        <Slider label="Threshold" value={effects.bloom.threshold} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('bloom', 'threshold', v)} />
        <Slider label="Radius" value={effects.bloom.radius} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('bloom', 'radius', v)} />
      </ControlGroup>

      <ControlGroup title="Depth of Field" icon={Camera} enabled={effects.depthOfField.enabled} onToggle={() => onUpdateEffect('depthOfField', 'enabled', !effects.depthOfField.enabled)}>
        <Slider label="Focus Dist" value={effects.depthOfField.focusDistance} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('depthOfField', 'focusDistance', v)} />
        <Slider label="Focal Length" value={effects.depthOfField.focalLength} min={0} max={0.1} step={0.001} onChange={(v: any) => onUpdateEffect('depthOfField', 'focalLength', v)} />
        <Slider label="Bokeh Scale" value={effects.depthOfField.bokehScale} min={0} max={10} step={0.1} onChange={(v: any) => onUpdateEffect('depthOfField', 'bokehScale', v)} />
      </ControlGroup>

      <ControlGroup title="Dot Screen" icon={Grid3X3} enabled={effects.dotScreen.enabled} onToggle={() => onUpdateEffect('dotScreen', 'enabled', !effects.dotScreen.enabled)}>
        <Slider label="Angle" value={effects.dotScreen.angle} min={0} max={Math.PI} step={0.01} onChange={(v: any) => onUpdateEffect('dotScreen', 'angle', v)} />
        <Slider label="Scale" value={effects.dotScreen.scale} min={0.1} max={5} step={0.1} onChange={(v: any) => onUpdateEffect('dotScreen', 'scale', v)} />
      </ControlGroup>

      <ControlGroup title="Pixelation" icon={Layers} enabled={effects.pixelation.enabled} onToggle={() => onUpdateEffect('pixelation', 'enabled', !effects.pixelation.enabled)}>
        <Slider label="Granularity" value={effects.pixelation.granularity} min={1} max={100} step={1} onChange={(v: any) => onUpdateEffect('pixelation', 'granularity', v)} />
      </ControlGroup>

      <ControlGroup title="Glitch" icon={Zap} enabled={effects.glitch.enabled} onToggle={() => onUpdateEffect('glitch', 'enabled', !effects.glitch.enabled)}>
        <p className="text-[9px] text-slate-500 uppercase leading-relaxed mb-4">Random digital distortion and chromatic fringing.</p>
        <Slider label="Duration" value={effects.glitch.duration[0]} min={0.1} max={5} step={0.1} onChange={(v: any) => onUpdateEffect('glitch', 'duration', [v, v + 0.5])} />
      </ControlGroup>

      <ControlGroup title="Scanline & Film" icon={Camera} enabled={effects.noise.enabled || effects.scanline.enabled} onToggle={() => onUpdateEffect('scanline', 'enabled', !effects.scanline.enabled)}>
        <Slider label="Scanline Density" value={effects.scanline.density} min={0} max={5} step={0.1} onChange={(v: any) => onUpdateEffect('scanline', 'density', v)} />
        <Slider label="Scanline Opacity" value={effects.scanline.opacity} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('scanline', 'opacity', v)} />
        <Slider label="Grain Opacity" value={effects.noise.opacity} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('noise', 'opacity', v)} />
        <Slider label="Vignette Offset" value={effects.vignette.offset} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('vignette', 'offset', v)} />
        <Slider label="Vignette Dark" value={effects.vignette.darkness} min={0} max={1} step={0.01} onChange={(v: any) => onUpdateEffect('vignette', 'darkness', v)} />
      </ControlGroup>

      <ControlGroup title="Antialiasing" icon={Layers} enabled={effects.smaa.enabled || effects.fxaa.enabled} onToggle={() => onUpdateEffect('smaa', 'enabled', !effects.smaa.enabled)}>
        <div className="flex gap-4">
          <button onClick={() => {onUpdateEffect('smaa', 'enabled', true); onUpdateEffect('fxaa', 'enabled', false);}} className={`flex-1 py-2 text-[8px] font-black uppercase rounded border transition-all ${effects.smaa.enabled ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>SMAA</button>
          <button onClick={() => {onUpdateEffect('fxaa', 'enabled', true); onUpdateEffect('smaa', 'enabled', false);}} className={`flex-1 py-2 text-[8px] font-black uppercase rounded border transition-all ${effects.fxaa.enabled ? 'bg-purple-600 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>FXAA</button>
        </div>
      </ControlGroup>

      <ControlGroup title="Outline" icon={Layers} enabled={effects.outline.enabled} onToggle={() => onUpdateEffect('outline', 'enabled', !effects.outline.enabled)}>
        <ColorPicker label="Edge Color" value={effects.outline.visibleEdgeColor} onChange={(v: any) => onUpdateEffect('outline', 'visibleEdgeColor', v)} />
        <Slider label="Edge Strength" value={effects.outline.edgeStrength} min={1} max={10} step={0.1} onChange={(v: any) => onUpdateEffect('outline', 'edgeStrength', v)} />
      </ControlGroup>
    </div>
  );
}
