export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="v4-footer">
      <div className="wrap">
        <div className="v4-footer-grid">
          <div className="v4-footer-copy">
            <strong>FireFly // Student AI Club</strong>
            <span>Associated with AMIEE · SRM Institute of Science and Technology, Chennai</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
              Designed & Engineered with M Muthu Kumaran and the FireFly Team
            </span>
          </div>

          <div className="v4-footer-links">
            <div className="v4-version-switch" title="Switch Version">
              <a href="/v1/" className="v4-ver-btn mono">v1</a>
              <a href="/v2/" className="v4-ver-btn mono">v2</a>
              <a href="/v3/" className="v4-ver-btn mono">v3</a>
              <a href="/v4/" className="v4-ver-btn mono is-active">v4</a>
            </div>

            <a
              href="https://github.com/kkm121/RP_Club"
              target="_blank"
              rel="noopener noreferrer"
              className="mono"
              style={{ fontSize: '13px' }}
            >
              GitHub ↗
            </a>

            <button
              type="button"
              className="mono"
              style={{ fontSize: '13px', color: 'var(--ember)' }}
              onClick={scrollToTop}
            >
              Top ↑
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
