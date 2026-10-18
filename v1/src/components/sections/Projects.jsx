import React, { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const projects = [
  {
    id: '01',
    title: 'FIREFLY-VISION-CORE',
    tag: 'Computer Vision',
    desc: 'Placeholder repository for the lab vision experiments. Code, datasets, and notebooks will land here as work begins.',
    metrics: ['UNDER WORK', 'PYTHON', 'PYTORCH']
  },
  {
    id: '02',
    title: 'FIREFLY-NLP-PLAYGROUND',
    tag: 'Language',
    desc: 'Placeholder repository for text classification, summarisation, and retrieval experiments by lab members.',
    metrics: ['PLANNING', 'PYTHON', 'TRANSFORMERS']
  },
  {
    id: '03',
    title: 'FIREFLY-ROBOTICS-SIM',
    tag: 'Robotics',
    desc: 'Placeholder repository for robot simulation, path planning, and embedded control projects.',
    metrics: ['UNDER WORK', 'ROS2', 'C++']
  },
];

const PIN_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine)';
const REPO_NOTE = 'This project page is being built. Repository details will be added once the project goes public.';

export function Projects({ onShowProgress }) {
  const sectionRef = useRef(null);
  const sliderRef = useRef(null);
  const [pinned, setPinned] = useState(() => window.matchMedia(PIN_QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(PIN_QUERY);
    const onChange = () => setPinned(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!pinned) return undefined;

    const section = sectionRef.current;
    const slider = sliderRef.current;
    if (!section || !slider) return undefined;

    const getScrollAmount = () => -(slider.scrollWidth - window.innerWidth + 120);

    const tween = gsap.to(slider, {
      x: getScrollAmount,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        pin: true,
        start: 'top top',
        end: () => `+=${slider.scrollWidth - window.innerWidth + 500}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(slider, { clearProps: 'transform' });
    };
  }, [pinned]);

  return (
    <section
      ref={sectionRef}
      className={
        pinned
          ? 'relative w-full h-screen z-10 overflow-hidden bg-background flex flex-col justify-between py-12'
          : 'relative w-full z-10 bg-background flex flex-col gap-8 py-20'
      }
    >
      <div className="w-full px-6 md:px-20 z-20 flex items-end justify-between">
        <div>
          <div className="text-xs font-mono text-accent tracking-[0.25em] mb-2 uppercase">
            03 // Projects
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white tracking-tight">
            UNDER WORK
          </h2>
        </div>
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-mono text-gray-500 uppercase tracking-widest">
          <span>{pinned ? 'Slide to Explore' : 'Swipe'}</span>
          <span className="text-accent animate-pulse">→</span>
        </div>
      </div>

      <div
        ref={sliderRef}
        className={
          pinned
            ? 'flex items-center gap-8 md:gap-14 px-6 md:px-20 w-max h-[68vh] my-auto'
            : 'flex items-stretch gap-4 px-6 overflow-x-auto snap-x snap-mandatory h-[62svh] pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
        }
      >
        {projects.map((p, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onShowProgress?.(p.title, REPO_NOTE)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onShowProgress?.(p.title, REPO_NOTE); }}
            className={`${
              pinned ? 'w-[85vw] md:w-[65vw] max-w-5xl h-full' : 'w-[82vw] shrink-0 snap-center h-full'
            } glass-panel rounded-3xl p-8 md:p-14 relative overflow-hidden group cursor-pointer border border-white/[0.08] hover:border-accent/60 transition-all duration-500 flex flex-col justify-between`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-accent/[0.04] via-transparent to-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-white bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/[0.06]">
                  {p.id}
                </span>
                <span className="text-xs font-mono text-accent uppercase tracking-widest font-semibold">
                  {p.tag}
                </span>
              </div>
              <div className="text-xs font-mono text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
                <span>View Dossier</span>
                <span className="text-base transform group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </div>

            <div className="space-y-4 relative z-10 max-w-3xl my-auto">
              <h3 className="text-3xl md:text-6xl font-display font-black text-white tracking-tight group-hover:text-accent transition-colors duration-300">
                {p.title}
              </h3>
              <p className="text-sm md:text-lg text-gray-300 font-sans leading-relaxed">
                {p.desc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 relative z-10 pt-4 border-t border-white/[0.06]">
              {p.metrics.map((m, idx) => (
                <span
                  key={idx}
                  className="text-[10px] md:text-xs font-mono tracking-wider text-gray-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/[0.04]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full px-6 md:px-20 text-[10px] font-mono text-gray-600 tracking-[0.25em] uppercase flex items-center justify-between z-20">
        <div>FIREFLY // PROJECTS UNDER WORK</div>
        <div>03 PLACEHOLDER REPOSITORIES</div>
      </div>
    </section>
  );
}