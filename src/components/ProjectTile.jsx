import { useRef } from 'react';
import TransitionLink from './TransitionLink';
import { artUrl } from '../data/projects';

export default function ProjectTile({ p, priority = false }) {
  const box = useRef(null);

  const onMove = (e) => {
    const el = box.current;
    if (!el || e.pointerType === 'touch') return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
    el.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
  };
  const onLeave = () => {
    box.current?.style.setProperty('--mx', '0');
    box.current?.style.setProperty('--my', '0');
  };

  return (
    <TransitionLink className="sl-project" href={`/projects/${p.id}`} color={p.bg} text={p.text} label={p.name} data-cursor="VIEW" onPointerMove={onMove} onPointerLeave={onLeave} style={{ '--dc': p.color }}>
      <div className="sl-project-img" ref={box}>
        <img src={artUrl(p)} alt={p.name} loading={priority ? 'eager' : 'lazy'} decoding="async" draggable="false" />
        <span className="sl-project-tint" aria-hidden="true" />
        <span className="sl-project-sheen" aria-hidden="true" />
      </div>
      <div className="sl-project-meta">
        <span className="dom">
          <i /> {p.domainName}
        </span>
        <span className="st">{p.status}</span>
      </div>
      <div className="sl-project-tags">{p.tags}</div>
      <div className="sl-project-name" aria-label={p.name}>
        <span aria-hidden="true" className="roll">
          {[...p.name].map((c, i) => (
            <span className="rc" key={i} style={{ '--i': i }}>
              <span>{c === ' ' ? ' ' : c}</span>
              <span>{c === ' ' ? ' ' : c}</span>
            </span>
          ))}
        </span>
      </div>
    </TransitionLink>
  );
}
