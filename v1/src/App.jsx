import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { LoadingSequence } from './components/ui/LoadingSequence';
import { Cursor } from './components/ui/Cursor';
import { Navbar } from './components/ui/Navbar';
import { Footer } from './components/ui/Footer';
import { ConstructionModal } from './components/ui/ConstructionModal';
import { DesktopModeNotice } from './components/ui/DesktopModeNotice';
import { DebugPanel } from './components/ui/DebugPanel';
import { isTouchDevice } from './lib/device';
import { HomePage } from './components/pages/HomePage';

const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));

function SceneUnavailable({ onReady }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

const Scene = lazy(() =>
  import('./components/canvas/Scene')
    .then((m) => ({ default: m.Scene }))
    .catch(() => ({ default: SceneUnavailable }))
);
const DomainsPage = lazyNamed(() => import('./components/pages/DomainsPage'), 'DomainsPage');
const ProjectsPage = lazyNamed(() => import('./components/pages/ProjectsPage'), 'ProjectsPage');
const TeamPage = lazyNamed(() => import('./components/pages/TeamPage'), 'TeamPage');
const ApplicantPortalPage = lazyNamed(() => import('./components/pages/ApplicantPortalPage'), 'ApplicantPortalPage');
const AdminPortalPage = lazyNamed(() => import('./components/pages/AdminPortalPage'), 'AdminPortalPage');
const RecruitmentPortal = lazyNamed(() => import('./components/portals/RecruitmentPortal'), 'RecruitmentPortal');
const UnifiedPortal = lazyNamed(() => import('./components/portals/UnifiedPortal'), 'UnifiedPortal');
const TerminalPortal = lazyNamed(() => import('./components/portals/TerminalPortal'), 'TerminalPortal');
const ResetPasswordModal = lazyNamed(() => import('./components/portals/ResetPasswordModal'), 'ResetPasswordModal');

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const PORTALS_ENABLED = false;

const IS_TOUCH = typeof window !== 'undefined' && isTouchDevice();
const SHOW_DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');

const THEME_COLORS = {
  home: '#00F5D4',
  domains: '#8B5CF6',
  projects: '#38BDF8',
  team: '#F59E0B',
  'candidate-portal': '#00F5D4',
  'admin-portal': '#E11D48',
};

export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneMounted, setSceneMounted] = useState(false);
  const [activePage, setActivePage] = useState('home');
  const [customThemeColor, setCustomThemeColor] = useState('');

  const [session, setSession] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [applyOpen, setApplyOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(
    () => PORTALS_ENABLED && window.location.hash.includes('type=recovery')
  );
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setSceneMounted(true), 700);
    return () => clearTimeout(timer);
  }, []);

  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleLoaded = useCallback(() => setLoaded(true), []);
  const handleLoaderExited = useCallback(() => setLoaderVisible(false), []);

  const showProgress = useCallback((feature, message) => {
    setNotice({ feature, message });
  }, []);

  const openApply = useCallback(() => {
    if (PORTALS_ENABLED) setApplyOpen(true);
    else showProgress('Recruitment', 'Applications will open here soon. Follow FireFly on Instagram and LinkedIn to hear when they go live.');
  }, [showProgress]);

  const openLogin = useCallback(() => {
    if (PORTALS_ENABLED) setLoginModalOpen(true);
    else showProgress('Sign in', 'Accounts and sign-in will open here soon. Follow FireFly on Instagram and LinkedIn to hear when they go live.');
  }, [showProgress]);

  const openTerminal = useCallback(() => {
    setTerminalOpen(true);
  }, []);

  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToastMessage('');
      toastTimer.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!PORTALS_ENABLED) return undefined;

    let cancelled = false;
    let subscription = null;

    const isOAuthReturn =
      window.location.hash.includes('access_token') ||
      window.location.search.includes('code=');
    const isRecovery = window.location.hash.includes('type=recovery');

    const isStaffSession = (s) => s?.user?.role && s.user.role !== 'APPLICANT';

    (async () => {
      const [{ supabase }, { api }] = await Promise.all([
        import('./lib/supabaseClient'),
        import('./services/api'),
      ]);
      if (cancelled) return;

      try {
        const current = await api.getCurrentUserSession();
        if (cancelled) return;
        setSession(current);
        if (current && isOAuthReturn && !isRecovery) {
          setActivePage(isStaffSession(current) ? 'admin-portal' : 'candidate-portal');
          showToast(`Welcome, ${current.user.fullName || current.user.email}!`);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch {
        setSession(null);
      }

      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setResetPasswordOpen(true);
        } else if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          const resolved = await api.getCurrentUserSession();
          setSession(resolved);
          if (resolved) {
            showToast(`Welcome, ${resolved.user.fullName || resolved.user.email}!`);
            if (isOAuthReturn && !window.location.hash.includes('type=recovery')) {
              setActivePage(isStaffSession(resolved) ? 'admin-portal' : 'candidate-portal');
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setActivePage('home');
        }
      });
      subscription = data.subscription;
    })();

    return () => {
      cancelled = true;
      subscription?.unsubscribe();
    };
  }, [showToast]);

  const handleSignOut = async () => {
    const { api } = await import('./services/api');
    await api.logout();
    setSession(null);
    setActivePage('home');
    showToast('Signed out successfully.');
  };

  const handleNavigate = (page) => {
    setCustomThemeColor('');
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loaded) return undefined;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 600));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const id = idle(() => {
      import('./components/pages/DomainsPage');
      import('./components/pages/ProjectsPage');
      import('./components/pages/TeamPage');
    });
    return () => cancel(id);
  }, [loaded]);

  const scrollLocked = !loaded || applyOpen || loginModalOpen || terminalOpen || resetPasswordOpen || notice !== null;

  useEffect(() => {
    if (!IS_TOUCH) return undefined;
    document.documentElement.classList.toggle('scroll-locked', scrollLocked);
    return () => document.documentElement.classList.remove('scroll-locked');
  }, [scrollLocked]);

  useEffect(() => {
    if (IS_TOUCH) return undefined;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);

    function updateTicker(time) {
      lenis.raf(time * 1000);
    }

    gsap.ticker.add(updateTicker);
    gsap.ticker.lagSmoothing(0);

    if (scrollLocked) {
      lenis.stop();
    } else {
      lenis.start();
    }

    return () => {
      gsap.ticker.remove(updateTicker);
      lenis.destroy();
    };
  }, [scrollLocked]);

  const activeThemeColor = customThemeColor || THEME_COLORS[activePage] || '#00F5D4';
  const isStaff = session?.user?.role && session.user.role !== 'APPLICANT';

  return (
    <>
      <Cursor />

      {loaderVisible && (
        <LoadingSequence
          sceneReady={sceneReady}
          onComplete={handleLoaded}
          onExited={handleLoaderExited}
        />
      )}

      {toastMessage && (
        <div className="fixed top-20 right-6 z-[9999] px-4 py-3 rounded-2xl bg-black/90 border border-accent/40 text-white font-mono text-xs shadow-2xl flex items-center gap-3 animate-fade-in backdrop-blur-xl">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        session={session}
        onSignOut={handleSignOut}
        onOpenApply={openApply}
        onOpenLogin={openLogin}
        onOpenTerminal={openTerminal}
      />

      <Suspense fallback={null}>
        {sceneMounted && <Scene themeColor={activeThemeColor} onReady={handleSceneReady} />}
      </Suspense>

      <main className="relative z-10">
        <Suspense fallback={null}>
          <div key={activePage} className="animate-page-in">
            {activePage === 'home' && (
              <HomePage
                loaded={loaded}
                onNavigate={handleNavigate}
                onOpenApply={openApply}
                onShowProgress={showProgress}
              />
            )}

            {activePage === 'domains' && (
              <DomainsPage
                onOpenApply={openApply}
                onShowProgress={showProgress}
                onSetThemeColor={setCustomThemeColor}
              />
            )}

            {activePage === 'projects' && (
              <ProjectsPage onOpenApply={openApply} onShowProgress={showProgress} />
            )}

            {activePage === 'team' && <TeamPage onOpenApply={openApply} />}

            {activePage === 'candidate-portal' && session && (
              <ApplicantPortalPage
                session={session}
                onOpenApply={openApply}
                onSignOut={handleSignOut}
              />
            )}

            {activePage === 'admin-portal' && isStaff && (
              <AdminPortalPage session={session} onSignOut={handleSignOut} />
            )}

            {activePage === 'admin-portal' && !isStaff && (
              <div className="relative z-10 min-h-screen pt-40 pb-24 px-8 font-sans text-center">
                <div className="max-w-md mx-auto p-8 rounded-3xl bg-black/80 border border-red-500/30 backdrop-blur-2xl space-y-4">
                  <span className="text-4xl block">🔒</span>
                  <h2 className="text-xl font-display font-bold text-white">Access Denied</h2>
                  <p className="text-sm text-gray-400">Your account does not have administrative privileges. Contact a Super Administrator to request staff access.</p>
                  <button
                    onClick={() => handleNavigate(session ? 'candidate-portal' : 'home')}
                    className="px-6 py-3 rounded-xl bg-accent text-black font-mono text-xs font-bold hover:bg-white transition-colors"
                  >
                    {session ? 'Go to My Portal' : 'Return Home'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </Suspense>
      </main>

      <Footer />

      <DesktopModeNotice active={loaded} />
      {SHOW_DEBUG && <DebugPanel />}

      <ConstructionModal
        isOpen={notice !== null}
        feature={notice?.feature}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />

      <Suspense fallback={null}>
        {terminalOpen && (
          <TerminalPortal
            isOpen={terminalOpen}
            onClose={() => setTerminalOpen(false)}
            onOpenApply={openApply}
            onOpenAdmin={() => handleNavigate('admin-portal')}
            session={session}
            portalsEnabled={PORTALS_ENABLED}
          />
        )}

        {PORTALS_ENABLED && (
          <>
            <RecruitmentPortal isOpen={applyOpen} onClose={() => setApplyOpen(false)} />
            <UnifiedPortal
              isOpen={loginModalOpen}
              onClose={() => setLoginModalOpen(false)}
              onOpenApply={openApply}
            />
            <ResetPasswordModal
              isOpen={resetPasswordOpen}
              onClose={() => setResetPasswordOpen(false)}
              onSuccess={() => showToast('Password reset successfully! Please sign in with your new password.')}
            />
          </>
        )}
      </Suspense>
    </>
  );
}
