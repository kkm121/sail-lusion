import React from 'react';

const domains = [
  { id: '01', title: 'TECHNICAL CORE', desc: 'AI/ML, Next.js, Node, PyTorch, Cloud Infrastructure.' },
  { id: '02', title: 'RESEARCH & DEV', desc: 'Robotics, Embedded C++, ROS, IoT, Patent Research.' },
  { id: '03', title: 'CORPORATE & EVENTS', desc: 'Sponsorships, Conclave Operations, Industry Relations.' },
  { id: '04', title: 'CREATIVES & DESIGN', desc: 'UI/UX Systems, 3D Motion Graphics, Visual Branding.' },
  { id: '05', title: 'EDITORIAL & CONTENT', desc: 'Technical Paper Writing, Research Journalism.' },
];

export function Domains({ onExploreDomains }) {
  return (
    <section className="relative w-full min-h-screen py-32 z-10 px-6 md:px-24 bg-background/50 backdrop-blur-md">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <div className="text-xs font-mono text-accent tracking-[0.2em] mb-4 uppercase">02 // What We Build</div>
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white">THE FIVE PILLARS</h2>
          </div>
          <p className="text-gray-400 font-sans max-w-sm text-sm">
            Specialized engineering domains driving the FireFly ecosystem forward.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((d, i) => (
            <div
              key={i}
              role="button"
              tabIndex={0}
              onClick={onExploreDomains}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExploreDomains?.(); }}
              className={`glass-panel p-8 rounded-3xl cursor-pointer transition-all duration-500 hover:border-accent hover:bg-white/[0.05] group ${i === 4 ? 'md:col-span-2 lg:col-span-1' : ''}`}
            >
              <div className="text-xs font-mono text-gray-500 mb-6 group-hover:text-accent transition-colors">{d.id} //</div>
              <h3 className="text-xl font-display font-bold text-white mb-4">{d.title}</h3>
              <p className="text-sm text-gray-400 font-sans">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
