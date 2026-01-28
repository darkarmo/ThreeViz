
import React, { useState } from 'react';
import { AppState, MaterialSettings, LightSettings } from '../types';
import { Copy, Check, Terminal, Cpu } from 'lucide-react';

interface CodePanelProps {
  state: AppState;
}

const CodePanel: React.FC<CodePanelProps> = ({ state }) => {
  const [copied, setCopied] = useState(false);

  const getMaterialType = (mat: MaterialSettings) => {
    switch (mat.type) {
      case 'basic': return 'MeshBasicMaterial';
      case 'lambert': return 'MeshLambertMaterial';
      case 'phong': return 'MeshPhongMaterial';
      case 'toon': return 'MeshToonMaterial';
      case 'normal': return 'MeshNormalMaterial';
      case 'depth': return 'MeshDepthMaterial';
      case 'physical': return 'MeshPhysicalMaterial';
      case 'matcap': return 'MeshMatcapMaterial';
      default: return 'MeshStandardMaterial';
    }
  };

  const generateMaterialProps = (mat: MaterialSettings) => {
    const props: string[] = [];
    if (mat.type !== 'normal' && mat.type !== 'depth') {
      props.push(`    color: '${mat.color}'`);
    }
    props.push(`    transparent: ${mat.opacity < 1 || mat.transmission > 0}`);
    props.push(`    opacity: ${mat.opacity.toFixed(2)}`);
    props.push(`    wireframe: ${mat.wireframe}`);
    props.push(`    name: '${mat.name}'`);

    if (['phong', 'lambert', 'standard', 'physical'].includes(mat.type)) {
      props.push(`    emissive: '${mat.emissive}'`);
      props.push(`    emissiveIntensity: ${mat.emissiveIntensity.toFixed(1)}`);
    }

    if (mat.type === 'phong') {
      props.push(`    specular: '${mat.specular}'`);
      props.push(`    shininess: ${mat.shininess.toFixed(0)}`);
    }

    if (['standard', 'physical'].includes(mat.type)) {
      props.push(`    metalness: ${mat.metalness.toFixed(2)}`);
      props.push(`    roughness: ${mat.roughness.toFixed(2)}`);
      props.push(`    envMapIntensity: ${mat.envMapIntensity.toFixed(1)}`);
    }

    if (mat.type === 'physical') {
      props.push(`    clearcoat: ${mat.clearcoat.toFixed(2)}`);
      props.push(`    clearcoatRoughness: ${mat.clearcoatRoughness.toFixed(2)}`);
      props.push(`    transmission: ${mat.transmission.toFixed(2)}`);
      props.push(`    thickness: ${mat.thickness.toFixed(2)}`);
      props.push(`    ior: ${mat.ior.toFixed(2)}`);
    }

    return props.join(',\n');
  };

  const materialsCode = (Object.values(state.materials) as MaterialSettings[])
    .map(mat => `  '${mat.name}': new THREE.${getMaterialType(mat)}({
${generateMaterialProps(mat)}
  })`)
    .join(',\n');

  const generateLightCode = (light: LightSettings) => {
    const tag = light.type === 'ambient' ? 'ambientLight' : 
                light.type === 'directional' ? 'directionalLight' :
                light.type === 'point' ? 'pointLight' : 
                light.type === 'hemisphere' ? 'hemisphereLight' :
                light.type === 'rectArea' ? 'rectAreaLight' : 'spotLight';
    
    let extra = '';
    if (light.type === 'hemisphere') {
      extra = `\n        args={['${light.color}', '${light.groundColor}', ${light.intensity}]}` +
              `\n        position={[${light.position.join(', ')}]}`;
    } else if (light.type === 'rectArea') {
      extra = `\n        color="${light.color}"` +
              `\n        intensity={${light.intensity.toFixed(1)}}` +
              `\n        width={${light.width}}` +
              `\n        height={${light.height}}` +
              `\n        position={[${light.position.join(', ')}]}` +
              `\n        rotation={[${light.rotation?.join(', ')}]}`;
    } else if (light.type !== 'ambient') {
      extra = `\n        color="${light.color}"` +
              `\n        intensity={${light.intensity.toFixed(1)}}` +
              `\n        position={[${light.position.join(', ')}]}` +
              `\n        castShadow={${light.castShadow}}`;
    } else {
       extra = `\n        color="${light.color}"` +
               `\n        intensity={${light.intensity.toFixed(1)}}`;
    }

    return `      <${tag}${extra} />`;
  };

  const lightsCode = state.lights.map(generateLightCode).join('\n');

  const fullComponentCode = `import React, { useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment, ContactShadows, OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom, Glitch, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'

/**
 * Three.js Visualizer - Custom Model Component
 */
function Model({ materialsConfig, overrideEnabled }) {
  const { scene } = useGLTF('${state.scene.modelType === 'custom' ? 'your-model-url.glb' : state.scene.modelType}')

  const materials = useMemo(() => ({
${materialsCode}
  }), [])

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (overrideEnabled) {
          if (Array.isArray(child.material)) {
            child.material = child.material.map(m => materials[m.name] || m)
          } else if (child.material) {
            const matched = materials[child.material.name]
            if (matched) child.material = matched
          }
        }
      }
    })
  }, [scene, materials, overrideEnabled])

  return <primitive object={scene} />
}

export default function Scene() {
  return (
    <Canvas shadows camera={{ position: [4, 3, 4], fov: 50 }}>
      <color attach="background" args={['${state.scene.background}']} />
      <OrbitControls makeDefault />
      
      {/* Lighting Configuration */}
${lightsCode}
      
      <React.Suspense fallback={null}>
        <Model overrideEnabled={${state.scene.overrideMaterials}} />
        <Environment preset="${state.scene.environmentPreset}" />
      </React.Suspense>

      {/* Post Processing */}
      <EffectComposer>
        {${state.effects.smaa.enabled} ? <SMAA /> : null}
        {${state.effects.bloom.enabled} ? (
          <Bloom 
            intensity={${state.effects.bloom.intensity.toFixed(1)}} 
            luminanceThreshold={${state.effects.bloom.threshold.toFixed(2)}} 
            mipmapBlur 
          />
        ) : null}
        {${state.effects.glitch.enabled} ? <Glitch /> : null}
      </EffectComposer>

      {/* Floor Elements */}
${state.scene.showPlane ? `      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="${state.scene.planeColor}" roughness={${state.scene.planeRoughness}} />
      </mesh>` : ''}
${state.scene.contactShadows ? `      <ContactShadows position={[0, -0.99, 0]} opacity={${state.scene.shadowOpacity}} scale={10} blur={${state.scene.shadowBlur}} />` : ''}
    </Canvas>
  )
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullComponentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg">
            <Cpu size={14} className="text-emerald-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Three.js Visualizer Code</span>
        </div>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all text-slate-400 hover:text-white border border-slate-700 cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Terminal size={12} />}
          <span className="text-[10px] font-bold uppercase">{copied ? 'Copy All' : 'Copy All'}</span>
        </button>
      </div>

      <div className="flex-1 bg-black/50 rounded-xl border border-slate-800 p-6 overflow-auto fira-code text-[11px] leading-relaxed relative">
        <pre className="text-blue-300/90 whitespace-pre">
          {fullComponentCode.split('\n').map((line, i) => {
            const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
            const isImport = line.trim().startsWith('import');
            return (
              <div key={i} className={`${isComment ? 'text-slate-600 italic' : isImport ? 'text-purple-400' : ''} min-h-[1.2em]`}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
