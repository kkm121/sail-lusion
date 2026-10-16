import { Navigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SubHero from '../components/SubHero';
import Text from '../components/Text';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import ScrollStrip from '../components/ScrollStrip';
import TransitionLink from '../components/TransitionLink';
import { artUrl, projectById, projects } from '../data/projects';
import { domainById } from '../data/domains';
import { SITE } from '../data/site';
import { MockBadge, MockNote } from '../components/Mock';

export default function ProjectDetail() {
  const { id } = useParams();
  const p = projectById(id);
  if (!p) return <Navigate to="/projects" replace />;
  const d = domainById(p.domain);
  const at = projects.findIndex((x) => x.id === p.id);
  const next = projects[(at + 1) % projects.length];
  const gallery = [...projects.filter((x) => x.domain === p.domain && x.id !== p.id), ...projects.filter((x) => x.domain !== p.domain)].slice(0, 7);

  return (
    <PageShell className="is-domain" back={{ href: '/projects', label: 'Projects' }} accent={d.color} next={{ label: 'Domains', href: '/domains' }}>
      <SubHero
        size="l"
        accent={d.color}
        eyebrow={`${d.shortName} · Chapter ${d.code}`}
        title={p.title || p.name}
        lede={p.blurb}
        figure={{ src: artUrl(p), alt: p.name }}
        scrollLabel="Scroll for the details"
      >
        <Reveal type="up" y={30} delay={900} className="sl-sh-actions">
          <TransitionLink className="sl-sh-chip sl-sh-chip--link" href={`/domains/${d.id}`} color={d.bg} text={d.text} label={d.shortName}>
            <i /> {d.shortName}
          </TransitionLink>
          <MockBadge />
          <span className="sl-sh-chip">{p.status}</span>
          <span className="sl-sh-chip">{p.metric}</span>
        </Reveal>
      </SubHero>

      <section className="sl-sh-mq" aria-label="Stack">
        <Marquee variant="outline" items={p.stack} speed={42} dir={1} label={p.stack.join(', ')} />
      </section>

      <section className="sl-pd-meta">
        <MockNote>This project page is a mockup. The project, its status, numbers and team shown here are sample content for the design; nothing on this page is a real, published FireFly project yet.</MockNote>
        <div className="sl-pd-cols">
          <div className="sl-pd-left">
            <div className="sl-pd-desc">
              {p.desc.map((line, i) => (
                <p key={line}>
                  <Text type={i === 0 ? 'scrub' : 'lines'}>{line}</Text>
                </p>
              ))}
            </div>
            <Reveal type="up" y={30} delay={120}>
              <a className="sl-pd-launch" href={SITE.instagram} target="_blank" rel="noreferrer" data-magnetic>
                <i /> Follow the progress <span aria-hidden="true">↗</span>
              </a>
            </Reveal>
          </div>
          <Reveal type="rise" cols={1} stagger={90} y={36} className="sl-pd-right">
            <div className="sl-pd-spec">
              <h4>Status</h4>
              <div>{p.status}</div>
            </div>
            <div className="sl-pd-spec">
              <h4>Performance</h4>
              <div>{p.metric}</div>
            </div>
            <div className="sl-pd-spec">
              <h4>Stack</h4>
              <div className="chips">
                {p.stack.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
            <div className="sl-pd-spec">
              <h4>Team</h4>
              <div>{d.members.join(' · ')}</div>
            </div>
          </Reveal>
        </div>
      </section>

      <ScrollStrip items={gallery} label="More from the club" />

      <TransitionLink className="sl-pd-next" href={`/projects/${next.id}`} color={next.bg} text={next.text} label={next.name} data-cursor="NEXT" style={{ '--nc': next.color }}>
        <span className="sl-pd-next-label">
          <Text as="span" type="scramble">
            Next project
          </Text>
        </span>
        <span className="sl-pd-next-title">{next.name}</span>
        <span className="sl-pd-next-bar" aria-hidden="true" />
        <span className="sl-pd-next-arrow" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </TransitionLink>
    </PageShell>
  );
}
