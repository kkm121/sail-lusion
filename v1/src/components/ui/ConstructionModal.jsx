import React, { useEffect } from 'react';

const DEFAULT_MESSAGE = 'This is being built and will be available here soon. Follow FireFly on Instagram and LinkedIn to hear when it goes live.';

export function ConstructionModal({ isOpen, feature, message, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center px-4 bg-black/70 md:backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Under construction"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-white/[0.06] via-black/80 to-black/95 border border-white/[0.12] shadow-[0_20px_80px_rgba(0,0,0,0.8)] text-center space-y-6 overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px] max-md:hidden bg-accent opacity-20 pointer-events-none" />

        <div className="relative inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase text-gray-300 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.1]">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span>Under Construction</span>
        </div>

        <div className="relative space-y-3">
          <h2 className="text-3xl font-display font-black text-white tracking-tight">
            {feature || 'This section'} is being built.
          </h2>
          <p className="text-sm text-gray-400 font-sans leading-relaxed">{message || DEFAULT_MESSAGE}</p>
        </div>

        <button
          onClick={onClose}
          className="relative px-8 py-3 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
