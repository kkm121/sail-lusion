import PageShell from '../components/PageShell';
import SubHero from '../components/SubHero';
import Reveal from '../components/Reveal';
import TransitionLink from '../components/TransitionLink';

export default function NotFound() {
  return (
    <PageShell className="is-domain" back={{ href: '/', label: 'Home' }} next={{ label: 'Home', href: '/' }}>
      <SubHero eyebrow="Error 404" title="Lost in the dark" lede="That page is not part of the voyage. Head home, or open the CLI with Ctrl K and type help." size="s" scrollLabel="Nothing below">
        <Reveal type="up" y={30} delay={900} className="sl-sh-actions">
          <TransitionLink className="sl-pill sl-pill--white" href="/" label="Home" data-magnetic>
            <i /> Back to the start
          </TransitionLink>
        </Reveal>
      </SubHero>
    </PageShell>
  );
}
