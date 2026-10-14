import { useEffect, useRef, useState } from 'react';
import Ribbon from './Ribbon';
import SplitLine from './SplitLine';
import TransitionLink from './TransitionLink';
import GLMedia from './GLMedia';
import { HAVE, MEDIA } from '../data/media';

const isMobile = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);

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
    <div className="sl-duo" ref={tintRef} role="img" aria-label="SAIL work in progress">
      {SLIDES.map((src, k) => (
        <img key={src} src={src} alt="" loading="lazy" className={k === i ? 'is-on' : k === prev ? 'is-prev' : ''} />
      ))}
      <span className="tint" />
    </div>
  );
}

export default function Reel() {
  const sectionRef = useRef(null);
  const track = useRef(null);
  const stage = useRef(null);
  const card = useRef(null);
  const play = useRef(null);
  const duo = useRef(null);
  const modalVideo = useRef(null);
  const [open, setOpen] = useState(false);

  const [reelSrc] = useState(() => {
    const m = isMobile();
    if (HAVE.reel) return m ? MEDIA.reel.mobile : MEDIA.reel.desktop;
    return m ? MEDIA.reel.fallbackMobile : MEDIA.reel.fallbackDesktop;
  });

  useEffect(() => {
    const trackEl = track.current;
    if (!trackEl) return undefined;
    let raf = 0;
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const mobile = vw < 768;
      const r = trackEl.getBoundingClientRect();
      const warp = Math.pow(clamp(r.top / (vh * 0.92)), 1.25);
      const pin = clamp(-r.top / Math.max(r.height - vh, 1));
      const exit = clamp((pin - 0.62) / 0.38);
      const colour = 1 - clamp(pin / 0.45);

      const g = {
        x: warp * vw * (mobile ? 0.05 : 0.11),
        y: warp * vh * -0.0,
        rot: -0.22 * warp,
        scale: 1 - 0.36 * warp,
        skew: 0.62 * warp,
        bend: 0.42 * warp,
        blur: ease(exit) * 0.5,
        desat: ease(exit) * 0.45,
        lift: ease(exit) * 0.22,
      };
      if (card.current) {
        card.current.__gl = g;
        card.current.dataset.tint = String(clamp(warp * 1.1 + colour * 0.9, 0, 1));
      }
      if (play.current) {
        play.current.style.transform = `translate3d(${g.x}px, 0, 0) rotate(${g.rot}rad) scale(${g.scale})`;
        play.current.style.opacity = String(clamp(1 - warp * 1.6) * (1 - ease(exit)));
      }
      if (duo.current) {
        const pr = duo.current.getBoundingClientRect();
        const t = clamp((pr.top - vh * 0.1) / (vh * 0.75));
        duo.current.style.setProperty('--tint', String(0.15 + t * 0.85));
      }
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

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

  return (
    <section className="sl-reel" id="reel" ref={sectionRef}>
      <Ribbon section={sectionRef} track={track} />
      <h2 className="sl-reel-title">
        <span>
          <SplitLine text="Bold ideas," />
        </span>
        <span>
          <SplitLine text="built to think" delay={120} />
        </span>
      </h2>

      <div className="sl-reel-row">
        <Slideshow tintRef={duo} />
        <div className="sl-reel-content">
          <p>
            <SplitLine
              mode="word"
              text="It starts with a question. We are the SRM Artificial Intelligence Lab: students who build, research and ship intelligent systems together, from computer vision and language models to robotics and interactive 3D."
            />
          </p>
          <TransitionLink className="sl-pill sl-pill--white" href="/about" label="About us" data-magnetic>
            <i /> Meet the crew
          </TransitionLink>
        </div>
      </div>

      <div className="sl-reel-track" ref={track}>
        <div className="sl-reel-stage" ref={stage}>
          <GLMedia
            boxRef={card}
            video
            className="sl-reel-card"
            src={reelSrc}
            fallback={isMobile() ? MEDIA.reel.fallbackMobile : MEDIA.reel.fallbackDesktop}
            poster={MEDIA.reel.poster}
            radius={22}
            role="button"
            tabIndex={0}
            aria-label="Play reel"
            data-tint="1"
            onClick={() => setOpen(true)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setOpen(true)}
          >
            <div className="sl-reel-play" ref={play}>
              <span>PLAY</span>
              <span className="btn" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 4.5v15l13-7.5z" />
                </svg>
              </span>
              <span>REEL</span>
            </div>
          </GLMedia>
        </div>
      </div>

      <div className={`sl-overlay ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label="SAIL reel" onClick={() => setOpen(false)}>
        <button type="button" className="sl-overlay-close" onClick={() => setOpen(false)}>
          Close
        </button>
        {open && <video ref={modalVideo} className="sl-overlay-video" src={reelSrc} controls autoPlay playsInline onClick={(e) => e.stopPropagation()} />}
      </div>
    </section>
  );
}
