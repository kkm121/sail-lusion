import { useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Arrow, JoinBand, Reveal, SectionHead } from '../components/ui';
import { Marquee, PopImage, Split, useParallax, useTilt } from '../components/motion';
import { VALUES } from '../data/club';
import { leadershipTeam, teams } from '../data/team';

export default function About() {
  const page = useRef(null);
  const img = useRef(null);
  useTilt(page, '.tilt', 4);
  useParallax(img, 0.1);
  return (
    <div ref={page}>
      <PageHero eyebrow="About FireFly" title={<>A club that learns <span className="ember-text">by building.</span></>} lede="FireFly is a student-run artificial intelligence club at SRM Institute of Science and Technology, associated with AMIEE. We turn questions into working systems, and we do it together." />

      <section className="section">
        <div className="wrap story">
          <div className="story-text">
            <Reveal as="span" className="eyebrow">
              <b>01</b> Our story
            </Reveal>
            <Split className="h2">Why a firefly?</Split>
            <Reveal as="p" delay={100}>
              One firefly is a small light. A field of them changes the night. That is the idea behind the club: no one needs to be an expert to start, and every person who builds something makes it easier for the next one.
            </Reveal>
            <Reveal as="p" delay={180}>
              FireFly brings students from every department into five domains, from engineering and research to design, partnerships and media. Each domain runs its own projects, and all of them meet at the end of term to show what they made.
            </Reveal>
            <Reveal as="p" delay={260}>
              We are associated with AMIEE, and we work closely with faculty and the wider SRM community.
            </Reveal>
          </div>
          <Reveal className="story-img" delay={120}>
            <PopImage side="right" src="/media/crew.jpg" alt="Students working together at a table" loading="lazy" />
          </Reveal>
        </div>
      </section>

      <Marquee items={['Equal space', 'Learn by building', 'Open by default', 'Keep a record']} speed={40} />

      <section className="section">
        <div className="wrap">
          <SectionHead n="02" label="What we value" title="Four things we hold to." />
          <Reveal className="grid g4" stagger={100}>
            {VALUES.map((v, i) => (
              <article className="card tilt value" key={v.title}>
                <span className="mono">0{i + 1}</span>
                <h3 className="h3">{v.title}</h3>
                <p className="small">{v.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap quote">
          <Reveal as="span" className="eyebrow">
            The idea
          </Reveal>
          <Split as="p">
            One firefly is a small light. <span className="ember-text">A field of them changes the night.</span>
          </Split>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="03" label="How FireFly is run" title="Leadership, teams and records." lede="A president and two secretaries coordinate four teams. Every team has a clear job, and the Report Team keeps the club's memory.">
            <Link className="link" to="/team" viewTransition>
              Meet everyone <Arrow />
            </Link>
          </SectionHead>
          <Reveal className="org" stagger={80}>
            <article className="card tilt">
              <span className="tag">Leadership</span>
              <h3 className="h3">Executive</h3>
              <p className="who">
                {leadershipTeam.map((m, i) => (
                  <span key={m.name}>
                    {i > 0 && ', '}
                    <b>{m.name}</b> ({m.role})
                  </span>
                ))}
              </p>
            </article>
            {teams.map((t) => (
              <article className="card tilt" key={t.id}>
                <span className="tag">Team</span>
                <h3 className="h3">{t.name}</h3>
                <p className="small">{t.blurb}</p>
                <p className="who">
                  {t.lead && (
                    <>
                      <b>{t.lead.name}</b> ({t.lead.role}){t.members.length ? ', ' : ''}
                    </>
                  )}
                  {t.members.join(', ')}
                  {t.mentor && (
                    <>
                      , <b>{t.mentor}</b> (Mentor)
                    </>
                  )}
                </p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
