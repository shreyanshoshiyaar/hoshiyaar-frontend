import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let animationId;
    let renderer;
    let resizeObserver;

    const initThree = () => {
      const THREE = window.THREE;
      if (!containerRef.current || !THREE) return;
      
      const container = containerRef.current;
      container.innerHTML = '';

      let width = container.clientWidth;
      let height = container.clientHeight;

      // 1. Scene & Fog Setup
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x0a0a0c, 0.0012);

      // 2. Camera Setup
      const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
      camera.position.z = 500;

      // 3. Geometry Setup
      const particleCount = 20000;
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount);
      const colors = new Float32Array(particleCount * 3);

      const color1 = new THREE.Color("#00ffcc");
      const color2 = new THREE.Color("#7000ff");

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = Math.random() * 2000 - 1000;
        positions[i * 3 + 1] = Math.random() * 2000 - 1000;
        positions[i * 3 + 2] = Math.random() * 2000 - 1000;

        velocities[i] = Math.random() * 2;

        const mixRatio = (positions[i * 3 + 1] + 1000) / 2000;
        const mixedColor = color1.clone().lerp(color2, mixRatio);

        colors[i * 3] = mixedColor.r;
        colors[i * 3 + 1] = mixedColor.g;
        colors[i * 3 + 2] = mixedColor.b;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

      // 4. Material Setup
      const material = new THREE.PointsMaterial({
        size: 2.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      // 5. Points Object
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      // 6. Renderer Setup
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);

      container.appendChild(renderer.domElement);

      const xSpeed = 0.0008;
      const ySpeed = 0.002;

      function animate() {
        animationId = requestAnimationFrame(animate);

        points.rotation.y += xSpeed;

        const positionAttribute = points.geometry.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          let y = positionAttribute.getY(i);
          velocities[i] += Math.random() * ySpeed;
          y += velocities[i];
          if (y > 1000) {
            y = -1000;
            velocities[i] = Math.random() * 2;
          }
          positionAttribute.setY(i, y);
        }
        positionAttribute.needsUpdate = true;

        camera.lookAt(scene.position);
        renderer.render(scene, camera);
      }

      // Handle Resize via ResizeObserver
      resizeObserver = new ResizeObserver(entries => {
        if (!containerRef.current) return;
        for (let entry of entries) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      });
      resizeObserver.observe(container);

      animate();
    };

    if (!window.THREE) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = initThree;
      document.head.appendChild(script);
    } else {
      initThree();
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (renderer) renderer.dispose();
      if (resizeObserver) resizeObserver.disconnect();
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full z-0 bg-transparent overflow-hidden rounded-[inherit]"></div>;
};

export default ParticleBackground;
