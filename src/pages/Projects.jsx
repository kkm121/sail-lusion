import { useState } from 'react';
import PageShell from '../components/PageShell';
import SplitLine from '../components/SplitLine';
import ProjectTile from '../components/ProjectTile';
import { domains } from '../data/domains';
import { projects } from '../data/projects';

const STEP = 6;

export default function Projects() {
  const [filter, setFilter] = useState('all');
  const [shown, setShown] = useState(STEP);
  const list = filter === 'all' ? projects : projects.filter((p) => p.domain === filter);
  const count = (id) => projects.filter((p) => p.domain === id).length;
  const pick = (id) => {
    setFilter(id);
    setShown(STEP);
  };

  return (
    <PageShell back={{ href: '/', label: 'Home' }} accent={domains.find((d) => d.id === filter)?.color} next={{ label: 'About us', href: '/about' }}>
      <section className="sl-projects-head">
        <h1>
          <SplitLine text="Projects" />
        </h1>
        <span className="sl-count sl-count--s">{String(list.length).padStart(2, '0')}</span>
      </section>
      <div className="sl-filter" role="tablist" aria-label="Filter projects by domain">
        <button type="button" role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'is-on' : ''} onClick={() => pick('all')}>
          All <b>{projects.length}</b>
        </button>
        {domains.map((d) => (
          <button key={d.id} type="button" role="tab" aria-selected={filter === d.id} className={filter === d.id ? 'is-on' : ''} style={{ '--dc': d.color }} onClick={() => pick(d.id)}>
            <i /> {d.shortName} <b>{count(d.id)}</b>
          </button>
        ))}
      </div>
      <section className="sl-featured sl-featured--list">
        <div className="sl-grid">
          {list.slice(0, shown).map((p) => (
            <ProjectTile key={p.id} p={p} />
          ))}
        </div>
      </section>
      {shown < list.length && (
        <div className="sl-more">
          <button type="button" className="sl-pill sl-pill--white" onClick={() => setShown((n) => n + STEP)} data-magnetic>
            <i /> Show {Math.min(STEP, list.length - shown)} more
          </button>
        </div>
      )}
    </PageShell>
  );
}
