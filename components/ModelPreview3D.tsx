
import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ModelPreview3DProps {
  textureUrl: string;
}

const ModelPreview3D: React.FC<ModelPreview3DProps> = ({ textureUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Object3D | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);

  const [shape, setShape] = useState<'sphere' | 'cube' | 'plane' | 'custom'>('sphere');
  const [isModelLoading, setIsModelLoading] = useState(false);

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 400;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020617');
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const directLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directLight.position.set(5, 5, 5);
    directLight.castShadow = true;
    scene.add(directLight);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle Resize
    const handleResize = () => {
      if (!containerRef.current || !camera || !renderer) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    
    // Call resize once after a short delay to ensure layout is settled
    const timeout = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrameId);
      if (rendererRef.current && containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Geometry based on shape choice
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old mesh
    if (meshRef.current) {
      sceneRef.current.remove(meshRef.current);
    }

    if (shape === 'custom') return;

    let geometry: THREE.BufferGeometry;
    switch (shape) {
      case 'cube': geometry = new THREE.BoxGeometry(2, 2, 2); break;
      case 'plane': geometry = new THREE.PlaneGeometry(3, 3); break;
      case 'sphere':
      default: geometry = new THREE.SphereGeometry(1.5, 64, 64); break;
    }

    const material = new THREE.MeshStandardMaterial({
      roughness: 0.7,
      metalness: 0.2,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    sceneRef.current.add(mesh);
    meshRef.current = mesh;

    // Apply current texture if available
    if (textureRef.current) {
      applyTextureToMesh(mesh);
    }
  }, [shape]);

  // Update Texture whenever URL changes
  useEffect(() => {
    if (!textureUrl) return;

    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.repeat.set(1, 1);
      textureRef.current = tex;
      
      if (meshRef.current) {
        applyTextureToMesh(meshRef.current);
      }
    });
  }, [textureUrl]);

  const applyTextureToMesh = (obj: THREE.Object3D) => {
    if (!textureRef.current) return;
    
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material;
        if (mat instanceof THREE.MeshStandardMaterial) {
          mat.map = textureRef.current;
          mat.needsUpdate = true;
        } else if (Array.isArray(mat)) {
          mat.forEach(m => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.map = textureRef.current;
              m.needsUpdate = true;
            }
          });
        } else {
           // Fallback for meshes without standard materials
           child.material = new THREE.MeshStandardMaterial({
             map: textureRef.current,
             roughness: 0.7,
             metalness: 0.2
           });
        }
      }
    });
  };

  const handleModelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sceneRef.current) return;

    setIsModelLoading(true);
    setShape('custom');

    const reader = new FileReader();
    reader.onload = (event) => {
      const contents = event.target?.result;
      const loader = new GLTFLoader();
      
      loader.parse(contents as ArrayBuffer, '', (gltf) => {
        if (meshRef.current && sceneRef.current) {
          sceneRef.current.remove(meshRef.current);
        }

        const model = gltf.scene;
        
        // Center the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / (maxDim || 1);
        model.scale.set(scale, scale, scale);
        model.position.sub(center.multiplyScalar(scale));

        sceneRef.current?.add(model);
        meshRef.current = model;
        
        if (textureRef.current) {
          applyTextureToMesh(model);
        }
        setIsModelLoading(false);
      }, (error) => {
        console.error('Error parsing GLTF', error);
        setIsModelLoading(false);
      });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
          </svg>
          3D Perspective
        </h3>
        
        <div className="flex items-center gap-2">
          <select 
            value={shape} 
            onChange={(e) => setShape(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
          >
            <option value="sphere">Sphere</option>
            <option value="cube">Cube</option>
            <option value="plane">Plane</option>
            {shape === 'custom' && <option value="custom">Uploaded Model</option>}
          </select>
          
          <label className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-lg cursor-pointer transition-colors">
            Upload .GLB
            <input type="file" accept=".glb,.gltf" className="hidden" onChange={handleModelUpload} />
          </label>
        </div>
      </div>

      <div className="flex-1 relative min-h-[400px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
        <div ref={containerRef} className="w-full h-full" />
        
        {isModelLoading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-400">Forging 3D Geometry...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 flex flex-col gap-1 pointer-events-none">
          <div className="bg-black/40 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-slate-400 font-mono">
            Orbit Navigation: Drag to Rotate / Scroll to Zoom
          </div>
          {shape === 'custom' && (
            <div className="bg-indigo-900/40 backdrop-blur-xs px-2 py-1 rounded text-[10px] text-indigo-200 font-mono">
              Custom Mesh Active
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelPreview3D;
