import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Arrow, CharRise, Count, JoinBand, Logo, Reveal, ScrambleText, SectionHead } from '../components/ui';
import Backdrop from '../components/Backdrop';
import Fluid from '../components/Fluid';
import { Cycle, DragRail, Magnetic, Marquee, PopImage, Split, useSectionProgress, useTilt } from '../components/motion';
import { PILLARS, FORMATS } from '../data/club';
import { domains } from '../data/domains';
import { artUrl, projects } from '../data/projects';
import { coreTeam } from '../data/core';
import { leadershipTeam } from '../data/team';
import { onFrame, reduced, scroll, Spring } from '../lib/motion';

const achievements = domains.flatMap((d) => d.achievements.map((a) => ({ ...a, domain: d }))).slice(0, 4);
const STACK = [...new Set(domains.flatMap((d) => d.technologies))];

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

// Domain cards stack as you scroll: each one pins near the top and the ones beneath shrink back and dim.
function DomainDeck() {
  const root = useRef(null);
  useSectionProgress(root, () => {
    const cards = root.current?.querySelectorAll('.deck-card');
    if (!cards) return;
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const a = c.getBoundingClientRect();
      const b = next.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, 1 - (b.top - a.top) / a.height));
      c.style.transform = `scale(${(1 - k * 0.06).toFixed(4)})`;
      c.style.filter = `brightness(${(1 - k * 0.45).toFixed(3)})`;
    });
  });
  return (
    <ol className="deck" ref={root}>
      {domains.map((d, i) => (
        <li key={d.id} className="deck-item" style={{ '--i': i, '--dc': d.color }}>
          <Link to={`/domains#${d.id}`} className="deck-card" viewTransition>
            <div className="deck-l">
              <span className="deck-code">{d.code}</span>
              <h3 className="h2">{d.shortName}</h3>
              <p className="small">{d.tagline}</p>
              <span className="link">
                Explore {d.shortName} <Arrow />
              </span>
            </div>
            <div className="deck-r">
              <div className="chips">
                {d.technologies.slice(0, 6).map((t) => (
                  <span className="tag" key={t}>
                    {t}
                  </span>
                ))}
              </div>
              <div className="deck-team">
                <span className="mono">Team</span>
                <span>{d.members.join(' · ')}</span>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

// A term as a timeline whose line fills as you read down it.
function Timeline() {
  const root = useRef(null);
  const fill = useRef(null);
  useSectionProgress(root, (p, r) => {
    const k = Math.min(1, Math.max(0, (scroll.vh * 0.6 - r.top) / r.height));
    if (fill.current) fill.current.style.transform = `scaleY(${k.toFixed(4)})`;
    root.current?.querySelectorAll('.tl-step').forEach((s) => {
      const top = s.getBoundingClientRect().top;
      s.classList.toggle('is-lit', top < scroll.vh * 0.6);
    });
  });
  return (
    <div className="tl" ref={root}>
      <div className="tl-line" aria-hidden="true">
        <i ref={fill} />
      </div>
      {FORMATS.map((f, i) => (
        <div className="tl-step" key={f.title}>
          <span className="tl-dot" aria-hidden="true" />
          <span className="mono">
            0{i + 1} · {f.when}
          </span>
          <h3 className="h3">{f.title}</h3>
          <p className="small">{f.text}</p>
        </div>
      ))}
    </div>
  );
}

function LifeSection() {
  const root = useRef(null);
  const text = 'We build late into the night. We debug together, share what we learn, and turn research into live, working software.';
  const words = text.split(' ');
  const wordRefs = useRef([]);

  useSectionProgress(root, (progress) => {
    const total = words.length;
    wordRefs.current.forEach((el, idx) => {
      if (!el) return;
      const start = idx / (total + 3);
      const end = (idx + 3) / (total + 3);
      const k = Math.min(1, Math.max(0, (progress - start) / (end - start)));
      el.style.opacity = (0.2 + 0.8 * k).toFixed(2);
      el.style.color = k > 0.6 ? 'var(--ink)' : 'var(--faint)';
    });
  });

  return (
    <section className="life-section" ref={root}>
      <div className="wrap">
        <div className="life-head">
          <span className="eyebrow">
            <b>Life in the club</b> · Daily rhythm
          </span>
          <p className="life-text" style={{ marginTop: '24px' }}>
            {words.map((w, i) => (
              <span
                key={i}
                ref={(el) => (wordRefs.current[i] = el)}
                style={{ display: 'inline-block', margin: '0 0.16em', transition: 'color 0.25s', opacity: 0.2 }}
              >
                {w}
              </span>
            ))}
          </p>
        </div>

        <div className="life-grid">
          <PopImage side="left" src="/media/build.jpg" alt="Building in the lab" />
          <PopImage side="right" src="/media/crew.jpg" alt="FireFly team working together" className="span-2" />
          <PopImage side="left" src="/media/lab-screen.jpg" alt="Late night session" className="span-2" />
          <PopImage side="right" src={artUrl(projects[0])} alt={projects[0]?.name || 'Project'} />
          <PopImage side="left" src={artUrl(projects[1])} alt={projects[1]?.name || 'Project'} />
          <PopImage side="right" src={artUrl(projects[2])} alt={projects[2]?.name || 'Project'} className="span-2" />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const page = useRef(null);
  useTilt(page, '.tilt');
  return (
    <div ref={page}>
      <section className="hero">
        <Backdrop />
        <Fluid />
        <div className="wrap hero-in">
          <div className="hero-copy">
            <span className="eyebrow hero-a">
              <ScrambleText text="Student AI club · SRM · Associated with AMIEE" />
            </span>
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
              <Magnetic>
                <Link className="btn btn-ghost" to="/projects" viewTransition>
                  See what we build
                </Link>
              </Magnetic>
            </div>
          </div>
          <HeroMark />
        </div>
        <div className="wrap hero-stats hero-d">
          {[
            [coreTeam.length, 'Core team'],
            [domains.length, 'Domains'],
            [projects.length, 'Projects'],
            [domains.reduce((a, d) => a + d.achievements.length, 0), 'Achievements'],
          ].map(([n, l]) => (
            <div key={l}>
              <b>
                <Count to={n} />
              </b>
              <span className="mono">{l}</span>
            </div>
          ))}
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span className="mono">Scroll</span>
          <i />
        </div>
        <div className="hero-bottom-strip">
          <Marquee items={['STUDENT AI CLUB', 'FIVE DOMAINS', 'AMIEE SRMIST', 'ZERO TO SHIPPED', 'OPEN RESEARCH']} speed={34} className="small-mq" />
        </div>
      </section>

      <Marquee items={['Learn', 'Build', 'Share', 'Vision', 'Language', 'Robotics', 'Design', 'Research']} speed={46} />

      <section className="section">
        <div className="wrap">
          <SectionHead n="01" label="What we do" title="Learn it. Build it. Share it." lede="Three habits run through everything FireFly does, from a first workshop to a published project." />
          <Reveal className="grid g3" stagger={110}>
            {PILLARS.map((p) => (
              <article className="card tilt pillar" key={p.n}>
                <span className="pillar-n">{p.n}</span>
                <h3 className="h3">{p.title}</h3>
                <p className="small">{p.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <LifeSection />

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="Domains" title="Five chapters, one crew." lede="Every member belongs to a domain. Scroll through them; each has its own team, stack and flagship work.">
            <Link className="link" to="/domains" viewTransition>
              All domains <Arrow />
            </Link>
          </SectionHead>
          <DomainDeck />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="03" label="Projects" title="Work that ships." lede="Drag the row, flick it, or use the arrows. Each project is open about where it stands.">
            <Link className="link" to="/projects" viewTransition>
              All {projects.length} projects <Arrow />
            </Link>
          </SectionHead>
          <DragRail label="Projects">
            {projects.map((p) => (
              <Link className="card tilt proj" key={p.id} to={`/projects/${p.id}`} style={{ '--dc': p.color }} draggable="false" viewTransition>
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

      <Marquee items={STACK} speed={30} className="small-mq" />

      <section className="section band">
        <div className="wrap tl-wrap">
          <div className="tl-head">
            <SectionHead n="04" label="Every term" title="A rhythm you can count on." lede="Six formats run all term. Dates are announced on Instagram first." solo>
              <Link className="link" to="/events" viewTransition>
                How a term works <Arrow />
              </Link>
            </SectionHead>
          </div>
          <Timeline />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="05" label="Achievements" title="Flagship work across the domains." lede="Highlights from each domain. Full write-ups live on the project pages." />
          <Reveal className="grid g2" stagger={110}>
            {achievements.map((a) => (
              <Link className="card tilt ach" key={a.id} to={`/projects/${a.id}`} style={{ '--dc': a.domain.color }} viewTransition>
                <span className="tag">
                  <i /> {a.domain.shortName}
                </span>
                <h3 className="h3">{a.title}</h3>
                <p className="small">{a.desc}</p>
                <div className="ach-foot">
                  <span className="mono">{a.status}</span>
                  <b>{a.metric}</b>
                </div>
              </Link>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap">
          <SectionHead n="06" label="The crew" title={`${coreTeam.length} people, equal space.`} lede="FireFly is led by its members. A title is only a tag; everyone shares the work, the decisions and the credit.">
            <Link className="link" to="/team" viewTransition>
              Meet the whole team <Arrow />
            </Link>
          </SectionHead>
          <Reveal className="grid g3" stagger={110}>
            {leadershipTeam.map((m) => (
              <article className="card tilt person" key={m.name}>
                <span className="person-i" aria-hidden="true">
                  {m.name[0]}
                </span>
                <span className="tag">{m.role}</span>
                <h3 className="h3">{m.name}</h3>
                <p className="small">{m.bio}</p>
              </article>
            ))}
          </Reveal>
        </div>
        <div className="crew-mq">
          <Marquee items={coreTeam.map((m) => m.name)} speed={34} className="small-mq" />
        </div>
      </section>

      <JoinBand />
    </div>
  );
}
