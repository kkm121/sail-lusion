import React from 'react';

export function Join({ onOpenApply }) {
  return (
    <section className="relative w-full h-screen flex flex-col items-center justify-center z-10 px-6 text-center bg-background/50">
      
      <div className="space-y-3 mb-10">
        <div className="text-xs font-mono text-gray-500 uppercase tracking-widest">BUILD</div>
        <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">LEARN</div>
        <div className="text-xs font-mono text-gray-300 uppercase tracking-widest">COMPETE</div>
        <div className="text-xs font-mono text-gray-200 uppercase tracking-widest">CREATE</div>
        <div className="text-xs font-mono text-white uppercase tracking-widest font-bold">LEAD</div>
      </div>

      <h2 className="text-[clamp(3rem,8vw,7rem)] font-display font-black leading-none tracking-tighter text-white mb-10">
        BECOME PART <br/> <span className="text-accent text-outline">OF FIREFLY</span>
      </h2>

      <button
        onClick={onOpenApply}
        className="group relative px-10 py-5 rounded-full glass-panel overflow-hidden border border-accent/40 shadow-[0_0_30px_rgba(0,245,212,0.25)] hover:scale-105 active:scale-95 transition-all"
      >
        <div className="absolute inset-0 bg-accent transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-[cubic-bezier(0.87,0,0.13,1)]"></div>
        <span className="relative z-10 text-xs md:text-sm font-mono font-bold tracking-widest uppercase text-white group-hover:text-background transition-colors duration-500">
          Initialize Dossier ⚡
        </span>
      </button>

      <div className="absolute bottom-8 text-[10px] font-mono text-gray-600 tracking-widest uppercase">
        © 2026 FIREFLY // STUDENT AI CLUB
      </div>
    </section>
  );
}
