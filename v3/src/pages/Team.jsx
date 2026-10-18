import { useRef } from 'react';
import PageHero from '../components/PageHero';
import { JoinBand, Reveal, SectionHead } from '../components/ui';
import { Marquee, useTilt } from '../components/motion';
import { coreTeam } from '../data/core';
import { teams } from '../data/team';

export default function Team() {
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  return (
    <div ref={page}>
      <PageHero eyebrow="Team" title={<>{coreTeam.length} people, <span className="ember-text">equal space.</span></>} lede="FireFly is run by its members. Everyone on the core team has equal space and equal responsibility; a title is only a tag." />

      <section className="section" style={{ paddingTop: 0 }}>
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
                  {m.tag && <span className="tag">{m.tag}</span>}
                </div>
                <h3 className="h3">{m.name}</h3>
                <p className="mono" style={{ color: m.creator ? 'var(--gold)' : 'var(--ember-1)', fontSize: 11 }}>
                  {m.area}
                </p>
                <p className="small">{m.about}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <Marquee items={coreTeam.map((m) => m.name)} speed={36} />

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="Teams" title="Who does what." lede="Four teams keep FireFly running, alongside the five domains." />
          <Reveal className="team-teams" stagger={80}>
            {teams.map((t) => (
              <article className="card tilt" key={t.id}>
                <h3 className="h3">{t.name}</h3>
                <p className="small">{t.blurb}</p>
                <ul>
                  {t.lead && (
                    <li>
                      {t.lead.name} <span>{t.lead.role}</span>
                    </li>
                  )}
                  {t.members.map((n) => (
                    <li key={n}>
                      {n} <span>Member</span>
                    </li>
                  ))}
                  {t.mentor && (
                    <li>
                      {t.mentor} <span>Mentor</span>
                    </li>
                  )}
                </ul>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
