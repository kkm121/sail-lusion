import { useEffect, useRef, useState } from 'react';
import { finePointer, onFrame, reduced, Spring } from '../lib/motion';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);
  const sparksRef = useRef([]);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!finePointer()) return undefined;
    setActive(true);
    document.documentElement.classList.add('has-custom-cursor');

    const pointer = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
      inside: false,
    };

    const springX = new Spring(pointer.x, { damping: 0.8, response: 0.25 });
    const springY = new Spring(pointer.y, { damping: 0.8, response: 0.25 });
    const springScale = new Spring(1, { damping: 0.75, response: 0.2 });

    let activeLabel = '';
    let isHovering = false;
    let isText = false;
    let lastX = pointer.x;
    let lastY = pointer.y;

    const sparkCount = 12;
    const sparks = Array.from({ length: sparkCount }, () => ({
      x: pointer.x,
      y: pointer.y,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0.5,
    }));
    let sparkHead = 0;

    const onMove = (e) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.inside = true;

      const target = e.target;
      if (target) {
        const tag = target.tagName ? target.tagName.toLowerCase() : '';
        isText = target.isContentEditable || tag === 'input' || tag === 'textarea';

        const cursorEl = target.closest?.('[data-cursor]');
        const interactive = cursorEl || target.closest?.('a, button, summary, [role="button"], .rail-btn');
        isHovering = !!interactive;

        if (cursorEl) {
          activeLabel = cursorEl.getAttribute('data-cursor') || '';
        } else {
          activeLabel = '';
        }
      }

      if (!reduced() && !isText) {
        const dx = pointer.x - lastX;
        const dy = pointer.y - lastY;
        const distSq = dx * dx + dy * dy;
        if (distSq > 36) {
          lastX = pointer.x;
          lastY = pointer.y;
          const s = sparks[sparkHead];
          s.x = pointer.x + (Math.random() - 0.5) * 6;
          s.y = pointer.y + (Math.random() - 0.5) * 6;
          s.vx = (Math.random() - 0.5) * 36 - dx * 0.12;
          s.vy = (Math.random() - 0.5) * 36 - dy * 0.12 - 14;
          s.life = 1.0;
          s.maxLife = 0.3 + Math.random() * 0.25;
          sparkHead = (sparkHead + 1) % sparkCount;
        }
      }
    };

    const onLeave = () => {
      pointer.inside = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);

    const stop = onFrame((dt) => {
      springX.target = pointer.x;
      springY.target = pointer.y;
      const targetScale = isHovering ? (activeLabel ? 2.6 : 1.7) : 1.0;
      springScale.target = targetScale;

      const rx = springX.step(dt);
      const ry = springY.step(dt);
      const sc = springScale.step(dt);

      const hideAll = !pointer.inside || isText;
      const opacity = hideAll ? '0' : '1';

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
        dotRef.current.style.opacity = isHovering ? '0' : opacity;
      }

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${sc})`;
        ringRef.current.style.opacity = opacity;
      }

      if (labelRef.current) {
        if (labelRef.current.textContent !== activeLabel) {
          labelRef.current.textContent = activeLabel;
        }
        labelRef.current.style.opacity = activeLabel && !hideAll ? '1' : '0';
      }

      const sparkEls = sparksRef.current;
      for (let i = 0; i < sparkCount; i++) {
        const s = sparks[i];
        const el = sparkEls[i];
        if (!el) continue;
        if (s.life > 0) {
          s.life -= dt / s.maxLife;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.vy -= 22 * dt;
          if (s.life <= 0) {
            s.life = 0;
            el.style.opacity = '0';
          } else {
            el.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scale(${s.life})`;
            el.style.opacity = (s.life * 0.85).toFixed(3);
          }
        }
      }
    });

    return () => {
      stop();
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  if (!active) return null;

  return (
    <div className="cur-wrap" aria-hidden="true">
      <div className="cur-dot" ref={dotRef} />
      <div className="cur-ring" ref={ringRef}>
        <span className="cur-label" ref={labelRef} />
      </div>
      <div className="cur-sparks">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="cur-spark"
            ref={(el) => {
              sparksRef.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}
