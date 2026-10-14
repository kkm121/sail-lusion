import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import TransitionLink from './TransitionLink';
import { useBuilding, useRecruit, useTerminal } from './RecruitContext';
import { SITE } from '../data/site';
import { isSoundOn, playSound, setSound, subscribeSound } from '../lib/sound';

const PAGES = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Domains', href: '/domains' },
  { label: 'Projects', href: '/projects' },
];

export default function Header({ back }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const sound = useSyncExternalStore(subscribeSound, isSoundOn, () => false);
  const building = useBuilding();
  const recruit = useRecruit();
  const openTerminal = useTerminal();

  useEffect(() => {
    const selector = 'a, button, [role=button]';
    const over = (e) => {
      const target = e.target.closest?.(selector);
      if (target && target !== e.relatedTarget?.closest?.(selector)) playSound('hover');
    };
    const click = (e) => e.target.closest?.(selector) && playSound('click');
    document.addEventListener('pointerover', over);
    document.addEventListener('click', click);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('click', click);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    const check = () => {
      // 1. Sub-pages are inherently dark
      if (document.querySelector('.sl-sub')) {
        root.classList.add('sl-nav-dark');
        return;
      }
      // 2. Lab journey section check
      const lab = document.getElementById('lab');
      if (lab) {
        const r = lab.getBoundingClientRect();
        if (r.top <= 75 && r.bottom >= 75) {
          const range = Math.max(r.height - window.innerHeight, 1);
          const p = -r.top / range;
          if (p > 0.06) {
            root.classList.add('sl-nav-dark');
            return;
          }
        }
      }
      // 3. Elements with explicit dark attribute or end section
      const dark = [...document.querySelectorAll('.sl-end, .sl-nav, [data-dark]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= 75 && r.bottom >= 75;
      });
      root.classList.toggle('sl-nav-dark', dark);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      root.classList.remove('sl-nav-dark');
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const soon = (feature) => () => {
    setOpen(false);
    building(feature);
  };
  const isCurrent = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <>
      <header className="sl-nav-bar">
        <TransitionLink className="brand" href="/" label="Home" aria-label="SAIL home">
          <b>SAIL</b>
          <small>SRM AI Lab · Associated with AMIEE</small>
        </TransitionLink>

        <nav className="links" aria-label="Primary">
          {PAGES.map((l) => (
            <TransitionLink key={l.label} href={l.href} label={l.label} aria-current={isCurrent(l.href) ? 'page' : undefined}>
              {l.label}
            </TransitionLink>
          ))}
        </nav>

        <div className="actions">
          <button className={`snd ${sound ? 'is-on' : ''}`} type="button" aria-label={sound ? 'Turn sound off' : 'Turn sound on'} aria-pressed={sound} data-cursor="SOUND" onClick={() => setSound(!isSoundOn())}>
            <b />
            <b />
            <b />
          </button>
          <button className="btn apply" type="button" onClick={recruit} data-magnetic>
            Apply now
          </button>
          <button className="btn ghost" type="button" onClick={soon('Sign in')} data-magnetic>
            Sign in
          </button>
          <button className="btn cli" type="button" onClick={openTerminal} data-magnetic aria-label="Open the SAIL CLI">
            CLI <span aria-hidden="true">⚡</span>
          </button>
          <button className="btn menu" type="button" aria-expanded={open} aria-controls="sl-menu" onClick={() => setOpen((o) => !o)}>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
      </header>
      {back && (
        <TransitionLink className="sl-back" href={back.href} label={back.label}>
          <span aria-hidden="true">←</span> {back.label}
        </TransitionLink>
      )}

      <nav id="sl-menu" className={`sl-menu ${open ? 'is-open' : ''}`} aria-hidden={!open}>
        <div className="sl-menu-links">
          {PAGES.map((l) => (
            <TransitionLink key={l.label} href={l.href} label={l.label} tabIndex={open ? 0 : -1} aria-current={isCurrent(l.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {l.label}
            </TransitionLink>
          ))}
          <button type="button" tabIndex={open ? 0 : -1} onClick={soon('Recruitment')}>
            Recruitment <em>Building</em>
          </button>
          <button type="button" tabIndex={open ? 0 : -1} onClick={soon('Sign in')}>
            Sign in <em>Building</em>
          </button>
          <button type="button" tabIndex={open ? 0 : -1} onClick={soon('Sign up')}>
            Sign up <em>Building</em>
          </button>
          <button
            type="button"
            tabIndex={open ? 0 : -1}
            onClick={() => {
              setOpen(false);
              openTerminal();
            }}
          >
            CLI <em>Ctrl K</em>
          </button>
          <a href={SITE.linkedin} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
            Contact
          </a>
        </div>
        <div className="sl-menu-news">
          <h3>Follow the lab</h3>
          <div className="sl-menu-social">
            <a href={SITE.instagram} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
              Instagram ↗
            </a>
            <a href={SITE.linkedin} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
              LinkedIn ↗
            </a>
          </div>
        </div>
      </nav>
    </>
  );
}
