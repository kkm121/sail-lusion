import { useRef } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Marquee } from '../components/motion';
import { Arrow, Reveal } from '../components/ui';

export function SignIn() {
  const page = useRef(null);

  return (
    <div ref={page}>
      <PageHero
        eyebrow="Portal Access"
        title={<>Sign in to <span className="ember-text">FireFly.</span></>}
        lede="Member authentication and internal dashboard services are currently in staging."
      />

      <div className="hazard-wrap" aria-hidden="true">
        <Marquee
          className="hazard-tape"
          items={['UNDER CONSTRUCTION', 'DEV PREVIEW ONLY', 'AUTHENTICATION COMING SOON', 'STAGING ENVIRONMENT', 'AMIEE LABS']}
          speed={32}
        />
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="form-preview-wrap">
            <div className="coming-soon-badge">Coming Soon</div>
            <article className="card form-preview-card" aria-hidden="true">
              <h3 className="h3" style={{ marginBottom: 20 }}>Member Sign In</h3>
              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label className="mono" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>SRM Email / NetID</label>
                  <input
                    type="email"
                    disabled
                    value="student@srmist.edu.in"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line-2)',
                      background: 'var(--paper)',
                      fontFamily: 'var(--f-mono)',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label className="mono" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Password</label>
                  <input
                    type="password"
                    disabled
                    value="••••••••••••"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line-2)',
                      background: 'var(--paper)',
                      fontFamily: 'var(--f-mono)',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--muted)' }}>
                  <input type="checkbox" disabled checked readOnly />
                  <span>Keep me signed in on this workstation</span>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                >
                  Sign in to console
                </button>
              </form>
            </article>

            <Reveal className="form-links" delay={120}>
              <div style={{ textAlign: 'center', marginTop: 32, display: 'grid', gap: 14 }}>
                <p className="small">
                  Need an account? <Link className="link" to="/signup" viewTransition>Request access / Sign up <Arrow /></Link>
                </p>
                <p className="small" style={{ color: 'var(--muted)' }}>
                  Looking to join the student club? <Link className="link" to="/join" viewTransition>Admissions & recruitments guide <Arrow /></Link>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SignUp() {
  const page = useRef(null);

  return (
    <div ref={page}>
      <PageHero
        eyebrow="New Member Registration"
        title={<>Sign up for <span className="ember-text">FireFly.</span></>}
        lede="Online registration for new lab recruits and community contributors."
      />

      <div className="hazard-wrap" aria-hidden="true">
        <Marquee
          className="hazard-tape"
          items={['UNDER CONSTRUCTION', 'REGISTRATION IN STAGING', 'APPLICATIONS OPENING SOON', 'SRM INSTITUTE', 'AMIEE LABS']}
          speed={32}
        />
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="form-preview-wrap">
            <div className="coming-soon-badge">Coming Soon</div>
            <article className="card form-preview-card" aria-hidden="true">
              <h3 className="h3" style={{ marginBottom: 20 }}>Apply for Membership</h3>
              <form onSubmit={(e) => e.preventDefault()} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label className="mono" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Full Name</label>
                  <input
                    type="text"
                    disabled
                    value="Student Name"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line-2)',
                      background: 'var(--paper)',
                      fontFamily: 'var(--f-body)',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label className="mono" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>SRM Student Email</label>
                  <input
                    type="email"
                    disabled
                    value="netid@srmist.edu.in"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line-2)',
                      background: 'var(--paper)',
                      fontFamily: 'var(--f-mono)',
                      fontSize: 14,
                    }}
                  />
                </div>
                <div>
                  <label className="mono" style={{ display: 'block', marginBottom: 6, fontSize: 11 }}>Preferred Domain</label>
                  <select
                    disabled
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line-2)',
                      background: 'var(--paper)',
                      fontFamily: 'var(--f-body)',
                      fontSize: 14,
                    }}
                  >
                    <option>Vision & Perception</option>
                    <option>Natural Language</option>
                    <option>Robotics & Embodied AI</option>
                    <option>Design & Systems</option>
                    <option>Research & Foundations</option>
                  </select>
                </div>
                <button
                  type="button"
                  disabled
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10 }}
                >
                  Submit application
                </button>
              </form>
            </article>

            <Reveal className="form-links" delay={120}>
              <div style={{ textAlign: 'center', marginTop: 32, display: 'grid', gap: 14 }}>
                <p className="small">
                  Already registered? <Link className="link" to="/signin" viewTransition>Sign in to your account <Arrow /></Link>
                </p>
                <p className="small" style={{ color: 'var(--muted)' }}>
                  Questions about how we recruit? <Link className="link" to="/join" viewTransition>Read recruitment steps & FAQ <Arrow /></Link>
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
