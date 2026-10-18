import { useEffect, useRef, useState } from 'react';
import { Logo } from './ui';

const LOGS = [
  'BOOTING FIREFLY CORE...',
  'CALIBRATING 5 RESEARCH DOMAINS...',
  'SYNCHRONIZING AMIEE CLUSTERS...',
  'CHARGING WEBGL FLUID MATRIX...',
  'FIREFLY READY.',
];

export default function Preloader() {
  const [percent, setPercent] = useState(0);
  const [logIndex, setLogIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [gone, setGone] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    // 1. Particle animation on canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const N = 40;
    const particles = Array.from({ length: N }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      r: 1 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.7,
      pulse: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      t += 0.03;
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < N; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const a = p.alpha * (0.6 + 0.4 * Math.sin(t + p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 170, 50, ${a})`;
        ctx.shadowColor = 'rgba(255, 140, 30, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
      }
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    // 2. Count-up progression
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 4) + 2;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setPercent(100);
        setLogIndex(LOGS.length - 1);
        setTimeout(() => setDismissed(true), 350);
        setTimeout(() => setGone(true), 1100);
      } else {
        setPercent(current);
        const idx = Math.min(LOGS.length - 2, Math.floor((current / 100) * (LOGS.length - 1)));
        setLogIndex(idx);
      }
    }, 28);

    return () => clearInterval(interval);
  }, []);

  if (gone) return null;

  return (
    <div className={`v3-loader ${dismissed ? 'is-dismissed' : ''}`} aria-hidden={dismissed}>
      <canvas ref={canvasRef} className="v3-loader-canvas" />

      <div className="v3-loader-center">
        <div className="v3-loader-logo-ring">
          <div className="v3-loader-ring r1" />
          <div className="v3-loader-ring r2" />
          <div className="v3-loader-logo">
            <Logo />
          </div>
        </div>

        <div className="v3-loader-pct">
          <span>{String(percent).padStart(2, '0')}</span>
          <span className="v3-loader-pct-sym">%</span>
        </div>

        <div className="v3-loader-bar-track">
          <div className="v3-loader-bar-fill" style={{ width: `${percent}%` }} />
        </div>

        <div className="v3-loader-status mono">
          <span className="v3-loader-dot" />
          {LOGS[logIndex]}
        </div>
      </div>

      <div className="v3-loader-corner top-left mono">FIREFLY // v3.0</div>
      <div className="v3-loader-corner top-right mono">SRMIST · AMIEE</div>
      <div className="v3-loader-corner bottom-left mono">LATENCY: 0.14ms</div>
      <div className="v3-loader-corner bottom-right mono">SECURE INITIALIZATION</div>
    </div>
  );
}
