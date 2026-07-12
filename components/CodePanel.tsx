import React, { useState, useEffect, useRef } from 'react';
import { AppState, MaterialSettings, LightSettings } from '../types';
import { Copy, Check, Terminal, Cpu, Save } from 'lucide-react';

interface CodePanelProps {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
}

const CodePanel: React.FC<CodePanelProps> = ({ state, setState }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

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

    if (mat.map) props.push(`    map: loadTexture('${mat.map}', [${mat.uvRepeat?.[0]||1}, ${mat.uvRepeat?.[1]||1}], [${mat.uvOffset?.[0]||0}, ${mat.uvOffset?.[1]||0}], ${mat.uvRotation||0})`);
    if (mat.normalMap) props.push(`    normalMap: loadDataTexture('${mat.normalMap}', [${mat.uvRepeat?.[0]||1}, ${mat.uvRepeat?.[1]||1}], [${mat.uvOffset?.[0]||0}, ${mat.uvOffset?.[1]||0}], ${mat.uvRotation||0})`);
    if (mat.roughnessMap) props.push(`    roughnessMap: loadDataTexture('${mat.roughnessMap}', [${mat.uvRepeat?.[0]||1}, ${mat.uvRepeat?.[1]||1}], [${mat.uvOffset?.[0]||0}, ${mat.uvOffset?.[1]||0}], ${mat.uvRotation||0})`);
    if (mat.metalnessMap) props.push(`    metalnessMap: loadDataTexture('${mat.metalnessMap}', [${mat.uvRepeat?.[0]||1}, ${mat.uvRepeat?.[1]||1}], [${mat.uvOffset?.[0]||0}, ${mat.uvOffset?.[1]||0}], ${mat.uvRotation||0})`);

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
    .map(mat => `  '${mat.name}': new THREE.${getMaterialType(mat)}({\n${generateMaterialProps(mat)}\n  })`)
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

// Texture Helpers
const textureLoader = new THREE.TextureLoader();
const applyUVs = (tex, repeat, offset, rotation) => {
  if (repeat) tex.repeat.set(repeat[0], repeat[1]);
  if (offset) tex.offset.set(offset[0], offset[1]);
  if (rotation) {
    tex.rotation = rotation;
    tex.center.set(0.5, 0.5);
  }
};
const loadTexture = (url, repeat, offset, rotation) => {
  const tex = textureLoader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  applyUVs(tex, repeat, offset, rotation);
  return tex;
};
const loadDataTexture = (url, repeat, offset, rotation) => {
  const tex = textureLoader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  applyUVs(tex, repeat, offset, rotation);
  return tex;
};

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

  const [localCode, setLocalCode] = useState(fullComponentCode);

  useEffect(() => {
    if (!isEditing) {
      setLocalCode(fullComponentCode);
    }
  }, [fullComponentCode, isEditing]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    
    const newState = { ...state };
    let changed = false;

    try {
      // Parse background
      const bgMatch = newCode.match(/scene\.background\s*=\s*new\s+THREE\.Color\(['"]([^'"]+)['"]\)/);
      if (bgMatch && bgMatch[1] !== newState.scene.background) {
        newState.scene.background = bgMatch[1];
        changed = true;
      }

      // Parse Materials
      const materialsBlockMatch = newCode.match(/const materials = {([\s\S]*?)};\n/);
      if (materialsBlockMatch) {
        const materialsBlock = materialsBlockMatch[1];
        const newMaterials = { ...newState.materials };
        Object.values(newMaterials).forEach(mat => {
          const safeName = mat.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const matRegex = new RegExp(`'${safeName}':\\s*new\\s+THREE\\.[a-zA-Z]+\\(\\{([\\s\\S]*?)\\}\\)`);
          const matMatch = materialsBlock.match(matRegex);
          if (matMatch) {
            const propsBlock = matMatch[1];
            
            const colorMatch = propsBlock.match(/color:\s*new\s+THREE\.Color\(['"]([^'"]+)['"]\)/);
            if (colorMatch && colorMatch[1] !== mat.color) { mat.color = colorMatch[1]; changed = true; }

            const emissiveMatch = propsBlock.match(/emissive:\s*new\s+THREE\.Color\(['"]([^'"]+)['"]\)/);
            if (emissiveMatch && emissiveMatch[1] !== mat.emissive) { mat.emissive = emissiveMatch[1]; changed = true; }

            const opacityMatch = propsBlock.match(/opacity:\s*([0-9.]+)/);
            if (opacityMatch && parseFloat(opacityMatch[1]) !== mat.opacity) { mat.opacity = parseFloat(opacityMatch[1]); changed = true; }

            const wireframeMatch = propsBlock.match(/wireframe:\s*(true|false)/);
            if (wireframeMatch && (wireframeMatch[1] === 'true') !== mat.wireframe) { mat.wireframe = wireframeMatch[1] === 'true'; changed = true; }

            const metalnessMatch = propsBlock.match(/metalness:\s*([0-9.]+)/);
            if (metalnessMatch && parseFloat(metalnessMatch[1]) !== mat.metalness) { mat.metalness = parseFloat(metalnessMatch[1]); changed = true; }

            const roughnessMatch = propsBlock.match(/roughness:\s*([0-9.]+)/);
            if (roughnessMatch && parseFloat(roughnessMatch[1]) !== mat.roughness) { mat.roughness = parseFloat(roughnessMatch[1]); changed = true; }
          }
        });
        newState.materials = newMaterials;
      }

      // Parse Lights
      const newLights = [...newState.lights];
      newLights.forEach((light, index) => {
        const lightName = `${light.type}Light_${index}`;
        
        const instRegex = new RegExp(`const\\s+${lightName}\\s*=\\s*new\\s+THREE\\.[a-zA-Z]+\\(['"]([^'"]+)['"],\\s*([0-9.]+)`);
        const instMatch = newCode.match(instRegex);
        if (instMatch) {
          if (instMatch[1] !== light.color) { light.color = instMatch[1]; changed = true; }
          if (parseFloat(instMatch[2]) !== light.intensity) { light.intensity = parseFloat(instMatch[2]); changed = true; }
        }

        const posRegex = new RegExp(`${lightName}\\.position\\.set\\(([^,]+),\\s*([^,]+),\\s*([^)]+)\\)`);
        const posMatch = newCode.match(posRegex);
        if (posMatch) {
          const newPos = [parseFloat(posMatch[1]), parseFloat(posMatch[2]), parseFloat(posMatch[3])];
          if (newPos.join(',') !== light.position.join(',')) {
            light.position = newPos as [number, number, number];
            changed = true;
          }
        }
      });
      newState.lights = newLights;

      if (changed) {
        setState(newState);
      }
    } catch (e) {
      console.error("Failed to parse code edits", e);
    }
  };

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Three.js Visualizer Code</span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <span className="text-[9px] text-amber-500 uppercase tracking-widest font-bold animate-pulse mr-2">Editing...</span>
          )}
          <button 
            onClick={handleCopy}
            className={`hw-button flex items-center gap-2 px-3 py-1.5 transition-all cursor-pointer ${
              copied ? 'active active-accent' : ''
            }`}
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span className="text-[10px] font-bold uppercase">{copied ? 'Copied' : 'Copy All'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 relative hw-screen overflow-hidden group">
        <textarea
          value={localCode}
          onChange={handleCodeChange}
          onFocus={() => setIsEditing(true)}
          onBlur={() => setIsEditing(false)}
          onScroll={handleScroll}
          spellCheck={false}
          className="absolute inset-0 w-full h-full p-4 bg-transparent text-transparent caret-emerald-400 font-mono text-[10px] leading-relaxed resize-none outline-none z-10 whitespace-pre custom-scrollbar"
        />
        <pre 
          ref={preRef}
          className="absolute inset-0 w-full h-full p-4 overflow-hidden font-mono text-[10px] leading-relaxed text-emerald-400/90 whitespace-pre pointer-events-none"
        >
          {localCode.split('\n').map((line, i) => {
            const isComment = line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*');
            const isImport = line.trim().startsWith('import');
            return (
              <div key={i} className={`${isComment ? 'text-neutral-600 italic' : isImport ? 'text-purple-400' : ''} min-h-[1.2em]`}>
                {line || ' '}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
};

export default CodePanel;
