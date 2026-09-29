import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Upload, RotateCcw, ZoomIn, ZoomOut, Maximize2, Eye, Loader } from 'lucide-react';

/**
 * IFC 3D Viewer — клиентский компонент для мгновенного просмотра BIM-моделей.
 * 
 * Файл .ifc обрабатывается целиком в браузере через WebAssembly (web-ifc),
 * геометрия отрисовывается через Three.js/WebGL напрямую видеокартой клиента.
 * Никакой отправки на бэкенд — максимальная скорость.
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

  // Инициализация Three.js сцены
  const initScene = useCallback(async () => {
    if (!canvasRef.current || sceneRef.current) return;

    const THREE = await import('three');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);

    // Сетка (grid helper)
    const grid = new THREE.GridHelper(100, 100, 0x2a2a4e, 0x1e1e3a);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    scene.add(grid);

    // Освещение
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-50, 50, -50);
    scene.add(directionalLight2);

    // Камера
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);

    // Рендерер
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 5000;
    controls.maxPolarAngle = Math.PI;

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    controlsRef.current = controls;

    // Анимационный цикл
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  useEffect(() => {
    initScene();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
    };
  }, [initScene]);

  // Загрузка IFC файла
  const loadIFCFile = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.ifc')) {
      setError('Пожалуйста, загрузите файл с расширением .ifc');
      return;
    }

    setIsLoading(true);
    setLoadProgress(0);
    setLoadStage('Чтение файла...');
    setError(null);
    setModelLoaded(false);

    try {
      const THREE = await import('three');

      // Шаг 1: Чтение файла в ArrayBuffer
      setLoadStage('Чтение файла в память...');
      setLoadProgress(10);
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);

      // Шаг 2: Инициализация web-ifc WASM
      setLoadStage('Инициализация WASM-движка...');
      setLoadProgress(20);

      let ifcApi;
      try {
        const WebIFC = await import('web-ifc');
        ifcApi = new WebIFC.IfcAPI();
        
        // Пути для WASM файлов (порядок: локальный → CDN с правильной версией)
        const wasmPaths = [
          '/',
          './',
          'https://unpkg.com/web-ifc@0.0.78/',
          'https://cdn.jsdelivr.net/npm/web-ifc@0.0.78/',
        ];
        
        let initialized = false;
        for (const wasmPath of wasmPaths) {
          try {
            console.log(`Trying WASM path: ${wasmPath}`);
            ifcApi.SetWasmPath(wasmPath);
            await ifcApi.Init();
            initialized = true;
            console.log(`WASM initialized from: ${wasmPath}`);
            break;
          } catch (e) {
            console.warn(`WASM path ${wasmPath} failed:`, e.message);
          }
        }
        
        if (!initialized) {
          throw new Error('Не удалось инициализировать WASM-движок');
        }
      } catch (e) {
        console.error('web-ifc init error:', e);
        // Фоллбэк: парсим IFC как текст и создаём базовую 3D модель
        setLoadStage('Альтернативный парсинг IFC...');
        setLoadProgress(30);
        await loadIFCFallback(file, THREE);
        return;
      }

      // Шаг 3: Открытие модели
      setLoadStage('Парсинг IFC структуры...');
      setLoadProgress(40);
      const modelID = ifcApi.OpenModel(data);

      // Шаг 4: Извлечение геометрии
      setLoadStage('Извлечение геометрии...');
      setLoadProgress(50);

      // Удаляем старую модель
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      }

      const group = new THREE.Group();
      let meshCount = 0;
      let totalTriangles = 0;

      // Получаем все meshes из модели
      setLoadStage('Построение 3D-сцены...');
      setLoadProgress(60);

      ifcApi.StreamAllMeshes(modelID, (mesh) => {
        const placedGeometries = mesh.geometries;

        for (let i = 0; i < placedGeometries.size(); i++) {
          const placedGeometry = placedGeometries.get(i);
          const geomData = ifcApi.GetGeometry(modelID, placedGeometry.geometryExpressID);

          const verts = ifcApi.GetVertexArray(geomData.GetVertexData(), geomData.GetVertexDataSize());
          const indices = ifcApi.GetIndexArray(geomData.GetIndexData(), geomData.GetIndexDataSize());

          if (verts.length === 0 || indices.length === 0) continue;

          // Создаём BufferGeometry
          const geometry = new THREE.BufferGeometry();

          // Вершины (каждые 6 float: x, y, z, nx, ny, nz)
          const positions = new Float32Array(verts.length / 2);
          const normals = new Float32Array(verts.length / 2);

          for (let j = 0; j < verts.length; j += 6) {
            const idx = j / 2;
            positions[idx] = verts[j];
            positions[idx + 1] = verts[j + 1];
            positions[idx + 2] = verts[j + 2];
            normals[idx] = verts[j + 3];
            normals[idx + 1] = verts[j + 4];
            normals[idx + 2] = verts[j + 5];
          }

          geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
          geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));

          // Материал с цветом из IFC
          const color = new THREE.Color(
            placedGeometry.color.x,
            placedGeometry.color.y,
            placedGeometry.color.z
          );

          const material = new THREE.MeshPhongMaterial({
            color: color,
            opacity: placedGeometry.color.w,
            transparent: placedGeometry.color.w < 1,
            side: THREE.DoubleSide,
            flatShading: false,
          });

          const mesh3D = new THREE.Mesh(geometry, material);

          // Применяем матрицу трансформации
          const matrix = new THREE.Matrix4();
          matrix.fromArray(placedGeometry.flatTransformation);
          mesh3D.applyMatrix4(matrix);

          group.add(mesh3D);
          meshCount++;
          totalTriangles += indices.length / 3;
        }
      });

      setLoadProgress(85);
      setLoadStage('Финализация...');

      if (meshCount === 0) {
        throw new Error('В файле не найдена геометрия');
      }

      // Добавляем модель в сцену
      sceneRef.current.add(group);
      modelRef.current = group;

      // Центрируем камеру на модели
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      cameraRef.current.position.set(
        center.x + maxDim * 1.5,
        center.y + maxDim,
        center.z + maxDim * 1.5
      );
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      // Закрываем модель в web-ifc
      ifcApi.CloseModel(modelID);

      setLoadProgress(100);
      setModelLoaded(true);
      setModelInfo({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2),
        meshes: meshCount,
        triangles: totalTriangles.toLocaleString(),
      });

    } catch (err) {
      console.error('IFC load error:', err);
      // Попробуем fallback
      try {
        const THREE = await import('three');
        await loadIFCFallback(file, THREE);
      } catch (fallbackErr) {
        setError(`Ошибка загрузки: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fallback парсер: читает IFC как текст и создаёт упрощённую 3D визуализацию
  const loadIFCFallback = useCallback(async (file, THREE) => {
    try {
      setLoadStage('Текстовый парсинг IFC...');
      setLoadProgress(40);

      const text = await file.text();
      const lines = text.split('\n');

      // Удаляем старую модель
      if (modelRef.current && sceneRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse(child => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
            else child.material.dispose();
          }
        });
      }

      setLoadStage('Извлечение элементов...');
      setLoadProgress(50);

      const group = new THREE.Group();
      let elementCount = 0;

      // Парсим координаты из IFCCARTESIANPOINT
      const points = {};
      const placements = {};

      for (const line of lines) {
        const trimmed = line.trim();

        // Ищем IFCCARTESIANPOINT
        const cpMatch = trimmed.match(/^#(\d+)\s*=\s*IFCCARTESIANPOINT\s*\(\s*\(\s*([-\d.eE+]+)\s*,\s*([-\d.eE+]+)\s*(?:,\s*([-\d.eE+]+))?\s*\)/i);
        if (cpMatch) {
          points[cpMatch[1]] = {
            x: parseFloat(cpMatch[2]) || 0,
            y: parseFloat(cpMatch[3]) || 0,
            z: parseFloat(cpMatch[4]) || 0,
          };
        }

        // Ищем IFCLOCALPLACEMENT
        const lpMatch = trimmed.match(/^#(\d+)\s*=\s*IFCLOCALPLACEMENT\s*\(\s*(?:#(\d+)|\\$)\s*,\s*#(\d+)/i);
        if (lpMatch) {
          placements[lpMatch[1]] = { ref: lpMatch[3] };
        }
      }

      setLoadStage('Построение 3D элементов...');
      setLoadProgress(65);

      // Определяем типы элементов и их цвета
      const elementTypes = {
        IFCWALL: { color: 0xCCCCCC, height: 3, width: 0.3 },
        IFCWALLSTANDARDCASE: { color: 0xCCCCCC, height: 3, width: 0.3 },
        IFCSLAB: { color: 0x999999, height: 0.3, width: 5 },
        IFCCOLUMN: { color: 0xAAAAAA, height: 3, width: 0.4 },
        IFCBEAM: { color: 0x888888, height: 0.4, width: 0.3 },
        IFCDOOR: { color: 0x8B4513, height: 2.1, width: 0.9 },
        IFCWINDOW: { color: 0x87CEEB, height: 1.5, width: 1.2 },
        IFCROOF: { color: 0xCD853F, height: 0.4, width: 6 },
        IFCSTAIR: { color: 0xBBBBBB, height: 3, width: 1.2 },
        IFCRAILING: { color: 0x666666, height: 1, width: 0.05 },
        IFCFURNISHINGELEMENT: { color: 0xDEB887, height: 0.8, width: 0.6 },
        IFCSPACE: { color: 0x3498db, height: 2.7, width: 4 },
      };

      let posIndex = 0;
      const gridSize = Math.ceil(Math.sqrt(Object.keys(elementTypes).length * 5));

      for (const line of lines) {
        const trimmed = line.trim();
        
        for (const [typeName, config] of Object.entries(elementTypes)) {
          const regex = new RegExp(`^#(\\d+)\\s*=\\s*${typeName}\\s*\\(`, 'i');
          const match = trimmed.match(regex);
          
          if (match) {
            let geometry;
            if (typeName.includes('COLUMN')) {
              geometry = new THREE.CylinderGeometry(config.width / 2, config.width / 2, config.height, 8);
            } else if (typeName.includes('SLAB') || typeName.includes('ROOF')) {
              geometry = new THREE.BoxGeometry(config.width, config.height, config.width);
            } else {
              geometry = new THREE.BoxGeometry(config.width, config.height, config.width * 0.8);
            }

            const material = new THREE.MeshPhongMaterial({
              color: config.color,
              transparent: typeName === 'IFCWINDOW' || typeName === 'IFCSPACE',
              opacity: typeName === 'IFCWINDOW' ? 0.5 : typeName === 'IFCSPACE' ? 0.15 : 1,
              side: THREE.DoubleSide,
            });

            const mesh = new THREE.Mesh(geometry, material);

            // Расположение элементов в пространстве (сетка)
            const row = Math.floor(posIndex / gridSize);
            const col = posIndex % gridSize;
            mesh.position.set(col * 4, config.height / 2, row * 4);

            group.add(mesh);
            elementCount++;
            posIndex++;

            if (elementCount > 500) break; // Лимит для fallback
          }
        }
        if (elementCount > 500) break;
      }

      setLoadProgress(85);
      setLoadStage('Финализация...');

      if (elementCount === 0) {
        // Создаём хотя бы placeholder-куб
        const geom = new THREE.BoxGeometry(5, 5, 5);
        const mat = new THREE.MeshPhongMaterial({ color: 0x3498db, wireframe: true });
        group.add(new THREE.Mesh(geom, mat));
        elementCount = 1;
      }

      sceneRef.current.add(group);
      modelRef.current = group;

      // Центрируем камеру
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);

      cameraRef.current.position.set(
        center.x + maxDim * 1.5,
        center.y + maxDim,
        center.z + maxDim * 1.5
      );
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();

      setLoadProgress(100);
      setModelLoaded(true);
      setModelInfo({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2),
        meshes: elementCount,
        triangles: '~' + (elementCount * 12).toLocaleString(),
        fallback: true,
      });

    } catch (err) {
      setError(`Ошибка парсинга: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Drag & Drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) loadIFCFile(file);
  }, [loadIFCFile]);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) loadIFCFile(file);
    e.target.value = null;
  }, [loadIFCFile]);

  // Управление камерой
  const resetCamera = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current || !modelRef.current) return;
    const THREE = window.__THREE_IMPORT || {};
    import('three').then(T => {
      const box = new T.Box3().setFromObject(modelRef.current);
      const center = box.getCenter(new T.Vector3());
      const size = box.getSize(new T.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      cameraRef.current.position.set(center.x + maxDim * 1.5, center.y + maxDim, center.z + maxDim * 1.5);
      cameraRef.current.lookAt(center);
      controlsRef.current.target.copy(center);
      controlsRef.current.update();
    });
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  // Стили
  const s = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '500px',
      gap: '16px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
    },
    toolbar: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
    },
    toolBtn: {
      padding: '8px 12px',
      backgroundColor: 'var(--bg-panel, #1e1e3a)',
      color: 'var(--text-main, #e0e0e0)',
      border: '1px solid var(--border-color, #333)',
      borderRadius: '6px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      transition: 'all 0.2s',
    },
    viewerWrapper: {
      position: 'relative',
      flex: 1,
      borderRadius: '12px',
      overflow: 'hidden',
      border: isDragOver
        ? '2px dashed #3b82f6'
        : '1px solid var(--border-color, #333)',
      backgroundColor: '#0a0a1a',
      transition: 'border 0.3s ease',
    },
    canvas: {
      width: '100%',
      height: '100%',
      display: 'block',
    },
    dropOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDragOver ? 'rgba(59,130,246,0.15)' : 'transparent',
      zIndex: isDragOver ? 10 : -1,
      pointerEvents: 'none',
      transition: 'all 0.3s',
    },
    emptyState: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      zIndex: 5,
      pointerEvents: 'none',
    },
    loadingOverlay: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(10,10,26,0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 20,
    },
    progressBar: {
      width: '280px',
      height: '6px',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '3px',
      overflow: 'hidden',
      marginTop: '16px',
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#3b82f6',
      borderRadius: '3px',
      transition: 'width 0.3s ease',
      width: `${loadProgress}%`,
    },
    infoBar: {
      display: 'flex',
      gap: '20px',
      flexWrap: 'wrap',
      padding: '10px 16px',
      backgroundColor: 'var(--bg-panel, #1e1e3a)',
      borderRadius: '8px',
      border: '1px solid var(--border-color, #333)',
      fontSize: '12px',
      color: 'var(--text-muted, #888)',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    infoValue: {
      color: 'var(--text-main, #e0e0e0)',
      fontWeight: '600',
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
              Мгновенный просмотр IFC-моделей в браузере • WebAssembly + WebGL
            </p>
          </div>
        </div>

        <div style={s.toolbar}>
          <label style={{ ...s.toolBtn, cursor: 'pointer' }}>
            <Upload size={14} /> Загрузить .ifc
            <input
              type="file"
              accept=".ifc"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </label>
          {modelLoaded && (
            <>
              <button style={s.toolBtn} onClick={resetCamera} title="Сбросить камеру">
                <RotateCcw size={14} />
              </button>
              <button style={s.toolBtn} onClick={toggleFullscreen} title="Полный экран">
                <Maximize2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        style={s.viewerWrapper}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <canvas ref={canvasRef} style={s.canvas} />

        {/* Empty state */}
        {!modelLoaded && !isLoading && (
          <div style={s.emptyState}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Box size={36} color="#3b82f6" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#e0e0e0', fontSize: '16px', margin: '0 0 6px 0', fontWeight: 600 }}>
                Перетащите файл .ifc сюда
              </p>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                или используйте кнопку «Загрузить .ifc» выше
              </p>
            </div>
          </div>
        )}

        {/* Drag overlay */}
        {isDragOver && (
          <div style={{ ...s.dropOverlay, zIndex: 10 }}>
            <Upload size={48} color="#3b82f6" style={{ animation: 'pulse 1.5s infinite' }} />
            <p style={{ color: '#3b82f6', fontSize: '18px', fontWeight: 600, marginTop: '12px' }}>
              Отпустите файл для загрузки
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div style={s.loadingOverlay}>
            <div style={{
              width: '56px',
              height: '56px',
              border: '3px solid rgba(59,130,246,0.2)',
              borderTop: '3px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{ color: '#e0e0e0', fontSize: '16px', marginTop: '20px', fontWeight: 600 }}>
              {loadStage}
            </p>
            <div style={s.progressBar}>
              <div style={s.progressFill} />
            </div>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              {loadProgress}% • Обработка на вашем устройстве (без отправки на сервер)
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(239,68,68,0.9)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: 30,
            maxWidth: '90%',
          }}>
            {error}
          </div>
        )}

        {/* Controls hint */}
        {modelLoaded && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            display: 'flex',
            gap: '8px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.4)',
            zIndex: 5,
          }}>
            <span>🖱️ Вращение</span>
            <span>⚙️ Колесо = Зум</span>
            <span>🖱️ ПКМ = Панорама</span>
          </div>
        )}
      </div>

      {/* Model info bar */}
      {modelLoaded && modelInfo && (
        <div style={s.infoBar}>
          <div style={s.infoItem}>
            <Eye size={14} color="#3b82f6" />
            <span>Файл:</span>
            <span style={s.infoValue}>{modelInfo.name}</span>
          </div>
          <div style={s.infoItem}>
            <span>Размер:</span>
            <span style={s.infoValue}>{modelInfo.size} MB</span>
          </div>
          <div style={s.infoItem}>
            <span>Элементов:</span>
            <span style={s.infoValue}>{modelInfo.meshes.toLocaleString()}</span>
          </div>
          <div style={s.infoItem}>
            <span>Треугольников:</span>
            <span style={s.infoValue}>{modelInfo.triangles}</span>
          </div>
          {modelInfo.fallback && (
            <div style={{ ...s.infoItem, color: '#f59e0b' }}>
              <span>⚠️ Упрощённый рендер (WASM недоступен)</span>
            </div>
          )}
        </div>
      )}

      {/* CSS animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
