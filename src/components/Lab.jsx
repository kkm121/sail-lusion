import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Ribbon from './Ribbon';
import SplitLine from './SplitLine';
import TransitionLink from './TransitionLink';
import { CHAPTERS, pAtZ } from '../lib/journey';
import LabScene from './LabScene';
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
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = section.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
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
        let dx = (wr.left + wr.width / 2 - cx) / (r.width / 2);
        const dy = (wr.top + wr.height / 2 - cy) / (r.height / 2);
        const sgn = dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx);
        dx = sgn * (0.38 + Math.abs(dx) * 0.62);
        w.style.setProperty('--dx', dx.toFixed(3));
        w.style.setProperty('--dy', dy.toFixed(3));
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
    const update = () => {
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const mobile = vw < 768;
      const p = Math.min(1, Math.max(0, -r.top / (r.height - vh)));
      progress.current = p;
      ribbonDraw.current?.(Math.min(1, 0.55 * Math.min(1, Math.max(0, 1 - r.top / vh)) + 0.45 * seg(p, 0, 0.18)));

      const tw = mobile ? vw * 0.9 : vw * 0.46;
      const s0 = tw / vw;
      const cx0 = mobile ? vw / 2 : vw * 0.065 + tw / 2;
      const cy0 = mobile ? vh * 0.7 : vh * 0.66;
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
          stage.current.toggleAttribute('data-dark', e > 0.5);
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

      const ringIn = seg(p, 0.22, 0.34) * (1 - seg(p, 0.66, 0.72));
      if (ring.current) {
        ring.current.style.opacity = String(ringIn);
        ring.current.style.transform = `translate(-50%, -50%) scale(${lerp(0.7, 1.06, seg(p, 0.22, 0.7))})`;
      }

      const wIn = seg(p, 0.37, 0.44);
      const sp = ease(seg(p, 0.5, 0.68));
      if (words.current) {
        words.current.style.setProperty('--sp', (1 - Math.pow(1 - sp, 2.2)).toFixed(4));
        words.current.style.setProperty('--sc', (sp * sp).toFixed(4));
        words.current.style.opacity = String(wIn * (1 - seg(p, 0.64, 0.7)));
      }
      if (giant.current) {
        giant.current.style.opacity = '0';
      }
      if (fade.current) {
        fade.current.style.opacity = '0';
      }

      let active = -1;
      CHAPTERS.forEach((ch, i) => {
        const el = chapEls.current[i];
        if (!el) return;
        const to = ch.to;
        const local = (p - ch.from) / Math.max(to - ch.from, 0.001);
        const on = local > 0 && local < 1;
        if (on) active = i;
        el.style.setProperty('--r', seg(local, 0.02, 0.2).toFixed(4));
        el.style.setProperty('--o', i === CHAPTERS.length - 1 ? '0' : seg(local, 0.8, 0.97).toFixed(4));
        el.style.visibility = local > -0.02 && local < 1.02 ? 'visible' : 'hidden';
      });
      railEls.current.forEach((el, i) => {
        if (!el) return;
        el.classList.toggle('on', i === active);
        el.classList.toggle('done', i < active);
      });
      if (rail.current) rail.current.style.opacity = String(seg(p, 0.668, 0.69));
      if (nextEl.current) {
        const ch = CHAPTERS[Math.max(active, 0)];
        const local = active >= 0 ? (p - ch.from) / Math.max(ch.to - ch.from, 0.001) : 0;
        const show = active >= 0 && active < CHAPTERS.length - 1 ? seg(local, 0.55, 0.72) * (1 - seg(local, 0.92, 1)) : 0;
        nextEl.current.style.opacity = String(show);
        nextEl.current.style.transform = `translate3d(${(1 - show) * 28}px, 0, 0)`;
        if (active >= 0 && active < CHAPTERS.length - 1) {
          const n = CHAPTERS[active + 1];
          nextEl.current.querySelector('b').textContent = n.verb;
          nextEl.current.querySelector('small').textContent = n.domain;
          nextEl.current.style.setProperty('--nc', n.color);
        }
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
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <section className="sl-lab" id="lab" ref={section} data-dark-after>
      <div className="sl-lab-stage" ref={stage} data-z="0">
        <div className="sl-lab-world" ref={world}>
          <div className="sl-lab-paper" ref={introRef} />
          <Ribbon section={introRef} variant="lab" stops={['#00f5d4', '#38bdf8']} span={(sec) => sec.offsetHeight} drawRef={ribbonDraw} />
          <div className="sl-lab-intro">
            <h2>
              <span>
                <SplitLine text="Inside the lab," />
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
              <p className="more">Come aboard. The Core is waiting, and Nav knows the way.</p>
            </div>
          </div>
          <div className="sl-lab-device" ref={device}>
            <div className="sl-lab-screen">
              <div className="sl-lab-still" />
              <Suspense fallback={null}>
                <div className="sl-lab-canvas">
                  <LabScene progress={progress} visible={visible} />
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
          LAB
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
