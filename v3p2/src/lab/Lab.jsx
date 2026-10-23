import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SplitLine from './SplitLine';
import { CHAPTERS, ROOM_START, pAtZ } from './journey';
import { labState } from './labstate';
import { onFrame, reduced } from '../lib/motion';
import { isLite } from '../lib/lite';
import './lab.css';

// The 3D voyage is its own chunk (three.js, react-three-fiber, post-processing): it is only downloaded and mounted near the section.
const LabScene = lazy(() => import('./LabScene'));

// full: everything, as in v2. lite: one pixel per pixel, no post-processing, fewer stars. static: no 3D at all (a still sky).
function labTier() {
  if (reduced()) return 'static';
  const nav = navigator;
  const conn = nav.connection || {};
  if (conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || '')) return 'static';
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return 'static';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    return 'static';
  }
  const mem = nav.deviceMemory || 4;
  const cores = nav.hardwareConcurrency || 4;
  if (mem <= 1) return 'static';
  if (isLite()) return 'lite'; // phones (auto), ?lite, or the footer switch: v1's lite tier
  if (mem <= 2 || cores <= 2) return 'lite';
  return 'full';
}

const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const LINES = [['COME', 'ABOARD'], ['FOLLOW', 'THE', 'SIGNAL'], ['ASK', "WHAT'S", 'NEXT']];

