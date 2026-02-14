import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

export default function Product3DViewer() {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const mouseStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0x14b8a6, 0.4);
    directionalLight2.position.set(-5, -5, -5);
    scene.add(directionalLight2);

    // Create 3D product model (sophisticated wireframe structure)
    const group = new THREE.Group();

    // Main product body
    const bodyGeometry = new THREE.BoxGeometry(2, 2.5, 1.5);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.7,
      roughness: 0.3,
      emissive: 0x0a0f1a,
      emissiveIntensity: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    group.add(bodyMesh);

    // Wireframe overlay
    const wireframeGeometry = new THREE.EdgesGeometry(bodyGeometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    bodyMesh.add(wireframe);

    // Accent pieces
    const accentGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 32);
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x14b8a6,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0x14b8a6,
      emissiveIntensity: 0.3
    });
    
    const accent1 = new THREE.Mesh(accentGeometry, accentMaterial);
    accent1.position.set(-1.2, 0, 0);
    accent1.rotation.z = Math.PI / 2;
    group.add(accent1);

    const accent2 = new THREE.Mesh(accentGeometry, accentMaterial);
    accent2.position.set(1.2, 0, 0);
    accent2.rotation.z = Math.PI / 2;
    group.add(accent2);

    // Floating detail spheres
    const sphereGeometry = new THREE.SphereGeometry(0.15, 32, 32);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 1,
      roughness: 0,
      emissive: 0xf59e0b,
      emissiveIntensity: 0.4
    });

    for (let i = 0; i < 5; i++) {
      const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      const angle = (i / 5) * Math.PI * 2;
      sphere.position.set(
        Math.cos(angle) * 1.8,
        Math.sin(angle * 2) * 0.5,
        Math.sin(angle) * 1.8
      );
      group.add(sphere);
    }

    scene.add(group);
    sceneRef.current = { scene, camera, renderer, group };

    // Animation loop
    let animationId;
    const animate = () => {
      if (!isDragging) {
        group.rotation.y += 0.005;
      }
      
      // Floating animation
      group.position.y = Math.sin(Date.now() * 0.001) * 0.15;
      
      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', handleResize);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      scene.clear();
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    mouseStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !sceneRef.current) return;
    const deltaX = e.clientX - mouseStart.current.x;
    const deltaY = e.clientY - mouseStart.current.y;
    sceneRef.current.group.rotation.y += deltaX * 0.01;
    sceneRef.current.group.rotation.x += deltaY * 0.01;
    mouseStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    mouseStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !sceneRef.current) return;
    const deltaX = e.touches[0].clientX - mouseStart.current.x;
    const deltaY = e.touches[0].clientY - mouseStart.current.y;
    sceneRef.current.group.rotation.y += deltaX * 0.01;
    sceneRef.current.group.rotation.x += deltaY * 0.01;
    mouseStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full h-full"
    >
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: 'none' }}
      />
      
      {/* Interaction hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-slate-500 font-medium"
      >
        <span className="hidden md:inline">Click and drag to rotate</span>
        <span className="md:hidden">Swipe to rotate</span>
      </motion.div>
    </motion.div>
  );
}
