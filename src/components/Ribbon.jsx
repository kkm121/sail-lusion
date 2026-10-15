import { useEffect, useRef, useState } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { useDocRect } from '../lib/measure';

const PATHS = {
  intro: (p) =>
    [
      `M ${p(-0.05, 0.04)}`,
      `C ${p(0.12, -0.02)} ${p(0.3, 0.01)} ${p(0.35, 0.13)}`,
      `C ${p(0.4, 0.26)} ${p(0.14, 0.3)} ${p(0.09, 0.42)}`,
      `C ${p(0.04, 0.54)} ${p(0.0, 0.76)} ${p(0.14, 0.82)}`,
      `C ${p(0.3, 0.88)} ${p(0.58, 0.8)} ${p(0.7, 0.9)}`,
      `C ${p(0.82, 1.0)} ${p(0.98, 0.98)} ${p(1.06, 1.08)}`,
    ].join(' '),
  lab: (p) =>
    [
      `M ${p(0.62, -0.05)}`,
      `C ${p(0.5, 0.1)} ${p(0.46, 0.34)} ${p(0.62, 0.42)}`,
      `C ${p(0.82, 0.5)} ${p(1.0, 0.32)} ${p(1.06, 0.2)}`,
    ].join(' '),
};

export default function Ribbon({ section, track, variant = 'intro', stops = ['#00f5d4', '#38bdf8', '#8b5cf6', '#f5c84b'], span, drawRef }) {
  const [geom, setGeom] = useState(null);
  const main = useRef(null);
  const shine = useRef(null);
  const glow = useRef(null);
  const region = useRef({ top: 0, height: 1 });
  const gid = useRef(`sl-rg-${variant}`).current;
  const secRect = useDocRect(section);

  useEffect(() => {
    const sec = section.current;
    const tr = track?.current;
    if (!sec) return undefined;

    const measure = () => {
      const w = sec.offsetWidth;
      const h = span ? span(sec, tr) : tr.offsetTop + window.innerHeight * 0.2;
      region.current = { top: 0, height: h };
      const p = (x, y) => `${(x * w).toFixed(1)},${(y * h).toFixed(1)}`;
      setGeom({ d: PATHS[variant](p), w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(sec);

    const apply = (p) => {
      for (const el of [main.current, shine.current, glow.current]) {
        if (!el) continue;
        el.style.strokeDashoffset = String(1 - p);
        el.style.opacity = p > 0.003 ? '1' : '0';
      }
    };
    if (drawRef) {
      drawRef.current = apply;
      return () => ro.disconnect();
    }
    let lastP = -1;
    const stop = onTick(() => {
      const top = secRect.top - scrollState.y;
      const p = Math.min(1, Math.max(0, (scrollState.vh * 0.8 - top) / (region.current.height + scrollState.vh * 0.1)));
      if (Math.abs(p - lastP) > 0.0004) {
        lastP = p;
        apply(p);
      }
    }, 6);
    return () => {
      ro.disconnect();
      stop();
    };
  }, [section, track, variant, span, drawRef]);

  if (!geom) return null;
  return (
    <svg className="sl-ribbon" width={geom.w} height={geom.h} viewBox={`0 0 ${geom.w} ${geom.h}`} aria-hidden="true">
      <defs>
        <linearGradient id={gid} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={geom.w} y2={geom.h}>
          {stops.map((c, i) => (
            <stop key={c} offset={i / (stops.length - 1)} stopColor={c} />
          ))}
        </linearGradient>
      </defs>
      <path ref={glow} d={geom.d} pathLength={1} className="glow" stroke={stops[0]} />
      <path ref={main} d={geom.d} pathLength={1} className="main" stroke={`url(#${gid})`} />
      <path ref={shine} d={geom.d} pathLength={1} className="shine" />
    </svg>
  );
}
