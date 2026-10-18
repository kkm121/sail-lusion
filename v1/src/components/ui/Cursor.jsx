import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const TOUCH_QUERY = '(hover: none), (pointer: coarse)';

export function Cursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    // Touch / keyboard users: no custom cursor (CSS restores native cursor).
    if (typeof window !== 'undefined' && window.matchMedia?.(TOUCH_QUERY).matches) return;
    const cursor = cursorRef.current;
    const dot = dotRef.current;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    let rafId = 0;
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dotX(mouseX);
      dotY(mouseY);
    };

    const render = () => {
      // Spring physics for the ring
      cursorX += (mouseX - cursorX) * 0.15;
      cursorY += (mouseY - cursorY) * 0.15;

      if (cursor) {
        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove);
    rafId = requestAnimationFrame(render);

    // Hover interactions
    const iterables = document.querySelectorAll('a, button, .project-panel');
    const onHover = () => gsap.to(cursor, { scale: 1.5, borderColor: '#00F5D4', backgroundColor: 'rgba(0, 245, 212, 0.1)', duration: 0.3 });
    const onLeave = () => gsap.to(cursor, { scale: 1, borderColor: 'rgba(255, 255, 255, 0.2)', backgroundColor: 'transparent', duration: 0.3 });

    iterables.forEach(el => {
      el.addEventListener('mouseenter', onHover);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(rafId);
      iterables.forEach(el => {
        el.removeEventListener('mouseenter', onHover);
        el.removeEventListener('mouseleave', onLeave);
      });
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia?.(TOUCH_QUERY).matches) return null;

  return (
    <div aria-hidden="true">
      <div 
        ref={cursorRef} 
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/20 pointer-events-none z-[10000] mix-blend-difference transition-colors hidden [@media(hover:hover)]:block"
      />
      <div 
        ref={dotRef} 
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-[10000] mix-blend-difference -translate-x-1/2 -translate-y-1/2 hidden [@media(hover:hover)]:block"
      />
    </div>
  );
}
