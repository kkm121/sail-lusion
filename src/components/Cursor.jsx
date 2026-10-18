import { useEffect, useRef } from 'react';
import { isFinePointer, isTouch } from '../lib/device';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';

export default function Cursor() {
  const dot = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!isFinePointer() || isTouch()) return undefined;
    document.documentElement.classList.add('sl-has-cursor');
    const el = dot.current;
    const text = label.current;
    if (!el || !text) return undefined;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let magnet = null;
    let currentIsLight = false;
    let lastTarget = null;
    const lightCache = new WeakMap();

    const updateLuminance = (clientX, clientY) => {
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) return;
      if (target === lastTarget) return;
      lastTarget = target;

      // 1. Parts that are always light, even though they sit inside a dark page (footer, white pills, menus)
      const isLightLandmark = !!target.closest('.sl-footer, .sl-menu-links, .sl-menu-news, .sl-pill--white, [data-theme="light"], .sl-light');
      if (isLightLandmark) {
        if (!currentIsLight) {
          currentIsLight = true;
          el.classList.add('is-on-light');
        }
        return;
      }

      // 2. Dark landmarks: the 3D stages, dark modals and every inner page (they are all dark now)
      const isDarkLandmark = !!target.closest(
        '.sl-lab-stage, .sl-lab-screen, .sl-lab-device, .sl-lab-canvas, .sl-hero-visual, .sl-end, .sl-overlay, .sl-modal, .sl-cli, .sl-menu-labs, .sl-pill--dark, .sl-reel-card, .sl-sub, [data-theme="dark"], .sl-dark, canvas'
      );
      if (isDarkLandmark) {
        if (currentIsLight) {
          currentIsLight = false;
          el.classList.remove('is-on-light');
        }
        return;
      }

      // 2b. The light featured section on the home page
      if (target.closest('.sl-featured')) {
        if (!currentIsLight) {
          currentIsLight = true;
          el.classList.add('is-on-light');
        }
        return;
      }

      // 3. Fallback: default to light landmark check
      if (currentIsLight) {
        currentIsLight = false;
        el.classList.remove('is-on-light');
      }
    };

    // Probe for light or dark under the pointer only when pointer moves, never during scroll
    let needProbe = false;
    let lastProbe = 0;
    const stopTick = onTick((time, dt) => {
      const k = 1 - Math.exp(-13 * dt);
      cx += (x - cx) * k;
      cy += (y - cy) * k;
      el.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0)`;
      if (needProbe && time - lastProbe > 150) {
        lastProbe = time;
        needProbe = false;
        lastTarget = null;
        if (el.classList.contains('is-visible')) updateLuminance(x, y);
      }
    }, 30);

    const onMove = (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
      x = e.clientX;
      y = e.clientY;
      el.classList.add('is-visible');
      needProbe = true;

      if (magnet) {
        const r = magnet.getBoundingClientRect();
        magnet.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      }
    };

    const onOver = (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
      const t = e.target.closest?.('[data-cursor], a, button, [role=button]');
      const m = e.target.closest?.('[data-magnetic]');
      if (m && m !== magnet) {
        magnet = m;
        m.style.transition = 'transform .15s ease-out';
      }
      if (t) {
        const name = t.getAttribute('data-cursor');
        el.classList.add('is-hover');
        if (name) {
          text.textContent = name;
          el.classList.add('has-label');
        }
      }
    };

    const onOut = (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
      const t = e.target.closest?.('[data-cursor], a, button, [role=button]');
      const m = e.target.closest?.('[data-magnetic]');
      if (m && m === magnet && !m.contains(e.relatedTarget)) {
        m.style.transition = 'transform .6s cubic-bezier(.2,.9,.2,1.4)';
        m.style.transform = '';
        magnet = null;
      }
      if (t && !t.contains(e.relatedTarget)) {
        el.classList.remove('is-hover', 'has-label');
        text.textContent = '';
      }
    };

    const onLeave = () => el.classList.remove('is-visible');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      document.documentElement.classList.remove('sl-has-cursor');
      stopTick();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      document.removeEventListener('pointerout', onOut);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="sl-cursor" ref={dot} aria-hidden="true">
      <span ref={label} />
    </div>
  );
}