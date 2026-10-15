import { useEffect, useRef, useState } from 'react';
import Ribbon from './Ribbon';
import TransitionLink from './TransitionLink';
import GLMedia from './GLMedia';
import { HAVE, MEDIA } from '../data/media';

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
  const title = useRef(null);
  const ln1 = useRef(null);
  const ln2 = useRef(null);
  const desc = useRef(null);
  const descIn = useRef(null);
  const cta = useRef(null);
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
      // The card is never pinned: it rises with the page and straightens as it reaches the middle of the screen.
      const c = (r.top + r.height / 2 - vh / 2) / vh;
      const warp = Math.pow(clamp(c / 0.62), 1.1);
      const colour = clamp(warp * 1.2);

      const g = {
        x: warp * vw * (mobile ? 0.05 : 0.11),
        y: warp * vh * -0.0,
        rot: -0.22 * warp,
        scale: 1 - 0.36 * warp,
        skew: 0.62 * warp,
        bend: 0.42 * warp,
        blur: 0,
        desat: 0,
        lift: 0,
      };
      if (card.current) {
        card.current.__gl = g;
        card.current.dataset.tint = String(clamp(warp * 1.1 + colour * 0.3, 0, 1));
      }
      if (play.current) {
        play.current.style.transform = `translate3d(${g.x}px, 0, 0) rotate(${g.rot}rad) scale(${g.scale})`;
        play.current.style.opacity = String(clamp(1 - warp * 1.3));
      }
      // Text motion measured from lusion.co: the two title lines scissor in (one rises from below while
      // sliding in from the left, the other drops from above), the copy fades up 30px with 0.13 parallax.
      const fs = parseFloat(getComputedStyle(title.current).fontSize) || 120;
      const rel = (el) => el.getBoundingClientRect().top / vh;
      const par = mobile ? 0 : 0.13;
      if (ln1.current) {
        const t = rel(ln1.current.parentElement);
        const ty = (1 - sm(clamp((1.13 - t) / 0.36))) * fs * 1.07;
        const tx = -(1 - sm(clamp((0.9 - t) / 0.34))) * fs * 1.64 * (mobile ? 0.5 : 1);
        ln1.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
      if (ln2.current) {
        const t = rel(ln2.current.parentElement);
        ln2.current.style.transform = `translate3d(0, ${-(1 - sm(clamp((1.13 - t) / 0.3))) * fs * 1.07}px, 0)`;
      }
      if (desc.current) {
        const t = rel(desc.current);
        const p = clamp((1.12 - t) / 0.42);
        desc.current.style.transform = `translate3d(0, ${par * vh * (t - 1)}px, 0)`;
        descIn.current.style.opacity = String(sm(clamp(p * 1.25)));
        descIn.current.style.transform = `translate3d(0, ${30 * (1 - sm(clamp(p * 1.3)))}px, 0)`;
      }
      if (cta.current) {
        const t = rel(cta.current);
        const p = clamp((1.1 - t) / 0.26);
        cta.current.style.opacity = String(0.6 + 0.4 * sm(p));
        cta.current.style.transform = `translate3d(0, ${par * vh * (t - 1) + 24 * (1 - sm(p))}px, 0) skewY(${3.4 * (1 - sm(p))}deg)`;
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
      <h2 className="sl-reel-title" ref={title}>
        <span className="ln">
          <span ref={ln1}>Bold ideas,</span>
        </span>
        <span className="ln">
          <span ref={ln2}>built to think</span>
        </span>
      </h2>

      <div className="sl-reel-row">
        <Slideshow tintRef={duo} />
        <div className="sl-reel-content">
          <div ref={desc}>
            <p ref={descIn}>It starts with a question. We are the SRM Artificial Intelligence Lab: students who build, research and ship intelligent systems together, from computer vision and language models to robotics and interactive 3D.</p>
          </div>
          <div className="sl-reel-cta" ref={cta}>
            <TransitionLink className="sl-pill sl-pill--white" href="/about" label="About us" data-magnetic>
              <i /> Meet the crew
            </TransitionLink>
          </div>
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
