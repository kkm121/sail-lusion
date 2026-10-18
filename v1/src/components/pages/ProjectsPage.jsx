import React, { useState } from 'react';

const projectsData = [
  {
    id: 'p1',
    code: '01',
    domain: 'COMPUTER VISION',
    domainTag: 'TECHNICAL',
    title: 'firefly-vision-core',
    tagline: 'Placeholder repository: image classification and detection toolkit',
    summary: 'A starter repository for the lab vision experiments. Datasets, training scripts, and evaluation notebooks will be added here as the project takes shape.',
    metrics: { phase: 'Under work', language: 'Python', license: 'MIT' },
    stack: ['Python', 'PyTorch', 'OpenCV', 'Jupyter', 'GitHub Actions'],
    paper: 'firefly-vision-core (placeholder)',
    status: 'Under Work',
    accentColor: '#00F5D4'
  },
  {
    id: 'p2',
    code: '02',
    domain: 'NATURAL LANGUAGE',
    domainTag: 'RESEARCH_AND_DEVELOPMENT',
    title: 'firefly-nlp-playground',
    tagline: 'Placeholder repository: language model experiments',
    summary: 'A placeholder for text classification, summarisation, and retrieval experiments built by lab members.',
    metrics: { phase: 'Planning', language: 'Python', license: 'MIT' },
    stack: ['Python', 'Transformers', 'scikit-learn', 'FastAPI'],
    paper: 'firefly-nlp-playground (placeholder)',
    status: 'Planning',
    accentColor: '#8B5CF6'
  },
  {
    id: 'p3',
    code: '03',
    domain: 'ROBOTICS & EMBEDDED',
    domainTag: 'TECHNICAL',
    title: 'firefly-robotics-sim',
    tagline: 'Placeholder repository: simulation and control experiments',
    summary: 'A placeholder for robot simulation, path planning, and microcontroller control projects.',
    metrics: { phase: 'Under work', language: 'C++', license: 'MIT' },
    stack: ['ROS2', 'C++', 'Python', 'Gazebo'],
    paper: 'firefly-robotics-sim (placeholder)',
    status: 'Under Work',
    accentColor: '#10B981'
  },
  {
    id: 'p4',
    code: '04',
    domain: 'DATA & RESEARCH',
    domainTag: 'RESEARCH_AND_DEVELOPMENT',
    title: 'firefly-data-lab',
    tagline: 'Placeholder repository: datasets and reproducible research',
    summary: 'A placeholder for shared datasets, benchmarks, and reproducible research write-ups from the lab.',
    metrics: { phase: 'Planning', language: 'Python', license: 'MIT' },
    stack: ['Python', 'Pandas', 'JAX', 'DVC'],
    paper: 'firefly-data-lab (placeholder)',
    status: 'Planning',
    accentColor: '#3B82F6'
  },
  {
    id: 'p5',
    code: '05',
    domain: 'WEB & DESIGN',
    domainTag: 'CREATIVE',
    title: 'firefly-web',
    tagline: 'Placeholder repository: this website',
    summary: 'The source of the FireFly website, built with React, Three.js, and GSAP. Recruitment and sign-in are still under construction.',
    metrics: { phase: 'Under work', language: 'JavaScript', license: 'MIT' },
    stack: ['React', 'Three.js', 'GSAP', 'Tailwind CSS', 'Vite'],
    paper: 'firefly-web (placeholder)',
    status: 'Under Work',
    accentColor: '#EC4899'
  }
];
const REPO_MESSAGE = 'This project page is being built. Repository details will be added once the project goes public.';

export function ProjectsPage({ onOpenApply, onShowProgress }) {
  const [filter, setFilter] = useState('ALL');

  const filteredProjects = filter === 'ALL' 
    ? projectsData 
    : projectsData.filter(p => p.domainTag === filter);

  return (
    <div className="relative z-10 min-h-screen pt-32 pb-24 px-4 sm:px-8 md:px-16 lg:px-24 font-sans selection:bg-cyan-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Apple-Grade Header */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase text-gray-300 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.1] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>03 // Projects Under Work</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white tracking-tight leading-[1.08]">
            Frontier work, <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              being built.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans max-w-xl mx-auto">
            Placeholder repositories for now. Real FireFly projects will replace these as they are built.
          </p>
        </div>

        {/* Apple Segmented Filter Bar */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-full bg-black/60 border border-white/[0.12] backdrop-blur-3xl flex flex-wrap justify-center gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-full max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
            {[
              { id: 'ALL', label: 'All Projects' },
              { id: 'TECHNICAL', label: 'Robotics & Systems' },
              { id: 'RESEARCH_AND_DEVELOPMENT', label: 'Neuromorphic & Quantum' },
              { id: 'CREATIVE', label: 'Spatial WebGL' }
            ].map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-5 py-2 rounded-full text-xs font-mono transition-all duration-300 shrink-0 whitespace-nowrap ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Apple-Style Bento Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => onShowProgress?.(p.title, REPO_MESSAGE)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onShowProgress?.(p.title, REPO_MESSAGE); }}
              className="cursor-pointer p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.05] via-black/80 to-black/95 backdrop-blur-3xl border border-white/[0.1] hover:border-white/[0.25] transition-all duration-500 space-y-8 flex flex-col justify-between group shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden"
            >
              {/* Subtle Ambient Radial Glow */}
              <div 
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[100px] max-md:hidden pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                style={{ backgroundColor: p.accentColor }}
              />

              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="font-bold tracking-wider" style={{ color: p.accentColor }}>
                    {p.code} // {p.domain}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-gray-300 text-[10px]">
                    {p.status}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-black text-white group-hover:text-cyan-400 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs font-mono text-gray-400">{p.tagline}</p>
                <p className="text-sm font-sans text-gray-300 leading-relaxed pt-1">{p.summary}</p>
              </div>

              {/* Hardware & Compute Telemetry */}
              <div className="space-y-5 pt-6 border-t border-white/[0.08] relative z-10">
                <div className="grid grid-cols-3 gap-2.5 font-mono text-xs">
                  {Object.entries(p.metrics).map(([k, v], idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[9px] text-gray-500 block uppercase tracking-wider">{k}</span>
                      <span className="text-white font-semibold font-sans text-xs block">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Tech Chips */}
                <div className="flex flex-wrap gap-2 font-mono text-[10px]">
                  {p.stack.map((s, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-gray-300">
                      {s}
                    </span>
                  ))}
                </div>

                {/* Paper & Application Link */}
                <div className="flex items-center justify-between pt-2 text-xs font-mono">
                  <span className="text-gray-500 text-[11px]">Repo: <strong className="text-gray-300 font-sans">{p.paper}</strong></span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onOpenApply(); }}
                    className="text-cyan-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1"
                  >
                    <span>Join Project Lab</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
