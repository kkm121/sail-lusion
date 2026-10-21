import { FORMATS, PILLARS } from '../data/club';

export default function ClubInitiatives() {
  return (
    <section id="initiatives" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">05 // COMMUNITY & FORMATS</span>
          <h2 className="v4-section-title">
            How FireFly runs throughout the year.
          </h2>
          <p className="v4-section-desc">
            We don’t just meet occasionally for talks. We run structured build sprints, fortnightly paper reading groups,
            hands-on software bootcamps, and an end-of-term public demo day.
          </p>
        </div>

        {/* 3 Pillars */}
        <div className="v4-pillars-grid">
          {PILLARS.map((p) => (
            <div key={p.n} className="v4-pillar-card">
              <span className="v4-pillar-num mono">{p.n}</span>
              <h3 className="v4-pillar-title">{p.title}</h3>
              <p className="v4-pillar-text">{p.text}</p>
            </div>
          ))}
        </div>

        {/* 6 Core Formats */}
        <div className="v4-formats-grid" style={{ marginTop: '32px' }}>
          {FORMATS.map((f) => (
            <div key={f.title} className="v4-format-card">
              <div className="v4-format-top">
                <span className="v4-tag mono">{f.tag}</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{f.when}</span>
              </div>
              <h4 className="v4-format-title">{f.title}</h4>
              <p className="v4-format-text">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
