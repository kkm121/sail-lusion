import { useEffect, useRef, useState } from 'react';

const TELEMETRY = [
  'BOOT_KERNEL // FIREFLY v4.0 PRO',
  'SYNC_CLUSTER // SRMIST · AMIEE LINK',
  'COMPUTE_ALLOC // 17 CREW · 5 DOMAINS',
  'SYSTEM_ONLINE // READY TO INITIALIZE',
];

export default function Preloader({ onComplete }) {
  const [percent, setPercent] = useState(0);
  const [telemetryIndex, setTelemetryIndex] = useState(0);
  const [dismissing, setDismissing] = useState(false);
  const [gone, setGone] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Lock scrolling while the preloader plays to avoid premature layout shifts
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    const startTime = performance.now();
    const duration = 950; // Snappy 950ms total sequence

    let rafId = 0;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Nonlinear snappy curve (accelerates smoothly to 100%)
      const pVal = Math.min(100, Math.round(Math.pow(progress, 0.9) * 100));
      setPercent(pVal);

      const tIdx = Math.min(TELEMETRY.length - 1, Math.floor(progress * TELEMETRY.length));
      setTelemetryIndex(tIdx);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Unlock immediately when curtains begin opening
        document.documentElement.style.overflow = '';
        setDismissing(true);
        setTimeout(() => {
          document.documentElement.style.overflow = '';
          setGone(true);
          onCompleteRef.current?.();
        }, 550);
      }
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      document.documentElement.style.overflow = '';
    };
  }, []);

  const handleSkip = () => {
    if (!dismissing) {
      document.documentElement.style.overflow = '';
      setPercent(100);
      setDismissing(true);
      setTimeout(() => {
        document.documentElement.style.overflow = '';
        setGone(true);
        onCompleteRef.current?.();
      }, 200);
    }
  };

  if (gone) return null;

  return (
    <div
      className={`v4-preloader ${dismissing ? 'is-dismissing' : ''}`}
      onClick={handleSkip}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="v4-curtain-top" />
      <div className="v4-curtain-bottom" />

      <div className="v4-preloader-core">
        <div className="v4-preloader-header mono">
          <div className="v4-preloader-status">
            <span className="v4-status-dot" />
            <span>SYS_INIT</span>
          </div>
          <span>[NOTHING // LINEAR]</span>
        </div>

        <div className="v4-preloader-brand">
          <h2 className="v4-preloader-title">
            FIREFLY <span>v4</span>
          </h2>
          <p className="v4-preloader-subtitle mono">STUDENT AI CLUB · SRMIST</p>
        </div>

        <div className="v4-preloader-meter">
          <div className="v4-meter-bar">
            <div className="v4-meter-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="v4-preloader-telemetry mono">
            <span className="v4-telemetry-log">
              [{String(telemetryIndex + 1).padStart(2, '0')}] {TELEMETRY[telemetryIndex]}
            </span>
            <span style={{ color: 'var(--ember)', fontWeight: 700 }}>{percent}%</span>
          </div>
        </div>

        <button type="button" className="v4-preloader-skip mono" onClick={handleSkip}>
          CLICK TO SKIP ↗
        </button>
      </div>
    </div>
  );
}
