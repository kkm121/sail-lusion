import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Ribbon from './Ribbon';
import SplitLine from './SplitLine';
import TransitionLink from './TransitionLink';
import { CHAPTERS, ROOM_START, pAtZ } from '../lib/journey';
import LabScene from './LabScene';
import { labState } from '../scene/shared';
import { isResolved, subscribeAssets } from '../lib/assets';
import '../styles/lab.css';

const seg = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a, b, t) => a + (b - a) * t;

const LINES = [['COME', 'ABOARD'], ['FOLLOW', 'THE', 'SIGNAL'], ['ASK', "WHAT'S", 'NEXT']];

export default function Lab() {
  const section = useRef(null);
  const stage = useRef(null);
  const world = useRef(null);
  const device = useRef(null);
  // The voyage canvas mounts under the preloader so all shaders compile before the page opens.
  const [go] = useState(true);
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
  const ribbonDraw = useRef(null);
  const visibleRef = useRef(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = entry.isIntersecting;
      },
      { rootMargin: '100% 0px 100% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

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

    const update = () => {
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

      const p = rawP;
      progress.current = p;
      labState.active = p > 0.005 && p < 0.995;
      ribbonDraw.current?.(Math.min(1, 0.55 * Math.min(1, Math.max(0, 1 - rTop / vh)) + 0.45 * seg(p, 0, 0.18)));

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
      }
      const dev = device.current;
      if (dev) {
        dev.style.left = `${cx0 - vw / 2}px`;
        dev.style.top = `${cy0 - vh / 2}px`;
        dev.style.width = `${vw}px`;
        dev.style.height = `${vh}px`;
        dev.style.transform = `scale(${s0})`;
        const eff = s0 * f;
        dev.style.setProperty('--r', `${lerp(36, 0, seg(e, 0.6, 1)) / eff}px`);
        dev.style.setProperty('--bz', `${lerp(13, 0, seg(e, 0.55, 1)) / eff}px`);
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
        words.current.style.opacity = String(wIn * (1 - seg(p, 0.53, 0.565)));
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
          if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden';
          return;
        }
        el.style.visibility = 'visible';
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
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

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
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      if (unlockTimer) clearTimeout(unlockTimer);
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      if (typeof window !== 'undefined' && window.__lenis) {
        window.__lenis.start();
      }
    };
  }, []);

  return (
    <section className="sl-lab" id="lab" ref={section} data-dark-after>
      <div className="sl-lab-stage" ref={stage} data-z="0">
        <div className="sl-lab-world" ref={world}>
          <div className="sl-lab-paper" ref={introRef} />
          <Ribbon section={introRef} variant="lab" stops={['#ff5a1f', '#ffb347']} span={(sec) => sec.offsetHeight} drawRef={ribbonDraw} />
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
          <div className="sl-lab-device" ref={device}>
            <div className="sl-lab-screen">
              <div className="sl-lab-still" />
              <Suspense fallback={null}>
                <div className="sl-lab-canvas">
                  {go && <LabScene progress={progress} visibleRef={visibleRef} />}
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
          <TransitionLink className="sl-pill sl-pill--white" href="/domains" label="Domains" data-magnetic>
            Explore the chapters <i />
          </TransitionLink>
          <span className="hint">Continue to scroll</span>
        </div>
      </div>
    </section>
  );
}
