import { useMemo } from 'react';
import PreloaderBlob from './PreloaderBlob';
import { SITE } from '../data/site';

const STACK = Array.from({ length: 101 }, (_, i) => i % 10);

function Digit({ n }) {
  return (
    <span className="col">
      <span className="stack" style={{ '--n': n }}>
        {STACK.map((d, i) => (
          <i key={i}>{d}</i>
        ))}
      </span>
    </span>
  );
}

// One loader design for the first load and for every route change.
export default function LoaderScreen({ phase, value, fill, blob = false, label, className = '' }) {
  const digits = useMemo(() => [Math.floor(value / 100), Math.floor(value / 10), value], [value]);
  return (
    <div className={`sl-pre ${className} is-${phase}`} aria-hidden="true" role="presentation">
      <div className="sl-pre-half a" />
      <div className="sl-pre-half b" />
      {blob && <PreloaderBlob progress={value} phase={phase} />}
      <div className="sl-pre-top">
        <span className="brand">FireFly</span>
        <span>{label ? `Opening ${label}` : SITE.fullName}</span>
        <span>{SITE.tagline}</span>
      </div>
      <div className="sl-pre-stage">
        <div className="sl-pre-bar">
          <span className="track" />
          <span className="fill" ref={fill} />
        </div>
        <span className="sl-pre-sail" />
        <span className="sl-pre-hull" />
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
