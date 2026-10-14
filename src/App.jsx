import { useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Lenis from '@studio-freight/lenis';
import TransitionProvider from './components/TransitionProvider';
import { RecruitProvider } from './components/RecruitContext';
import Cursor from './components/Cursor';
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

function SmoothScroll() {
  useEffect(() => {
    const isMobileDevice = isTouch();
    let lenis = null;

    if (!isMobileDevice) {
      lenis = new Lenis({
        lerp: 0.08,
        wheelMultiplier: 0.95,
        smoothWheel: true,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      scrollState.lenis = lenis;
      lenis.on('scroll', (e) => {
        scrollState.velocity = e.velocity;
        scrollState.y = e.scroll;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        scrollState.progress = Math.min(1, Math.max(0, e.scroll / max));
      });
    }

    let lastY = window.scrollY || 0;
    let lastTime = performance.now();

    const stop = onTick((time) => {
      if (lenis) {
        lenis.raf(time);
        if (Math.abs(lenis.velocity) < 0.01) scrollState.velocity = 0;
      } else {
        const now = time;
        const dt = Math.max((now - lastTime) / 1000, 0.016);
        const curY = window.scrollY || 0;
        const rawVel = (curY - lastY) / dt;
        scrollState.velocity += (rawVel - scrollState.velocity) * 0.18;
        if (Math.abs(scrollState.velocity) < 0.05) scrollState.velocity = 0;
        scrollState.y = curY;
        const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        scrollState.progress = Math.min(1, Math.max(0, curY / max));
        lastY = curY;
        lastTime = now;
      }
    }, 0);

    return () => {
      stop();
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TransitionProvider>
      </RecruitProvider>
    </BrowserRouter>
  );
}
