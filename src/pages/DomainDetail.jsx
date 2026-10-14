import { Navigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import SplitLine from '../components/SplitLine';
import TransitionLink from '../components/TransitionLink';
import ProjectTile from '../components/ProjectTile';
import { useRecruit } from '../components/RecruitContext';
import { domainById, domains } from '../data/domains';
import { coreTeam } from '../data/core';
import { artUrl, projectsByDomain } from '../data/projects';

export default function DomainDetail() {
  const { id } = useParams();
  const d = domainById(id);
  const recruit = useRecruit();
  if (!d) return <Navigate to="/domains" replace />;
  const next = domains[(domains.findIndex((x) => x.id === d.id) + 1) % domains.length];
  const list = projectsByDomain(d.id);
  const people = d.members.map((name) => coreTeam.find((m) => m.name === name) || { name });

  return (
    <PageShell back={{ href: '/domains', label: 'Domains' }} accent={d.color} next={{ label: 'Our projects', href: '/projects' }}>
      <section className="sl-dd-hero">
        <p className="sl-eyebrow">
          Chapter {d.code} / {String(domains.length).padStart(2, '0')}
        </p>
        <h1>
          <SplitLine text={d.name} />
        </h1>
        <p className="sl-dd-tag">{d.tagline}</p>
        <div className="sl-dd-cols">
          <p className="sl-dd-desc">{d.description}</p>
          <div className="sl-dd-stack">
            <h4>Stack</h4>
            <div className="chips">
              {d.technologies.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <button type="button" className="sl-pill sl-pill--white" onClick={recruit} data-magnetic>
              <i /> Apply to {d.shortName}
            </button>
          </div>
        </div>
      </section>

      <div className="sl-dd-strip" aria-label={`${d.shortName} imagery`}>
        {list.slice(0, 4).map((p) => (
          <img key={p.id} src={artUrl(p)} alt={p.name} loading="lazy" />
        ))}
      </div>

      <section className="sl-dd-block">
        <div className="sl-about-count">
          <h2 className="sl-about-h">Team</h2>
          <span className="sl-count">{people.length}</span>
        </div>
        <p className="sl-dd-note">{d.teamNote} Everyone here has equal space and equal responsibility; a tag is only a label.</p>
        <div className="sl-dd-team">
          {people.map((m) => (
            <div key={m.name} className="sl-dd-person">
              {m.tag && <em>{m.tag}</em>}
              <b>{m.name}</b>
              <small>{m.area || d.shortName}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="sl-dd-block">
        <div className="sl-about-count">
          <h2 className="sl-about-h">Achievements</h2>
          <span className="sl-count">{d.achievements.length}</span>
        </div>
        <div className="sl-dd-ach">
          {d.achievements.map((a) => (
            <TransitionLink key={a.id} className="sl-dd-card" href={`/projects/${a.id}`} color={d.bg} text={d.text} label={a.name} data-cursor="VIEW">
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
        </div>
      </section>

      <section className="sl-dd-block">
        <h2 className="sl-about-h">Lab profile</h2>
        <div className="sl-dd-specs">
          {Object.entries(d.labSpecs).map(([k, v]) => (
            <div className="sl-dd-spec" key={k}>
              <small>{k}</small>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </section>

      <section className="sl-dd-block">
        <div className="sl-about-count">
          <h2 className="sl-about-h">Projects</h2>
          <span className="sl-count">{list.length}</span>
        </div>
        <div className="sl-grid" style={{ marginTop: 'calc(var(--u) * 3)' }}>
          {list.map((p) => (
            <ProjectTile key={p.id} p={p} />
          ))}
        </div>
      </section>

      <TransitionLink className="sl-pd-next" href={`/domains/${next.id}`} color={next.bg} text={next.text} label={next.shortName} data-dark>
        <span className="sl-pd-next-label">Next chapter</span>
        <span className="sl-pd-next-title">{next.shortName}</span>
        <span className="sl-pd-next-bar" aria-hidden="true" />
      </TransitionLink>
    </PageShell>
  );
}
