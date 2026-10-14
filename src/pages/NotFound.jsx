import PageShell from '../components/PageShell';
import SplitLine from '../components/SplitLine';

export default function NotFound() {
  return (
    <PageShell back={{ href: '/', label: 'Home' }} next={{ label: 'Home', href: '/' }}>
      <section className="sl-about-hero" style={{ minHeight: '70svh' }}>
        <p className="sl-eyebrow">404</p>
        <h1>
          <span>
            <SplitLine text="LOST IN" />
          </span>
          <span>
            <SplitLine text="THE LAB" delay={80} />
          </span>
        </h1>
        <p className="sl-about-lede" style={{ marginTop: 'calc(var(--u) * 4)' }}>That page is not part of the voyage. Head home, or open the CLI with Ctrl K and type help.</p>
      </section>
    </PageShell>
  );
}
