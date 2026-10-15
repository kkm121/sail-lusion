import { useEffect, useRef } from 'react';
import { onTick } from '../lib/ticker';
import { scrollState } from '../lib/scroll';

export default function ScrollIndicator() {
  const bar = useRef(null);
  useEffect(() => {
    let last = -1;
    return onTick(() => {
      const p = Math.round(scrollState.progress * 4000) / 10;
      if (p !== last && bar.current) {
        last = p;
        bar.current.style.transform = `translateY(${p}%)`;
      }
    }, 6);
  }, []);
  return (
    <div className="sl-scrollind" aria-hidden="true">
      <div ref={bar} />
    </div>
  );
}
