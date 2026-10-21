import { useState } from 'react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="v4-header">
      <div className="wrap">
        <div className="v4-nav-inner">
          <div className="v4-nav-brand" onClick={() => scrollTo('hero')} style={{ cursor: 'pointer' }}>
            <div className="v4-brand-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2c.5 3 2.5 5 5.5 5.5-3 .5-5 2.5-5.5 5.5-.5-3-2.5-5-5.5-5.5 3-.5 5-2.5 5.5-5.5Z" fill="currentColor" />
                <path d="M18 16c.3 1.5 1.5 2.5 3 2.8-1.5.3-2.5 1.5-2.8 3-.3-1.5-1.5-2.5-3-2.8 1.5-.3 2.5-1.5 2.8-3Z" fill="currentColor" />
              </svg>
            </div>
            <span>FireFly</span>
            <span className="v4-version-tag mono">v4.0</span>
          </div>

          <nav className="v4-nav-links">
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('hero')}>Overview</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('philosophy')}>Mission</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('domains')}>Domains</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('playground')}>Labs</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('projects')}>Projects</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('initiatives')}>Formats</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('research')}>Research</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('crew')}>Crew</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('admissions')}>Join</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('terminal')}>Terminal</button>
          </nav>

          <div className="v4-nav-actions">
            <div className="v4-version-switch" title="Switch FireFly Edition">
              <a href="/v1/" className="v4-ver-btn mono">v1</a>
              <a href="/v2/" className="v4-ver-btn mono">v2</a>
              <a href="/v3/" className="v4-ver-btn mono">v3</a>
              <a href="/v4/" className="v4-ver-btn mono is-active">v4</a>
            </div>

            <button
              type="button"
              className="v4-apply-btn"
              onClick={() => scrollTo('admissions')}
            >
              <span>Join Club</span>
              <span>→</span>
            </button>

            <button
              type="button"
              className="v4-mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle Navigation"
            >
              <span />
              <span />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="v4-mobile-menu">
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('hero')}>01 // Overview</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('philosophy')}>02 // Mission</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('domains')}>03 // Domains</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('playground')}>04 // Interactive Labs</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('projects')}>05 // Projects</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('initiatives')}>06 // Formats & Sprints</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('research')}>07 // Research</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('crew')}>08 // The Crew (17)</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('admissions')}>09 // Recruitment</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('terminal')}>10 // Terminal</button>
            <button type="button" className="v4-mobile-link" onClick={() => scrollTo('partners')}>11 // Ecosystem</button>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '8px' }}>
                SWITCH PORTAL EDITION:
              </div>
              <div className="v4-version-switch" style={{ width: '100%', justifyContent: 'space-around' }}>
                <a href="/v1/" className="v4-ver-btn mono">v1</a>
                <a href="/v2/" className="v4-ver-btn mono">v2</a>
                <a href="/v3/" className="v4-ver-btn mono">v3</a>
                <a href="/v4/" className="v4-ver-btn mono is-active">v4</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
