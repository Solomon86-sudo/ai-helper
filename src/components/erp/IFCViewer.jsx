import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Upload, RotateCcw, Maximize2, Eye, AlertTriangle } from 'lucide-react';

/**
 * BIM 3D Viewer — клиентский компонент для просмотра 3D-моделей.
 * 
 * Поддерживаемые форматы:
 * - GLB/GLTF (рекомендуется) — мгновенная загрузка через Three.js GLTFLoader
 * - IFC — парсинг через WebAssembly (web-ifc), подходит для файлов до ~200 МБ
 * 
 * Вся обработка на клиенте, без отправки на бэкенд.
 */
export default function IFCViewer() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const modelRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isDragOver, setIsDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadStage, setLoadStage] = useState('');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ========================
  // Three.js scene init
  // ========================
  const initScene = useCallback(async () => {
    if (!canvasRef.current || sceneRef.current) return;

    const THREE = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Grid
    const grid = new THREE.GridHelper(200, 200, 0x2a2a4e, 0x1e1e3a);
    grid.material.opacity = 0.3;
    grid.material.transparent = true;
    scene.add(grid);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight1.position.set(50, 100, 50);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight2.position.set(-50, 50, -50);
    scene.add(dirLight2);

    // Camera
    const w = containerRef.current.clientWidth;
    const h = containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50000);
    camera.position.set(30, 30, 30);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.minDistance = 0.5;
    controls.maxDistance = 20000;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const ro = new ResizeObserver(() => {
      const cw = containerRef.current?.clientWidth || w;
      const ch = containerRef.current?.clientHeight || h;
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
      renderer.setSize(cw, ch);
    });
    ro.observe(containerRef.current);
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, [initScene]);

  // ========================
  // Удаление предыдущей модели
  // ========================
  const clearModel = useCallback(async () => {
    if (modelRef.current && sceneRef.current) {
      sceneRef.current.remove(modelRef.current);
      modelRef.current.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(m => {
            if (m.map) m.map.dispose();
            if (m.normalMap) m.normalMap.dispose();
            m.dispose();
          });
        }
      });
      modelRef.current = null;
    }
  }, []);

  // ========================
  // Центрирование камеры на модели
  // ========================
  const centerCamera = useCallback(async (group) => {
    const THREE = await import('three');
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    const dist = maxDim * 1.8;
    cameraRef.current.position.set(center.x + dist * 0.7, center.y + dist * 0.5, center.z + dist * 0.7);
    cameraRef.current.lookAt(center);
    cameraRef.current.near = maxDim * 0.001;
    cameraRef.current.far = maxDim * 100;
    cameraRef.current.updateProjectionMatrix();
    controlsRef.current.target.copy(center);
    controlsRef.current.update();
  }, []);

  // ========================
  // GLB / GLTF Loader (быстрый, рекомендуемый)
  // ========================
  const loadGLBFile = useCallback(async (file) => {
    setIsLoading(true);
    setLoadProgress(0);
    setLoadStage('Чтение GLB файла...');
    setError(null);
    setModelLoaded(false);

    try {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/examples/jsm/loaders/DRACOLoader.js');

      setLoadProgress(10);
      setLoadStage('Инициализация загрузчика...');

      const loader = new GLTFLoader();
      
      // Draco decoder для сжатых моделей
      try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        loader.setDRACOLoader(dracoLoader);
      } catch (e) {
        console.warn('Draco loader not available, continuing without compression support');
      }

      setLoadProgress(20);
      setLoadStage('Загрузка 3D-модели...');

      const buffer = await file.arrayBuffer();
      
      setLoadProgress(40);
      setLoadStage('Парсинг геометрии...');

      const gltf = await new Promise((resolve, reject) => {
        loader.parse(buffer, '', resolve, reject);
      });

      setLoadProgress(70);
      setLoadStage('Построение сцены...');

      await clearModel();

      const model = gltf.scene;
      
      // Статистика
      let meshCount = 0;
      let triangleCount = 0;
      model.traverse(child => {
        if (child.isMesh) {
          meshCount++;
          if (child.geometry.index) {
            triangleCount += child.geometry.index.count / 3;
          } else if (child.geometry.attributes.position) {
            triangleCount += child.geometry.attributes.position.count / 3;
          }
          // Включаем тени
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      sceneRef.current.add(model);
      modelRef.current = model;

      setLoadProgress(90);
      setLoadStage('Настройка камеры...');

      await centerCamera(model);

      setLoadProgress(100);
      setModelLoaded(true);
      setModelInfo({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1),
        meshes: meshCount,
        triangles: triangleCount.toLocaleString(),
        format: 'GLB/glTF',
      });

    } catch (err) {
      console.error('GLB load error:', err);
      setError(`Ошибка загрузки GLB: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [clearModel, centerCamera]);

  // ========================
  // IFC Loader (через web-ifc WASM)
  // ========================
  const loadIFCFile = useCallback(async (file) => {
    const fileSizeMB = file.size / (1024 * 1024);
    
    // Предупреждение для больших файлов
    if (fileSizeMB > 300) {
      setError(`Файл ${fileSizeMB.toFixed(0)} МБ слишком большой для IFC-просмотра в браузере. Рекомендуем конвертировать в GLB (Revit → Экспорт → glTF/GLB). GLB-файл будет ~${Math.round(fileSizeMB * 0.1)}-${Math.round(fileSizeMB * 0.2)} МБ и загрузится мгновенно.`);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadProgress(0);
    setLoadStage('Чтение IFC файла...');
    setError(null);
    setModelLoaded(false);

    try {
      const THREE = await import('three');

      setLoadProgress(10);
      setLoadStage(`Чтение ${fileSizeMB.toFixed(0)} МБ в память...`);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      setLoadProgress(20);
      setLoadStage('Инициализация WASM-движка...');

      const WebIFC = await import('web-ifc');
      const ifcApi = new WebIFC.IfcAPI();

      // Пути для WASM
      const wasmPaths = [
        '/',
        './',
        `https://unpkg.com/web-ifc@0.0.78/`,
        `https://cdn.jsdelivr.net/npm/web-ifc@0.0.78/`,
      ];

      let initialized = false;
      for (const p of wasmPaths) {
        try {
          ifcApi.SetWasmPath(p);
          await ifcApi.Init();
          initialized = true;
          break;
        } catch (e) {
          console.warn(`WASM ${p} failed`);
        }
      }

      if (!initialized) {
        throw new Error('WASM-движок не загрузился. Попробуйте GLB-формат.');
      }

      setLoadProgress(35);
      setLoadStage('Парсинг IFC-структуры...');
      const modelID = ifcApi.OpenModel(data);

      setLoadProgress(45);
      setLoadStage('Извлечение геометрии...');

      await clearModel();

      const group = new THREE.Group();
      let meshCount = 0;
      let totalTriangles = 0;

      ifcApi.StreamAllMeshes(modelID, (mesh) => {
        const placed = mesh.geometries;
        for (let i = 0; i < placed.size(); i++) {
          const pg = placed.get(i);
          const gd = ifcApi.GetGeometry(modelID, pg.geometryExpressID);
          const verts = ifcApi.GetVertexArray(gd.GetVertexData(), gd.GetVertexDataSize());
          const indices = ifcApi.GetIndexArray(gd.GetIndexData(), gd.GetIndexDataSize());

          if (!verts.length || !indices.length) continue;

          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(verts.length / 2);
          const normals = new Float32Array(verts.length / 2);

          for (let j = 0; j < verts.length; j += 6) {
            const k = j / 2;
            positions[k] = verts[j];
            positions[k + 1] = verts[j + 1];
            positions[k + 2] = verts[j + 2];
            normals[k] = verts[j + 3];
            normals[k + 1] = verts[j + 4];
            normals[k + 2] = verts[j + 5];
          }

          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

          const color = new THREE.Color(pg.color.x, pg.color.y, pg.color.z);
          const material = new THREE.MeshPhongMaterial({
            color,
            opacity: pg.color.w,
            transparent: pg.color.w < 1,
            side: THREE.DoubleSide,
          });

          const m = new THREE.Mesh(geometry, material);
          const matrix = new THREE.Matrix4().fromArray(pg.flatTransformation);
          m.applyMatrix4(matrix);
          group.add(m);
          meshCount++;
          totalTriangles += indices.length / 3;
        }
      });

      ifcApi.CloseModel(modelID);

      if (meshCount === 0) throw new Error('В IFC-файле не найдена геометрия');

      setLoadProgress(80);
      setLoadStage('Финализация...');

      sceneRef.current.add(group);
      modelRef.current = group;
      await centerCamera(group);

      setLoadProgress(100);
      setModelLoaded(true);
      setModelInfo({
        name: file.name,
        size: fileSizeMB.toFixed(1),
        meshes: meshCount,
        triangles: totalTriangles.toLocaleString(),
        format: 'IFC (WASM)',
      });

    } catch (err) {
      console.error('IFC load error:', err);
      setError(err.message || 'Ошибка загрузки IFC');
    } finally {
      setIsLoading(false);
    }
  }, [clearModel, centerCamera]);

  // ========================
  // Универсальный обработчик файлов
  // ========================
  const handleFile = useCallback((file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    
    if (name.endsWith('.glb') || name.endsWith('.gltf')) {
      loadGLBFile(file);
    } else if (name.endsWith('.ifc')) {
      loadIFCFile(file);
    } else {
      setError('Поддерживаемые форматы: .glb, .gltf, .ifc');
    }
  }, [loadGLBFile, loadIFCFile]);

  // Drag & Drop
  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);
  const handleFileInput = useCallback((e) => {
    handleFile(e.target.files[0]);
    e.target.value = null;
  }, [handleFile]);

  // Camera reset
  const resetCamera = useCallback(async () => {
    if (modelRef.current) await centerCamera(modelRef.current);
  }, [centerCamera]);

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // ========================
  // Styles
  // ========================
  const s = {
    container: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', gap: '16px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    toolbar: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
    btn: {
      padding: '8px 14px', backgroundColor: 'var(--bg-panel, #1e1e3a)', color: 'var(--text-main, #e0e0e0)',
      border: '1px solid var(--border-color, #333)', borderRadius: '6px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'all 0.2s',
    },
    btnGreen: {
      padding: '8px 14px', backgroundColor: '#059669', color: 'white',
      border: 'none', borderRadius: '6px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 'bold',
    },
    viewer: {
      position: 'relative', flex: 1, borderRadius: '12px', overflow: 'hidden',
      border: isDragOver ? '2px dashed #3b82f6' : '1px solid var(--border-color, #333)',
      backgroundColor: '#0a0a1a', transition: 'border 0.3s ease',
    },
    canvas: { width: '100%', height: '100%', display: 'block' },
    overlay: {
      position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(10,10,26,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 20,
    },
    info: {
      display: 'flex', gap: '20px', flexWrap: 'wrap', padding: '10px 16px',
      backgroundColor: 'var(--bg-panel, #1e1e3a)', borderRadius: '8px',
      border: '1px solid var(--border-color, #333)', fontSize: '12px', color: 'var(--text-muted, #888)',
    },
  };

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box size={24} color="#3b82f6" />
          <div>
            <h2 style={{ margin: 0, fontSize: '20px' }}>3D BIM Viewer</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted, #888)' }}>
              Форматы: <strong style={{ color: '#10b981' }}>GLB/glTF</strong> (рекомендуется, мгновенно) • IFC (до 300 МБ)
            </p>
          </div>
        </div>

        <div style={s.toolbar}>
          <label style={{ ...s.btnGreen, cursor: 'pointer' }}>
            <Upload size={14} /> Загрузить GLB
            <input type="file" accept=".glb,.gltf" onChange={handleFileInput} style={{ display: 'none' }} />
          </label>
          <label style={{ ...s.btn, cursor: 'pointer' }}>
            <Upload size={14} /> Загрузить IFC
            <input type="file" accept=".ifc" onChange={handleFileInput} style={{ display: 'none' }} />
          </label>
          {modelLoaded && (
            <>
              <button style={s.btn} onClick={resetCamera} title="Сбросить камеру"><RotateCcw size={14} /></button>
              <button style={s.btn} onClick={toggleFullscreen} title="Полный экран"><Maximize2 size={14} /></button>
            </>
          )}
        </div>
      </div>

      {/* 3D Viewport */}
      <div ref={containerRef} style={s.viewer}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      >
        <canvas ref={canvasRef} style={s.canvas} />

        {/* Empty state */}
        {!modelLoaded && !isLoading && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 5, pointerEvents: 'none' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(16,185,129,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={36} color="#3b82f6" />
            </div>
            <p style={{ color: '#e0e0e0', fontSize: '16px', margin: 0, fontWeight: 600 }}>Перетащите файл сюда</p>
            <p style={{ color: '#666', fontSize: '13px', margin: 0, textAlign: 'center', maxWidth: '400px' }}>
              <strong style={{ color: '#10b981' }}>GLB/glTF</strong> — для быстрого просмотра (любой размер)<br/>
              <strong style={{ color: '#3b82f6' }}>IFC</strong> — для BIM-моделей до 300 МБ
            </p>
          </div>
        )}

        {/* Drag overlay */}
        {isDragOver && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.15)', zIndex: 10 }}>
            <Upload size={48} color="#3b82f6" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginTop: '12px' }}>Отпустите файл</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div style={s.overlay}>
            <div style={{ width: '56px', height: '56px', border: '3px solid rgba(59,130,246,0.2)', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#e0e0e0', fontSize: '16px', marginTop: '20px', fontWeight: 600 }}>{loadStage}</p>
            <div style={{ width: '280px', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: '3px', transition: 'width 0.3s', width: `${loadProgress}%` }} />
            </div>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>{loadProgress}% • Обработка локально</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', backgroundColor: 'rgba(30,30,50,0.95)', border: '1px solid #f59e0b', color: '#fbbf24', padding: '14px 18px', borderRadius: '10px', fontSize: '13px', zIndex: 30, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ marginBottom: '4px', fontWeight: 600 }}>Рекомендация</div>
              {error}
              <button onClick={() => setError(null)} style={{ marginLeft: '12px', padding: '2px 10px', border: '1px solid #f59e0b', background: 'transparent', color: '#fbbf24', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✕</button>
            </div>
          </div>
        )}

        {/* Controls hint */}
        {modelLoaded && (
          <div style={{ position: 'absolute', bottom: '12px', right: '12px', display: 'flex', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', zIndex: 5 }}>
            <span>🖱️ Вращение</span><span>⚙️ Колесо = Зум</span><span>🖱️ ПКМ = Панорама</span>
          </div>
        )}
      </div>

      {/* Info bar */}
      {modelLoaded && modelInfo && (
        <div style={s.info}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Eye size={14} color="#3b82f6" /><span>Файл:</span><strong style={{ color: 'var(--text-main, #e0e0e0)' }}>{modelInfo.name}</strong>
          </div>
          <div><span>Формат:</span> <strong style={{ color: modelInfo.format.includes('GLB') ? '#10b981' : '#3b82f6' }}>{modelInfo.format}</strong></div>
          <div><span>Размер:</span> <strong style={{ color: 'var(--text-main, #e0e0e0)' }}>{modelInfo.size} МБ</strong></div>
          <div><span>Элементов:</span> <strong style={{ color: 'var(--text-main, #e0e0e0)' }}>{modelInfo.meshes.toLocaleString()}</strong></div>
          <div><span>Треугольников:</span> <strong style={{ color: 'var(--text-main, #e0e0e0)' }}>{modelInfo.triangles}</strong></div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.6; transform:scale(1.1); } }
      `}</style>
    </div>
  );
}
