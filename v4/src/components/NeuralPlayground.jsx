import { useEffect, useRef, useState } from 'react';

const ACTIVATIONS = {
  GELU: {
    fn: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3)))),
    name: 'GELU'
  },
  ReLU: {
    fn: (x) => Math.max(0, x),
    name: 'ReLU'
  },
  Tanh: {
    fn: (x) => Math.tanh(x),
    name: 'Tanh'
  },
  Sigmoid: {
    fn: (x) => 1 / (1 + Math.exp(-x)),
    name: 'Sigmoid'
  }
};

export default function NeuralPlayground() {
  const canvasRef = useRef(null);
  const [activeAct, setActiveAct] = useState('GELU');
  const [loss, setLoss] = useState(0.042);
  const [step, setStep] = useState(180);
  const [mode, setMode] = useState('decision'); // 'decision' | 'activation'

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf = 0;

    let time = 0;
    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 24;
      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const act = ACTIVATIONS[activeAct].fn;

      if (mode === 'decision') {
        // Render 2D decision boundary field
        const stepSize = 12;
        for (let x = 0; x < w; x += stepSize) {
          for (let y = 0; y < h; y += stepSize) {
            const nx = (x - w / 2) / (w / 4);
            const ny = (y - h / 2) / (h / 4);

            // Simple 2-layer feedforward projection
            const h1 = act(nx * 1.2 + ny * 0.8 + Math.sin(time * 0.5));
            const h2 = act(nx * -0.9 + ny * 1.4 + Math.cos(time * 0.5));
            const out = Math.sin(h1 * 2 - h2 * 2);

            const alpha = Math.min(0.35, Math.abs(out) * 0.4);
            if (out > 0) {
              ctx.fillStyle = `rgba(255, 90, 31, ${alpha})`; // FireFly Orange
            } else {
              ctx.fillStyle = `rgba(0, 245, 212, ${alpha})`; // Cyber Cyan
            }
            ctx.fillRect(x, y, stepSize, stepSize);
          }
        }

        // Render synthetic scatter nodes (Clusters)
        const numPts = 16;
        for (let i = 0; i < numPts; i++) {
          const angle = (i / numPts) * Math.PI * 2 + time * 0.1;
          const r = 60 + Math.sin(i * 3 + time) * 15;
          const px = w / 2 + Math.cos(angle) * r;
          const py = h / 2 + Math.sin(angle) * r;

          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ff5a1f' : '#00f5d4';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      } else {
        // Curve visualization mode
        ctx.beginPath();
        ctx.strokeStyle = '#ff5a1f';
        ctx.lineWidth = 2.5;

        for (let x = 0; x < w; x += 3) {
          const nx = (x - w / 2) / (w / 8);
          const ny = act(nx);
          const py = h / 2 - ny * (h / 6);

          if (x === 0) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [activeAct, mode]);

  const handleStep = () => {
    setStep((s) => s + 20);
    setLoss((l) => Math.max(0.008, parseFloat((l * 0.94).toFixed(4))));
  };

  return (
    <div className="v4-neural-box">
      <div className="v4-neural-header">
        <div className="v4-neural-title mono">
          <span className="v4-status-dot is-live" />
          <span>NEURAL KERNEL // TENSOR SIMULATOR</span>
        </div>
        <div className="v4-neural-telemetry mono">
          <span>LOSS: <b style={{ color: 'var(--accent)' }}>{loss}</b></span>
          <span>EPOCH: <b>{step}</b></span>
        </div>
      </div>

      <div className="v4-neural-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="v4-neural-canvas"
          width={560}
          height={320}
        />

        <div className="v4-neural-overlay-controls">
          <div className="v4-act-selector mono">
            {Object.keys(ACTIVATIONS).map((act) => (
              <button
                key={act}
                type="button"
                className={`v4-act-chip ${activeAct === act ? 'is-active' : ''}`}
                onClick={() => setActiveAct(act)}
              >
                {act}
              </button>
            ))}
          </div>

          <div className="v4-neural-actions">
            <button
              type="button"
              className="v4-step-btn mono"
              onClick={handleStep}
            >
              +20 EPOCHS
            </button>
            <button
              type="button"
              className="v4-step-btn mono"
              onClick={() => setMode(m => m === 'decision' ? 'activation' : 'decision')}
            >
              VIEW: {mode.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      <div className="v4-neural-caption mono">
        Feedforward Tensor Plane · Dual-layer projection showing live decision boundaries & gradient manifolds.
      </div>
    </div>
  );
}
