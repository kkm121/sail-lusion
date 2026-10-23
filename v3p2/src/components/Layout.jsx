import { Suspense, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Magnetic } from './motion';
import { Arrow, Logo, ScrambleText } from './ui';
import Ambient from './Ambient';
import CliSheet from './CliSheet';
import LiteCursor from './LiteCursor';
import Lenis from 'lenis';
import { onFrame, scroll, reduced, setCalm, Spring } from '../lib/motion';
import { SITE } from '../data/site';
import { CREATOR } from '../data/team';
import { prefetchPage } from '../routes';
import { isLite, litePref, setLitePref } from '../lib/lite';

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/domains', label: 'Domains' },
  { to: '/events', label: 'Events' },
  { to: '/projects', label: 'Projects' },
  { to: '/team', label: 'Team' },
  { to: '/partners', label: 'Partners' },
];

// Translucent header: content scrolls under it; it slides away while reading down and returns on the way up.
function Header() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navRef = useRef(null);
  const pillRef = useRef(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => (document.documentElement.style.overflow = '');
  }, [open]);

  useEffect(() => {
    let hidden = false;
    let solid = false;
    let travel = 0;
    let lastY = window.scrollY;
    let heroH = 700;
    const measureHero = () => {
      const hero = document.querySelector('.hero, .ph');
      if (hero) heroH = hero.offsetHeight;
    };
    measureHero();
    window.addEventListener('resize', measureHero, { passive: true });

    let n = 0;
    const stop = onFrame(() => {
      const el = ref.current;
      if (!el) return;
      if (++n % 30 === 0) measureHero(); // pages mount after the header, and change on navigation
      const y = scroll.y;
      const dy = y - lastY;
      lastY = y;
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      const wantSolid = y > 24;
      if (wantSolid !== solid) el.classList.toggle('is-solid', (solid = wantSolid));
      // dark under the header: the hero, or v2's voyage once it has turned to space (flag set by Lab.jsx)
      const over = (heroH - y > 70 || window.__labDark === true) && !el.classList.contains('is-open');
      if (over !== el.classList.contains('is-over')) el.classList.toggle('is-over', over);
      if (over && solid) el.classList.remove('is-solid'), (solid = false);
      const nearBottom = window.innerHeight + y >= (document.documentElement.scrollHeight - 250);
      const wantHide = !nearBottom && y > 320 && travel > 60;
      const wantShow = nearBottom || travel < -24 || y < 120;
      if (wantHide && !hidden) el.classList.add('is-hidden'), (hidden = true);
      else if (wantShow && hidden) el.classList.remove('is-hidden'), (hidden = false);
    });

    return () => {
      stop();
      window.removeEventListener('resize', measureHero);
    };
  }, []);


  return (
    <header ref={ref} className={`hd ${open ? 'is-open' : ''}`.trim()}>
      <div className="wrap hd-in">
        <Link to="/" className="hd-brand" aria-label="FireFly home" viewTransition>
          <Logo />
          <span>
            <b>FireFly</b>
            <small>Student AI club · AMIEE</small>
          </span>
        </Link>
        <nav className="hd-nav" ref={navRef} aria-label="Primary">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} viewTransition onPointerEnter={() => prefetchPage(n.to)} onFocus={() => prefetchPage(n.to)}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hd-actions">
          <Link className="btn btn-ghost hd-act-btn" to="/signin" viewTransition>
            Sign in
          </Link>
          <button type="button" className="btn hd-cli-btn" onClick={() => window.dispatchEvent(new Event('ff:cli'))} aria-label="Open the FireFly console">
            <span className="hd-bolt">⚡</span> CLI
          </button>
          <Magnetic>
            <Link className="btn btn-primary hd-join" to="/join" viewTransition>
              Join FireFly
            </Link>
          </Magnetic>
        </div>
        <button className="hd-burger" type="button" aria-expanded={open} aria-controls="hd-drawer" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
          <i />
          <i />
        </button>
      </div>
      <div className="hd-drawer" id="hd-drawer" hidden={!open}>
        <nav aria-label="Mobile">
          {NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} style={{ '--d': `${60 + i * 45}ms` }} onTouchStart={() => prefetchPage(n.to)}>
              <span className="mono">0{i + 1}</span> {n.label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', animation: 'drawer-in 0.7s var(--ease) both', animationDelay: '360ms' }}>
            <Link className="btn btn-ghost" to="/signin" onClick={() => setOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
              Sign in
            </Link>
            <button type="button" className="btn hd-cli-btn" onClick={() => { setOpen(false); window.dispatchEvent(new Event('ff:cli')); }} style={{ flex: 1, justifyContent: 'center' }}>
              <span className="hd-bolt">⚡</span> CLI
            </button>
          </div>
          <Link className="btn btn-primary" to="/join" style={{ '--d': '420ms' }}>
            Join FireFly <Arrow />
          </Link>
        </nav>
      </div>
    </header>
  );
}

