import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function About() {
  const textRef = useRef(null);

  useEffect(() => {
    const letters = textRef.current.querySelectorAll('.reveal-text');
    
    gsap.fromTo(letters,
      { opacity: 0.15 },
      {
        opacity: 1,
        stagger: 0.08,
        ease: 'none',
        scrollTrigger: {
          trigger: textRef.current,
          start: 'top 75%',
          end: 'bottom 45%',
          scrub: true,
        }
      }
    );
  }, []);

  const statement = "We build, experiment, compete, collaborate, and turn ideas into engineering reality.";
  const words = statement.split(' ');

  return (
    <section className="relative w-full min-h-screen flex items-center z-10 px-6 md:px-16 lg:px-24 py-20">
      <div className="max-w-3xl lg:max-w-4xl">
        <div className="text-xs font-mono text-accent tracking-[0.25em] mb-8 uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>01 // Who We Are</span>
        </div>

        {/* High-contrast headline with crisp drop shadow for supreme legibility */}
        <h2
          ref={textRef}
          className="text-[clamp(2.2rem,5.5vw,4.6rem)] font-display font-medium leading-[1.08] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]"
        >
          {words.map((word, i) => (
            <span key={i} className="reveal-text inline-block mr-[1.4vw]">{word}</span>
          ))}
        </h2>

        {/* Pillar Paragraphs with enhanced contrast and subtle glass cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs md:text-sm font-sans leading-relaxed">
          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06] text-gray-300">
            <span className="text-[10px] font-mono text-accent block mb-2 uppercase tracking-widest">01 / Foundation</span>
            FireFly is not just a student club. It is a research and development ecosystem where technology intersects with human ambition.
          </div>
          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06] text-gray-300">
            <span className="text-[10px] font-mono text-accent block mb-2 uppercase tracking-widest">02 / Focus</span>
            Our laboratory focuses on autonomous systems, high-performance computing, spatial design, and advanced robotics.
          </div>
          <div className="p-5 rounded-2xl bg-black/40 backdrop-blur-md border border-white/[0.06] text-gray-300">
            <span className="text-[10px] font-mono text-accent block mb-2 uppercase tracking-widest">03 / Ethos</span>
            We operate under a simple ethos: Curiosity over conformity. Physical and digital rigor. Exponential impact.
          </div>
        </div>
      </div>
    </section>
  );
}
