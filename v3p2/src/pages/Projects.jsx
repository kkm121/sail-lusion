import { useLayoutEffect, useRef } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Arrow, JoinBand, Reveal } from '../components/ui';
import { PopImage, useTilt } from '../components/motion';
import { domains, domainById } from '../data/domains';
import { artUrl, projectById, projects } from '../data/projects';

export function Projects() {
  const [params, setParams] = useSearchParams();
  const filter = params.get('domain') || 'all';
  const list = filter === 'all' ? projects : projects.filter((p) => p.domain === filter);
  const pick = (id) => setParams(id === 'all' ? {} : { domain: id }, { replace: true });
  const bar = useRef(null);
  const ink = useRef(null);
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  // a pill glides under the active filter
  useLayoutEffect(() => {
    const on = bar.current?.querySelector('[aria-pressed="true"]');
    if (!on || !ink.current) return undefined;
    const place = () => {
      ink.current.style.width = `${on.offsetWidth}px`;
      ink.current.style.transform = `translate(${on.offsetLeft}px, ${on.offsetTop}px)`;
    };
    place();
    window.addEventListener('resize', place);
    document.fonts?.ready.then(place);
    return () => window.removeEventListener('resize', place);
  }, [filter]);
  return (
    <div ref={page}>
      <PageHero eyebrow="Projects" title={<>Work that <span className="ember-text">ships.</span></>} lede="Toolkits, research and products built by members, each marked with where it stands today." />
      <section className="section" style={{ paddingTop: 'clamp(48px, 6vw, 80px)' }}>
        <div className="wrap">
          <Reveal className="filters" role="group" aria-label="Filter by domain">
            <span className="filters-ink" ref={ink} aria-hidden="true" />
            <div ref={bar} style={{ display: 'contents' }}>
              <button type="button" aria-pressed={filter === 'all'} onClick={() => pick('all')}>
                All <b>{projects.length}</b>
              </button>
              {domains.map((d) => (
                <button key={d.id} type="button" aria-pressed={filter === d.id} onClick={() => pick(d.id)} style={{ '--dc': d.color }}>
                  <i /> {d.shortName} <b>{projects.filter((p) => p.domain === d.id).length}</b>
                </button>
              ))}
            </div>
          </Reveal>
          <div className="pgrid" key={filter}>
            {list.map((p, i) => (
              <Link className="card tilt proj" key={p.id} to={`/projects/${p.id}`} style={{ '--dc': p.color, '--i': i }} viewTransition>
                <div className="proj-img">
                  <PopImage side={i % 2 === 0 ? 'left' : 'right'} src={artUrl(p)} alt={p.name} loading="lazy" />
                </div>
                <div className="proj-meta">
                  <span className="tag">
                    <i /> {p.domainName}
                  </span>
                  <span className="small">{p.status}</span>
                </div>
                <h3 className="h3">{p.name}</h3>
                <p className="small">{p.blurb}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <JoinBand />
    </div>
  );
}

export function ProjectDetail() {
  const { id } = useParams();
  const p = projectById(id);
  const page = useRef(null);
  useTilt(page, '.tilt', 3);
  if (!p) return <Navigate to="/projects" replace />;
  const d = domainById(p.domain);
  const next = projects[(projects.findIndex((x) => x.id === p.id) + 1) % projects.length];
  return (
    <div ref={page} style={{ '--dc': d.color }}>
      <PageHero eyebrow={`${d.shortName} · ${p.status}`} title={p.title || p.name} lede={p.blurb} />
      <section className="section" style={{ paddingTop: 'clamp(48px, 6vw, 80px)' }}>
        <div className="wrap pd">
          <Reveal>
            <div className="pd-img">
              <PopImage side="left" src={artUrl(p)} alt={p.name} />
            </div>
            <div className="pd-text">
              {p.desc.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </Reveal>
          <Reveal className="card tilt pd-side" delay={100}>
            {[
              ['Domain', d.shortName],
              ['Status', p.status],
              ['Performance', p.metric],
              ['Team', d.members.join(' · ')],
            ].map(([k, v]) => (
              <div className="spec" key={k}>
                <span className="mono">{k}</span>
                <span>{v}</span>
              </div>
            ))}
            <div className="spec">
              <span className="mono">Stack</span>
              <div className="chips">
                {p.stack.map((s) => (
                  <span className="tag" key={s}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <Link className="next" to={`/projects/${next.id}`} viewTransition style={{ '--dc': next.color }}>
            <div>
              <span className="eyebrow">Next project</span>
              <h2 className="h2">{next.name}</h2>
            </div>
            <span className="btn btn-ghost">
              Open <Arrow />
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
