import React, { useEffect, useState } from 'react';
import { isPhoneInDesktopMode } from '../../lib/device';

const STORAGE_KEY = 'sail_desktop_notice_seen';

function alreadySeen() {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function DesktopModeNotice({ active }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active || alreadySeen() || !isPhoneInDesktopMode()) return undefined;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 15000);
    return () => clearTimeout(timer);
  }, [active]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      return;
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 z-[70] flex justify-center px-4 pointer-events-none" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)' }}>
      <div className="pointer-events-auto max-w-md w-full flex items-start gap-3 p-4 rounded-2xl bg-black/95 border border-white/[0.14] shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-fade-in">
        <span className="mt-1 w-2 h-2 rounded-full bg-accent shrink-0" />
        <p className="flex-1 text-[12px] leading-relaxed font-mono text-gray-300">
          You are viewing the desktop version on a phone. Turn off <span className="text-white">Desktop site</span> in your browser menu for the mobile layout.
        </p>
        <button onClick={dismiss} aria-label="Dismiss" className="text-gray-400 hover:text-white text-base leading-none px-1">
          ×
        </button>
      </div>
    </div>
  );
}