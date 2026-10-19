import React from 'react';
import { ROLE_LABELS } from '../../data/recruitment';

const MOBILE_PAGES = [
  { id: 'home', label: 'Vision' },
  { id: 'domains', label: 'Domains' },
  { id: 'projects', label: 'Work' },
  { id: 'team', label: 'Fellows' },
];

function MobileNav({ activePage, onNavigate }) {
  return (
    <div
      className="lg:hidden fixed inset-x-0 bottom-0 z-50 flex justify-center pointer-events-none px-4"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
    >
      <div className="pointer-events-auto flex items-center gap-1 p-1.5 rounded-full bg-black/95 border border-white/[0.14] shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {MOBILE_PAGES.map((page) => (
          <button
            key={page.id}
            onClick={() => onNavigate(page.id)}
            aria-current={activePage === page.id ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-full text-[11px] font-mono font-semibold tracking-wider uppercase transition-colors ${
              activePage === page.id ? 'bg-accent text-black' : 'text-gray-300 active:bg-white/[0.12]'
            }`}
          >
            {page.label}
          </button>
        ))}
      </div>
    </div>
  );
}
export function Navbar({ activePage, onNavigate, session, onSignOut, onOpenApply, onOpenLogin, onOpenTerminal }) {
  const isStaff = session && session.user?.role && session.user.role !== 'APPLICANT';

  return (
    <>
    <nav className="fixed top-0 left-0 w-full z-50 px-4 md:px-12 py-5 pointer-events-auto max-md:bg-gradient-to-b max-md:from-background max-md:via-background/80 max-md:to-transparent">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo (Navigates to Home) */}
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 md:gap-3 group cursor-pointer text-left shrink-0">
          <img src="/brand/firefly-mark.png" alt="" aria-hidden="true" className="w-7 h-7 md:w-9 md:h-9 object-contain transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:drop-shadow-[0_0_14px_rgba(255,90,40,0.7)]" />
          <span className="flex flex-col">
            <span className="text-white font-display font-black text-base md:text-xl tracking-wider md:tracking-widest uppercase leading-none group-hover:text-ember transition-colors">
              FireFly
            </span>
            <span className="max-md:hidden text-gray-400 font-mono text-[9px] tracking-[0.2em] uppercase mt-1 whitespace-nowrap">
              Student AI club
            </span>
          </span>
        </button>

        {/* Multi-Page Navigation Anchors */}
        <div className="hidden lg:flex items-center space-x-7 text-xs font-mono tracking-widest uppercase">
          <button
            onClick={() => onNavigate('home')}
            className={`transition-colors ${activePage === 'home' ? 'text-accent font-bold underline underline-offset-8' : 'text-gray-300 hover:text-accent'}`}
          >
            Vision
          </button>
          <button
            onClick={() => onNavigate('domains')}
            className={`transition-colors ${activePage === 'domains' ? 'text-accent font-bold underline underline-offset-8' : 'text-gray-300 hover:text-accent'}`}
          >
            Domains
          </button>
          <button
            onClick={() => onNavigate('projects')}
            className={`transition-colors ${activePage === 'projects' ? 'text-accent font-bold underline underline-offset-8' : 'text-gray-300 hover:text-accent'}`}
          >
            Work
          </button>
          <button
            onClick={() => onNavigate('team')}
            className={`transition-colors ${activePage === 'team' ? 'text-accent font-bold underline underline-offset-8' : 'text-gray-300 hover:text-accent'}`}
          >
            Fellows
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 min-[400px]:gap-2 sm:gap-2.5">
          <nav className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.14] backdrop-blur-md text-[11px] font-mono tracking-wider mr-1" aria-label="Version Switcher">
            <a href="/v1/" className="px-2 py-0.5 rounded-full text-black bg-accent font-bold shadow-[0_0_8px_rgba(0,245,212,0.4)]">v1</a>
            <a href="/v2/" className="px-2 py-0.5 rounded-full text-gray-400 hover:text-white transition-colors">v2</a>
            <a href="/v3/" className="px-2 py-0.5 rounded-full text-gray-400 hover:text-white transition-colors">v3</a>
          </nav>
          <button
            onClick={onOpenApply}
            className="text-[0.72rem] md:text-[11px] font-mono font-bold tracking-wider uppercase text-black bg-accent px-2.5 min-[400px]:px-3.5 sm:px-4 py-2 rounded-full hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] shrink-0"
          >
            Apply Now
          </button>

          {/* Logged Out State: 1-Click Sign In Modal Trigger */}
          {!session ? (
            <button
              onClick={onOpenLogin}
              className="text-[0.72rem] md:text-[11px] font-mono font-medium tracking-wider uppercase text-white bg-white/[0.08] border border-white/[0.18] px-2.5 min-[400px]:px-3.5 sm:px-4 py-2 rounded-full hover:bg-white/[0.2] hover:scale-105 active:scale-95 transition-all shrink-0"
            >
              Sign In
            </button>
          ) : (
            /* Logged In State: Direct Navigation to Candidate or Admin Command Page */
            <>
              <button
                onClick={() => onNavigate(isStaff ? 'admin-portal' : 'candidate-portal')}
                className={`text-[0.72rem] md:text-[11px] font-mono font-bold tracking-wider uppercase px-3.5 py-2 rounded-full border transition-all shrink-0 ${
                  isStaff
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30'
                    : 'bg-white/[0.08] text-white border-white/[0.18] hover:bg-accent hover:text-black hover:border-accent'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isStaff ? 'bg-red-400' : 'bg-accent'}`} />
                  <span>
                    {isStaff
                      ? `Command (${(ROLE_LABELS[session.user?.role] || 'Staff').split(' ').pop()})`
                      : 'My Portal'}
                  </span>
                </span>
              </button>

              <button
                onClick={onSignOut}
                className="hidden sm:inline-flex text-[0.72rem] md:text-[11px] font-mono font-medium tracking-wider uppercase text-gray-400 hover:text-red-400 bg-white/[0.04] hover:bg-red-500/10 border border-white/[0.08] px-3 py-2 rounded-full transition-all shrink-0"
              >
                Sign Out
              </button>
            </>
          )}

          <button
            onClick={onOpenTerminal}
            className="text-[0.72rem] md:text-[11px] font-mono font-bold tracking-wider uppercase text-white bg-white/[0.12] border border-white/[0.2] px-2.5 min-[400px]:px-3 sm:px-3.5 py-2 rounded-full hover:bg-white hover:text-black transition-all shrink-0"
          >
            CLI ⚡
          </button>
        </div>

      </div>
    </nav>
    <MobileNav activePage={activePage} onNavigate={onNavigate} />
    </>
  );
}
