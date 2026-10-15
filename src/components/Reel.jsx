import { useEffect, useRef, useState } from 'react';
import Ribbon from './Ribbon';
import TransitionLink from './TransitionLink';
import ReelCard from './ReelCard';
import { HAVE, MEDIA } from '../data/media';
import { scrollState } from '../lib/scroll';
import { useDocRect } from '../lib/measure';
import { useTick } from '../lib/useTick';
import { canGL } from '../lib/device';

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sm = (t) => t * t * (3 - 2 * t);

const REAL = [HAVE.crew && MEDIA.crew.src, HAVE.build && MEDIA.build.src].filter(Boolean);
const SLIDES = REAL.length
  ? REAL
  : ['/media/crew.jpg', '/media/build.jpg', '/media/projects/engineering-handbook.jpg', '/media/projects/robotics-sim.jpg'];

function Slideshow({ tintRef }) {
  const [i, setI] = useState(0);
  const [prev, setPrev] = useState(-1);

  useEffect(() => {
    if (SLIDES.length < 2) return undefined;
    const id = window.setInterval(() => {
      setI((cur) => {
        setPrev(cur);
        return (cur + 1) % SLIDES.length;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sl-duo" ref={tintRef} role="img" aria-label="FireFly work in progress">
      {SLIDES.map((src, k) => (
        <img key={src} src={src} alt="" loading="lazy" decoding="async" className={k === i ? 'is-on' : k === prev ? 'is-prev' : ''} />
      ))}
      <span className="tint" />
    </div>
  );
}

const Crosses = ({ side }) => (
  <div className={`sl-reel-cross ${side}`} aria-hidden="true">
    {[0, 1, 2, 3, 4].map((k) => (
      <span key={k}>+</span>
    ))}
  </div>
);

const PlayLabel = ({ playRef }) => (
  <div className="sl-reel-play" ref={playRef}>
    <span>PLAY</span>
    <span className="btn" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 4.5v15l13-7.5z" />
      </svg>
    </span>
    <span>REEL</span>
  </div>
);

export default function Reel() {
  const sectionRef = useRef(null);
  const track = useRef(null);
  const title = useRef(null);
  const ln1Box = useRef(null);
  const ln1 = useRef(null);
  const ln2Box = useRef(null);
  const ln2 = useRef(null);
  const descBox = useRef(null);
  const descMove = useRef(null);
  const descIn = useRef(null);
  const ctaBox = useRef(null);
  const cta = useRef(null);
  const duo = useRef(null);
  const card = useRef(null);
  const play = useRef(null);
  const modalVideo = useRef(null);
  const warp = useRef({ x: 0, y: 0, rot: 0, scale: 1, skew: 0, bend: 0, tint: 1, lum: 1 });
  const fontPx = useRef({ vw: 0, px: 120 });
  const [open, setOpen] = useState(false);

  const rTrack = useDocRect(track);
  const rLn1 = useDocRect(ln1Box);
  const rLn2 = useDocRect(ln2Box);
  const rDesc = useDocRect(descBox);
  const rCta = useDocRect(ctaBox);
  const rDuo = useDocRect(duo);

  const [reelSrc] = useState(() => {
    const m = isMobile();
    if (HAVE.reel) return m ? MEDIA.reel.mobile : MEDIA.reel.desktop;
    return m ? MEDIA.reel.fallbackMobile : MEDIA.reel.fallbackDesktop;
  });
  const gl = canGL();

  useTick(() => {
    if (!rTrack.ready) return;
    const { y, vh, vw } = scrollState;
    const mobile = vw < 768;
    const rel = (r) => (r.top - y) / vh;

    // The card is never pinned: it rises with the page and straightens as it reaches the middle of the screen.
    const c = (rTrack.top + rTrack.height / 2 - y - vh / 2) / vh;
    const w = clamp(c / 0.62) ** 1.1;
    const g = warp.current;
    g.x = w * vw * (mobile ? 0.05 : 0.11);
    g.rot = -0.22 * w;
    g.scale = 1 - 0.36 * w;
    g.skew = 0.62 * w;
    g.bend = 0.42 * w;
    g.tint = clamp(w * 1.1 + (1 - w) * 0.02, 0, 1);
    if (play.current) {
      play.current.style.transform = `translate3d(${g.x}px, 0, 0) rotate(${g.rot}rad) scale(${g.scale})`;
      play.current.style.opacity = String(clamp(1 - w * 1.3));
    }
    if (!gl && card.current) {
      card.current.style.transform = `perspective(1500px) translate3d(${g.x}px,0,0) rotate(${g.rot}rad) rotateX(${w * 14}deg) scale(${g.scale})`;
      card.current.style.opacity = String(1 - w * 0.12);
    }

    // Text motion measured from lusion.co: title lines scissor in, the copy fades up with 0.15 parallax.
    if (fontPx.current.vw !== vw && title.current) {
      fontPx.current = { vw, px: parseFloat(getComputedStyle(title.current).fontSize) || 120 };
    }
    const fs = fontPx.current.px;
    if (ln1.current) {
      const t = rel(rLn1);
      const ty = (1 - sm(clamp((1.13 - t) / 0.36))) * fs * 1.07;
      const tx = -(1 - sm(clamp((0.9 - t) / 0.34))) * fs * 1.64 * (mobile ? 0.45 : 1);
      ln1.current.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
    }
    if (ln2.current) {
      const t = rel(rLn2);
      ln2.current.style.transform = `translate3d(0, ${(-(1 - sm(clamp((1.13 - t) / 0.3))) * fs * 1.07).toFixed(2)}px, 0)`;
    }
    const par = mobile ? 0 : 0.15;
    if (descMove.current) {
      const t = rel(rDesc);
      const p = clamp((1.12 - t) / 0.42);
      descMove.current.style.transform = `translate3d(0, ${(par * vh * (t - 1)).toFixed(2)}px, 0)`;
      descIn.current.style.opacity = sm(clamp(p * 1.25)).toFixed(3);
      descIn.current.style.transform = `translate3d(0, ${(30 * (1 - sm(clamp(p * 1.3)))).toFixed(2)}px, 0)`;
    }
    if (cta.current) {
      const t = rel(rCta);
      const p = clamp((1.1 - t) / 0.26);
      cta.current.style.opacity = (0.6 + 0.4 * sm(p)).toFixed(3);
      cta.current.style.transform = `translate3d(0, ${(par * vh * (t - 1) + 24 * (1 - sm(p))).toFixed(2)}px, 0) skewY(${(3.4 * (1 - sm(p))).toFixed(2)}deg)`;
    }
    if (duo.current) {
      const t = clamp((rel(rDuo) - 0.1) / 0.75);
      duo.current.style.setProperty('--tint', (0.15 + t * 0.85).toFixed(3));
    }
  }, 5);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    const v = modalVideo.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const openProps = {
    role: 'button',
    tabIndex: 0,
    'aria-label': 'Play reel',
    onClick: () => setOpen(true),
    onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true),
  };

  return (
    <section className="sl-reel" id="reel" ref={sectionRef}>
      <Ribbon section={sectionRef} track={track} />
      <h2 className="sl-reel-title" ref={title}>
        <span className="ln" ref={ln1Box}>
          <span ref={ln1}>Bold ideas,</span>
        </span>
        <span className="ln" ref={ln2Box}>
          <span ref={ln2}>built to think</span>
        </span>
      </h2>

      <div className="sl-reel-row">
        <Slideshow tintRef={duo} />
        <div className="sl-reel-content">
          <div className="sl-reel-desc" ref={descBox}>
            <div ref={descMove}>
              <p ref={descIn}>It starts with a question. We are the FireFly Club: students who build, research and ship intelligent systems together, from computer vision and language models to robotics and interactive 3D.</p>
            </div>
          </div>
          <div className="sl-reel-ctabox" ref={ctaBox}>
            <div className="sl-reel-cta" ref={cta}>
              <TransitionLink className="sl-pill sl-pill--white" href="/about" label="About us" data-magnetic>
                <i /> Meet the crew
              </TransitionLink>
            </div>
          </div>
        </div>
      </div>

      <div className="sl-reel-track" ref={track}>
        <Crosses side="top" />
        <div className="sl-reel-stage">
          {gl ? (
            <ReelCard warp={warp} src={reelSrc} fallback={isMobile() ? MEDIA.reel.fallbackMobile : MEDIA.reel.fallbackDesktop} poster={MEDIA.reel.poster} {...openProps}>
              <PlayLabel playRef={play} />
            </ReelCard>
          ) : (
            <div className="sl-reel-card sl-reel-card--flat" ref={card} {...openProps}>
              <video className="sl-reel-vid is-flat" src={reelSrc} poster={MEDIA.reel.poster} muted loop autoPlay playsInline preload="auto" />
              <PlayLabel playRef={play} />
            </div>
          )}
        </div>
        <Crosses side="bottom" />
      </div>

      <div className={`sl-overlay ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="FireFly reel" onClick={() => setOpen(false)}>
        <button type="button" className="sl-overlay-close" onClick={() => setOpen(false)}>
          Close
        </button>
        {open && <video ref={modalVideo} className="sl-overlay-video" src={reelSrc} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />}
      </div>
    </section>
  );
}
