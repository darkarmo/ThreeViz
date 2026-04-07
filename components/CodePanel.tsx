
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
      props.push(`    color: new THREE.Color('${mat.color}')`);
    }
    props.push(`    transparent: ${mat.opacity < 1 || mat.transmission > 0}`);
    props.push(`    opacity: ${mat.opacity.toFixed(2)}`);
    props.push(`    wireframe: ${mat.wireframe}`);
    props.push(`    name: '${mat.name}'`);

    if (['phong', 'lambert', 'standard', 'physical'].includes(mat.type)) {
      props.push(`    emissive: new THREE.Color('${mat.emissive}')`);
      props.push(`    emissiveIntensity: ${mat.emissiveIntensity.toFixed(1)}`);
    }

    if (mat.type === 'phong') {
      props.push(`    specular: new THREE.Color('${mat.specular}')`);
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

  const generateLightCode = (light: LightSettings, index: number) => {
    let code = '';
    const lightName = `${light.type}Light_${index}`;
    
    switch (light.type) {
      case 'ambient':
        code += `const ${lightName} = new THREE.AmbientLight('${light.color}', ${light.intensity.toFixed(1)});\n`;
        break;
      case 'directional':
        code += `const ${lightName} = new THREE.DirectionalLight('${light.color}', ${light.intensity.toFixed(1)});\n`;
        code += `${lightName}.position.set(${light.position.join(', ')});\n`;
        code += `${lightName}.castShadow = ${light.castShadow};\n`;
        break;
      case 'point':
        code += `const ${lightName} = new THREE.PointLight('${light.color}', ${light.intensity.toFixed(1)});\n`;
        code += `${lightName}.position.set(${light.position.join(', ')});\n`;
        code += `${lightName}.castShadow = ${light.castShadow};\n`;
        break;
      case 'spot':
        code += `const ${lightName} = new THREE.SpotLight('${light.color}', ${light.intensity.toFixed(1)});\n`;
        code += `${lightName}.position.set(${light.position.join(', ')});\n`;
        code += `${lightName}.castShadow = ${light.castShadow};\n`;
        break;
      case 'hemisphere':
        code += `const ${lightName} = new THREE.HemisphereLight('${light.color}', '${light.groundColor}', ${light.intensity.toFixed(1)});\n`;
        code += `${lightName}.position.set(${light.position.join(', ')});\n`;
        break;
      case 'rectArea':
        code += `const ${lightName} = new THREE.RectAreaLight('${light.color}', ${light.intensity.toFixed(1)}, ${light.width}, ${light.height});\n`;
        code += `${lightName}.position.set(${light.position.join(', ')});\n`;
        if (light.rotation) {
          code += `${lightName}.rotation.set(${light.rotation.join(', ')});\n`;
        }
        break;
    }
    code += `scene.add(${lightName});`;
    return code;
  };

  const lightsCode = state.lights.map((l, i) => generateLightCode(l, i)).join('\n\n');

  const hasRectAreaLight = state.lights.some(l => l.type === 'rectArea');

  const fullComponentCode = `import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
${hasRectAreaLight ? "import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';\n" : ''}
// Basic Setup
const canvas = document.querySelector('#webgl-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('${state.scene.background}');

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 3, 4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;${state.scene.autoRotate ? '\ncontrols.autoRotate = true;\ncontrols.autoRotateSpeed = 0.5;' : ''}
${hasRectAreaLight ? '\nRectAreaLightUniformsLib.init();\n' : ''}
// Lighting
${lightsCode}

// Materials
const materials = {
${materialsCode}
};

// Load Model
const loader = new GLTFLoader();
loader.load('${state.scene.modelType === 'custom' ? 'your-model-url.glb' : state.scene.modelType + '.glb'}', (gltf) => {
    const model = gltf.scene;
    
    model.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            ${state.scene.overrideMaterials ? `
            // Apply custom materials
            if (Array.isArray(child.material)) {
                child.material = child.material.map(m => materials[m.name] || m);
            } else if (child.material) {
                const matched = materials[child.material.name];
                if (matched) child.material = matched;
            }` : ''}
        }
    });
    
    scene.add(model);
});

${state.scene.showPlane ? `// Floor
const floorGeometry = new THREE.PlaneGeometry(100, 100);
const floorMaterial = new THREE.MeshStandardMaterial({ 
    color: new THREE.Color('${state.scene.planeColor}'),
    roughness: ${state.scene.planeRoughness},
    transparent: ${state.scene.planeOpacity < 1},
    opacity: ${state.scene.planeOpacity}
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
floor.receiveShadow = true;
scene.add(floor);` : ''}

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});`;

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
          <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy All'}</span>
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
