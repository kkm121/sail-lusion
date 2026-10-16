import { Navigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubHero from '../components/SubHero';
import { MockBadge, MockNote } from '../components/Mock';
import Text from '../components/Text';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import ScrollStrip from '../components/ScrollStrip';
import CountUp from '../components/CountUp';
import TransitionLink from '../components/TransitionLink';
import ProjectGrid from '../components/ProjectGrid';
import { useRecruit } from '../components/RecruitContext';
import { domainById, domains } from '../data/domains';
import { coreTeam } from '../data/core';
import { artUrl, projects, projectsByDomain } from '../data/projects';

const pad = (n) => String(n).padStart(2, '0');

// Cards that light up under the pointer.
const spot = (e) => {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - r.left}px`);
  el.style.setProperty('--my', `${e.clientY - r.top}px`);
};

function Head({ title, count }) {
  return (
    <div className="sl-dx-head">
      <h2>
        <Text type="chars">{title}</Text>
      </h2>
      {count != null && <span className="sl-dx-count">[{pad(count)}]</span>}
    </div>
  );
}

export default function DomainDetail() {
  const { id } = useParams();
  const d = domainById(id);
  const recruit = useRecruit();
  if (!d) return <Navigate to="/domains" replace />;
  const next = domains[(domains.findIndex((x) => x.id === d.id) + 1) % domains.length];
  const list = projectsByDomain(d.id);
  const people = d.members.map((name) => coreTeam.find((m) => m.name === name) || { name });
  const strip = [...list, ...projects.filter((p) => p.domain !== d.id)].slice(0, 7);
  const initial = (n) => n.trim()[0]?.toUpperCase() || '';

  return (
    <PageShell className="is-domain" back={{ href: '/domains', label: 'Domains' }} accent={d.color} next={{ label: 'Our projects', href: '/projects' }}>
      <SubHero
        size="l"
        accent={d.color}
        eyebrow={`Chapter ${d.code} / ${pad(domains.length)}`}
        title={d.name}
        ghost={d.code}
        lede={d.tagline}
        figure={list[0] ? { src: artUrl(list[0]), alt: list[0].name } : undefined}
      >
        <Reveal type="up" y={30} delay={900} className="sl-sh-actions">
          <button type="button" className="sl-pill sl-pill--white" onClick={recruit} data-magnetic>
            <i /> Apply to {d.shortName}
          </button>
          <span className="sl-sh-chip">
            {pad(people.length)} members · {pad(d.achievements.length)} achievements · {pad(list.length)} projects
          </span>
        </Reveal>
      </SubHero>

      <section className="sl-sh-mq" aria-label={`${d.shortName} technologies`}>
        <Marquee variant="outline" items={d.technologies} speed={44} dir={1} label={d.technologies.join(', ')} />
      </section>

      <section className="sl-dx sl-dx--intro">
        <div className="sl-dx-intro">
          <p className="sl-dx-desc">
            <Text type="scrub">{d.description}</Text>
          </p>
          <div className="sl-dx-side">
            <h4>Stack</h4>
            <Reveal type="up" stagger={55} y={26} cols={1} className="chips">
              {d.technologies.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      <ScrollStrip items={strip} label={`${d.shortName} imagery`} />

      <section className="sl-dx">
        <Head title="Team" count={people.length} />
        <Text as="p" type="lines" className="sl-dx-note" delay={100}>
          {`${d.teamNote} Everyone here has equal space and equal responsibility; a tag is only a label.`}
        </Text>
        <Reveal type="rise" cols={Math.min(4, people.length)} stagger={90} y={70} className="sl-dd-team">
          {people.map((m, i) => (
            <div key={m.name} className="sl-dd-person">
              <span className="sl-dd-avatar" aria-hidden="true">
                {initial(m.name)}
              </span>
              <span className="sl-dd-idx">{pad(i + 1)}</span>
              {m.tag && <em>{m.tag}</em>}
              <b>{m.name}</b>
              <small>{m.area || d.shortName}</small>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="sl-dx">
        <Head title="Achievements" count={d.achievements.length} />
        <MockNote>These achievements are mockups. Their titles, statuses and figures are sample content for the design, not real results.</MockNote>
        <Reveal type="rise" cols={2} stagger={120} y={80} className="sl-dd-ach">
          {d.achievements.map((a, i) => (
            <TransitionLink key={a.id} className="sl-dd-card" href={`/projects/${a.id}`} color={d.bg} text={d.text} label={a.name} data-cursor="VIEW" onPointerMove={spot}>
              <MockBadge />
              <span className="n" aria-hidden="true">
                {pad(i + 1)}
              </span>
              <span className="top">
                <i /> {a.status}
              </span>
              <h3>{a.title}</h3>
              <p>{a.desc}</p>
              <span className="metric">
                <small>Performance</small>
                <b>{a.metric}</b>
              </span>
            </TransitionLink>
          ))}
        </Reveal>
      </section>

      <section className="sl-dx">
        <Head title="Club profile" />
        <Reveal type="rise" cols={3} stagger={100} y={44} className="sl-dd-specs">
          {Object.entries(d.labSpecs).map(([k, v]) => (
            <div className="sl-dd-spec" key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="sl-dx">
        <Head title="Projects" count={list.length} />
        <ProjectGrid list={list} />
      </section>

      <TransitionLink className="sl-pd-next" href={`/domains/${next.id}`} color={next.bg} text={next.text} label={next.shortName} data-cursor="NEXT" style={{ '--nc': next.color }}>
        <span className="sl-pd-next-label">
          <Text as="span" type="scramble">
            Next chapter
          </Text>
        </span>
        <span className="sl-pd-next-title">{next.shortName}</span>
        <span className="sl-pd-next-bar" aria-hidden="true" />
        <span className="sl-pd-next-arrow" aria-hidden="true">
          <CountUp to={Number(next.code)} duration={900} />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </TransitionLink>
    </PageShell>
  );
}
