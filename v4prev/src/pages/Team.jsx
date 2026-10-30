import { useRef } from 'react';
import PageHero from '../components/PageHero';
import { JoinBand, Reveal, SectionHead } from '../components/ui';
import { Marquee, useSectionProgress, useTilt } from '../components/motion';
import { coreTeam } from '../data/core';
import { CREATOR, teams } from '../data/team';

const TEAM_COLOR = { technical: '#ffb347', corporate: '#f5c84b', creatives: '#ff4d8d', report: '#2ee6c8' };

// v3's stacking cards: each team pins near the top as you scroll, and the one beneath shrinks back and dims.
// Only transform and opacity change (a dimming layer instead of a brightness filter), and only when the value moves.
function TeamDeck() {
  const root = useRef(null);
  const last = useRef([]);
  useSectionProgress(root, () => {
    const items = root.current?.querySelectorAll('.deck-card');
    if (!items) return;
    const rects = [...items].map((c) => c.getBoundingClientRect());
    items.forEach((c, i) => {
      const next = rects[i + 1];
      const k = next ? Math.min(1, Math.max(0, 1 - (next.top - rects[i].top) / rects[i].height)) : 0;
      const key = k.toFixed(3);
      if (last.current[i] === key) return;
      last.current[i] = key;
      c.style.transform = `scale(${(1 - k * 0.06).toFixed(4)})`;
      const dim = c.querySelector('.deck-dim');
      if (dim) dim.style.opacity = (k * 0.5).toFixed(3);
    });
  });
  return (
    <ol className="deck team-deck" ref={root}>
      {teams.map((t, i) => {
        const people = [...(t.lead ? [[t.lead.name, t.lead.role]] : []), ...t.members.map((n) => [n, n === CREATOR ? 'Member · Creator' : 'Member']), ...(t.mentor ? [[t.mentor, 'Mentor']] : [])];
        return (
          <li key={t.id} className="deck-item" style={{ '--i': i, '--dc': TEAM_COLOR[t.id] || '#ff8a3d' }}>
            <article className="deck-card">
              <div className="deck-l">
                <span className="deck-code">0{i + 1}</span>
                <h3 className="h2">{t.name}</h3>
                <p className="small">{t.blurb}</p>
              </div>
              <div className="deck-r">
                <ul className="deck-people">
                  {people.map(([n, role]) => (
                    <li key={n} className={n === CREATOR ? 'is-creator' : undefined}>
                      <span>{n}</span>
                      <span className="mono">{role}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <i className="deck-dim" aria-hidden="true" />
            </article>
          </li>
        );
      })}
    </ol>
  );
}

export default function Team() {
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  return (
    <div ref={page}>
      <PageHero eyebrow="Team" title={<>{coreTeam.length} people, <span className="ember-text">equal space.</span></>} lede="FireFly is run by its members. Everyone on the core team has equal space and equal responsibility; a title is only a tag." />

      <section className="section" style={{ paddingTop: 'clamp(48px, 6vw, 80px)' }}>
        <div className="wrap">
          <SectionHead n="01" label="Core team" title="The crew." />
          <Reveal className="grid g3" stagger={50}>
            {coreTeam.map((m) => (
              <article className={`card tilt person ${m.creator ? 'is-creator' : ''}`.trim()} key={m.name}>
                <span className="person-i" aria-hidden="true">
                  {m.name[0]}
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <span className="mono" style={{ color: 'var(--muted)' }}>
                    {m.index}
                  </span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className="tag">Member</span>
                    {m.creator ? (
                      <span className="tag" style={{ borderColor: 'rgba(255, 160, 50, 0.4)', color: 'var(--ember-ink)' }}>Creator</span>
                    ) : (
                      m.tag && <span className="tag">{m.tag}</span>
                    )}
                  </div>
                </div>
                {/* the face (their own photo, or their initial) with their profiles beside it */}
                <div className="person-face-row">
                  <span className="person-face" aria-hidden="true">
                    {m.photo ? <img src={m.photo} alt="" loading="lazy" decoding="async" width="56" height="56" /> : m.name[0]}
                  </span>
                  {(m.github || m.linkedin) && (
                    <span className="mate-links">
                      {m.linkedin && (
                        <a href={`https://www.linkedin.com/in/${m.linkedin}/`} target="_blank" rel="noreferrer" aria-label={`${m.name} on LinkedIn`}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4.98 3.5A2.5 2.5 0 1 1 5 8.5a2.5 2.5 0 0 1-.02-5ZM3 9.75h4V21H3V9.75Zm6.5 0h3.8v1.6h.06c.53-1 1.84-2.05 3.78-2.05 4.04 0 4.79 2.6 4.79 6V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.95 1.32-1.95 2.69V21h-4V9.75Z" /></svg>
                        </a>
                      )}
                      {m.github && (
                        <a href={`https://github.com/${m.github}`} target="_blank" rel="noreferrer" aria-label={`${m.name} on GitHub`}>
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" /></svg>
                        </a>
                      )}
                    </span>
                  )}
                </div>
                <h3 className="h3">{m.name}</h3>
                <p className="mono" style={{ color: 'var(--ember-1)', fontSize: 11 }}>
                  {m.creator ? 'Technical Team · Creator of this website' : m.area}
                </p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <Marquee items={['Engineer. Innovate. Lead.', 'One firefly is a small light.', 'A field of them changes the night.', 'Learn it. Build it. Share it.', 'Building intelligent systems together.']} speed={34} />

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="Teams" title="Who does what." lede="Four teams keep FireFly running, alongside the five domains." />
          <TeamDeck />
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
