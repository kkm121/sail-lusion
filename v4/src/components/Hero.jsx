import DiscoverInteractive from './DiscoverInteractive';

export default function Hero({ onOpenCli }) {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="hero" className="v4-hero-section">
      <div className="wrap">
        <div className="v4-hero-grid">
          <div className="v4-hero-content">
            <div className="v4-pill-badge mono">
              <i />
              <span>SRMIST · ASSOCIATED WITH AMIEE</span>
            </div>

            <h1 className="v4-hero-title">
              Small lights,<br />
              <span>built together.</span>
            </h1>

            <p className="v4-hero-lede">
              FireFly is a student-run artificial intelligence laboratory at SRM Institute of Science and Technology.
              We build physical robotics, train vision-language models, and architect high-performance distributed systems.
            </p>

            <div className="v4-hero-actions">
              <button
                type="button"
                className="v4-btn-primary"
                onClick={() => scrollTo('domains')}
              >
                <span>Explore 5 Domains</span>
                <span>↓</span>
              </button>

              <button
                type="button"
                className="v4-btn-secondary mono"
                onClick={onOpenCli}
              >
                <span>Terminal</span>
                <span style={{ opacity: 0.6 }}>⌘K</span>
              </button>

              <button
                type="button"
                className="v4-btn-secondary"
                onClick={() => scrollTo('crew')}
              >
                <span>The Crew (17)</span>
                <span>→</span>
              </button>
            </div>

            <div className="v4-hero-metrics-pill mono">
              <div><strong className="v4-metric-dot">17</strong> Members</div>
              <div style={{ opacity: 0.3 }}>|</div>
              <div><strong className="v4-metric-dot">05</strong> Domains</div>
              <div style={{ opacity: 0.3 }}>|</div>
              <div><strong className="v4-metric-dot">16</strong> Projects</div>
              <div style={{ opacity: 0.3 }}>|</div>
              <div style={{ color: 'var(--green)' }}>● Active R&D</div>
            </div>
          </div>

          <div className="v4-hero-visual">
            <DiscoverInteractive />
          </div>
        </div>
      </div>
    </section>
  );
}
