import React from 'react';
import { CREATOR } from '../../data/team';
import { SOCIAL_LINKS } from '../../data/links';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11.5H3V9.75zm6.5 0h3.83v1.57h.06c.53-1 1.84-2.07 3.79-2.07 4.05 0 4.8 2.66 4.8 6.13v5.87h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75v5.29h-4V9.75z" />
    </svg>
  );
}

const iconLink =
  'w-9 h-9 rounded-full flex items-center justify-center text-gray-300 bg-white/[0.05] border border-white/[0.14] hover:text-black hover:bg-accent hover:border-accent hover:scale-110 transition-all';

export function Footer() {
  return (
    <footer className="relative z-10 w-full px-6 pt-10 pb-28 lg:pb-10 flex flex-col items-center gap-4 border-t border-white/[0.08] bg-black/60 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="FireFly on Instagram" className={iconLink}>
          <InstagramIcon />
        </a>
        <a href={SOCIAL_LINKS.linkedin} target="_blank" rel="noopener noreferrer" aria-label="FireFly on LinkedIn" className={iconLink}>
          <LinkedInIcon />
        </a>
      </div>
      <img src="/brand/firefly-mark.png" alt="FireFly logo" className="w-14 h-14 object-contain drop-shadow-[0_0_24px_rgba(255,80,30,0.45)]" />
      <div className="text-[11px] font-mono text-gray-400 tracking-[0.2em] uppercase text-center">
        FireFly // Student AI Club
      </div>
      <div className="flex items-center gap-2 text-xs sm:text-[13px] font-mono text-gray-300 tracking-wider text-center">
        <span className="w-1 h-1 rounded-full bg-gold/70" />
        <span>
          Website made by : <span className="text-gold-shine font-semibold">{CREATOR}</span>
        </span>
        <span className="w-1 h-1 rounded-full bg-gold/70" />
      </div>
    </footer>
  );
}
