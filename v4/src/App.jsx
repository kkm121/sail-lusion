import { useState } from 'react';
import Preloader from './components/Preloader';
import Header from './components/Header';
import Hero from './components/Hero';
import MarqueeTicker from './components/MarqueeTicker';
import MissionBento from './components/MissionBento';
import DomainsSection from './components/DomainsSection';
import PlaygroundSection from './components/PlaygroundSection';
import ProjectsSection from './components/ProjectsSection';
import ClubInitiatives from './components/ClubInitiatives';
import ResearchSection from './components/ResearchSection';
import CrewSection from './components/CrewSection';
import AdmissionsSection from './components/AdmissionsSection';
import TerminalSection from './components/TerminalSection';
import PartnersSection from './components/PartnersSection';
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
        {/* 01: Hero & Real-Time Physics Showcase */}
        <Hero onOpenCli={handleOpenCli} />

        {/* Dynamic Kinetic Marquee Slogan */}
        <MarqueeTicker text="WHERE CURIOSITY IGNITES INTELLIGENCE · ENGINEERING THE AUTONOMOUS FRONTIER · 17 MINDS · INFINITE COMPUTE · SRMIST × AMIEE" />

        {/* 02: Philosophy & Core Metric Bento */}
        <MissionBento />

        {/* 03: The 5 Specialized Domains & Lab Compute Specs */}
        <DomainsSection />

        {/* 04: Interactive Labs (Dual Physics Node Engine & Neural Simulator) */}
        <PlaygroundSection />

        {/* 05: Full Systems & Projects Portfolio */}
        <ProjectsSection />

        {/* 06: Formats, Build Sprints & Community Initiatives */}
        <ClubInitiatives />

        {/* 07: Academic Research Papers & Benchmark Datasets */}
        <ResearchSection />

        {/* 08: The Crew (17 Members, Equal Representation) */}
        <CrewSection />

        {/* 09: Recruitment Roadmap & Interactive FAQ */}
        <AdmissionsSection onOpenCli={handleOpenCli} />

        {/* 10: Stationary Cyber CLI */}
        <TerminalSection />

        {/* 11: Partnerships & Institutional Ecosystem */}
        <PartnersSection />
      </main>

      <Footer />
    </div>
  );
}
