import { useState } from 'react';
import { coreTeam, CREATOR_TAG } from '../data/core';

const FILTERS = ['All (17)', 'Technical', 'Leadership', 'Creatives', 'Corporate', 'Report'];

export default function CrewSection() {
  const [activeFilter, setActiveFilter] = useState('All (17)');

  const filteredMembers = coreTeam.filter((m) => {
    if (activeFilter === 'All (17)') return true;
    if (activeFilter === 'Technical') return m.area.includes('Technical');
    if (activeFilter === 'Leadership') return m.tag === 'President' || m.tag === 'Secretary';
    if (activeFilter === 'Creatives') return m.area.includes('Creatives');
    if (activeFilter === 'Corporate') return m.area.includes('Corporate');
    if (activeFilter === 'Report') return m.area.includes('Report');
    return true;
  });

  return (
    <section id="crew" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">04 // THE CREW</span>
          <h2 className="v4-section-title">
            17 people, equal space.
          </h2>
          <p className="v4-section-desc">
            FireFly is built and operated uniformly by its members. Every contributor carries equal responsibility,
            equal ownership, and equal representation.
          </p>
        </div>

        <div className="v4-crew-controls">
          <div className="v4-filter-chips mono">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`v4-filter-chip ${activeFilter === f ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Showing {filteredMembers.length} of 17 Members
          </div>
        </div>

        <div className="v4-crew-grid">
          {filteredMembers.map((m) => (
            <div
              key={m.name}
              className={`v4-member-card ${m.creator ? 'is-creator' : ''}`}
            >
              <div>
                <div className="v4-member-top">
                  <span className="v4-member-num mono">#{m.index}</span>
                  <div className="v4-member-tags">
                    <span className="v4-role-tag">Member</span>
                    {m.creator ? (
                      <span className="v4-role-tag creator-tag">Creator</span>
                    ) : m.tag ? (
                      <span className="v4-role-tag">{m.tag}</span>
                    ) : null}
                  </div>
                </div>

                <h3 className="v4-member-name" style={{ marginTop: '10px' }}>{m.name}</h3>
                <div className="v4-member-domain mono">{m.area}</div>
              </div>

              <p className="v4-member-bio">{m.about}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