export default function Lab() {
  const section = useRef(null);
  const stage = useRef(null);
  const world = useRef(null);
  const device = useRef(null);
  const shade = useRef(null);
  const [tier] = useState(labTier);
  const [go, setGo] = useState(false); // the canvas exists only while the section is near the screen
  const [active, setActive] = useState(false); // it draws only while the section is on screen
  const ring = useRef(null);
  const words = useRef(null);
  const giant = useRef(null);
  const hint = useRef(null);
  const fade = useRef(null);
  const chapEls = useRef([]);
  const railEls = useRef([]);
  const nextEl = useRef(null);
  const progress = useRef(0);
  const rail = useRef(null);
  const introRef = useRef(null);

  useEffect(() => {
    const el = section.current;
    if (!el || tier === 'static') {
      window.__labWarmDone?.(); // nothing to warm up: let the opening screen go
      return undefined;
    }
    let idle = 0;
    const start = () => {
      Object.assign(labState, { env: false, cage: false, earth: false, nav: false, warm: false, dive: false });
      setGo(true);
    };
    // mount when within a screen and a half, after the browser is idle so the page's own entrance is never interrupted
    const near = new IntersectionObserver(
      ([e]) => {
        cancelAnimationFrame(idle);
        if (!e.isIntersecting) return;
        if (!window.__ffReady) {
          // behind the opening screen: warm up once it shows the solid word (a stall there cannot be seen)
          if (window.__ldPhase === 'word' || window.__ldPhase === 'open') return start();
          const onPhase = (ev) => {
            if (ev.detail !== 'word') return;
            window.removeEventListener('ff:phase', onPhase);
            start();
          };
          window.addEventListener('ff:phase', onPhase);
          return undefined;
        }
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(start, { timeout: 2500 });
        else idle = window.setTimeout(start, 600);
      },
      { rootMargin: '150% 0px 150% 0px' }
    );
    // let go (the whole WebGL context, geometry and textures) once it is more than two screens away
    const far = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) return;
        if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
        setGo(false);
        setActive(false);
      },
      { rootMargin: '200% 0px 200% 0px' }
    );
    const vis = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '10% 0px 10% 0px' });
    near.observe(el);
    far.observe(el);
    vis.observe(el);
    return () => {
      near.disconnect();
      far.disconnect();
      vis.disconnect();
      if ('cancelIdleCallback' in window) window.cancelIdleCallback(idle);
    };
  }, [tier]);

  useLayoutEffect(() => {
    const root = words.current;
    if (!root) return undefined;
    const measure = () => {
      const r = root.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      root.querySelectorAll('.w').forEach((w, i) => {
        const prev = w.style.transform;
        w.style.transform = 'none';
        const wr = w.getBoundingClientRect();
        w.style.transform = prev;
        // Offset of each word from the middle of the block. Words move outward along it, so spacing grows with the scale.
        let ox = wr.left + wr.width / 2 - cx;
        const oy = wr.top + wr.height / 2 - cy;
        const min = r.width * 0.07;
        if (Math.abs(ox) < min) ox = (ox === 0 ? (i % 2 ? 1 : -1) : Math.sign(ox)) * min;
        w.style.setProperty('--cx', ox.toFixed(1));
        w.style.setProperty('--cy', (Math.abs(oy) < 4 ? (i % 2 ? 1 : -1) * 6 : oy).toFixed(1));
      });
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el) return undefined;
    let raf = 0;
    let elTop = 0;
    let elHeight = 0;
    const measureEl = () => {
      const box = el.getBoundingClientRect();
      elTop = box.top + window.scrollY;
      elHeight = box.height;
    };
    measureEl();
    window.addEventListener('resize', measureEl, { passive: true });

    let lastActive = -99;
    const WAVE_LOCK_P = 0.970;
    let byeStartTime = 0;
    let byeLocked = false;
    let byeDone = false;
    let byeLockY = 0;
    let unlockTimer = null;
    let touchStartY = 0;

    // Smoothness (v3p2): the DOM side follows a smoothed progress, eased every frame with the same curve the 3D camera
    // uses (LabScene's Rig), so the device, the words, the chapters and the camera move as one, without the bursts of
    // individual wheel ticks. Geometry is written only when the window size changes.
    let ps = -1; // smoothed progress
    let geo = '';
    let far = false;
    const introParts = world.current ? [...world.current.querySelectorAll('.sl-lab-intro h2, .sl-lab-intro .copy')] : [];
    let lastP = -1;
    const update = (dt = 1 / 60) => {
      const y = window.scrollY || 0;
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const rTop = elTop - y;
      const mobile = vw < 768;
      const maxScroll = Math.max(elHeight - vh, 1);
      let rawP = Math.min(1, Math.max(0, -rTop / maxScroll));

      // 1-second pause on the robot waving "bye" animation
      const yWave = elTop + WAVE_LOCK_P * maxScroll;
      const now = performance.now();

      if (rawP < 0.92) {
        byeDone = false;
        byeLocked = false;
        byeStartTime = 0;
        if (unlockTimer) {
          clearTimeout(unlockTimer);
          unlockTimer = null;
        }
      } else if (!byeDone && y >= yWave) {
        if (!byeLocked) {
          byeLocked = true;
          byeStartTime = now;
          byeLockY = yWave;
          if (typeof window !== 'undefined' && window.__lenis) {
            window.__lenis.stop();
          }
          if (unlockTimer) clearTimeout(unlockTimer);
          unlockTimer = setTimeout(() => {
            byeLocked = false;
            byeDone = true;
            if (typeof window !== 'undefined' && window.__lenis) {
              window.__lenis.start();
            }
          }, 1000);
        }

        if (byeLocked) {
          if (now - byeStartTime < 1000) {
            if (y > byeLockY) {
              window.scrollTo({ top: byeLockY, behavior: 'instant' });
            }
            rawP = WAVE_LOCK_P;
          } else {
            byeLocked = false;
            byeDone = true;
            if (typeof window !== 'undefined' && window.__lenis) {
              window.__lenis.start();
            }
          }
        }
      }

      progress.current = rawP; // the 3D scene smooths this itself
      // far from the section and settled: nothing to do
      const isFar = rTop > vh * 1.5 || rTop + elHeight < -vh * 0.5;
      if (isFar && far && Math.abs(rawP - ps) < 1e-4) return;
      far = isFar;
      if (ps < 0 || Math.abs(rawP - ps) > 0.15) ps = rawP; // a jump (link, reload): no fly-through
      else ps += (rawP - ps) * (1 - Math.exp(-8.5 * Math.min(dt, 0.05)));
      if (Math.abs(rawP - ps) < 1e-5) ps = rawP;
      const p = ps;
      labState.active = p > 0.005 && p < 0.995;
      if (p === lastP && geo === vw + 'x' + vh) return; // settled: nothing changed since the last frame
      lastP = p;

      const tw = mobile ? vw * 0.86 : vw * 0.46;
      const s0 = tw / vw;
      const cx0 = mobile ? vw / 2 : vw * 0.065 + tw / 2;
      const cy0 = mobile ? Math.max(vh * 0.84, 380) : vh * 0.7;
      const e = ease(seg(p, 0.02, 0.27));
      const f = lerp(1, 1 / s0, e);
      const rot = -0.17 * Math.sin(e * Math.PI);
      const tx = (vw / 2 - cx0) * e;
      const ty = (vh / 2 - cy0) * e;
      const w = world.current;
      if (w) {
        w.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(${cx0}px, ${cy0}px) rotate(${rot}rad) scale(${f}) translate(${-cx0}px, ${-cy0}px)`;
        if (stage.current) {
          stage.current.dataset.z = e >= 1 ? '1' : '0';
          stage.current.toggleAttribute('data-dark', e > 0.4);
        }
        if (section.current) {
          section.current.toggleAttribute('data-dark', e > 0.4);
        }
        window.__labDark = e > 0.4 && rTop < 70 && rTop + elHeight > 70;
      }
      const dev = device.current;
      if (dev) {
        const key = vw + 'x' + vh;
        if (key !== geo) {
          geo = key;
          for (const n of [dev, shade.current]) {
            if (!n) continue;
            n.style.left = `${cx0 - vw / 2}px`;
            n.style.top = `${cy0 - vh / 2}px`;
            n.style.width = `${vw}px`;
            n.style.height = `${vh}px`;
            n.style.transform = `scale(${s0})`;
          }
          shade.current?.style.setProperty('--r', `${36 / s0}px`);
        }
        // corners and bezel grow with the zoom like a real device (no repaint), then fold away at the end
        const k = seg(e, 0.55, 1);
        const rr = k > 0 ? (36 / s0) * (1 - seg(e, 0.6, 1)) : 36 / s0;
        const bz = k > 0 ? (13 / s0) * (1 - k) : 13 / s0;
        const sig = rr.toFixed(1) + '|' + bz.toFixed(1);
        if (dev.dataset.sig !== sig) {
          dev.dataset.sig = sig;
          dev.style.setProperty('--r', `${rr}px`);
          dev.style.setProperty('--bz', `${bz}px`);
        }
        if (shade.current) {
          const so = 1 - seg(e, 0.2, 0.6);
          shade.current.style.opacity = String(so);
          shade.current.style.visibility = so > 0.001 ? 'visible' : 'hidden';
        }
      }
      // the title and copy fall out of focus as the device swallows them (compositor-only: opacity and filter)
      {
        const b = seg(e, 0.04, 0.5);
        introParts[0]?.parentElement?.classList.toggle('live', b > 0.001 && b < 0.999);
        for (const n of introParts) {
          n.style.opacity = String(1 - b);
          n.style.filter = b > 0.001 && b < 0.999 ? `blur(${(b * 10).toFixed(2)}px)` : '';
        }
      }

      const ringIn = seg(p, 0.3, 0.4) * (1 - seg(p, 0.5, 0.56));
      if (ring.current) {
        ring.current.style.opacity = String(ringIn);
        ring.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.72, 1.04, seg(p, 0.3, 0.62))})`;
      }

      // Words fade in small around Nav, then fly outward past the camera while growing huge.
      const wIn = seg(p, 0.34, 0.4);
      const sp = seg(p, 0.43, 0.6);
      if (words.current) {
        words.current.style.setProperty('--ex', (Math.pow(sp, 1.15) * 11).toFixed(4));
        words.current.style.setProperty('--s', (1 + Math.pow(sp, 2.7) * 16).toFixed(4));
        const wo = wIn * (1 - seg(p, 0.53, 0.565));
        words.current.style.opacity = String(wo);
        words.current.classList.toggle('live', wo > 0.001); // its words get their own layers only while shown
      }
      if (giant.current) {
        giant.current.style.opacity = '0';
      }
      if (fade.current) {
        const f = Math.min(seg(p, pAtZ(ROOM_START + 14), pAtZ(ROOM_START - 2)), 1 - seg(p, pAtZ(ROOM_START - 2), pAtZ(ROOM_START - 20)));
        fade.current.style.opacity = String(Math.max(f, 0) * 0.92);
      }

      let active = -1;
      CHAPTERS.forEach((ch, i) => {
        const el = chapEls.current[i];
        if (!el) return;
        const to = ch.to;
        const local = (p - ch.from) / Math.max(to - ch.from, 0.001);
        const on = local > 0 && local < 1;
        if (on) active = i;
        if (local <= -0.05 || local >= 1.05) {
          if (el.style.visibility !== 'hidden') {
            el.style.visibility = 'hidden';
            el.classList.remove('live');
          }
          return;
        }
        if (el.style.visibility !== 'visible') {
          el.style.visibility = 'visible';
          el.classList.add('live');
        }
        el.style.setProperty('--r', seg(local, 0.02, 0.2).toFixed(4));
        el.style.setProperty('--o', i === CHAPTERS.length - 1 ? '0' : seg(local, 0.8, 0.97).toFixed(4));
      });
      if (active !== lastActive) {
        lastActive = active;
        railEls.current.forEach((el, i) => {
          if (!el) return;
          el.classList.toggle('on', i === active);
          el.classList.toggle('done', i < active);
        });
        if (nextEl.current && active >= 0 && active < CHAPTERS.length - 1) {
          const n = CHAPTERS[active + 1];
          const bEl = nextEl.current.querySelector('b');
          const smEl = nextEl.current.querySelector('small');
          if (bEl) bEl.textContent = n.verb;
          if (smEl) smEl.textContent = n.domain;
          nextEl.current.style.setProperty('--nc', n.color);
        }
      }
      if (rail.current) rail.current.style.opacity = String(seg(p, 0.668, 0.69));
      if (nextEl.current) {
        const ch = CHAPTERS[Math.max(active, 0)];
        const local = active >= 0 ? (p - ch.from) / Math.max(ch.to - ch.from, 0.001) : 0;
        const show = active >= 0 && active < CHAPTERS.length - 1 ? seg(local, 0.55, 0.72) * (1 - seg(local, 0.92, 1)) : 0;
        nextEl.current.style.opacity = String(show);
        nextEl.current.style.transform = `translate3d(${(1 - show) * 28}px, 0, 0)`;
      }
      const c = seg(p, 0.984, 0.998);
      if (hint.current) {
        hint.current.style.opacity = String(c);
        hint.current.style.pointerEvents = c > 0.5 ? 'auto' : 'none';
        hint.current.style.transform = `translate3d(0, ${(1 - c) * 24}px, 0)`;
      }
    };
    const onScroll = () => {
      geo = '';
      update();
    };
    const stopLoop = onFrame((dt) => update(dt));

    const onWheel = (e) => {
      if (byeLocked && performance.now() - byeStartTime < 1000) {
        if (e.deltaY > 0) {
          e.preventDefault();
        } else if (e.deltaY < 0) {
          byeLocked = false;
          if (unlockTimer) {
            clearTimeout(unlockTimer);
            unlockTimer = null;
          }
          if (typeof window !== 'undefined' && window.__lenis) {
            window.__lenis.start();
          }
        }
      }
    };

    const onTouchStart = (e) => {
      if (e.touches && e.touches[0]) {
        touchStartY = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (byeLocked && performance.now() - byeStartTime < 1000) {
        if (e.touches && e.touches[0]) {
          const dy = touchStartY - e.touches[0].clientY;
          if (dy > 0 && e.cancelable) {
            e.preventDefault();
          } else if (dy < -10) {
            byeLocked = false;
            if (unlockTimer) {
              clearTimeout(unlockTimer);
              unlockTimer = null;
            }
          }
        }
      }
    };

    update();
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      if (unlockTimer) clearTimeout(unlockTimer);
      cancelAnimationFrame(raf);
      stopLoop();
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      if (typeof window !== 'undefined' && window.__lenis) {
        window.__lenis.start();
      }
      window.__labDark = false;
    };
  }, []);

  return (
    <section className="sl-lab" id="lab" ref={section} data-dark-after>
      <div className="sl-lab-stage" ref={stage} data-z="0">
        <div className="sl-lab-world" ref={world}>
          <div className="sl-lab-paper" ref={introRef} />
          <div className="sl-lab-intro">
            <h2>
              <span>
                <SplitLine text="Inside FireFly," />
              </span>
              <span>
                <SplitLine text="a mind is" delay={90} />
              </span>
              <span>
                <SplitLine text="waking up." delay={180} />
              </span>
            </h2>
            <div className="copy">
              <p>Every project starts as a question. In here we turn it into structure, then colour, and finally something that works.</p>
              <p className="more">Come aboard. The Core is waiting, and the crew is ready.</p>
            </div>
          </div>
          <div className="sl-lab-shade" ref={shade} aria-hidden="true" />
          <div className="sl-lab-device" ref={device}>
            <div className="sl-lab-screen">
              <div className="sl-lab-still" />
              <Suspense fallback={null}>
                <div className="sl-lab-canvas">
                  {go && <LabScene progress={progress} active={active} tier={tier} onWarm={() => window.__labWarmDone?.()} />}
                </div>
              </Suspense>
              <div className="sl-lab-ring" ref={ring} aria-hidden="true">
                <i className="r1" />
                <i className="r2" />
                <i className="r3" />
              </div>
            </div>
          </div>
        </div>

        <div className="sl-lab-giant" ref={giant} aria-hidden="true">
          FLY
        </div>
        <div className="sl-lab-words" ref={words} aria-label="Come aboard. Follow the signal. Ask what is next.">
          {LINES.map((line, li) => (
            <div className="line" key={li} aria-hidden="true">
              {line.map((w) => (
                <span className="w" key={w}>
                  {w}
                </span>
              ))}
            </div>
          ))}
        </div>
        <div className="sl-lab-flash" ref={fade} aria-hidden="true" />
        <div className="sl-lab-chaps" aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <div className="chap" key={c.num} ref={(el) => (chapEls.current[i] = el)} style={{ '--cc': c.color }}>
              <span className="n">
                Chapter {c.num} <i /> {c.domain}
              </span>
              <h3>
                {[...c.verb].map((ch, k) => (
                  <span className="cl" key={k}>
                    <span className="ch" style={{ '--i': k }}>
                      {ch}
                    </span>
                  </span>
                ))}
              </h3>
              <p>{c.line}</p>
            </div>
          ))}
        </div>
        <ol className="sl-lab-rail" ref={rail} aria-hidden="true">
          {CHAPTERS.map((c, i) => (
            <li key={c.num} ref={(el) => (railEls.current[i] = el)} style={{ '--cc': c.color }}>
              <b>{c.num}</b>
              <span>{c.verb}</span>
            </li>
          ))}
        </ol>
        <div className="sl-lab-next" ref={nextEl} aria-hidden="true">
          <span>Next chapter</span>
          <b />
          <small />
        </div>
        <div className="sl-lab-hint" ref={hint}>
          <Link className="sl-pill sl-pill--white" to="/domains" viewTransition>
            Explore the chapters <i />
          </Link>
          <span className="hint">Continue to scroll</span>
        </div>
      </div>
    </section>
  );
}
