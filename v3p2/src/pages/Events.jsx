import { useRef } from 'react';
import PageHero from '../components/PageHero';
import { JoinBand, Reveal, SectionHead } from '../components/ui';
import { Magnetic, useTilt } from '../components/motion';
import { FORMATS } from '../data/club';
import { SITE } from '../data/site';

const TERM = [
  { when: 'Weeks 1–2', title: 'Kick-off', text: 'Recruitment call, welcome meetup, domains introduce their plans for the term.' },
  { when: 'Weeks 3–8', title: 'Learn and build', text: 'Workshops and reading groups run alongside the first build sprints.' },
  { when: 'Weeks 9–11', title: 'Sprint to finish', text: 'Teams focus on shipping. Mentors review work and help unblock.' },
  { when: 'Week 12', title: 'Showcase', text: 'Every team demos what it made. The Report Team writes it all down.' },
];

export default function Events() {
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  return (
    <div ref={page}>
      <PageHero eyebrow="Events" title={<>A rhythm you can <span className="ember-text">count on.</span></>} lede="FireFly runs the same shape every term, so new members always know what is coming next. Dates are announced on Instagram first." />

      <section className="section">
        <div className="wrap">
          <SectionHead n="01" label="Upcoming" title="On the calendar." />
          <Reveal className="empty">
            <span className="tag pulse">
              <i /> Nothing scheduled yet
            </span>
            <h3 className="h3">The next events will appear here as soon as they are announced.</h3>
            <p className="small">Follow FireFly to hear first. Every workshop, sprint and showcase is posted on Instagram and LinkedIn.</p>
            <div className="btn-row">
              <Magnetic>
                <a className="btn btn-primary" href={SITE.instagram} target="_blank" rel="noreferrer">
                  Follow on Instagram ↗
                </a>
              </Magnetic>
              <Magnetic>
                <a className="btn btn-ghost" href={SITE.linkedin} target="_blank" rel="noreferrer">
                  LinkedIn ↗
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="Formats" title="What we run." lede="Six kinds of events make up a FireFly term. Everything is open to members; showcases are open to all." />
          <Reveal className="grid g3" stagger={80}>
            {FORMATS.map((f) => (
              <article className="card tilt fmt" key={f.title} style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <span className="tag">{f.tag}</span>
                  <span className="mono" style={{ color: 'var(--ember-1)', fontSize: 11 }}>
                    {f.when}
                  </span>
                </div>
                <h3 className="h3">{f.title}</h3>
                <p className="small">{f.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="03" label="A typical term" title="Twelve weeks, four stages." lede="The exact weeks move with the academic calendar; the order stays the same." />
          <Reveal className="term">
            {TERM.map((t, i) => (
              <div key={t.title}>
                <div className="bar">
                  <i style={{ '--d': `${i * 250}ms` }} />
                </div>
                <span className="mono">{t.when}</span>
                <h3 className="h3">{t.title}</h3>
                <p className="small">{t.text}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
