import { useRef } from 'react';
import PageHero from '../components/PageHero';
import { Reveal, SectionHead } from '../components/ui';
import { Magnetic, useTilt } from '../components/motion';
import { PARTNER_TIERS } from '../data/club';
import { SITE } from '../data/site';

const WHY = [
  { title: 'Meet builders early', text: 'Members ship real AI projects every term. Partners see the work, and the people behind it, first.' },
  { title: 'Teach what you know', text: 'Run a workshop or set a challenge on your own tools, with students who want to use them.' },
  { title: 'Back the community', text: 'Your support pays for venues, compute and food, and keeps every event open to everyone.' },
];

export default function Partners() {
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  return (
    <div ref={page}>
      <PageHero eyebrow="Partners" title={<>Build the next crew <span className="ember-text">with us.</span></>} lede="FireFly works with companies, labs and founders who want to support students learning AI by building it." />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead n="01" label="Why partner" title="What partners get from FireFly." />
          <Reveal className="grid g3" stagger={100}>
            {WHY.map((w, i) => (
              <article className="card tilt value" key={w.title}>
                <span className="mono">0{i + 1}</span>
                <h3 className="h3">{w.title}</h3>
                <p className="small">{w.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="Ways to partner" title="Three ways in." lede="Every partnership is shaped together. These are starting points, not fixed packages." />
          <Reveal className="grid g3" stagger={100}>
            {PARTNER_TIERS.map((t, i) => (
              <article className={`card tilt tier ${i === 1 ? 'featured' : ''}`.trim()} key={t.name}>
                <span className="tag">{t.name}</span>
                <p>{t.text}</p>
                <ul>
                  {t.gets.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="03" label="Current partners" title="These spaces are waiting for their first logos." lede="FireFly is a new club. Our first partners will be shown here, with thanks." />
          <Reveal className="slots" stagger={80}>
            {[0, 1, 2, 3].map((i) => (
              <div className="slot" key={i} style={{ '--i': i }}>
                Your logo
              </div>
            ))}
          </Reveal>
          <Reveal className="empty">
            <h3 className="h3">Start a conversation</h3>
            <p className="small">Message the club on LinkedIn or Instagram and the Corporate Team will reply.</p>
            <div className="btn-row">
              <Magnetic>
                <a className="btn btn-primary" href={SITE.linkedin} target="_blank" rel="noreferrer">
                  Message on LinkedIn ↗
                </a>
              </Magnetic>
              <Magnetic>
                <a className="btn btn-ghost" href={SITE.instagram} target="_blank" rel="noreferrer">
                  Instagram ↗
                </a>
              </Magnetic>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
