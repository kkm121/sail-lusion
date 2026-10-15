import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import PageShell from '../components/PageShell';
import Text from '../components/Text';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import Crosses from '../components/Crosses';
import { CREATOR } from '../data/team';
import { coreTeam } from '../data/core';
import { SITE } from '../data/site';
import { canGL } from '../lib/device';
import { resolveAsset } from '../lib/assets';
import { scrollState, scrollTo } from '../lib/scroll';
import { useDocRect } from '../lib/measure';
import { useTick } from '../lib/useTick';

const AboutHero = lazy(() => import('../scene/AboutHero'));
const TeamStage = lazy(() => import('../scene/TeamStage'));

const EXPERTISE = [
  { n: '01', title: 'Vision', items: ['Image classification', 'Detection', 'Segmentation', 'Dataset curation', 'Model evaluation'] },
  { n: '02', title: 'Language', items: ['Text classification', 'Summarisation', 'Retrieval', 'Prompt design', 'Evaluation'] },
  { n: '03', title: 'Robotics', items: ['Simulation', 'Path planning', 'Control', 'Embedded systems', 'Prototyping'] },
  { n: '04', title: 'Creative tech', items: ['WebGL and 3D', 'Interface design', 'Motion', 'Visual identity', 'Event media'] },
];

const STEPS = [
  { n: '01', t: 'Say hello', d: 'Follow us and watch for the call for members. Anyone at SRM is welcome, from first year up.' },
  { n: '02', t: 'Pick a domain', d: 'Technical, R&D, Corporate, Creatives or Operations. Join one, and try others any time.' },
  { n: '03', t: 'Build with the crew', d: 'Start on a small project with a mentor, then take it to the showcase.' },
];
const RHYTHM = [
  { t: 'Workshops', d: 'Hands-on sessions on tools and ideas, open to all members.' },
  { t: 'Build sprints', d: 'Short team projects that end with something working.' },
  { t: 'Reading groups', d: 'Papers and talks, discussed over the term.' },
  { t: 'Showcase', d: 'A public demo day for everything the club has made.' },
];
const FAQ = [
  { q: 'Do I need experience?', a: 'No. Curiosity matters more than a CV, and every domain has people who will help you start.' },
  { q: 'Which departments can join?', a: 'Any department at SRM. The club works with AMIEE and welcomes everyone.' },
  { q: 'How much time does it take?', a: 'A few hours a week, more around events and sprints.' },
  { q: 'When do applications open?', a: 'Recruitment is still being built. Follow us to hear the moment it opens.' },
];

const TOOLS = ['PyTorch', 'OpenCV', 'Three.js', 'React', 'ROS', 'TensorFlow', 'Python', 'FastAPI', 'Arduino', 'Blender', 'Figma', 'Supabase'];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const initialOf = (name) => name.trim()[0]?.toUpperCase() || '';

function Hero() {
  const gl = canGL();
  useEffect(() => {
    if (!gl) resolveAsset('about');
  }, [gl]);
  return (
    <section className="sl-ah" id="about-hero">
      {gl ? (
        <Suspense fallback={null}>
          <AboutHero />
        </Suspense>
      ) : (
        <div className="sl-ah-fallback" aria-hidden="true" />
      )}
      <Crosses />
      <div className="sl-ah-copy">
        <h1>
          <Text type="lines" trigger="ready" delay={250}>
            WE ARE
          </Text>
          <Text type="lines" trigger="ready" delay={330}>
            FireFly
          </Text>
          <Text type="lines" trigger="ready" delay={410}>
            A STUDENT-RUN
          </Text>
          <Text type="lines" trigger="ready" delay={490} className="it">
            AI CLUB
          </Text>
        </h1>
        <p className="sl-ah-right">
          <Text type="lines" trigger="ready" delay={560} className="it">
            BUILDING INTELLIGENT
          </Text>
          <Text type="lines" trigger="ready" delay={640} className="it">
            SYSTEMS TOGETHER
          </Text>
        </p>
      </div>
      <div className="sl-ah-scroll">
        <Text type="scramble" trigger="ready" delay={900}>
          Scroll to explore
        </Text>
      </div>
    </section>
  );
}

