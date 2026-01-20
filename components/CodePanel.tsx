
import React, { useState } from 'react';
import { AppState } from '../types';
import { Copy, Check, Terminal } from 'lucide-react';

interface CodePanelProps {
  state: AppState;
}

const CodePanel: React.FC<CodePanelProps> = ({ state }) => {
  const [copied, setCopied] = useState(false);

  const getMaterialConstructor = () => {
    switch (state.material.type) {
      case 'basic': return 'MeshBasicMaterial';
      case 'lambert': return 'MeshLambertMaterial';
      case 'phong': return 'MeshPhongMaterial';
      case 'toon': return 'MeshToonMaterial';
      case 'normal': return 'MeshNormalMaterial';
      case 'depth': return 'MeshDepthMaterial';
      case 'physical': return 'MeshPhysicalMaterial';
      default: return 'MeshStandardMaterial';
    }
  };

  const getMaterialProperties = () => {
    const type = state.material.type;
    const props: string[] = [];
    
    if (type !== 'normal' && type !== 'depth') {
      props.push(`  color: '${state.material.color}'`);
    }
    
    props.push(`  wireframe: ${state.material.wireframe}`);
    props.push(`  transparent: ${state.material.opacity < 1 || state.material.transmission > 0}`);
    props.push(`  opacity: ${state.material.opacity.toFixed(2)}`);

    if (type === 'phong' || type === 'lambert' || type === 'standard' || type === 'physical') {
      props.push(`  emissive: '${state.material.emissive}'`);
      props.push(`  emissiveIntensity: ${state.material.emissiveIntensity.toFixed(1)}`);
    }

    if (type === 'phong') {
      props.push(`  specular: '${state.material.specular}'`);
      props.push(`  shininess: ${state.material.shininess.toFixed(0)}`);
    }

    if (type === 'standard' || type === 'physical') {
      props.push(`  metalness: ${state.material.metalness.toFixed(2)}`);
      props.push(`  roughness: ${state.material.roughness.toFixed(2)}`);
      props.push(`  envMapIntensity: ${state.material.envMapIntensity.toFixed(1)}`);
    }

    if (type === 'physical') {
      props.push(`  clearcoat: ${state.material.clearcoat.toFixed(2)}`);
      props.push(`  clearcoatRoughness: ${state.material.clearcoatRoughness.toFixed(2)}`);
      props.push(`  transmission: ${state.material.transmission.toFixed(2)}`);
      props.push(`  thickness: ${state.material.thickness.toFixed(2)}`);
      props.push(`  ior: ${state.material.ior.toFixed(2)}`);
    }

    return props.join(',\n');
  };

  const materialCode = `// --- Three.js Material Configuration ---
const material = new THREE.${getMaterialConstructor()}({
${getMaterialProperties()}
});

// --- Bloom Post-Processing ---
const bloomEffect = new BloomEffect({
  luminanceThreshold: ${state.bloom.threshold.toFixed(2)},
  intensity: ${state.bloom.intensity.toFixed(1)},
  radius: ${state.bloom.radius.toFixed(2)},
  mipmapBlur: true
});

// --- Scene Setup ---
// Ambient Intensity: ${state.scene.ambientIntensity.toFixed(2)}
// Shadow Softness: Enabled`;

  const handleCopy = () => {
    navigator.clipboard.writeText(materialCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Code Output</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="flex-1 bg-black rounded-xl border border-slate-800 p-6 overflow-auto fira-code text-xs leading-relaxed">
        <pre className="text-emerald-400/80">
          {materialCode.split('\n').map((line, i) => {
            if (line.startsWith('//')) {
              return <div key={i} className="text-slate-600 italic mb-1">{line}</div>;
            }
            return <div key={i} className="mb-0.5">{line}</div>;
          })}
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
