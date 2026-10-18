import { useRef } from 'react';
import { Logo } from './ui';
import Backdrop from './Backdrop';
import Fluid from './Fluid';
import { Split, useParallax } from './motion';

// The opening of every inner page: eyebrow, a headline that rises word by word, the lede,
// and the FireFly bird drifting slowly against the scroll behind it.
export default function PageHero({ eyebrow, title, lede, children }) {
  const mark = useRef(null);
  useParallax(mark, 0.18);
  return (
    <section className="ph">
      <Backdrop />
      <Fluid />
      <div className="ph-mark-wrap" aria-hidden="true">
        <div ref={mark}>
          <Logo className="ph-mark" />
        </div>
      </div>
      <div className="wrap ph-in">
        <span className="eyebrow hero-a">{eyebrow}</span>
        <Split as="h1" className="display" immediate delay={120}>
          {title}
        </Split>
        {lede && <p className="lede hero-c">{lede}</p>}
        {children && <div className="hero-d">{children}</div>}
      </div>
      <div className="ph-cue" aria-hidden="true">
        <i />
      </div>
    </section>
  );
}
