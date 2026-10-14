import PageShell from '../components/PageShell';
import SplitLine from '../components/SplitLine';
import { CREATOR } from '../data/team';
import { coreTeam } from '../data/core';
import { SITE } from '../data/site';

const EXPERTISE = [
  { title: 'Vision', items: ['Image classification', 'Detection', 'Segmentation', 'Dataset curation', 'Model evaluation'] },
  { title: 'Language', items: ['Text classification', 'Summarisation', 'Retrieval', 'Prompt design', 'Evaluation'] },
  { title: 'Robotics', items: ['Simulation', 'Path planning', 'Control', 'Embedded systems', 'Prototyping'] },
  { title: 'Creative tech', items: ['WebGL and 3D', 'Interface design', 'Motion', 'Visual identity', 'Event media'] },
];

export default function About() {
  return (
    <PageShell back={{ href: '/', label: 'Home' }} next={{ label: 'Our domains', href: '/domains' }}>
      <section className="sl-about-hero">
        <p className="sl-eyebrow">The crew</p>
        <h1>
          <span>
            <SplitLine text="A STUDENT-RUN" />
          </span>
          <span>
            <SplitLine text="AI RESEARCH" delay={80} />
          </span>
          <span>
            <SplitLine text="LAB" delay={160} />
          </span>
        </h1>
        <div className="sl-about-hero-row">
          <p className="sl-about-sub">BUILDING INTELLIGENT SYSTEMS TOGETHER</p>
          <p className="sl-about-lede">
            {SITE.fullName}, associated with AMIEE, is a community of SRM students working across computer vision, language, robotics and interactive 3D. We learn by building, and we share what we build.
          </p>
        </div>
      </section>

      <section className="sl-about-block" id="core-team">
        <div className="sl-about-count">
          <h2 className="sl-about-h">Core Team</h2>
          <span className="sl-count">{coreTeam.length}</span>
        </div>
        <p className="sl-about-note">One team, equal space and equal responsibility. A title is only a tag; everyone here shares the work, the decisions and the credit.</p>
        <div className="sl-core-grid">
          {coreTeam.map((m) => (
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
        </div>
      </section>

      <section className="sl-about-block">
        <h2 className="sl-about-h">
          <SplitLine text="Area of expertise" />
        </h2>
        <p className="sl-about-note">Four directions the lab explores together, each open to anyone curious enough to join.</p>
        <div className="sl-expertise">
          {EXPERTISE.map((e) => (
            <div key={e.title}>
              <h3>{e.title}</h3>
              <ul>
                {e.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="sl-about-block sl-about-credit">
        <p className="sl-eyebrow">Website</p>
        <h2 className="sl-about-h">
          Made by <span className="sl-gold">{CREATOR}</span>
        </h2>
      </section>
    </PageShell>
  );
}
