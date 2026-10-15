import Reveal from './Reveal';
import ProjectTile from './ProjectTile';

// Two tiles per row. Both tiles of a row rise from below at the same moment, left drifting in from the left and right from the right.
export default function ProjectGrid({ list, style }) {
  const rows = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));
  return (
    <div className="sl-grid" style={style}>
      {rows.map((row) => (
        <Reveal key={row.map((p) => p.id).join('+')} type="rise" className="sl-grid-row" margin="0px 0px -4% 0px" threshold={0.08}>
          {row.map((p, i) => (
            <ProjectTile key={p.id} p={p} priority={i === 0} />
          ))}
        </Reveal>
      ))}
    </div>
  );
}
