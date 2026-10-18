import { useRef } from 'react';
import PageHero from '../components/PageHero';
import { Faq, Reveal, SectionHead } from '../components/ui';
import { Magnetic, useTilt } from '../components/motion';
import { FAQ, STEPS, WANT } from '../data/club';
import { domains } from '../data/domains';
import { SITE } from '../data/site';

export default function Join() {
  const page = useRef(null);
  useTilt(page, '.tilt', 4);
  return (
    <div ref={page}>
      <PageHero eyebrow="Join" title={<>Bring your curiosity. <span className="ember-text">We bring the crew.</span></>} lede="Anyone at SRM can join FireFly, from any department and any year. No experience needed.">
        <div className="notice">
          <span className="pulse">
            <i />
            <b>Applications open soon.</b>
          </span>
          <span className="small">The online form is being built. Follow us to hear the moment recruitment opens.</span>
          <Magnetic>
            <a className="btn btn-primary" href={SITE.instagram} target="_blank" rel="noreferrer">
              Follow on Instagram ↗
            </a>
          </Magnetic>
        </div>
      </PageHero>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <SectionHead n="01" label="Who we want" title="People who like to make things." />
          <Reveal as="ul" className="want" stagger={80}>
            {WANT.map((w, i) => (
              <li key={w}>
                <span>0{i + 1}</span>
                {w}
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section band">
        <div className="wrap">
          <SectionHead n="02" label="How to join" title="Three steps in." />
          <Reveal className="steps" stagger={110}>
            {STEPS.map((s) => (
              <article className="card tilt step" key={s.n}>
                <span className="num">{s.n}</span>
                <h3 className="h3">{s.title}</h3>
                <p className="small">{s.text}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <SectionHead n="03" label="Choose a domain" title="Where would you start?" lede="You choose one to begin with. Each has its own team and work." />
          <Reveal className="grid g3" stagger={70}>
            {domains.map((d) => (
              <article className="card tilt" key={d.id} style={{ '--dc': d.color, display: 'grid', gap: 10 }}>
                <span className="tag">
                  <i /> {d.code}
                </span>
                <h3 className="h3">{d.shortName}</h3>
                <p className="small">{d.tagline}</p>
              </article>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="section band" id="faq">
        <div className="wrap">
          <SectionHead n="04" label="Questions" title="Asked often." />
          <Reveal>
            <Faq items={FAQ} />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
