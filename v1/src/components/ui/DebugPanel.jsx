import React, { useEffect, useState } from 'react';

function read() {
  const canvas = document.querySelector('canvas');
  const info = window.__sailDebug || {};
  return {
    viewport: `${window.innerWidth} x ${window.innerHeight}`,
    screen: `${window.screen.width} x ${window.screen.height}`,
    dpr: window.devicePixelRatio,
    pageScale: window.visualViewport ? Number(window.visualViewport.scale.toFixed(2)) : 'n/a',
    touch: window.matchMedia('(hover: none), (pointer: coarse)').matches,
    memory: navigator.deviceMemory ?? 'n/a',
    cores: navigator.hardwareConcurrency ?? 'n/a',
    tier: info.tier || '-',
    post: info.post === undefined ? '-' : info.post ? 'on' : 'off',
    full: info.full === undefined ? '-' : info.full ? 'full' : 'reduced',
    renderDpr: info.dpr ? Number(info.dpr.toFixed(2)) : '-',
    canvas: canvas ? `${canvas.width} x ${canvas.height} (${((canvas.width * canvas.height) / 1e6).toFixed(2)} Mpx)` : 'none',
    sizes: (info.sizes || []).slice(-4).join(' > ') || '-',
    calls: info.calls ?? '-',
    zeroDraw: info.zeroDraw ?? 0,
    maxGap: info.maxGapMs ?? '-',
    losses: info.losses ?? 0,
    restores: info.restores ?? 0,
    envAt: info.envAt ? `${info.envAt} ms` : 'not yet',
    readyAt: info.readyAt ? `${info.readyAt} ms` : 'not yet',
    hidden: info.hiddenCount ?? 0,
  };
}

export function DebugPanel() {
  const [data, setData] = useState(read);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    const store = (window.__sailDebug = window.__sailDebug || {});
    const onVisibility = () => {
      if (document.hidden) store.hiddenCount = (store.hiddenCount || 0) + 1;
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timer = setInterval(() => setData(read()), 500);
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (now) => {
      frames += 1;
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      clearInterval(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <pre className="fixed left-2 top-16 z-[10001] max-w-[96vw] p-3 rounded-xl bg-black/90 border border-white/20 text-[10px] leading-4 text-green-300 font-mono whitespace-pre-wrap pointer-events-none">
      {[
        `layout viewport : ${data.viewport}`,
        `device screen   : ${data.screen}`,
        `pixel ratio     : ${data.dpr}   page scale: ${data.pageScale}`,
        `touch: ${data.touch}  memory: ${data.memory}  cores: ${data.cores}`,
        `3D tier         : ${data.tier}  glow-pass: ${data.post}  glass: ${data.full}`,
        `3D render ratio : ${data.renderDpr}`,
        `3D canvas       : ${data.canvas}`,
        `canvas sizes    : ${data.sizes}`,
        `draw calls      : ${data.calls}  zero-draw frames: ${data.zeroDraw}`,
        `longest frame   : ${data.maxGap} ms`,
        `GPU lost/restore: ${data.losses} / ${data.restores}`,
        `env loaded at   : ${data.envAt}`,
        `scene ready at  : ${data.readyAt}`,
        `tab hidden count: ${data.hidden}`,
        `fps             : ${fps}`,
      ].join('\n')}
    </pre>
  );
}
