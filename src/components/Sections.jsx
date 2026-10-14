import { lazy, Suspense } from 'react';
import ProjectTile from './ProjectTile';
import SplitLine from './SplitLine';
import TransitionLink from './TransitionLink';
import FluidBackdrop from './FluidBackdrop';
import { useBuilding, useRecruit, useTerminal } from './RecruitContext';
import { projects } from '../data/projects';
import { SITE } from '../data/site';

const HeroScene = lazy(() => import('./HeroScene'));

const Plus = () => (
  <span className="sl-plus" aria-hidden="true">
    +
  </span>
);

export function Hero() {
  return (
    <section className="sl-hero" id="home-hero">
      <h1 className="sl-tagline">
        We build intelligent systems
        <br />
        and bring AI ideas to life
        <br />
        with the SRM community
      </h1>
      <div className="sl-hero-visual">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="sl-hero-chip">
          <i /> {SITE.fullName}
          <span className="assoc">Associated with AMIEE</span>
        </div>
      </div>
      <div className="sl-hero-scroll">
        <Plus />
        <span>Scroll to explore</span>
        <Plus />
      </div>
    </section>
  );
}

export function Featured({ list = projects.slice(0, 4), withCta = true }) {
  return (
    <section className="sl-featured" id="featured">
      <div className="sl-featured-head">
        <h2>
          <SplitLine text="Featured Work" />
        </h2>
        <p>The cargo so far: what the crew has brought back from its voyages. Placeholders for now, real work as it ships.</p>
      </div>
      <div className="sl-grid">
        {list.map((p) => (
          <ProjectTile key={p.id} p={p} />
        ))}
      </div>
      {withCta && (
        <div className="sl-featured-cta">
          <TransitionLink className="sl-pill sl-pill--white" href="/projects" label="Projects" data-magnetic>
            See all projects
          </TransitionLink>
        </div>
      )}
    </section>
  );
}

export function End() {
  const recruit = useRecruit();
  return (
    <section className="sl-end" id="end">
      <FluidBackdrop />
      <div className="sl-end-inner">
        <small>The crew has a seat for you</small>
        <h2>
          <button type="button" onClick={recruit} data-cursor="JOIN">
            <SplitLine text="Join the lab!" />
          </button>
        </h2>
        <p className="hint">Continue to scroll</p>
      </div>
    </section>
  );
}

export function Footer({ next = { label: 'About us', href: '/about' } }) {
  const building = useBuilding();
  const openTerminal = useTerminal();
  return (
    <>
      <footer className="sl-footer">
        <div className="sl-footer-mid">
          <div className="sl-footer-contact">
            <p>
              {SITE.address.map((line, i) => (
                <span key={line}>
                  {line}
                  {i < SITE.address.length - 1 && <br />}
                </span>
              ))}
            </p>
            <p>
              <a href={SITE.instagram} target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href={SITE.linkedin} target="_blank" rel="noreferrer">
                LinkedIn
              </a>
            </p>
            <p className="bld">
              <button type="button" onClick={() => building('Recruitment')}>
                Recruitment <em>Building</em>
              </button>
              <button type="button" onClick={() => building('Sign in')}>
                Sign in <em>Building</em>
              </button>
              <button type="button" onClick={() => building('Sign up')}>
                Sign up <em>Building</em>
              </button>
              <button type="button" onClick={openTerminal}>
                CLI <em>Ctrl K</em>
              </button>
            </p>
          </div>
          <div className="sl-footer-news">
            <h3>
              Join us in
              <br />
              building what&apos;s next
            </h3>
            <a className="sl-pill sl-pill--dark sl-footer-pill" href={SITE.instagram} target="_blank" rel="noreferrer" data-magnetic>
              Follow on Instagram <i />
            </a>
          </div>
        </div>
        <div className="sl-footer-bottom">
          <span>
            ©{SITE.year} {SITE.name} · {SITE.fullName}
          </span>
          <div className="right">
            <a href={SITE.linkedin} target="_blank" rel="noreferrer">
              Associated with AMIEE
            </a>
            <span className="credit">
              Website made by <b>{SITE.creator}</b>
            </span>
          </div>
          <a className="sl-up" href="#home-hero" aria-label="Back to top" data-magnetic>
            ↑
          </a>
        </div>
      </footer>
      <div className="sl-nav">
        <small>
          Keep scrolling
          <br />
          to learn more
        </small>
        <TransitionLink href={next.href} label={next.label}>
          {next.label}
        </TransitionLink>
        <TransitionLink href={next.href} label={next.label}>
          Next page
        </TransitionLink>
        <div className="line" />
      </div>
    </>
  );
}