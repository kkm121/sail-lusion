import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import TransitionProvider from './components/TransitionProvider';
import { RecruitProvider } from './components/RecruitContext';
import Cursor from './components/Cursor';
import Preloader from './components/Preloader';
import Home from './pages/Home';
import About from './pages/About';
import Domains from './pages/Domains';
import DomainDetail from './pages/DomainDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import NotFound from './pages/NotFound';
import { isTouch } from './lib/device';
import { scrollState } from './lib/scroll';
import { onTick } from './lib/ticker';

// Developer-only pose picker for the navigator model; the whole branch is removed from production builds.
const NavPose = import.meta.env.DEV ? lazy(() => import('./dev/NavPose')) : null;

function SmoothScroll() {
  useEffect(() => {
    const touch = isTouch();
    const root = document.documentElement;
    let lenis = null;
    if (!touch) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
      scrollState.lenis = lenis;
    }
    const size = () => {
      scrollState.vh = window.innerHeight;
      scrollState.vw = window.innerWidth;
    };
    size();
    window.addEventListener('resize', size);

    let lastY = window.scrollY || 0;
    let calmSince = 0;
    const stop = onTick((time, dt) => {
      if (lenis) lenis.raf(time);
      const y = window.scrollY || 0;
      const v = (y - lastY) / Math.max(dt * 60, 0.5);
      lastY = y;
      scrollState.velocity += (v - scrollState.velocity) * 0.4;
      if (Math.abs(scrollState.velocity) < 0.02) scrollState.velocity = 0;
      if (v !== 0) scrollState.dir = v > 0 ? 1 : -1;
      scrollState.y = y;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      scrollState.progress = Math.min(1, Math.max(0, y / max));
      // Hover effects pause while the page is moving so tiles do not flicker under a still pointer.
      if (Math.abs(scrollState.velocity) > 0.7) {
        calmSince = 0;
        if (!scrollState.scrolling) {
          scrollState.scrolling = true;
          root.classList.add('is-scrolling');
        }
      } else if (scrollState.scrolling) {
        calmSince = calmSince || time;
        if (time - calmSince > 140) {
          scrollState.scrolling = false;
          root.classList.remove('is-scrolling');
        }
      }
    }, 0);

    return () => {
      stop();
      window.removeEventListener('resize', size);
      root.classList.remove('is-scrolling');
      scrollState.lenis = null;
      lenis?.destroy();
    };
  }, []);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <SmoothScroll />
      <RecruitProvider>
        <TransitionProvider>
          <Cursor />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/domains" element={<Domains />} />
            <Route path="/domains/:id" element={<DomainDetail />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            {NavPose && (
              <Route
                path="/__nav"
                element={
                  <Suspense fallback={null}>
                    <NavPose />
                  </Suspense>
                }
              />
            )}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Preloader />
        </TransitionProvider>
      </RecruitProvider>
    </BrowserRouter>
  );
}
