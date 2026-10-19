import { useEffect, useRef, useState } from 'react';
import { Logo } from './ui';

const TELEMETRY = [
  { tag: 'SYS', text: 'INITIALIZING FIREFLY CORE ARCHITECTURE...' },
  { tag: 'CORE', text: 'SYNCHRONIZING 5 RESEARCH DOMAINS & MODELS...' },
  { tag: 'GPU', text: 'COMPILING WEBGL FLUID DYNAMICS & SHADERS...' },
  { tag: 'AMIEE', text: 'ESTABLISHING SECURE SRMIST CLUSTER UPLINK...' },
  { tag: 'READY', text: 'SYSTEM OPERATIONAL // WELCOME TO FIREFLY' },
];

export default function Preloader() {
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState(0);
  const [flash, setFlash] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [gone, setGone] = useState(false);

  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });

  // 1. Particle Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = (canvas.width = window.innerWidth * dpr);
    let h = (canvas.height = window.innerHeight * dpr);

    const onResize = () => {
      w = canvas.width = window.innerWidth * dpr;
      h = canvas.height = window.innerHeight * dpr;
    };
    window.addEventListener('resize', onResize);

    const onPointerMove = (e) => {
      mouseRef.current = {
        x: e.clientX * dpr,
        y: e.clientY * dpr,
        active: true,
      };
    };
    const onPointerLeave = () => {
      mouseRef.current.active = false;
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);

    const N = 100;
    const colors = [
      'rgba(255, 170, 50, ',
      'rgba(255, 110, 30, ',
      'rgba(255, 215, 70, ',
      'rgba(255, 60, 40, ',
    ];

    const particles = Array.from({ length: N }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * Math.max(w, h) * 0.45;
      return {
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.2 * dpr,
        vy: (Math.random() - 0.5) * 1.2 * dpr,
        baseR: (1 + Math.random() * 2.2) * dpr,
        alpha: 0.3 + Math.random() * 0.65,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        swirlSpeed: (0.003 + Math.random() * 0.006) * (Math.random() > 0.5 ? 1 : -1),
      };
    });

    let t = 0;
    const cx = () => w / 2;
    const cy = () => h / 2;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.02;

      ctx.clearRect(0, 0, w, h);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const mActive = mouseRef.current.active;

      // Draw particle constellation connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;
          const maxDist = 70 * dpr;
          if (distSq < maxDist * maxDist) {
            const dist = Math.sqrt(distSq);
            const lineAlpha = (1 - dist / maxDist) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(255, 160, 40, ${lineAlpha})`;
            ctx.lineWidth = 0.75 * dpr;
            ctx.stroke();
          }
        }
      }

      // Update & draw particles with vortex pull
      for (let i = 0; i < N; i++) {
        const p = particles[i];

        // Swirl around center
        const dx = p.x - cx();
        const dy = p.y - cy();
        const angle = Math.atan2(dy, dx) + p.swirlSpeed;
        const dist = Math.sqrt(dx * dx + dy * dy);

        p.x = cx() + Math.cos(angle) * dist + p.vx;
        p.y = cy() + Math.sin(angle) * dist + p.vy;

        // Gentle central gravity
        p.vx -= (dx / Math.max(dist, 10)) * 0.02 * dpr;
        p.vy -= (dy / Math.max(dist, 10)) * 0.02 * dpr;

        // Mouse interaction
        if (mActive) {
          const mdx = p.x - mx;
          const mdy = p.y - my;
          const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mDist < 140 * dpr) {
            const force = (1 - mDist / (140 * dpr)) * 3 * dpr;
            p.x += (mdx / (mDist || 1)) * force;
            p.y += (mdy / (mDist || 1)) * force;
          }
        }

        // Wrap around bounds
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        const a = p.alpha * (0.65 + 0.35 * Math.sin(t * 2 + p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.baseR, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a})`;
        ctx.shadowColor = 'rgba(255, 140, 30, 0.75)';
        ctx.shadowBlur = 10 * dpr;
        ctx.fill();
      }
    };

    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  // 2. Cinematic Loading Sequence Progression
  useEffect(() => {
    let current = 0;
    const start = performance.now();
    const duration = 2200; // 2.2 seconds total immersive sequence

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      // Nonlinear futuristic progression curve (snappy acceleration, sync checkpoints)
      const ease =
        progress < 0.4
          ? Math.pow(progress / 0.4, 1.4) * 0.4
          : progress < 0.85
          ? 0.4 + Math.pow((progress - 0.4) / 0.45, 0.9) * 0.45
          : 0.85 + Math.pow((progress - 0.85) / 0.15, 1.2) * 0.15;

      current = Math.min(100, Math.floor(ease * 100));
      setPercent(current);

      const stg = Math.min(
        TELEMETRY.length - 1,
        Math.floor((current / 100) * TELEMETRY.length)
      );
      setStage(stg);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        setPercent(100);
        setStage(TELEMETRY.length - 1);
        setFlash(true);
        setTimeout(() => setDismissed(true), 280);
        setTimeout(() => setGone(true), 1250);
      }
    };

    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Quick skip option on user click
  const handleSkip = () => {
    if (!dismissed) {
      setPercent(100);
      setFlash(true);
      setTimeout(() => setDismissed(true), 120);
      setTimeout(() => setGone(true), 850);
    }
  };

  if (gone) return null;

  // SVG circular gauge math: radius 84, circumference = 2 * PI * 84 ≈ 527.78
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div
      className={`v3-preloader ${dismissed ? 'is-dismissed' : ''}`}
      onClick={handleSkip}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {/* Supernova flash bloom on completion */}
      <div className={`v3-loader-flash ${flash ? 'is-flashing' : ''}`} />

      {/* Dual cinematic split curtains */}
      <div className="v3-curtain v3-curtain-top" />
      <div className="v3-curtain v3-curtain-bottom" />

      {/* Background cosmic vortex canvas */}
      <canvas ref={canvasRef} className="v3-canvas-layer" />

      {/* High-tech HUD grid overlay */}
      <div className="v3-hud-grid" />
      <div className="v3-hud-scanline" />

      {/* Main Center Hologram & Telemetry */}
      <div className="v3-content-core">
        {/* Holographic Circular Gauge */}
        <div className="v3-gauge-wrap">
          <svg className="v3-gauge-svg" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffb347" />
                <stop offset="50%" stopColor="#ff5a1d" />
                <stop offset="100%" stopColor="#ffd700" />
              </linearGradient>
              <filter id="gaugeGlow">
                <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background track circle */}
            <circle
              className="v3-gauge-bg"
              cx="100"
              cy="100"
              r={radius}
            />

            {/* Glowing animated progress arc */}
            <circle
              className="v3-gauge-bar"
              cx="100"
              cy="100"
              r={radius}
              stroke="url(#gaugeGradient)"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              filter="url(#gaugeGlow)"
            />
          </svg>

          {/* Rotating outer sci-fi compass rings */}
          <div className="v3-ring-outer" />
          <div className="v3-ring-inner" />
          <div className="v3-ring-ticks" />

          {/* Central Logo with breathing aura */}
          <div className="v3-emblem-wrap">
            <div className="v3-emblem-glow" />
            <Logo />
          </div>
        </div>

        {/* Master Brand Typography with Gold Sweep */}
        <div className="v3-title-wrap">
          <h1 className="v3-brand-title">FIREFLY</h1>
          <p className="v3-brand-sub">
            STUDENT AI CLUB · ASSOCIATED WITH AMIEE · SRMIST
          </p>
        </div>

        {/* Precision Kinetic Counter */}
        <div className="v3-counter-row">
          <span className="v3-counter-num">{String(percent).padStart(2, '0')}</span>
          <span className="v3-counter-pct">%</span>
        </div>

        {/* Equalizer Frequency Bars */}
        <div className="v3-eq-bar-wrap" aria-hidden="true">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="v3-eq-bar"
              style={{
                '--i': i,
                height: `${Math.max(12, Math.sin((i / 24) * Math.PI + percent * 0.1) * 38 + Math.random() * 8)}px`,
              }}
            />
          ))}
        </div>

        {/* Live System Diagnostics Feed */}
        {(() => {
          const currentTel = TELEMETRY[Math.max(0, Math.min(TELEMETRY.length - 1, stage))] || TELEMETRY[0];
          return (
            <div className="v3-telemetry-box">
              <div className="v3-telemetry-tag">
                <span className="v3-beacon" />
                [{currentTel.tag}]
              </div>
              <div className="v3-telemetry-text">
                {currentTel.text}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Cybernetic Edge HUD Elements */}
      <div className="v3-hud-corner top-left">
        <span className="mono">NODE // ALPHA-01</span>
        <span className="mono dim">MEM: 512MB POOL</span>
      </div>
      <div className="v3-hud-corner top-right">
        <span className="mono">VER // 3.0.4-RELEASE</span>
        <span className="mono dim">CLUSTER: AMIEE-SRM</span>
      </div>
      <div className="v3-hud-corner bottom-left">
        <span className="mono">LATENCY: 0.12ms</span>
        <span className="mono dim">TOPOLOGY: 5 DOMAINS</span>
      </div>
      <div className="v3-hud-corner bottom-right">
        <span className="mono">CLICK TO SKIP ↗</span>
      </div>
    </div>
  );
}
