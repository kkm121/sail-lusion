import { useEffect, useRef } from 'react';
import { SITE } from '../data/site';

export default function RecruitModal({ notice, onClose }) {
  const open = notice !== null;
  const last = useRef(notice);
  if (notice) last.current = notice;
  const shown = last.current;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`sl-overlay ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label={shown?.feature || 'In progress'} onClick={onClose}>
      <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
        <span className="sl-modal-chip">
          <i /> Currently building
        </span>
        <h3>{shown?.feature || 'This section'} is currently being built.</h3>
        <p>{shown?.message}</p>
        <div className="sl-modal-links">
          <a className="sl-pill sl-pill--white" href={SITE.instagram} target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a className="sl-pill sl-pill--white" href={SITE.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        </div>
        <button type="button" className="sl-modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
