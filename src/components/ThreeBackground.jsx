import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeBackground() {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const colors = [0xf59e0b, 0x14b8a6, 0xf97316];

    const objects = [];

    for (let i = 0; i < 15; i += 1) {
      const size = 0.6 + Math.random() * 0.8;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        wireframe: true,
        transparent: true,
        opacity: 0.85
      });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (Math.random() - 0.5) * 18,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      scene.add(cube);
      objects.push({
        mesh: cube,
        rotSpeed: 0.003 + Math.random() * 0.006,
        floatSpeed: 0.002 + Math.random() * 0.003,
        offset: Math.random() * Math.PI * 2
      });
    }

    for (let i = 0; i < 10; i += 1) {
      const radius = 0.4 + Math.random() * 0.6;
      const geometry = new THREE.SphereGeometry(radius, 20, 20);
      const material = new THREE.MeshBasicMaterial({
        color: colors[(i + 1) % colors.length],
        wireframe: true,
        transparent: true,
        opacity: 0.75
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 9,
        (Math.random() - 0.5) * 10
      );
      scene.add(sphere);
      objects.push({
        mesh: sphere,
        rotSpeed: 0.002 + Math.random() * 0.004,
        floatSpeed: 0.003 + Math.random() * 0.004,
        offset: Math.random() * Math.PI * 2
      });
    }

    const handleMouseMove = (event) => {
      const rect = container.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      mouseRef.current = { x, y };
    };

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    const animate = () => {
      const time = performance.now() * 0.001;
      const targetX = mouseRef.current.x * 1.5;
      const targetY = mouseRef.current.y * 1.0;

      camera.position.x += (targetX - camera.position.x) * 0.05;
      camera.position.y += (targetY - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      objects.forEach((obj) => {
        const { mesh, rotSpeed, floatSpeed, offset } = obj;
        mesh.rotation.x += rotSpeed;
        mesh.rotation.y += rotSpeed * 1.1;
        mesh.position.y += Math.sin(time + offset) * floatSpeed;
      });

      renderer.render(scene, camera);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      objects.forEach(({ mesh }) => {
        mesh.geometry.dispose();
        mesh.material.dispose();
      });
      renderer.dispose();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0" aria-hidden="true" />;
}
