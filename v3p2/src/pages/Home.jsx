import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CharRise, JoinBand, Logo, Reveal } from '../components/ui';
import Backdrop from '../components/Backdrop';
import { Cycle, useSectionProgress } from '../components/motion';
import { PILLARS } from '../data/club';
import { domains } from '../data/domains';
import { coreTeam } from '../data/core';
import { artUrl, projects } from '../data/projects';
import { scroll } from '../lib/motion';
import Lab from '../lab/Lab';

// Apple-style text links end in a small chevron.
const Chevron = () => (
  <svg className="chev" viewBox="0 0 12 12" aria-hidden="true">
    <path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Browsers that can run scroll-linked animations in CSS do the reveals there, with no JavaScript per frame.
const cssScroll = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()');

// One sentence, lit word by word as it scrolls through the screen (CSS where supported, a light fallback elsewhere).
function Statement() {
  const head = useRef(null);
  const text = 'We build late into the night. We debug together, share what we learn, and turn research into live, working software.';
  const words = text.split(' ');
  const refs = useRef([]);
  useSectionProgress(head, (p, r) => {
    if (cssScroll) return;
    const k = Math.min(1, Math.max(0, (scroll.vh * 0.82 - r.top) / (scroll.vh * 0.48)));
    refs.current.forEach((el, i) => {
      if (el) el.style.opacity = (0.16 + 0.84 * Math.min(1, Math.max(0, (k - i / words.length) * words.length))).toFixed(2);
    });
  });
  return (
    <section className="section statement">
      <div className="wrap" ref={head}>
        <p className="ab-kicker">Life in the club</p>
        <p className="statement-text">
          {words.map((w, i) => (
            <span key={i} ref={(el) => (refs.current[i] = el)} style={{ '--w': i / words.length }}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

// Projects as a row of tall cards you swipe through: native scroll snapping, two small buttons for mouse users.
function Carousel() {
  const row = useRef(null);
  const step = (dir) => {
    const el = row.current;
    if (!el) return;
    const card = el.firstElementChild;
    el.scrollBy({ left: dir * ((card?.getBoundingClientRect().width || 320) + 20), behavior: 'smooth' });
  };
  return (
    <div className="car-wrap">
      <div className="car" ref={row} role="list" aria-label="Projects">
        {projects.map((p) => (
          <Link className="car-card" role="listitem" key={p.id} to={`/projects/${p.id}`} style={{ '--dc': p.color }} viewTransition>
            <div className="car-img">
              <img src={artUrl(p)} alt="" loading="lazy" decoding="async" draggable="false" />
            </div>
            <div className="car-body">
              <span className="car-tag">{p.domainName}</span>
              <h3>{p.name}</h3>
              <p>{p.blurb}</p>
              <span className="car-status">{p.status}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="car-nav">
        <button type="button" onClick={() => step(-1)} aria-label="Previous projects">
          <Chevron />
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Next projects">
          <Chevron />
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div>
      <section className="hero ah">
        <Backdrop />
        <div className="wrap ah-in">
          <p className="ah-eyebrow hero-a">Student AI club · SRM · Associated with AMIEE</p>
          <h1 className="ah-title hero-b">
            <CharRise text="Small lights," delay={150} />
            <span className="ah-line">
              <Cycle words={['built', 'learned', 'shared', 'shipped']} /> together.
            </span>
          </h1>
          <p className="ah-sub hero-c">Learn artificial intelligence by building it, across five domains, with a crew that shares everything it makes.</p>
          <div className="ah-cta hero-d">
            <Link className="btn btn-primary ah-btn" to="/join" viewTransition>
              Join FireFly
            </Link>
            <a className="ah-link" href="#lab">
              Step inside <Chevron />
            </a>
          </div>
        </div>
        {/* the bird on a stage, at a three-quarter angle like a product shot; it lifts away as you scroll (CSS) */}
        <div className="ah-stage" aria-hidden="true">
          <div className="ah-mark">
            <div className="ah-bird">
              <Logo />
            </div>
          </div>
          <i className="ah-floor" />
        </div>
      </section>

      <Lab />

      <section className="section ab">
        <div className="wrap">
          <Reveal className="ab-head">
            <p className="ab-kicker">What we do</p>
            <h2 className="ab-h">Learn it. Build it. Share it.</h2>
            <p className="ab-sub">Three habits run through everything FireFly does, from a first workshop to a published project.</p>
          </Reveal>
          <Reveal className="bento" stagger={90}>
            {PILLARS.map((p, i) => (
              <article className={`tile tile-${i}`} key={p.n}>
                <span className="tile-n">{p.n}</span>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </article>
            ))}
            <article className="tile tile-stat">
              <b>{domains.length}</b>
              <span>domains, one crew</span>
            </article>
            <article className="tile tile-stat">
              <b>{coreTeam.length}</b>
              <span>members, equal space</span>
            </article>
          </Reveal>
        </div>
      </section>

      <Statement />

      <section className="section ag">
        <div className="wrap">
          <Reveal className="ab-head">
            <p className="ab-kicker">Our story</p>
            <h2 className="ab-h">Why a firefly?</h2>
            <p className="ab-sub">One firefly is a small light. A field of them changes the night. No one needs to be an expert to start, and every person who builds something makes it easier for the next one.</p>
          </Reveal>
        </div>
        <figure className="ag-fig">
          <img src="/media/crew.jpg" alt="Students working together at a table" loading="lazy" decoding="async" />
        </figure>
        <div className="wrap">
          <p className="ag-note">Students from every department, five domains, one showcase at the end of every term. Associated with AMIEE.</p>
        </div>
      </section>

      <section className="section ap">
        <div className="wrap ap-head">
          <div>
            <p className="ab-kicker">Projects</p>
            <h2 className="ab-h">Work that ships.</h2>
          </div>
          <Link className="ah-link" to="/projects" viewTransition>
            All {projects.length} projects <Chevron />
          </Link>
        </div>
        <Carousel />
      </section>

      <JoinBand />
    </div>
  );
}
