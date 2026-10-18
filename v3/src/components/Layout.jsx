import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Magnetic } from './motion';
import { Arrow, Logo, ScrambleText } from './ui';
import Ambient from './Ambient';
import Cursor from './Cursor';
import { onFrame, scroll, reduced, setCalm, Spring } from '../lib/motion';
import { SITE } from '../data/site';
import { CREATOR } from '../data/team';

export const NAV = [
  { to: '/about', label: 'About' },
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

    const stop = onFrame(() => {
      const el = ref.current;
      if (!el) return;
      const y = scroll.y;
      const dy = y - lastY;
      lastY = y;
      travel = Math.sign(dy) === Math.sign(travel) ? travel + dy : dy;
      const wantSolid = y > 24;
      if (wantSolid !== solid) el.classList.toggle('is-solid', (solid = wantSolid));
      const over = heroH - y > 70 && !el.classList.contains('is-open');
      if (over !== el.classList.contains('is-over')) el.classList.toggle('is-over', over);
      if (over && solid) el.classList.remove('is-solid'), (solid = false);
      const wantHide = y > 320 && travel > 60;
      const wantShow = travel < -24 || y < 120;
      if (wantHide && !hidden) el.classList.add('is-hidden'), (hidden = true);
      else if (wantShow && hidden) el.classList.remove('is-hidden'), (hidden = false);
    });

    return () => {
      stop();
      window.removeEventListener('resize', measureHero);
    };
  }, []);

  // Spring-driven sliding pill under hovered/active nav link
  useEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill || reduced()) return undefined;

    const springX = new Spring(0, { damping: 0.85, response: 0.3 });
    const springW = new Spring(0, { damping: 0.85, response: 0.3 });
    const springOp = new Spring(0, { damping: 0.9, response: 0.25 });

    const updateTarget = (el) => {
      if (el) {
        springX.target = el.offsetLeft;
        springW.target = el.offsetWidth;
        springOp.target = 1;
      } else {
        const active = nav.querySelector('a.active');
        if (active) {
          springX.target = active.offsetLeft;
          springW.target = active.offsetWidth;
          springOp.target = 1;
        } else {
          springOp.target = 0;
        }
      }
    };

    updateTarget(null);

    const links = nav.querySelectorAll('a');
    const onEnter = (e) => updateTarget(e.currentTarget);
    const onLeave = () => updateTarget(null);

    links.forEach((l) => l.addEventListener('pointerenter', onEnter));
    nav.addEventListener('pointerleave', onLeave);

    const stop = onFrame((dt) => {
      const x = springX.step(dt);
      const w = springW.step(dt);
      const op = springOp.step(dt);
      pill.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      pill.style.width = `${w.toFixed(2)}px`;
      pill.style.opacity = op.toFixed(3);
    });

    return () => {
      stop();
      links.forEach((l) => l.removeEventListener('pointerenter', onEnter));
      nav.removeEventListener('pointerleave', onLeave);
    };
  }, [pathname]);

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
          <span className="hd-nav-pill" ref={pillRef} aria-hidden="true" />
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} viewTransition>
              <ScrambleText text={n.label} />
            </NavLink>
          ))}
        </nav>
        <div className="hd-actions">
          <nav className="ff-ver-switch" aria-label="Version Switcher" title="Switch between website versions">
            <a href="/v1" className="ff-ver-link">v1</a>
            <a href="/v2" className="ff-ver-link">v2</a>
            <a href="/v3" className="ff-ver-link is-active">v3</a>
          </nav>
          <Link className="btn btn-ghost hd-act-btn" to="/signin" viewTransition>
            Sign in
          </Link>
          <Link className="btn hd-cli-btn" to="/cli" viewTransition>
            <span className="hd-bolt">⚡</span> CLI
          </Link>
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
            <NavLink key={n.to} to={n.to} style={{ '--d': `${60 + i * 45}ms` }}>
              <span className="mono">0{i + 1}</span> {n.label}
            </NavLink>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', animation: 'drawer-in 0.7s var(--ease) both', animationDelay: '360ms' }}>
            <Link className="btn btn-ghost" to="/signin" onClick={() => setOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
              Sign in
            </Link>
            <Link className="btn hd-cli-btn" to="/cli" onClick={() => setOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>
              <span className="hd-bolt">⚡</span> CLI
            </Link>
          </div>
          <Link className="btn btn-primary" to="/join" style={{ '--d': '420ms' }}>
            Join FireFly <Arrow />
          </Link>
        </nav>
      </div>
    </header>
  );
}

function Progress() {
  const ref = useRef(null);
  useEffect(
    () =>
      onFrame(() => {
        if (ref.current) ref.current.style.transform = `scaleX(${scroll.progress.toFixed(4)})`;
      }),
    []
  );
  return <div className="progress" ref={ref} aria-hidden="true" />;
}

function Footer() {
  const [calmState, setCalmState] = useState(() => reduced());
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
            <button type="button" className="ft-top-btn" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              Back to top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Layout() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return (
    <>
      <Progress />
      <Cursor />
      <a className="skip" href="#main">
        Skip to content
      </a>
      <Header />
      <Ambient />
      <main id="main" className="page" key={pathname}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
