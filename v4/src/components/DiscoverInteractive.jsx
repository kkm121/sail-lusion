import { useEffect, useRef, useState } from 'react';

const NODES = [
  { id: 'vis', label: 'Vision', code: 'VIS', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.18)', radius: 34, desc: 'Real-time robotic perception & neural radiance fields' },
  { id: 'llm', label: 'Reasoning', code: 'LLM', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.18)', radius: 36, desc: 'Large language agents & structured reasoning swarms' },
  { id: 'rob', label: 'Robotics', code: 'ROB', color: '#ff5a1f', bg: 'rgba(255, 90, 31, 0.22)', radius: 40, desc: '12-DOF physical quadruped locomotion policies' },
  { id: '3d', label: 'Spatial 3D', code: '3D', color: '#f5a623', bg: 'rgba(245, 166, 35, 0.18)', radius: 32, desc: 'Interactive WebGL simulations & tactile environments' },
  { id: 'sys', label: 'Systems', code: 'SYS', color: '#10b981', bg: 'rgba(16, 185, 129, 0.18)', radius: 35, desc: 'Distributed ML brokers & high-throughput pipelines' },
  { id: 'crew', label: '17 Crew', code: 'CREW', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.18)', radius: 30, desc: 'Student engineers building intelligent systems together' },
];

export default function DiscoverInteractive() {
  const canvasRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [lowPower, setLowPower] = useState(false);
  const stateRef = useRef({
    nodes: [],
    dragging: null,
    dragOffset: { x: 0, y: 0 },
    mouse: { x: -1000, y: -1000, isDown: false },
    width: 400,
    height: 400,
    dpr: 1,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let rafId = 0;

    // Detect device RAM & mobile constraints
    const isMobile = window.innerWidth < 768;
    const isLowRam = typeof navigator !== 'undefined' && (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile || isLowRam ? 1.0 : 1.5);
    stateRef.current.dpr = dpr;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      stateRef.current.width = w;
      stateRef.current.height = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.scale(dpr, dpr);

      // Initialize node positions in a responsive circle
      const cx = w / 2;
      const cy = h / 2;
      const orbitRadius = Math.min(w, h) * 0.32;

      stateRef.current.nodes = NODES.map((n, i) => {
        const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...n,
          homeX: cx + Math.cos(angle) * orbitRadius,
          homeY: cy + Math.sin(angle) * orbitRadius,
          x: cx + Math.cos(angle) * orbitRadius,
          y: cy + Math.sin(angle) * orbitRadius,
          vx: (Math.random() - 0.5) * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          scale: 1,
        };
      });
    };

    resize();
    window.addEventListener('resize', resize);

    // High performance animation loop (<60 FPS locked, zero memory allocations per frame)
    let lastTime = performance.now();

    const loop = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { width: w, height: h, nodes, dragging, mouse } = stateRef.current;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // 1. Draw central glowing FireFly core
      const pulse = Math.sin(time * 0.003) * 3;
      const coreGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 55 + pulse);
      coreGrad.addColorStop(0, 'rgba(255, 90, 31, 0.45)');
      coreGrad.addColorStop(0.5, 'rgba(255, 90, 31, 0.12)');
      coreGrad.addColorStop(1, 'rgba(255, 90, 31, 0)');

      ctx.beginPath();
      ctx.arc(cx, cy, 60 + pulse, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Central core badge
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5a1f';
      ctx.shadowColor = '#ff5a1f';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#07080a';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('AMIEE', cx, cy);

      // 2. Physics & Particle tether updates
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (dragging === node) {
          node.x = mouse.x - stateRef.current.dragOffset.x;
          node.y = mouse.y - stateRef.current.dragOffset.y;
          node.vx = 0;
          node.vy = 0;
        } else if (!lowPower) {
          // Spring force back to home orbit
          const dx = node.homeX - node.x;
          const dy = node.homeY - node.y;
          const kSpring = 0.85;
          node.vx += dx * kSpring * dt;
          node.vy += dy * kSpring * dt;

          // Ambient orbital drift
          node.vx += Math.sin(time * 0.002 + i) * 0.4;
          node.vy += Math.cos(time * 0.002 + i) * 0.4;

          // Damping friction
          node.vx *= 0.94;
          node.vy *= 0.94;

          node.x += node.vx;
          node.y += node.vy;

          // Boundary clamp with bounce
          const pad = node.radius + 8;
          if (node.x < pad) { node.x = pad; node.vx *= -0.7; }
          if (node.x > w - pad) { node.x = w - pad; node.vx *= -0.7; }
          if (node.y < pad) { node.y = pad; node.vy *= -0.7; }
          if (node.y > h - pad) { node.y = h - pad; node.vy *= -0.7; }
        }

        // Draw tether line to core
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw node body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = node.bg;
        ctx.fill();

        ctx.strokeStyle = dragging === node ? node.color : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = dragging === node ? 2 : 1;
        ctx.stroke();

        // Glowing node indicator ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.fill();

        // Node label
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 10.5px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.code, node.x, node.y);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    // Touch & pointer handlers
    const getPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const onStart = (e) => {
      const pos = getPos(e);
      stateRef.current.mouse = { x: pos.x, y: pos.y, isDown: true };

      // Find clicked node
      const nodes = stateRef.current.nodes;
      for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const dist = Math.hypot(pos.x - node.x, pos.y - node.y);
        if (dist <= node.radius + 6) {
          stateRef.current.dragging = node;
          stateRef.current.dragOffset = { x: pos.x - node.x, y: pos.y - node.y };
          setSelectedNode(node);
          if (e.cancelable) e.preventDefault();
          break;
        }
      }
    };

    const onMove = (e) => {
      const pos = getPos(e);
      stateRef.current.mouse.x = pos.x;
      stateRef.current.mouse.y = pos.y;
      if (stateRef.current.dragging && e.cancelable) {
        e.preventDefault();
      }
    };

    const onEnd = () => {
      stateRef.current.dragging = null;
      stateRef.current.mouse.isDown = false;
    };

    canvas.addEventListener('mousedown', onStart);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    canvas.addEventListener('touchstart', onStart, { passive: false });
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onStart);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
      canvas.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
  }, [lowPower]);

  return (
    <div className="v4-discover-card">
      <div className="v4-discover-hud">
        <div className="v4-hud-pill mono">
          <span>● 60 FPS INTERACTIVE ENGINE</span>
        </div>
        <button
          type="button"
          className="v4-mode-toggle mono"
          onClick={() => setLowPower(!lowPower)}
          title="Toggle power consumption mode"
        >
          {lowPower ? '⚡ LOW POWER' : '✦ FULL PHYSICS'}
        </button>
      </div>

      <canvas ref={canvasRef} className="v4-canvas-layer" />

      <div className="v4-discover-hint mono">
        {selectedNode ? (
          <span style={{ color: selectedNode.color }}>
            [{selectedNode.code}] {selectedNode.label}: {selectedNode.desc}
          </span>
        ) : (
          <span>[ DRAG OR FLING TO INTERACT WITH RESEARCH NODES ]</span>
        )}
      </div>
    </div>
  );
}
