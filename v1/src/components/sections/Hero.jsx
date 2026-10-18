import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function Hero({ loaded }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!loaded) return;
    
    // Smooth, dramatic kinetic entrance choreography on initial load
    const tl = gsap.timeline();

    tl.fromTo('.hero-title',
      { y: 80, opacity: 0, scale: 0.94, letterSpacing: '-0.04em' },
      { y: 0, opacity: 1, scale: 1, letterSpacing: '-0.02em', duration: 1.4, ease: 'power4.out', delay: 0.05 }
    )
    .fromTo('.hero-sub-badge',
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' },
      '-=1.0'
    )
    .fromTo('.hero-sub-text',
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' },
      '-=0.7'
    )
    .fromTo('.hero-footer',
      { opacity: 0, y: 25 },
      { opacity: 1, y: 0, duration: 1.0, ease: 'power2.out' },
      '-=0.6'
    );
  }, [loaded]);

  return (
    <section ref={containerRef} className="relative w-full h-screen flex flex-col items-center justify-center pointer-events-none select-none z-10">
      
      {/* Central Majestic Typography (Initially hidden with opacity-0 to prevent FOUC/double-flash) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center mix-blend-difference z-0">
        <h1 className="hero-title opacity-0 text-[clamp(3.6rem,13vw,11rem)] font-display font-black leading-none text-white text-center drop-shadow-2xl">
          FIREFLY
        </h1>
        
        <div className="hero-sub-badge opacity-0 flex items-center gap-3 mt-3">
          <span className="w-2 h-2 rounded-full bg-accent animate-ping"></span>
          <span className="text-[clamp(0.72rem,1.6vw,0.95rem)] font-mono font-semibold tracking-[0.2em] md:tracking-[0.3em] text-accent uppercase">
            Student AI Club
          </span>
        </div>

        <div className="hero-sub-badge opacity-0 text-[clamp(0.66rem,1.2vw,0.7rem)] font-mono tracking-[0.2em] md:tracking-[0.25em] text-gray-500 mt-1.5 uppercase">
          associated with AMIEE
        </div>

        <div className="hero-sub-text opacity-0 text-xs font-mono tracking-[0.3em] text-gray-400 mt-4 uppercase">
          ENGINEER • INNOVATE • LEAD
        </div>
      </div>

      {/* Atmospheric Scroll Prompt */}
      <div className="hero-footer opacity-0 absolute bottom-12 flex flex-col items-center z-20">
        <div className="text-[10px] font-mono text-gray-400 tracking-[0.25em] uppercase mb-3">
          Scroll to Enter World
        </div>
        <div className="w-[1px] h-14 bg-gradient-to-b from-accent to-transparent animate-pulse"></div>
      </div>

    </section>
  );
}
