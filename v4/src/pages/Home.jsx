import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { JoinBand, Reveal } from '../components/ui';
import { useSectionProgress } from '../components/motion';
import { PILLARS } from '../data/club';
import { domains } from '../data/domains';
import { coreTeam } from '../data/core';
import { scroll } from '../lib/motion';

// Files only this site has (posters, the crimson mark, the AMIEE logo) are served under its own base path.
const u = (p) => `${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}${p}`;

const Chevron = () => (
  <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const cssScroll = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()');

const WHY = ['Research opportunities', 'Internship and career opportunities', 'Networking and collaboration', 'Workshops and skill development', 'Exclusive events and resources'];

// The club's credo, lit word by word as it scrolls past (CSS where supported, a light fallback elsewhere).
function Credo() {
  const head = useRef(null);
  const words = 'We Learn. We Build. We Grow. We Shine Beyond Titles.'.split(' ');
  const refs = useRef([]);
  useSectionProgress(head, (p, r) => {
    if (cssScroll) return;
    const k = Math.min(1, Math.max(0, (scroll.vh * 0.85 - r.top) / (scroll.vh * 0.5)));
    refs.current.forEach((el, i) => {
      if (el) el.style.opacity = (0.18 + 0.82 * Math.min(1, Math.max(0, (k - i / words.length) * words.length))).toFixed(2);
    });
  });
  return (
    <section className="v4-credo" ref={head}>
      <p className="v4-credo-text">
        {words.map((w, i) => (
          <span key={i} ref={(el) => (refs.current[i] = el)} style={{ '--w': i / words.length }}>
            {w}{' '}
          </span>
        ))}
      </p>
    </section>
  );
}

export default function Home() {
  const faces = coreTeam.filter((m) => m.photo);
  return (
    <div className="v4">
      {/* 1. the poster: the wordmark stacked, the crimson bird crossing it */}
      <section className="v4-hero">
        <div className="v4-hero-in">
          <h1 className="v4-mark hero-b" aria-label="FireFly">
            <span>Fire</span>
            <span>Fly</span>
          </h1>
          <img className="v4-bird" src={u('/brand/firefly-crimson.png')} alt="" aria-hidden="true" />
          <div className="v4-hero-foot hero-d">
            <p>Student AI club at SRM · Associated with AMIEE</p>
            <div className="v4-cta">
              <Link className="btn btn-primary v4-btn" to="/join" viewTransition>
                Join FireFly
              </Link>
              <Link className="v4-link" to="/discover" viewTransition>
                Discover <Chevron />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. the credo */}
      <Credo />

      {/* 3. what the club does */}
      <section className="v4-sec">
        <Reveal className="v4-head">
          <p className="v4-kicker">What we do</p>
          <h2 className="v4-h">Learn it. Build it. Share it.</h2>
          <p className="v4-sub">Three habits run through everything FireFly does, from a first workshop to a published project.</p>
        </Reveal>
        <Reveal className="v4-three" stagger={90}>
          {PILLARS.map((p) => (
            <article className="v4-card" key={p.n}>
              <span className="v4-card-n">{p.n}</span>
              <h3>{p.title}</h3>
              <p>{p.text}</p>
            </article>
          ))}
        </Reveal>
      </section>

      {/* 4. the association */}
      <section className="v4-sec v4-amiee">
        <Reveal className="v4-amiee-in">
          <img className="v4-amiee-logo" src={u('/brand/amiee-logo.jpg')} alt="AMIEE: Empowering Innovation, Shaping Futures" loading="lazy" />
          <h2 className="v4-h v4-left">
            FireFly
            <br />
            Associated with AMIEE
          </h2>
          <p className="v4-sub v4-left">AMIEE is an association focused on AI, machine learning, innovation, entrepreneurship, engineering, research and professional development.</p>
        </Reveal>
      </section>

      {/* 5. why join */}
      <section className="v4-sec">
        <Reveal className="v4-head">
          <p className="v4-kicker">Why join</p>
          <h2 className="v4-h">One membership. Endless opportunity.</h2>
        </Reveal>
        <Reveal as="ul" className="v4-why" stagger={70}>
          {WHY.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </Reveal>
      </section>

      {/* 6. the five domains */}
      <section className="v4-sec">
        <Reveal className="v4-head">
          <p className="v4-kicker">Domains</p>
          <h2 className="v4-h">Five domains. One crew.</h2>
          <p className="v4-sub">Every member belongs to a domain, each with its own team, stack and flagship work.</p>
        </Reveal>
        <Reveal className="v4-domains" stagger={70}>
          {domains.slice(0, 5).map((d) => (
            <Link className="v4-dom" key={d.id} to={`/domains#${d.id}`} viewTransition>
              <span className="v4-dom-n">{d.code}</span>
              <h3>{d.shortName}</h3>
              <p>{d.tagline}</p>
              <span className="v4-link small">
                Learn more <Chevron />
              </span>
            </Link>
          ))}
        </Reveal>
      </section>

      {/* 7. discover */}
      <section className="v4-sec">
        <Link className="v4-discover" to="/discover" viewTransition>
          <img src={u('/brand/firefly-crimson.png')} alt="" aria-hidden="true" />
          <div>
            <p className="v4-kicker">Discover</p>
            <h2 className="v4-h v4-left">Step inside FireFly.</h2>
            <p className="v4-sub v4-left">A voyage through the five domains, from Earth at sunrise to the edge of the night.</p>
            <span className="v4-link">
              Take the voyage <Chevron />
            </span>
          </div>
        </Link>
      </section>

      {/* 8. the crew */}
      <section className="v4-sec">
        <Reveal className="v4-head">
          <p className="v4-kicker">The crew</p>
          <h2 className="v4-h">{coreTeam.length} members. Equal space.</h2>
          <p className="v4-sub">FireFly is run by its members. A title is only a tag; everyone shares the work and the credit.</p>
        </Reveal>
        <div className="v4-faces">
          {faces.map((m) => (
            <img key={m.name} src={m.photo} alt={m.name} title={m.name} loading="lazy" decoding="async" width="64" height="64" />
          ))}
        </div>
        <p className="v4-center">
          <Link className="v4-link" to="/team" viewTransition>
            Meet the team <Chevron />
          </Link>
        </p>
      </section>

      <JoinBand />
    </div>
  );
}
