import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const STATUS_STEPS = [
  [75, 'SYSTEM ARCHITECTURE ONLINE'],
  [45, 'SYNCHRONIZING SPATIAL CORE...'],
  [20, 'CALIBRATING NEURAL FACETS...'],
  [0, 'INITIALIZING QUANTUM OPTICS...'],
];

const HARD_DEADLINE_MS = 8000;

export function LoadingSequence({ onComplete, onExited, sceneReady = true }) {
  const containerRef = useRef(null);
  const percentRef = useRef(null);
  const statusRef = useRef(null);
  const barRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const onExitedRef = useRef(onExited);
  const readyRef = useRef(sceneReady);
  const concludeRef = useRef(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onExitedRef.current = onExited;
  }, [onComplete, onExited]);

  useEffect(() => {
    readyRef.current = sceneReady;
    if (sceneReady) concludeRef.current?.();
  }, [sceneReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const brand = container.querySelector('.loader-brand');
    const letters = container.querySelectorAll('.loader-letter');
    const meta = container.querySelectorAll('.loader-meta');
    const counter = { val: 0 };
    let lastStatus = '';
    let holdReached = false;
    let concluded = false;
    let completed = false;
    let creep = null;

    const render = () => {
      const value = Math.min(Math.round(counter.val), 100);
      if (percentRef.current) percentRef.current.textContent = String(value);
      const status = STATUS_STEPS.find(([threshold]) => value >= threshold)[1];
      if (status !== lastStatus && statusRef.current) {
        statusRef.current.textContent = status;
        lastStatus = status;
      }
    };

    const finish = () => {
      if (completed) return;
      completed = true;
      onCompleteRef.current?.();
    };

    const lift = () => {
      finish();
      gsap.to(container, {
        yPercent: -100,
        opacity: 0,
        scale: 1.04,
        duration: 1.1,
        ease: 'power4.inOut',
        force3D: true,
        pointerEvents: 'none',
        onComplete: () => onExitedRef.current?.(),
      });
    };

    const conclude = () => {
      if (concluded || !holdReached) return;
      concluded = true;
      creep?.kill();
      const bar = barRef.current;
      if (bar) {
        bar.style.animation = 'none';
        bar.style.transform = 'scaleX(0.78)';
        void bar.offsetWidth;
        bar.style.transition = 'transform 0.5s ease';
        bar.style.transform = 'scaleX(1)';
      }
      gsap
        .timeline({ onComplete: lift })
        .to(counter, { val: 100, duration: 0.5, ease: 'power2.inOut', onUpdate: render })
        .to(brand, { scale: 1.04, duration: 0.3, ease: 'power2.out', force3D: true }, '-=0.25')
        .to(meta, { opacity: 0, duration: 0.25, ease: 'power1.in' }, '<')
        .to(brand, { opacity: 0, y: -24, duration: 0.4, ease: 'power3.in', force3D: true });
    };
    concludeRef.current = conclude;

    const ramp = gsap.to(counter, {
      val: 78,
      duration: 1.7,
      ease: 'power2.out',
      onUpdate: render,
      onComplete: () => {
        holdReached = true;
        creep = gsap.to(counter, { val: 96, duration: 8, ease: 'sine.out', onUpdate: render });
        if (readyRef.current) conclude();
      },
    });

    const deadline = setTimeout(() => {
      holdReached = true;
      conclude();
    }, HARD_DEADLINE_MS);

    return () => {
      clearTimeout(deadline);
      concludeRef.current = null;
      ramp.kill();
      creep?.kill();
      gsap.killTweensOf([counter, brand, container, letters, meta]);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-[#030407] flex flex-col items-center justify-between p-10 md:p-16 select-none font-mono will-change-transform"
    >
      <div className="loader-fade w-full flex items-center justify-between text-[9px] md:text-[10px] text-gray-500 tracking-[0.2em] md:tracking-[0.3em] uppercase whitespace-nowrap gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping"></span>
          <span>FIREFLY PROTOCOL v6.0</span>
        </div>
        <div className="loader-meta">SRMIST KTR<span className="hidden sm:inline"> // CHENNAI</span></div>
      </div>

      <div className="loader-brand flex flex-col items-center text-center will-change-transform">
        <img src="/brand/firefly-mark.png" alt="" aria-hidden="true" className="loader-letter w-24 h-24 md:w-32 md:h-32 object-contain mb-4 drop-shadow-[0_0_40px_rgba(255,80,30,0.55)]" />
        <h1 className="text-6xl md:text-9xl font-display font-black tracking-tighter text-white drop-shadow-[0_0_40px_rgba(255,90,40,0.35)] flex" aria-label="FireFly">
          {['F', 'I', 'R', 'E', 'F', 'L', 'Y'].map((letter, i) => (
            <span key={i} className="loader-letter inline-block" aria-hidden="true">{letter}</span>
          ))}
        </h1>
        <div className="loader-fade text-[10px] md:text-xs font-mono tracking-[0.3em] text-accent mt-3 uppercase">
          FireFly Student AI Club
        </div>
        <div className="loader-fade text-[9px] md:text-[10px] font-mono tracking-[0.25em] text-gray-500 mt-1.5 uppercase">
          associated with AMIEE
        </div>
        <div className="loader-fade text-[10px] md:text-[11px] text-gray-400 tracking-[0.15em] md:tracking-[0.25em] mt-6 flex items-center justify-center gap-2 md:gap-3 max-w-[92vw]">
          <span className="text-accent tabular-nums inline-flex justify-end min-w-[3.4ch]">
            <span ref={percentRef}>0</span>%
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-600"></span>
          <span ref={statusRef} className="text-gray-400">INITIALIZING QUANTUM OPTICS...</span>
        </div>
      </div>

      <div className="loader-fade w-full max-w-md flex flex-col items-center gap-3">
        <div className="w-full h-[2px] bg-white/[0.08] rounded-full overflow-hidden relative">
          <div
            ref={barRef}
            className="h-full w-full origin-left bg-gradient-to-r from-accent via-white to-accent shadow-[0_0_15px_#00F5D4] will-change-transform"
            style={{ transform: 'scaleX(0)', animation: 'loader-bar 1.7s cubic-bezier(0.2, 0.7, 0.2, 1) 0.2s forwards' }}
          />
        </div>
        <div className="text-[9px] text-gray-600 tracking-[0.25em] uppercase">
          ENGINEER • INNOVATE • LEAD
        </div>
        <div className="text-[11px] font-mono text-gray-400/80 tracking-[0.15em] mt-1">
          Website made by : <span className="text-gold-shine font-semibold">M Muthu Kumaran</span>
        </div>
      </div>
    </div>
  );
}