// The reading progress bar: a CSS scroll-driven animation (see apple.css), no JavaScript per frame.
function Progress() {
  return <div className="progress" aria-hidden="true" />;
}

function Footer() {
  const [calmState, setCalmState] = useState(() => reduced());
  const [lite, setLite] = useState(() => litePref() || 'auto');
  const cycleLite = () => {
    const next = lite === 'auto' ? 'on' : lite === 'on' ? 'off' : 'auto';
    setLitePref(next === 'auto' ? null : next);
    setLite(next);
    // the voyage picks its tier when it mounts: reload so the choice applies everywhere
    window.location.reload();
  };
  const toggleMotion = () => {
    const next = !reduced();
    setCalm(next);
    setCalmState(next);
  };

  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-big" aria-hidden="true">
          <span>FireFly</span>
        </div>
        <div className="ft-top">
          <Link to="/" className="ft-brand" aria-label="FireFly home" viewTransition>
            <Logo />
            <span>
              <b>FireFly</b>
              <small>Student AI club · Associated with AMIEE</small>
            </span>
          </Link>
          <p className="ft-line">Small lights, built together.</p>
        </div>
        <div className="ft-cols">
          <div>
            <h4 className="mono">Explore</h4>
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} viewTransition>
                {n.label}
              </Link>
            ))}
          </div>
          <div>
            <h4 className="mono">Take part</h4>
            <Link to="/join" viewTransition>
              How to join
            </Link>
            <Link to="/join#faq">Questions</Link>
            <Link to="/events" viewTransition>
              Every term
            </Link>
            <Link to="/partners" viewTransition>
              Partner with us
            </Link>
          </div>
          <div>
            <h4 className="mono">Find us</h4>
            <p>
              {SITE.address.map((l) => (
                <span key={l}>
                  {l}
                  <br />
                </span>
              ))}
            </p>
          </div>
          <div>
            <h4 className="mono">Follow</h4>
            <a href={SITE.instagram} target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
            <a href={SITE.linkedin} target="_blank" rel="noreferrer">
              LinkedIn ↗
            </a>
          </div>
        </div>
        <div className="ft-bottom">
          <span>© {SITE.year} FireFly · Associated with AMIEE</span>
          <span>
            Website made by <b className="ft-credit">{CREATOR}</b>
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="ft-top-btn"
              onClick={toggleMotion}
              aria-label={`Toggle motion. Currently ${calmState ? 'off' : 'on'}`}
            >
              Motion: {calmState ? 'off' : 'on'}
            </button>
            <button type="button" className="ft-top-btn" onClick={cycleLite} aria-label={`Lite mode. Currently ${lite}${lite === 'auto' ? (isLite() ? ', on for this device' : ', off for this device') : ''}`}>
              Lite: {lite}
            </button>
            <button type="button" className="ft-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// v2's smooth scrolling: wheel input eases toward its target. Off on touch screens and when Motion is off.
function useSmoothScroll() {
  useEffect(() => {
    if (reduced() || window.matchMedia('(hover: none), (pointer: coarse)').matches) return undefined;
    const lenis = new Lenis({ lerp: 0.14, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    window.__lenis = lenis;
    const stop = onFrame((dt, now) => lenis.raf(now));
    return () => {
      stop();
      lenis.destroy();
      window.__lenis = null;
    };
  }, []);
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  useSmoothScroll();
  // the page mounts at once, behind the opening screen, so the voyage can download and warm up there;
  // its entrance animations stay paused until the screen opens (html.is-loading, see base.css)
  // the page is built once the opening screen shows the solid word and the bird has arrived (so neither stutters)
  const shown = () => !!window.__ffReady || !!window.__ldSettled || !document.getElementById('ldr');
  const [ready, setReady] = useState(shown);
  useEffect(() => {
    if (ready) return undefined;
    const on = () => shown() && setReady(true);
    window.addEventListener('ff:settled', on);
    window.addEventListener('ff:ready', on);
    on();
    return () => {
      window.removeEventListener('ff:settled', on);
      window.removeEventListener('ff:ready', on);
    };
  }, [ready]);
  useEffect(() => {
    if (!ready) return;
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.__lenis?.resize(); // the page just mounted: let smooth scrolling re-measure its height
    if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo(0, 0);
  }, [pathname, hash, ready]);
  return (
    <>
      <Progress />
      <LiteCursor />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <Ambient />
      <main id="main" className="page" key={pathname}>
        <Suspense fallback={<div className="page-wait" aria-busy="true" />}>
          {ready ? <Outlet /> : null}
        </Suspense>
      </main>
      <Footer />
      <CliSheet />
    </>
  );
}
