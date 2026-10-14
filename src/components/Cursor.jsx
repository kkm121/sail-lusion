import { useEffect, useRef } from 'react';
import { isFinePointer, isTouch } from '../lib/device';

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
    let raf = 0;
    let magnet = null;
    let currentIsLight = false;
    let lastTarget = null;

    const updateLuminance = (clientX, clientY) => {
      const target = document.elementFromPoint(clientX, clientY);
      if (!target) return;
      if (target === lastTarget) return;
      lastTarget = target;

      // 1. Dark landmark checks (3D canvas, visual stage, dark modal, dark cards, etc.)
      const isDarkLandmark = !!target.closest(
        '.sl-lab-stage, .sl-lab-screen, .sl-lab-device, .sl-lab-canvas, .sl-hero-visual, .sl-end, .sl-overlay, .sl-modal, .sl-cli, .sl-menu-labs, .sl-pill--dark, .sl-reel-card, [data-theme="dark"], .sl-dark, canvas'
      );

      if (isDarkLandmark) {
        if (currentIsLight) {
          currentIsLight = false;
          el.classList.remove('is-on-light');
        }
        return;
      }

      // 2. Light landmark checks (Footer, Featured, Subpages, light cards)
      const isLightLandmark = !!target.closest(
        '.sl-footer, .sl-featured, .sl-sub, .sl-about-hero, .sl-about-block, .sl-projects-head, .sl-pd-meta, .sl-menu-links, .sl-menu-news, .sl-core-card, .sl-pill--white, [data-theme="light"], .sl-light'
      );

      if (isLightLandmark) {
        if (!currentIsLight) {
          currentIsLight = true;
          el.classList.add('is-on-light');
        }
        return;
      }

      // 3. Fallback: inspect computed background color of target or ancestors
      let isLight = true;
      let curr = target;
      while (curr && curr !== document.documentElement && curr !== document.body) {
        const bg = window.getComputedStyle(curr).backgroundColor;
        if (bg && bg !== 'transparent' && !bg.startsWith('rgba(0, 0, 0, 0)')) {
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (match) {
            const a = match[4] !== undefined ? parseFloat(match[4]) : 1;
            if (a > 0.25) {
              const r = parseInt(match[1], 10);
              const g = parseInt(match[2], 10);
              const b = parseInt(match[3], 10);
              const lum = 0.299 * r + 0.587 * g + 0.114 * b;
              isLight = lum > 140;
              break;
            }
          }
        }
        curr = curr.parentElement;
      }

      if (isLight !== currentIsLight) {
        currentIsLight = isLight;
        el.classList.toggle('is-on-light', isLight);
      }
    };

    const render = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      el.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onMove = (e) => {
      if (e.pointerType === 'touch' || e.pointerType === 'pen') return;
      x = e.clientX;
      y = e.clientY;
      el.classList.add('is-visible');
      updateLuminance(x, y);

      if (magnet) {
        const r = magnet.getBoundingClientRect();
        magnet.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.28}px)`;
      }
    };

    const onScroll = () => {
      if (el.classList.contains('is-visible')) {
        lastTarget = null;
        updateLuminance(x, y);
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
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('pointerover', onOver);
    document.addEventListener('pointerout', onOut);
    document.documentElement.addEventListener('pointerleave', onLeave);

    return () => {
      document.documentElement.classList.remove('sl-has-cursor');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('scroll', onScroll);
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