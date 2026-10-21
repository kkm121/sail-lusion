import { useState } from 'react';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import MissionBento from './components/MissionBento';
import DomainsSection from './components/DomainsSection';
import ProjectsSection from './components/ProjectsSection';
import CrewSection from './components/CrewSection';
import TerminalSection from './components/TerminalSection';
import Footer from './components/Footer';
import './styles/v4.css';

export default function App() {
  const [loaded, setLoaded] = useState(false);

  const handleOpenCli = () => {
    const el = document.getElementById('terminal');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="v4-root">
      <Preloader onComplete={() => setLoaded(true)} />
      <Header />
      <main id="main">
        {/* Scroll 1: Hero & Discover Interactive */}
        <Hero onOpenCli={handleOpenCli} />

        {/* Scroll 2: Philosophy & Bento Metrics */}
        <MissionBento />

        {/* Scroll 3: 5 Research Chapters */}
        <DomainsSection />

        {/* Scroll 4: Flagship Builds */}
        <ProjectsSection />

        {/* Scroll 5: The Crew (17 Members, Equal Representation) */}
        <CrewSection />

        {/* Scroll 6: Interactive Terminal & Admissions */}
        <TerminalSection />
      </main>
      <Footer />
    </div>
  );
}
