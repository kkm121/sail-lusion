import { lazy, Suspense, useEffect, useRef } from 'react';
import Text from './Text';
import Crosses from './Crosses';
import { ErrorBoundary } from './ErrorBoundary';
import { canGL } from '../lib/device';
import { resolveAsset } from '../lib/assets';
import { whenShown } from '../lib/ready';
import { scrollState } from '../lib/scroll';
import { useTick } from '../lib/useTick';

const SubField = lazy(() => import('../scene/SubField'));

// Soft drifting colour for phones and for machines without WebGL; it also lets the loader finish.
function Fallback({ a, b }) {
  useEffect(() => {
    resolveAsset('sub');
  }, []);
  return (
    <div className="sl-sh-fallback" style={{ '--fa': a, '--fb': b }}>
      <i className="a" />
      <i className="b" />
    </div>
  );
}

// Opening block of the inner pages: moving backdrop, eyebrow, big title, lede and room for extras.
// size: xl (index pages) | l (long titles). ghost: a large outlined number behind the title.
export default function SubHero({ eyebrow, title, lede, count, accent = '#00f5d4', accent2, look, size = 'xl', ghost, figure, scrollLabel = 'Scroll to explore', children, extra }) {
  const gl = canGL();
  const root = useRef(null);
  const back = useRef(null);
  const body = useRef(null);
  const fig = useRef(null);

  useEffect(() => whenShown(() => root.current?.classList.add('is-in'), 80), []);

  // The backdrop lags the page, the text drifts up and fades as the page leaves the hero.
  useTick(() => {
    const y = scrollState.y;
    if (y > scrollState.vh * 1.25) return;
    const k = Math.min(1, y / (scrollState.vh * 0.85));
    if (back.current) back.current.style.transform = `translate3d(0, ${(y * 0.38).toFixed(1)}px, 0)`;
    if (body.current) {
      body.current.style.transform = `translate3d(0, ${(y * 0.16).toFixed(1)}px, 0)`;
      body.current.style.opacity = (1 - k * 1.15).toFixed(3);
    }
    if (fig.current) fig.current.style.transform = `translate3d(0, ${(y * -0.1).toFixed(1)}px, 0)`;
  }, 6);

  return (
    <section className={`sl-sh sl-sh--${size}`} ref={root}>
      <div className="sl-sh-back" ref={back} aria-hidden="true">
        {gl ? (
          <ErrorBoundary fallback={<Fallback a={accent} b={accent2} />}>
            <Suspense fallback={null}>
              <SubField accent={accent} accent2={accent2} {...look} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Fallback a={accent} b={accent2} />
        )}
      </div>
      <Crosses className="sl-sh-crosses" />
      {ghost && (
        <span className="sl-sh-ghost" aria-hidden="true">
          {ghost}
        </span>
      )}
      {figure && (
        <div className="sl-sh-figure-wrap" ref={fig}>
          <figure className="sl-sh-figure">
            <img src={figure.src} alt={figure.alt || ''} decoding="async" />
            <span className="sl-sh-figure-tint" aria-hidden="true" />
          </figure>
        </div>
      )}
      <div className="sl-sh-in" ref={body}>
        <p className="sl-sh-eyebrow">
          <Text as="span" type="scramble" trigger="ready" delay={150}>
            {eyebrow}
          </Text>
        </p>
        <h1 className="sl-sh-title">
          <Text type="chars" trigger="ready" delay={220}>
            {title}
          </Text>
          {count != null && <span className="sl-sh-count">{count}</span>}
        </h1>
        {lede && (
          <Text as="p" type="lines" trigger="ready" delay={560} className="sl-sh-lede">
            {lede}
          </Text>
        )}
        {children}
      </div>
      {extra}
      <div className="sl-sh-scroll" aria-hidden="true">
        <Text as="span" type="scramble" trigger="ready" delay={1000}>
          {scrollLabel}
        </Text>
        <i />
      </div>
    </section>
  );
}
