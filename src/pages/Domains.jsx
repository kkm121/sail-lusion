import PageShell from '../components/PageShell';
import SubHero from '../components/SubHero';
import CountUp from '../components/CountUp';
import Reveal from '../components/Reveal';
import Marquee from '../components/Marquee';
import Roll from '../components/Roll';
import TransitionLink from '../components/TransitionLink';
import { domains } from '../data/domains';
import { artUrl, projects, projectsByDomain } from '../data/projects';

const STATS = [
  { n: domains.length, label: 'Domains' },
  { n: projects.length, label: 'Projects' },
  { n: domains.reduce((a, d) => a + d.achievements.length, 0), label: 'Achievements' },
];
const STACK = [...new Set(domains.flatMap((d) => d.technologies))];

export default function Domains() {
  return (
    <PageShell className="is-domain" back={{ href: '/', label: 'Home' }} next={{ label: 'Our projects', href: '/projects' }}>
      <SubHero
        eyebrow="The chapters"
        title="Domains"
        count={<CountUp to={domains.length} delay={500} />}
        lede="Each domain is a chapter of the voyage, with its own team, flagship work and achievements. Technical and R&D sit together under the Technical Team, so the same three members carry both."
        accent="#00f5d4"
        accent2="#8b5cf6"
      >
        <Reveal type="rise" cols={3} stagger={110} y={34} className="sl-sh-stats">
          {STATS.map((s) => (
            <div className="sl-sh-stat" key={s.label}>
              <b>
                <CountUp to={s.n} delay={700} />
              </b>
              <small>{s.label}</small>
            </div>
          ))}
        </Reveal>
      </SubHero>

      <section className="sl-sh-mq" aria-label="Domains">
        <Marquee variant="outline" items={domains.map((d) => d.shortName)} speed={48} dir={1} label={domains.map((d) => d.shortName).join(', ')} />
      </section>

      <section className="sl-dom-list" aria-label="All domains">
        {domains.map((d) => {
          const list = projectsByDomain(d.id);
          return (
            <Reveal key={d.id} type="up" y={56} className="sl-dom-item" style={{ '--dc': d.color }} margin="0px 0px -6% 0px" threshold={0.1}>
              <TransitionLink className="sl-dom-row sl-roll-host" href={`/domains/${d.id}`} color={d.bg} text={d.text} label={d.shortName} data-cursor="OPEN">
                <span className="code">{d.code}</span>
                <span className="name">
                  <b>
                    <Roll text={d.shortName} />
                  </b>
                  <small>{d.tagline}</small>
                  <em className="who">{d.members.join(' · ')}</em>
                </span>
                <span className="thumb" aria-hidden="true">
                  <img src={artUrl(list[0] || projects[0])} alt="" loading="lazy" decoding="async" draggable="false" />
                </span>
                <span className="meta">
                  <b>{String(d.achievements.length).padStart(2, '0')}</b> achievements
                  <br />
                  <b>{String(list.length).padStart(2, '0')}</b> projects
                </span>
                <span className="go" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </TransitionLink>
            </Reveal>
          );
        })}
      </section>

      <section className="sl-sh-mq sl-sh-mq--end" aria-label="Technologies">
        <Marquee variant="mono" items={STACK} speed={36} dir={-1} />
      </section>
    </PageShell>
  );
}
