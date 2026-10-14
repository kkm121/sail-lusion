import { useCallback, useRef } from 'react';
import GLStage from '../components/GLStage';
import Header from '../components/Header';
import Lab from '../components/Lab';
import LiquidOverlay from '../components/LiquidOverlay';
import PageTint from '../components/PageTint';
import Preloader from '../components/Preloader';
import Reel from '../components/Reel';
import ScrollIndicator from '../components/ScrollIndicator';
import { End, Featured, Footer, Hero } from '../components/Sections';

export default function Home() {
  const root = useRef(null);
  const onReady = useCallback(() => root.current?.classList.add('is-ready'), []);
  return (
    <main className="sail has-loader" ref={root}>
      <Preloader onReady={onReady} />
      <ScrollIndicator />
      <PageTint />
      <GLStage />
      <LiquidOverlay />
      <Header />
      <Hero />
      <Reel />
      <Featured />
      <Lab />
      <End />
      <Footer />
    </main>
  );
}
