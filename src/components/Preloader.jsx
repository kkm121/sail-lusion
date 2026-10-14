import { useEffect, useMemo, useRef, useState } from 'react';
import PreloaderBlob from './PreloaderBlob';
import { SITE } from '../data/site';
import { artUrl, projects } from '../data/projects';
import '../styles/loader.css';

let seen = false;

const STACK = Array.from({ length: 101 }, (_, i) => i % 10);

function Digit({ n }) {
  return (
    <span className="col">
      <span className="stack" style={{ '--n': n }}>
        {STACK.map((d, i) => (
          <i key={i}>{d}</i>
        ))}
      </span>
    </span>
  );
}

export default function Preloader({ onReady }) {
  const [done, setDone] = useState(false);
  const [phase, setPhase] = useState('load');
  const [value, setValue] = useState(0);
  const fill = useRef(null);

  useEffect(() => {
    if (seen) {
      onReady?.();
      return undefined;
    }
    document.documentElement.style.overflow = 'hidden';
    window.scrollTo(0, 0);
    let loaded = document.readyState === 'complete';
    let fonts = false;
    let images = false;
    const onLoad = () => (loaded = true);
    window.addEventListener('load', onLoad);
    document.fonts.ready.then(() => (fonts = true));
    Promise.all(
      projects.slice(0, 4).map(
        (p) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = resolve;
            img.src = artUrl(p);
          })
      )
    ).then(() => (images = true));

    const timers = [];
    const later = (fn, ms) => timers.push(window.setTimeout(fn, ms));
    const duration = 1500;
    let last = performance.now();
    let v = 0;
    let finished = false;
    const tick = window.setInterval(() => {
      const now = performance.now();
      const dt = Math.min(now - last, 500);
      last = now;
      const cap = loaded && fonts && images ? 100 : 91;
      const rate = (dt / duration) * 100 * (0.55 + 0.9 * Math.sin((Math.min(v, 100) / 100) * Math.PI));
      v = Math.min(cap, v + Math.max(rate, dt / 2200));
      const p = Math.min(100, v);
      if (fill.current) fill.current.style.transform = `scaleX(${p / 100})`;
      setValue(Math.round(p));
      if (p >= 99.9 && !finished) {
        finished = true;
        clearInterval(tick);
        later(() => setPhase('mark'), 100);
        later(() => {
          setPhase('open');
          document.documentElement.style.overflow = '';
          onReady?.();
        }, 750);
        later(() => {
          window.scrollTo(0, 0);
          seen = true;
          setDone(true);
        }, 1750);
      }
    }, 30);

    later(() => {
      onReady?.();
      document.documentElement.style.overflow = '';
      seen = true;
      setDone(true);
    }, 5500);

    return () => {
      clearInterval(tick);
      timers.forEach(clearTimeout);
      window.removeEventListener('load', onLoad);
      document.documentElement.style.overflow = '';
    };
  }, [onReady]);

  const digits = useMemo(() => {
    const h = Math.floor(value / 100);
    const t = Math.floor(value / 10);
    return [h, t, value];
  }, [value]);

  if (done || seen) return null;
  return (
    <div className={`sl-pre sl-preloader is-${phase}`} aria-hidden="true" role="presentation">
      <div className="sl-pre-half a" />
      <div className="sl-pre-half b" />
      <PreloaderBlob progress={value} phase={phase} />
      <div className="sl-pre-top">
        <span className="brand">SAIL</span>
        <span>{SITE.fullName}</span>
        <span>{SITE.tagline}</span>
      </div>
      <div className="sl-pre-stage">
        <div className="sl-pre-bar">
          <span className="track" />
          <span className="fill" ref={fill} />
        </div>
        <span className="sl-pre-sail" />
        <span className="sl-pre-hull" />
      </div>
      <div className="sl-pre-digits">
        <Digit n={digits[0]} />
        <Digit n={digits[1]} />
        <Digit n={digits[2]} />
      </div>
      <div className="sl-pre-credit">Website made by {SITE.creator}</div>
    </div>
  );
}
