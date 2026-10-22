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
                <h3 className="h3">{m.name}</h3>
                <p className="mono" style={{ color: 'var(--ember-1)', fontSize: 11 }}>
                  {m.creator ? 'Technical Team · Creator of this website' : m.area}
                </p>
                <p className="small">{m.about}</p>
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
