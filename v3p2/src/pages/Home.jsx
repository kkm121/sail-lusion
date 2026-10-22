import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Arrow, CharRise, JoinBand, Logo, Reveal, SectionHead } from '../components/ui';
import Backdrop from '../components/Backdrop';
import { Cycle, DragRail, Magnetic, Marquee, Split, useSectionProgress } from '../components/motion';
import { PILLARS } from '../data/club';
import { artUrl, projects } from '../data/projects';
import { onFrame, reduced, scroll, Spring } from '../lib/motion';
import Lab from '../lab/Lab';

// The bird floats, leans toward the pointer and lifts away as the hero scrolls out.
function HeroMark() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced()) return undefined;
    const rx = new Spring(0, { damping: 1, response: 0.8 });
    const ry = new Spring(0, { damping: 1, response: 0.8 });
    const move = (e) => {
      ry.target = ((e.clientX / window.innerWidth) * 2 - 1) * 10;
      rx.target = -((e.clientY / window.innerHeight) * 2 - 1) * 8;
    };
    window.addEventListener('pointermove', move, { passive: true });
    let t = 0;
    const stop = onFrame((dt) => {
      // nothing to draw once the hero is gone
      if (scroll.y > scroll.vh * 1.2) return;
      t += dt;
      rx.step(dt);
      ry.step(dt);
      const k = Math.min(1, scroll.y / scroll.vh);
      el.style.transform = `translate3d(0, ${(Math.sin(t * 0.9) * 10 - k * 120).toFixed(1)}px, 0) perspective(800px) rotateX(${rx.x.toFixed(2)}deg) rotateY(${ry.x.toFixed(2)}deg) rotate(${(Math.sin(t * 0.5) * 2 - k * 8).toFixed(2)}deg) scale(${(1 - k * 0.15).toFixed(3)})`;
      el.style.opacity = (1 - k * 0.9).toFixed(3);
    });
    return () => {
      stop();
      window.removeEventListener('pointermove', move);
    };
  }, []);
  return (
    <div className="hero-mark" aria-hidden="true">
      <div className="hero-ring r1" />
      <div className="hero-ring r2" />
      <div ref={ref} className="hero-bird">
        <Logo />
      </div>
    </div>
  );
}

// One sentence, lit word by word as it scrolls through the screen.
function Statement() {
  const head = useRef(null);
  const text = 'We build late into the night. We debug together, share what we learn, and turn research into live, working software.';
  const words = text.split(' ');
  const refs = useRef([]);
  useSectionProgress(head, (p, r) => {
    const k = Math.min(1, Math.max(0, (scroll.vh * 0.82 - r.top) / (scroll.vh * 0.48)));
    refs.current.forEach((el, i) => {
      if (!el) return;
      const w = Math.min(1, Math.max(0, (k - i / words.length) * words.length));
      el.style.opacity = (0.16 + 0.84 * w).toFixed(2);
    });
  });
  return (
    <section className="section statement">
      <div className="wrap" ref={head}>
        <span className="eyebrow">
          <b>Life in the club</b>
        </span>
        <p className="statement-text">
          {words.map((w, i) => (
            <span key={i} ref={(el) => (refs.current[i] = el)}>
              {w}{' '}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <section className="hero">
        <Backdrop />
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow hero-a">Student AI club · SRM · Associated with AMIEE</span>
            <h1 className="display hero-title">
              <span className="hero-rise-wrap" style={{ display: 'block' }}>
                <CharRise text="Small lights," delay={150} />
              </span>
              <span className="hero-line hero-b">
                <Cycle words={['built', 'learned', 'shared', 'shipped']} /> together.
              </span>
            </h1>
            <p className="lede hero-c">FireFly is a student-run club where people learn artificial intelligence by building it, across five domains, with a crew that shares everything it makes.</p>
            <div className="btn-row hero-d">
              <Magnetic>
                <Link className="btn btn-primary" to="/join" viewTransition>
                  Join FireFly <Arrow />
                </Link>
              </Magnetic>
              <a className="btn btn-ghost" href="#lab">
                Step inside
              </a>
            </div>
          </div>
          <HeroMark />
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span className="mono">Scroll</span>
          <i />
        </div>
      </section>

      <Marquee items={['Learn', 'Build', 'Share', 'Vision', 'Language', 'Robotics', 'Design', 'Research']} speed={46} />

      <Lab />

      <section className="section">
        <div className="wrap">
          <SectionHead n="01" label="What we do" title="Learn it. Build it. Share it." lede="Three habits run through everything FireFly does, from a first workshop to a published project." />
          <Reveal className="grid g3" stagger={110}>
            {PILLARS.map((p) => (
              <article className="card pillar" key={p.n}>
                <span className="pillar-n">{p.n}</span>
                <h3 className="h3">{p.title}</h3>
                <p className="small">{p.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <Statement />

      <section className="section">
        <div className="wrap story">
          <div className="story-text">
            <Reveal as="span" className="eyebrow">
              <b>02</b> Our story
            </Reveal>
            <Split className="h2">Why a firefly?</Split>
            <Reveal as="p" delay={100}>
              One firefly is a small light. A field of them changes the night. No one needs to be an expert to start, and every person who builds something makes it easier for the next one.
            </Reveal>
            <Reveal as="p" delay={180}>
              Students from every department work across five domains, from engineering and research to design, partnerships and media, and meet at the end of term to show what they made. We are associated with AMIEE.
            </Reveal>
          </div>
          <Reveal className="story-img" delay={120}>
            <img src="/media/crew.jpg" alt="Students working together at a table" loading="lazy" />
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap">
          <SectionHead n="03" label="Projects" title="Work that ships." lede="Drag the row, or use the arrows. Each project is open about where it stands.">
            <Link className="link" to="/projects" viewTransition>
              All {projects.length} projects <Arrow />
            </Link>
          </SectionHead>
          <DragRail label="Projects">
            {projects.map((p) => (
              <Link className="card proj" key={p.id} to={`/projects/${p.id}`} style={{ '--dc': p.color }} draggable="false" viewTransition>
                <div className="proj-img">
                  <img src={artUrl(p)} alt="" loading="lazy" draggable="false" />
                </div>
                <div className="proj-meta">
                  <span className="tag">
                    <i /> {p.domainName}
                  </span>
                  <span className="small">{p.status}</span>
                </div>
                <h3 className="h3">{p.name}</h3>
                <p className="small">{p.blurb}</p>
              </Link>
            ))}
          </DragRail>
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