function Statement() {
  return (
    <section className="sl-st">
      <p className="sl-st-top">
        <Text type="scrub">A community of students building, researching and shipping intelligent systems together.</Text>
      </p>
      <p className="sl-st-bottom">
        <Text type="scrub">{`${SITE.fullName}, associated with AMIEE, learns by building and shares what it builds with everyone.`}</Text>
      </p>
      <Crosses n={5} />
    </section>
  );
}

function Team() {
  const names = useMemo(() => coreTeam.map((m) => m.name), []);
  const creatorIdx = useMemo(() => coreTeam.findIndex((m) => m.creator), []);
  const N = coreTeam.length;
  const section = useRef(null);
  const rect = useDocRect(section);
  const idxRef = useRef({ idx: 0, frac: 0, creatorIdx });
  const active = useRef(false);
  const [idx, setIdx] = useState(0);
  const [fill, setFill] = useState(0);
  const gl = canGL();

  useTick(() => {
    if (!rect.ready) return;
    const range = Math.max(rect.height - scrollState.vh, 1);
    const p = clamp((scrollState.y - rect.top) / range);
    const pos = p * (N - 0.001);
    const i = Math.min(N - 1, Math.floor(pos));
    idxRef.current.idx = i;
    idxRef.current.frac = pos - i;
    active.current = scrollState.y + scrollState.vh > rect.top && scrollState.y < rect.top + rect.height;
    setIdx((cur) => (cur === i ? cur : i));
    const f = Math.round(p * 100);
    setFill((cur) => (cur === f ? cur : f));
  }, 6);

  const goTo = (i) => {
    const range = Math.max(rect.height - scrollState.vh, 1);
    scrollTo(rect.top + ((i + 0.5) / N) * range, { duration: 1.1 });
  };

  const m = coreTeam[idx];
  return (
    <section className="sl-ts" id="core-team" ref={section} style={{ '--n': N }} aria-label="Core team">
      <div className="sl-ts-stage">
        {gl ? (
          <Suspense fallback={null}>
            <TeamStage names={names} idxRef={idxRef} creatorIdx={creatorIdx} active={active} />
          </Suspense>
        ) : (
          <div className="sl-ts-flat" aria-hidden="true">
            {m.name}
          </div>
        )}
        <Crosses n={5} />
        <div className="sl-ts-rule" aria-hidden="true">
          <i style={{ transform: `scaleX(${fill / 100})` }} />
        </div>
        <h2 className="sl-ts-title">
          <Text type="chars" className="sl-ts-spaced">
            TEAM
          </Text>
        </h2>
        <div className="sl-ts-count" aria-hidden="true">
          <span>[[</span>
          <b key={idx}>{String(idx + 1).padStart(2, '0')}</b>
          <span>]]</span>
          <em>/ {String(N).padStart(2, '0')}</em>
        </div>

        <div className={`sl-ts-info ${m.creator ? 'is-creator' : ''}`} key={m.name}>
          <span className="sl-ts-name">{m.name}</span>
          <span className="sl-ts-area">{m.area}</span>
          {m.tag && <span className="sl-ts-tag">{m.tag}</span>}
        </div>
        <p className="sl-ts-about" key={`a-${m.name}`}>
          {m.about}
        </p>
        <div className={`sl-ts-letter ${m.creator ? 'is-creator' : ''}`} aria-hidden="true" key={`l-${m.name}`}>
          {initialOf(m.name)}
        </div>
        <button type="button" className="sl-ts-next" onClick={() => goTo((idx + 1) % N)} aria-label="Next team member" data-magnetic data-cursor="NEXT">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function Crew() {
  const rows = [];
  for (let i = 0; i < coreTeam.length; i += 3) rows.push(coreTeam.slice(i, i + 3));
  return (
    <section className="sl-cw" id="crew">
      <div className="sl-cw-head">
        <h2>
          <Text type="chars">Core Team</Text>
        </h2>
        <span className="sl-cw-count">{coreTeam.length}</span>
      </div>
      <Text as="p" type="lines" className="sl-cw-note" delay={120}>
        One team, equal space and equal responsibility. A title is only a tag; everyone here shares the work, the decisions and the credit.
      </Text>
      <div className="sl-core-grid">
        {rows.map((row) => (
          <Reveal key={row[0].name} type="rise" cols={3} className="sl-core-row" margin="0px 0px -4% 0px" threshold={0.08}>
            {row.map((m) => (
              <article className={`sl-core-card ${m.creator ? 'is-creator' : ''}`} key={m.name}>
                <div className="sl-core-top">
                  <span className="sl-core-index">{m.index}</span>
                  {m.tag && <span className="sl-core-tag">{m.tag}</span>}
                </div>
                <h3 className="sl-core-name">{m.name}</h3>
                <p className="sl-core-area">{m.area}</p>
                <p className="sl-core-about">{m.about}</p>
              </article>
            ))}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Expertise() {
  return (
    <section className="sl-ex">
      <div className="sl-ex-head">
        <h2>
          <Text type="chars">Area of expertise</Text>
        </h2>
        <Text as="p" type="lines" className="sl-ex-note" delay={140}>
          Four directions the club explores together, each open to anyone curious enough to join.
        </Text>
      </div>
      <div className="sl-ex-list">
        {EXPERTISE.map((e) => (
          <Reveal key={e.title} type="up" className="sl-ex-row" y={46}>
            <span className="n">{e.n}</span>
            <h3>{e.title}</h3>
            <ul>
              {e.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ClubInfo() {
  return (
    <section className="sl-ci" aria-label="About the club">
      <div className="sl-ci-col">
        <h2><Text type="chars">How to join</Text></h2>
        <Reveal type="rise" cols={1} stagger={90} y={36} className="sl-ci-steps">
          {STEPS.map((s) => (
            <div className="sl-ci-step" key={s.n}><span>{s.n}</span><b>{s.t}</b><p>{s.d}</p></div>
          ))}
        </Reveal>
      </div>
      <div className="sl-ci-col">
        <h2><Text type="chars">Every term</Text></h2>
        <Reveal type="rise" cols={2} stagger={80} y={36} className="sl-ci-grid">
          {RHYTHM.map((r) => (
            <div className="sl-ci-card" key={r.t}><b>{r.t}</b><p>{r.d}</p></div>
          ))}
        </Reveal>
      </div>
      <div className="sl-ci-col sl-ci-faq">
        <h2><Text type="chars">Questions</Text></h2>
        <Reveal type="up" y={36}>
          {FAQ.map((f) => (
            <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <PageShell back={{ href: '/', label: 'Home' }} next={{ label: 'Our domains', href: '/domains' }}>
      <Hero />
      <Statement />
      <Team />
      <Crew />
      <Expertise />
      <ClubInfo />
      <section className="sl-ab-tools" aria-label="Tools we build with">
        <Text as="p" type="lines" className="sl-ab-tools-title">
          WHAT WE BUILD WITH
        </Text>
        <Marquee variant="outline" items={TOOLS} speed={52} dir={1} className="sl-ab-mq" label={TOOLS.join(', ')} />
        <Marquee variant="mono" items={['Vision', 'Language', 'Robotics', 'Creative tech', 'Research', 'Community']} speed={30} dir={-1} />
      </section>
      <section className="sl-about-credit">
        <p className="sl-eyebrow">Website</p>
        <h2>
          <Text type="lines">Made by</Text> <span className="sl-gold">{CREATOR}</span>
        </h2>
      </section>
    </PageShell>
  );
}
