import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Arrow, JoinBand, Reveal } from '../components/ui';
import { Marquee, Split } from '../components/motion';
import { domains } from '../data/domains';
import { projectsByDomain } from '../data/projects';

export default function Domains() {
  const [on, setOn] = useState(domains[0].id);
  const nav = useRef(null);
  // the chip for the domain on screen lights up, and the chip row scrolls to keep it visible
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setOn(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    domains.forEach((d) => {
      const el = document.getElementById(d.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    nav.current?.querySelector('.is-on')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [on]);
  return (
    <>
      <PageHero eyebrow="Domains" title={<>Five chapters, <span className="ember-text">one crew.</span></>} lede="Every member belongs to a domain. Technical and R&D share one team, so the same members carry both." />
      <nav className="dom-nav" aria-label="Domains">
        <div className="dom-nav-in" ref={nav}>
          <div>
            {domains.map((d) => (
              <a key={d.id} href={`#${d.id}`} className={`tag ${on === d.id ? 'is-on' : ''}`.trim()} style={{ '--dc': d.color }}>
                <i /> {d.shortName}
              </a>
            ))}
          </div>
        </div>
      </nav>
      {domains.map((d, i) => {
        const list = projectsByDomain(d.id);
        return (
          <section key={d.id} id={d.id} className={`section ${i % 2 ? 'band' : ''}`.trim()} style={{ '--dc': d.color }}>
            <div className="wrap dom-block">
              <div className="dom-block-head">
                <Reveal as="span" className="code">
                  {d.code}
                </Reveal>
                <Split className="h2">{d.name}</Split>
                <Reveal as="p" className="mono" style={{ color: 'var(--dc)' }} delay={100}>
                  {d.tagline}
                </Reveal>
                <Reveal as="p" className="lede" delay={160}>
                  {d.description}
                </Reveal>
              </div>
              <Reveal className="dom-block-body" stagger={90}>
                <div>
                  <h3 className="mono" style={{ marginBottom: 12 }}>
                    Team
                  </h3>
                  <p>{d.members.join(' · ')}</p>
                  <p className="small" style={{ marginTop: 6 }}>
                    {d.teamNote}
                  </p>
                </div>
                <div>
                  <h3 className="mono" style={{ marginBottom: 12 }}>
                    Stack
                  </h3>
                  <div className="chips">
                    {d.technologies.map((t) => (
                      <span className="tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mono" style={{ marginBottom: 4 }}>
                    Flagship work
                  </h3>
                  {d.achievements.map((a) => (
                    <Link key={a.id} to={`/projects/${a.id}`} className="spec" viewTransition>
                      <span className="mono">{a.status}</span>
                      <b>{a.title}</b>
                      <span className="small">{a.metric}</span>
                    </Link>
                  ))}
                </div>
                <div>
                  <h3 className="mono" style={{ marginBottom: 4 }}>
                    Lab profile
                  </h3>
                  {Object.entries(d.labSpecs).map(([k, v]) => (
                    <div className="spec" key={k}>
                      <span className="mono">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
                <Link className="link" to={`/projects?domain=${d.id}`} viewTransition>
                  {list.length} projects in {d.shortName} <Arrow />
                </Link>
              </Reveal>
            </div>
          </section>
        );
      })}
      <Marquee items={[...new Set(domains.flatMap((d) => d.technologies))]} speed={30} className="small-mq" />
      <JoinBand />
    </>
  );
}
