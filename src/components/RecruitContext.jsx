import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import RecruitModal from './RecruitModal';
import Terminal from './Terminal';

const Ctx = createContext({ building: () => {}, openTerminal: () => {} });

export const MESSAGES = {
  Recruitment: 'Applications will open here soon. Follow SAIL to hear the moment they go live.',
  'Sign in': 'Accounts and sign-in will open here soon. Follow SAIL to hear the moment they go live.',
  'Sign up': 'Sign-up will open together with recruitment. Follow SAIL to hear the moment it goes live.',
};

export const useBuilding = () => useContext(Ctx).building;
export const useTerminal = () => useContext(Ctx).openTerminal;
export const useRecruit = () => {
  const building = useBuilding();
  return useCallback(() => building('Recruitment'), [building]);
};

export function RecruitProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const [terminal, setTerminal] = useState(false);
  const building = useCallback((feature, message) => setNotice({ feature, message: message || MESSAGES[feature] }), []);
  const openTerminal = useCallback(() => setTerminal(true), []);
  const value = useMemo(() => ({ building, openTerminal }), [building, openTerminal]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setTerminal((t) => !t);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Ctx.Provider value={value}>
      {children}
      <RecruitModal notice={notice} onClose={() => setNotice(null)} />
      <Terminal open={terminal} onClose={() => setTerminal(false)} building={building} />
    </Ctx.Provider>
  );
}
