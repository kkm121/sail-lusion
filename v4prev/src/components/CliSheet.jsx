import { lazy, Suspense, useCallback, useEffect, useState } from 'react';

const Terminal = lazy(() => import('./Terminal'));

// v2's console as a sheet over any page. Opened by the header's CLI button (an 'ff:cli' event); its code loads on first use.
export default function CliSheet() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('ff:cli', on);
    return () => window.removeEventListener('ff:cli', on);
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    window.__lenis?.stop();
    return () => window.__lenis?.start();
  }, [open]);
  if (!open) return null;
  return (
    <Suspense fallback={null}>
      <Terminal open onClose={close} />
    </Suspense>
  );
}
