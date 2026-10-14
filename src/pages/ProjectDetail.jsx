import { Navigate, useParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import TransitionLink from '../components/TransitionLink';
import { artUrl, projectById, projects, projectsByDomain } from '../data/projects';
import { domainById } from '../data/domains';
import { SITE } from '../data/site';

export default function ProjectDetail() {
  const { id } = useParams();
  const p = projectById(id);
  if (!p) return <Navigate to="/projects" replace />;
  const d = domainById(p.domain);
  const next = projects[(projects.findIndex((x) => x.id === p.id) + 1) % projects.length];
  const gallery = [p, ...projectsByDomain(p.domain).filter((x) => x.id !== p.id)].slice(0, 3);

  return (
    <PageShell back={{ href: '/projects', label: 'Projects' }} accent={d.color} next={{ label: 'Domains', href: '/domains' }}>
      <section className="sl-pd-gallery" aria-label={`${p.name} images`}>
        <div className="sl-pd-strip">
          {gallery.map((g, i) => (
            <img key={g.id} src={artUrl(g)} alt={i === 0 ? p.name : ''} loading={i === 0 ? 'eager' : 'lazy'} style={{ aspectRatio: i === 0 ? '3 / 2' : '4 / 3' }} />
          ))}
        </div>
        <p className="sl-pd-hint">Scroll to explore →</p>
      </section>

      <section className="sl-pd-meta">
        <TransitionLink className="sl-pd-domain" href={`/domains/${d.id}`} color={d.bg} text={d.text} label={d.shortName}>
          <i /> {d.shortName} · Chapter {d.code}
        </TransitionLink>
        <h1>{p.title || p.name}</h1>
        <div className="sl-pd-cols">
          <div className="sl-pd-left">
            <div className="sl-pd-desc">
              {p.desc.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <a className="sl-pd-launch" href={SITE.instagram} target="_blank" rel="noreferrer">
              <i /> Follow the progress <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="sl-pd-right">
            <h4>Status</h4>
            <div>{p.status}</div>
            <h4>Performance</h4>
            <div>{p.metric}</div>
            <h4>Stack</h4>
            {p.stack.map((s) => (
              <div key={s}>{s}</div>
            ))}
            <h4>Team</h4>
            <div>{d.members.join(' · ')}</div>
          </div>
        </div>
      </section>

      <TransitionLink className="sl-pd-next" href={`/projects/${next.id}`} color={next.bg} text={next.text} label={next.name} data-dark>
        <span className="sl-pd-next-label">Next project</span>
        <span className="sl-pd-next-title">{next.name}</span>
        <span className="sl-pd-next-bar" aria-hidden="true" />
      </TransitionLink>
    </PageShell>
  );
}
