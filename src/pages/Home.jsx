import { useEffect, useRef } from 'react';
import Header from '../components/Header';
import Lab from '../components/Lab';
import LiquidOverlay from '../components/LiquidOverlay';
import PageTint from '../components/PageTint';
import Reel from '../components/Reel';
import ScrollIndicator from '../components/ScrollIndicator';
import { End, Featured, Footer, Hero, VoyageTicker } from '../components/Sections';
import { whenShown } from '../lib/ready';

export default function Home() {
  const root = useRef(null);
  useEffect(() => whenShown(() => root.current?.classList.add('is-ready')), []);
  return (
    <main className="sail has-loader" ref={root}>
      <ScrollIndicator />
      <PageTint />
      <LiquidOverlay />
      <Header />
      <Hero />
      <Reel />
      <Featured />
      <VoyageTicker />
      <Lab />
      <End />
      <Footer />
    </main>
  );
}
