import { memo, useEffect, useMemo, useState } from 'react';
import PreloaderBlob from './PreloaderBlob';
import { SITE } from '../data/site';
import Logo from './Logo';

const STACK = Array.from({ length: 101 }, (_, i) => i % 10);

const Digit = memo(function Digit({ n }) {
  return (
    <span className="col">
      <span className="stack" style={{ '--n': n }}>
        {STACK.map((d, i) => (
          <i key={i}>{d}</i>
        ))}
      </span>
    </span>
  );
});

// One loader design for the first load and for every route change.
export default function LoaderScreen({ phase, value, fill, blob = false, label, className = '' }) {
  const digits = useMemo(() => [Math.floor(value / 100), Math.floor(value / 10), value], [value]);
  // The route loader creates its particle cloud the first time it is used, not while the first page loads.
  const [armed, setArmed] = useState(phase !== 'idle');
  useEffect(() => {
    if (phase !== 'idle') setArmed(true);
  }, [phase]);
  return (
    <div className={`sl-pre ${className} is-${phase}`} aria-hidden="true" role="presentation">
      <div className="sl-pre-half a" />
      <div className="sl-pre-half b" />
      <div className="sl-pre-glow" aria-hidden="true" />
      {blob && armed && <PreloaderBlob progress={value} phase={phase} />}
      <div className="sl-pre-top">
        <span className="brand">
          <Logo /> FireFly
        </span>
        <span>{label ? `Opening ${label}` : SITE.fullName}</span>
        <span>{SITE.tagline}</span>
      </div>
      <div className="sl-pre-stage">
        <div className="sl-pre-bar">
          <span className="track" />
          <span className="fill" ref={fill} />
        </div>
        <Logo variant="ember" className="sl-pre-bird" />
      </div>
      <div className="sl-pre-digits">
        <Digit n={digits[0]} />
        <Digit n={digits[1]} />
        <Digit n={digits[2]} />
      </div>
      <div className="sl-pre-credit">Website made by {SITE.creator}</div>
    </div>
  );
}
