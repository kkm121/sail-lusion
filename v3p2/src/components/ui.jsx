import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Magnetic, Marquee, Split } from './motion';

export const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export function Logo({ className = '', title }) {
  const base = import.meta.env.BASE_URL || '/';
  const src = `${base.replace(/\/$/, '')}/brand/firefly-mark.png`;
  return <img className={`logo ${className}`.trim()} src={src} alt={title || ''} aria-hidden={title ? undefined : 'true'} draggable="false" decoding="async" />;
}

// Fades and lifts its children into view once. With `stagger`, each direct child arrives a little later.
export function Reveal({ as: Tag = 'div', className = '', stagger = 0, delay = 0, children, style, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const targets = stagger ? Array.from(el.children) : [el];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
          } else {
            e.target.classList.remove('is-in');
          }
        });
      },
      { rootMargin: '0px 0px -4% 0px', threshold: 0.05 }
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [stagger]);
  if (stagger) {
    let i = 0;
    const kids = Children.map(children, (c) => (isValidElement(c) ? cloneElement(c, { className: `${c.props.className || ''} rv`.trim(), style: { ...c.props.style, '--d': `${delay + i++ * stagger}ms` } }) : c));
    return (
      <Tag ref={ref} className={className} style={style} {...rest}>
        {kids}
      </Tag>
    );
  }
  return (
    <Tag ref={ref} className={`rv ${className}`.trim()} style={{ '--d': `${delay}ms`, ...style }} {...rest}>
      {children}
    </Tag>
  );
}

// A number that counts up the first time it scrolls into view.
export function Count({ to, pad = 2, suffix = '' }) {
  const ref = useRef(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - k, 4))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.5 });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref} className="count">
      {String(v).padStart(pad, '0')}
      {suffix}
    </span>
  );
}

export function SectionHead({ n, label, title, lede, solo = false, children }) {
  return (
    <div className={`head ${solo ? 'solo' : ''}`.trim()}>
      <div>
        <Reveal as="span" className="eyebrow">
          {n && <b>{n}</b>} {label}
        </Reveal>
        <Split className="h2">{title}</Split>
      </div>
      {lede && (
        <Reveal as="p" className="lede" delay={120}>
          {lede}
        </Reveal>
      )}
      {children && <Reveal delay={200} className="head-link">{children}</Reveal>}
    </div>
  );
}

export function Faq({ items }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q} className="faq-item">
          <summary>
            <span>{f.q}</span>
            <i aria-hidden="true" />
          </summary>
          <div className="faq-body">
            <div>
              <p>{f.a}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

// Kept for the pages that use it; v3p2 shows the words plainly (no scrambling effect).
export function ScrambleText({ text, as: Tag = 'span', className = '', ...props }) {
  return (
    <Tag className={className} {...props}>
      {text}
    </Tag>
  );
}

export function CharRise({ text, className = '', delay = 100 }) {
  return (
    <span className={`char-rise ${className}`.trim()} aria-label={text}>
      {text.split('').map((ch, i) => (
        <span
          key={i}
          className="char-item"
          style={{
            display: 'inline-block',
            animation: 'char-in 0.85s cubic-bezier(0.16, 1, 0.3, 1) both',
            animationDelay: `${delay + i * 26}ms`,
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}

export function JoinBand() {
  return (
    <section className="join-band">
      <div className="wrap join-band-in">
        <Logo className="join-band-logo" />
        <Reveal as="span" className="eyebrow">
          <ScrambleText text="Recruitment · Next cohort" />
        </Reveal>
        <h2 className="display join-club-title">
          Join the club!
        </h2>
        <Split className="h2 join-club-sub">
          Bring your curiosity. <span className="ember-text">We bring the crew.</span>
        </Split>
        <Reveal as="p" className="lede" delay={150}>
          No experience needed. Pick a domain, join a team and build something real this term.
        </Reveal>
        <Reveal className="btn-row" delay={250}>
          <Magnetic>
            <Link className="btn btn-primary" to="/join" viewTransition>
              How to join <Arrow />
            </Link>
          </Magnetic>
          <Magnetic>
            <Link className="btn btn-ghost" to="/events" viewTransition>
              What happens each term
            </Link>
          </Magnetic>
        </Reveal>
      </div>
      <div className="join-band-strip" style={{ marginTop: 'clamp(36px, 5vw, 64px)' }}>
        <Marquee
          items={['JOIN THE CREW', 'FIVE DOMAINS', 'AMIEE LABS', 'BUILD REAL AI', 'SRMIST', 'FALL & SPRING COHORTS']}
          speed={36}
          className="small-mq"
        />
      </div>
    </section>
  );
}

