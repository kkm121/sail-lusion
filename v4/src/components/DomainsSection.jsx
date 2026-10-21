import { useState } from 'react';
import { domains } from '../data/domains';

export default function DomainsSection() {
  const [activeId, setActiveId] = useState(domains[0].id);

  const activeDomain = domains.find((d) => d.id === activeId) || domains[0];

  return (
    <section id="domains" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">02 // RESEARCH DOMAINS</span>
          <h2 className="v4-section-title">
            Five specialized domains. One unified crew.
          </h2>
          <p className="v4-section-desc">
            Each domain operates as an autonomous research pod with dedicated test benches, compute nodes, and project milestones.
          </p>
        </div>

        <div className="v4-domains-layout">
          <div className="v4-domain-tabs">
            {domains.map((d) => (
              <button
                key={d.id}
                type="button"
                className={`v4-domain-tab ${activeId === d.id ? 'is-active' : ''}`}
                onClick={() => setActiveId(d.id)}
              >
                <div className="v4-tab-label">
                  <span className="v4-tab-code mono">[{d.code}] CHAPTER</span>
                  <span className="v4-tab-name">{d.shortName || d.name}</span>
                </div>
                <span className="mono" style={{ color: activeId === d.id ? 'var(--ember)' : 'var(--text-dim)' }}>
                  →
                </span>
              </button>
            ))}
          </div>

          <div className="v4-domain-detail-card">
            <div className="v4-domain-detail-header">
              <span className="v4-domain-tagline mono">{activeDomain.tagline}</span>
              <h3>{activeDomain.name}</h3>
              <p className="v4-domain-desc">{activeDomain.description}</p>
            </div>

            {activeDomain.labSpecs && (
              <div>
                <span className="v4-eyebrow mono">LAB HARDWARE & COMPUTE</span>
                <div className="v4-specs-grid">
                  {Object.entries(activeDomain.labSpecs).map(([key, val]) => (
                    <div key={key} className="v4-spec-box">
                      <div className="v4-spec-label mono">{key}</div>
                      <div className="v4-spec-val mono">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeDomain.technologies && (
              <div>
                <span className="v4-eyebrow mono">TECHNICAL STACK</span>
                <div className="v4-tag-row mono">
                  {activeDomain.technologies.map((t) => (
                    <span key={t} className="v4-tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
