import { useEffect, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import TransitionLink from './TransitionLink';
import Logo from './Logo';
import { useBuilding, useRecruit, useTerminal } from './RecruitContext';
import { SITE } from '../data/site';
import { isSoundOn, playSound, setSound, subscribeSound } from '../lib/sound';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { trackAll } from '../lib/measure';

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
    if (document.querySelector('.sl-sub')) {
      root.classList.add('sl-nav-dark');
      return () => root.classList.remove('sl-nav-dark');
    }
    const track = trackAll(() => [...document.querySelectorAll('#lab, .sl-end, .sl-nav, [data-dark]')]);
    const retry = [400, 1200, 2800].map((ms) => window.setTimeout(() => window.dispatchEvent(new Event('sl:layout')), ms));
    let current = null;
    const stop = onTick(() => {
      const y = scrollState.y + 75;
      let dark = false;
      for (const r of track.rects) {
        if (!r || y < r.top || y > r.bottom) continue;
        if (r.el.id === 'lab') {
          const range = Math.max(r.height - scrollState.vh, 1);
          if ((scrollState.y - r.top) / range > 0.06) dark = true;
        } else dark = true;
      }
      if (dark !== current) {
        current = dark;
        root.classList.toggle('sl-nav-dark', dark);
      }
    }, 6);
    return () => {
      stop();
      track.stop();
      retry.forEach(clearTimeout);
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
        <TransitionLink className="brand" href="/" label="Home" aria-label="FireFly home">
          <Logo />
          <span className="txt">
            <b>FireFly</b>
            <small>Student club · Associated with AMIEE</small>
          </span>
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
          <button className="btn cli" type="button" onClick={openTerminal} data-magnetic aria-label="Open the FireFly CLI">
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
          <h3>Follow the club</h3>
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
