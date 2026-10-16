import { useEffect, useRef } from 'react';
import ProjectTile from './ProjectTile';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';
import { trackAll } from '../lib/measure';

const clamp = (v) => Math.min(1, Math.max(0, v));

// Two tiles per row. The tiles are tied to the scroll: as a row comes up from the bottom of the screen the left tile
// slides in from the left and the right tile from the right, both rising together; scrolling back up sends them out
// again the same way. On phones (one column) each tile does it on its own.
export default function ProjectGrid({ list, style }) {
  const root = useRef(null);
  const rows = [];
  for (let i = 0; i < list.length; i += 2) rows.push(list.slice(i, i + 2));

  useEffect(() => {
    const el = root.current;
    if (!el) return undefined;
    const tiles = () => [...el.querySelectorAll('.sl-grid-row > .sl-project')];
    const tracked = trackAll(tiles);
    const last = [];
    const stop = onTick(() => {
      const vh = scrollState.vh;
      const y = scrollState.y;
      tracked.rects.forEach((r, i) => {
        const top = r.top - y;
        if (top > vh * 1.15 || r.bottom - y < -vh * 0.3) return;
        const p = clamp((vh * 1.05 - top) / (vh * 0.72));
        const e = 1 - Math.pow(1 - p, 3);
        if (Math.abs(e - (last[i] ?? -1)) < 0.0008) return;
        last[i] = e;
        const t = r.el;
        const dir = t.previousElementSibling ? 1 : t.nextElementSibling ? -1 : 0;
        const inv = 1 - e;
        t.style.transform = `translate3d(${(dir * inv * 18).toFixed(2)}vw, ${(inv * 16).toFixed(2)}vh, 0) rotate(${(dir * inv * 6).toFixed(2)}deg) scale(${(0.88 + 0.12 * e).toFixed(3)})`;
        t.style.opacity = (0.1 + 0.9 * e).toFixed(3);
      });
    }, 6);
    return () => {
      stop();
      tracked.stop();
    };
  }, [list]);

  return (
    <div className="sl-grid" style={style} ref={root}>
      {rows.map((row) => (
        <div key={row.map((p) => p.id).join('+')} className="sl-grid-row">
          {row.map((p, i) => (
            <ProjectTile key={p.id} p={p} priority={i === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}
