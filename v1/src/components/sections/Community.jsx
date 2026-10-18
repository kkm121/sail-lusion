import React from 'react';
import { CREATOR, fellowsOrder } from '../../data/team';

export function Community({ onExploreTeam }) {
  return (
    <section className="relative w-full min-h-screen py-32 z-10 px-6 md:px-24">
      <div className="max-w-5xl mx-auto">
        <div className="text-xs font-mono text-accent tracking-[0.2em] mb-4 uppercase">04 // The People</div>
        <h2 className="text-4xl md:text-6xl font-display font-bold text-white mb-16">RESEARCH FELLOWS</h2>

        <div className="space-y-4">
          {fellowsOrder.map((name, i) => (
            <div
              key={name}
              role="button"
              tabIndex={0}
              onClick={onExploreTeam}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onExploreTeam?.(); }}
              className="group relative border-b border-white/[0.08] py-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors -mx-6 px-6"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-12">
                <span className="text-xs font-mono text-gray-500 w-8">{String(i + 1).padStart(2, '0')}</span>
                <span
                  className={`text-3xl md:text-5xl font-display font-medium transition-colors ${
                    name === CREATOR ? 'text-gold-shine' : 'text-white group-hover:text-accent'
                  }`}
                >
                  {name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
