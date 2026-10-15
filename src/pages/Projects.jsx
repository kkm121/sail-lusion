import { useLayoutEffect, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import SubHero from '../components/SubHero';
import CountUp from '../components/CountUp';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import ProjectGrid from '../components/ProjectGrid';
import { domains } from '../data/domains';
import { projects } from '../data/projects';

const STEP = 6;
const NAMES = projects.map((p) => p.name);

export default function Projects() {
  const [filter, setFilter] = useState('all');
  const [shown, setShown] = useState(STEP);
  const bar = useRef(null);
  const list = filter === 'all' ? projects : projects.filter((p) => p.domain === filter);
  const active = domains.find((d) => d.id === filter);
  const count = (id) => projects.filter((p) => p.domain === id).length;
  const pick = (id) => {
    setFilter(id);
    setShown(STEP);
  };

  // A pill slides under the active filter.
  useLayoutEffect(() => {
    const root = bar.current;
    const on = root?.querySelector('.is-on');
    if (!root || !on) return undefined;
    const place = () => {
      root.style.setProperty('--ix', `${on.offsetLeft}px`);
      root.style.setProperty('--iw', `${on.offsetWidth}px`);
      root.style.setProperty('--iy', `${on.offsetTop}px`);
    };
    place();
    document.fonts?.ready.then(place);
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [filter]);

  return (
    <PageShell className="is-domain" back={{ href: '/', label: 'Home' }} accent={active?.color} next={{ label: 'About us', href: '/about' }}>
      <SubHero
        eyebrow="The cargo so far"
        title="Projects"
        count={<CountUp to={list.length} delay={500} />}
        lede="Everything the crew is building, from open toolkits to flagship research. Filter by domain to follow a single chapter."
        accent={active?.color || '#00f5d4'}
        accent2={active ? undefined : '#8b5cf6'}
        size="s"
      />

      <section className="sl-sh-mq" aria-label="Projects">
        <Marquee variant="outline" items={NAMES} speed={46} dir={-1} label={NAMES.join(', ')} />
      </section>

      <Reveal type="up" y={30} className="sl-filter-wrap">
        <div className="sl-filter" role="tablist" aria-label="Filter projects by domain" ref={bar}>
          <span className="sl-filter-ink" aria-hidden="true" />
          <button type="button" role="tab" aria-selected={filter === 'all'} className={filter === 'all' ? 'is-on' : ''} onClick={() => pick('all')}>
            All <b>{projects.length}</b>
          </button>
          {domains.map((d) => (
            <button key={d.id} type="button" role="tab" aria-selected={filter === d.id} className={filter === d.id ? 'is-on' : ''} style={{ '--dc': d.color }} onClick={() => pick(d.id)}>
              <i /> {d.shortName} <b>{count(d.id)}</b>
            </button>
          ))}
        </div>
      </Reveal>

      <section className="sl-featured sl-featured--list">
        <ProjectGrid key={filter} list={list.slice(0, shown)} />
      </section>
      {shown < list.length && (
        <Reveal type="up" className="sl-more">
          <button type="button" className="sl-pill sl-pill--white" onClick={() => setShown((n) => n + STEP)} data-magnetic>
            <i /> Show {Math.min(STEP, list.length - shown)} more
          </button>
        </Reveal>
      )}
    </PageShell>
  );
}
