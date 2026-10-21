import { PARTNER_TIERS } from '../data/club';

const SPONSORS = [
  'NVIDIA Inception',
  'Google Cloud for Startups',
  'Intel Developer Zone',
  'Microsoft Founders Hub',
  'AMIEE SRMIST'
];

export default function PartnersSection() {
  return (
    <section id="partners" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">10 // PARTNERSHIPS & ECOSYSTEM</span>
          <h2 className="v4-section-title">
            Partner with student intelligence.
          </h2>
          <p className="v4-section-desc">
            We collaborate with industry leaders, research foundations, and technology providers
            to bring hardware, cloud compute, and mentorship to our student engineering teams.
          </p>
        </div>

        {/* Sponsor Badges */}
        <div className="v4-sponsors-strip mono">
          {SPONSORS.map((s) => (
            <div key={s} className="v4-sponsor-badge">
              <span className="v4-sponsor-dot" />
              <span>{s}</span>
            </div>
          ))}
        </div>

        {/* Partnership Tiers */}
        <div className="v4-tiers-grid" style={{ marginTop: '36px' }}>
          {PARTNER_TIERS.map((tier) => (
            <div key={tier.name} className="v4-tier-card">
              <div className="v4-tier-header">
                <span className="v4-tag mono">{tier.name}</span>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ANNUAL</span>
              </div>
              <h3 className="v4-tier-name">{tier.name} Partner</h3>
              <p className="v4-tier-desc">{tier.text}</p>

              <div className="v4-tier-perks">
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  INCLUDED BENEFITS:
                </div>
                <ul>
                  {tier.gets.map((g, i) => (
                    <li key={i}>
                      <span className="mono" style={{ color: 'var(--accent)' }}>▸</span>
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
