import { lazy, Suspense } from 'react';
import ProjectGrid from './ProjectGrid';
import Text from './Text';
import Reveal from './Reveal';
import Marquee from './Marquee';
import TransitionLink from './TransitionLink';
import Logo from './Logo';
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

const VOYAGE = ['Build', 'Discover', 'Create', 'Connect', 'Record'];
const FIELDS = ['Computer Vision', 'Language Models', 'Robotics', 'Interactive 3D', 'Data Science', 'Edge Intelligence', 'Research', 'Community'];

export function Hero() {
  return (
    <section className="sl-hero" id="home-hero">
      <h1 className="sl-tagline">
        <Text type="lines" trigger="ready">
          We build intelligent systems and bring AI ideas to life with the SRM community
        </Text>
      </h1>
      <div className="sl-hero-visual">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
        <div className="sl-hero-chip">
          <Logo /> {SITE.fullName}
          <span className="assoc">Associated with AMIEE</span>
        </div>
      </div>
      <div className="sl-hero-scroll">
        <Plus />
        <Text as="span" type="scramble" trigger="ready" delay={900}>
          Scroll to explore
        </Text>
        <Plus />
      </div>
    </section>
  );
}

export function VoyageTicker() {
  return (
    <section className="sl-voyage" aria-label="The five chapters of the club">
      <Marquee variant="outline" items={VOYAGE} speed={46} dir={1} label="Build, Discover, Create, Connect, Record" />
      <Marquee variant="mono" items={FIELDS} speed={34} dir={-1} className="sl-voyage-mono" />
    </section>
  );
}

export function Featured({ list = projects.slice(0, 4), withCta = true }) {
  return (
    <section className="sl-featured" id="featured">
      <div className="sl-featured-head">
        <h2>
          <Text type="chars">Featured Work</Text>
        </h2>
        <Text as="p" type="lines" delay={160}>
          The cargo so far: what the crew has brought back from its voyages. Placeholders for now, real work as it ships.
        </Text>
      </div>
      <ProjectGrid list={list} />
      {withCta && (
        <Reveal type="up" className="sl-featured-cta">
          <TransitionLink className="sl-pill sl-pill--white" href="/projects" label="Projects" data-magnetic>
            See all projects
          </TransitionLink>
        </Reveal>
      )}
    </section>
  );
}

export function End() {
  const recruit = useRecruit();
  return (
    <section className="sl-end" id="end">
      <FluidBackdrop />
      <Logo variant="ember" className="sl-end-bird" />
      <div className="sl-end-inner">
        <small>
          <Text type="scramble">The crew has a seat for you</Text>
        </small>
        <h2>
          <button type="button" onClick={recruit} data-cursor="JOIN">
            <Text type="chars">Join the club!</Text>
          </button>
        </h2>
        <Text as="p" type="words" className="hint" delay={300}>
          Continue to scroll
        </Text>
      </div>
      <Marquee variant="mono" items={['Recruitment open', 'Apply now', 'Computer vision', 'Language', 'Robotics', 'Creative tech']} speed={40} dir={1} className="sl-end-mq" />
    </section>
  );
}

export function Footer({ next = { label: 'About us', href: '/about' } }) {
  const building = useBuilding();
  const openTerminal = useTerminal();
  return (
    <>
      <footer className="sl-footer">
        <Marquee variant="outline" items={['FireFly', 'Student club', 'AMIEE']} speed={34} dir={-1} className="sl-footer-mq" label="FireFly, FireFly, AMIEE" />
        <div className="sl-footer-brand">
          <Logo title="FireFly logo" />
          <span>
            <b>FireFly</b>
            <small>Student AI club · Associated with AMIEE</small>
          </span>
        </div>
        <div className="sl-footer-mid">
          <Reveal type="up" className="sl-footer-contact">
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
          </Reveal>
          <div className="sl-footer-news">
            <h3>
              <Text type="lines">Join us in building what&apos;s next</Text>
            </h3>
            <Reveal type="up" delay={220}>
              <a className="sl-pill sl-pill--dark sl-footer-pill" href={SITE.instagram} target="_blank" rel="noreferrer" data-magnetic>
                Follow on Instagram <i />
              </a>
            </Reveal>
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
