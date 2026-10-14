import PageShell from '../components/PageShell';
import SplitLine from '../components/SplitLine';
import TransitionLink from '../components/TransitionLink';
import { domains } from '../data/domains';
import { projectsByDomain } from '../data/projects';

export default function Domains() {
  return (
    <PageShell back={{ href: '/', label: 'Home' }} next={{ label: 'Our projects', href: '/projects' }}>
      <section className="sl-projects-head" style={{ flexDirection: 'column', gap: 0 }}>
        <p className="sl-eyebrow">The chapters</p>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'calc(var(--u) * 1.5)' }}>
          <h1>
            <SplitLine text="Domains" />
          </h1>
          <span className="sl-count sl-count--s">0{domains.length}</span>
        </div>
        <p className="sl-about-lede" style={{ marginTop: 'calc(var(--u) * 3)', maxWidth: 'calc(var(--u) * 52)' }}>
          Each domain is a chapter of the voyage, with its own team, flagship work and achievements. Technical and R&amp;D sit together under the Technical Team, so the same three members carry both.
        </p>
      </section>

      <section className="sl-dom-list" aria-label="All domains">
        {domains.map((d) => (
          <TransitionLink key={d.id} className="sl-dom-row" href={`/domains/${d.id}`} color={d.bg} text={d.text} label={d.shortName} data-cursor="OPEN" style={{ '--dc': d.color }}>
            <span className="code">{d.code}</span>
            <span className="name">
              <b>{d.shortName}</b>
              <small>{d.tagline}</small>
            </span>
            <span className="who">
              {d.members.map((m, i) => (
                <span key={m}>
                  {i > 0 && ' · '}
                  {m}
                </span>
              ))}
            </span>
            <span className="meta">
              {d.achievements.length} achievements · {projectsByDomain(d.id).length} projects
            </span>
            <span className="go" aria-hidden="true">
              →
            </span>
          </TransitionLink>
        ))}
      </section>
    </PageShell>
  );
}
