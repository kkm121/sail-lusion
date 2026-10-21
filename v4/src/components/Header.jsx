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
          <div className="v4-nav-brand">
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
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('projects')}>Projects</button>
            <button type="button" className="v4-nav-link" onClick={() => scrollTo('crew')}>Crew</button>
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
              onClick={() => scrollTo('terminal')}
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
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M3 12h18M3 6h18M3 18h18" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{
            padding: '16px 0 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('hero')}>Overview</button>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('philosophy')}>Mission</button>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('domains')}>Domains</button>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('projects')}>Projects</button>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('crew')}>Crew</button>
            <button type="button" className="v4-nav-link" style={{ textAlign: 'left', padding: '8px 12px' }} onClick={() => scrollTo('terminal')}>Terminal</button>
          </div>
        )}
      </div>
    </header>
  );
}
