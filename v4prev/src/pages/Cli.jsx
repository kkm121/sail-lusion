import { useNavigate } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Terminal from '../components/Terminal';

// The command line: v2's FireFly console, in the page.
export default function Cli() {
  const navigate = useNavigate();
  return (
    <div>
      <PageHero eyebrow="Command line" title="The FireFly console." lede="Explore the club from a terminal: the team, the domains, every project. Type help, or tap a command." />
      <section className="section dark cli-page">
        <div className="wrap">
          <Terminal open inline onClose={() => navigate('/')} />
        </div>
      </section>
    </div>
  );
}
