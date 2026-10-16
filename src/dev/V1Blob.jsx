import { Scene } from './v1/Scene';

// Developer-only: the blob scene from the first deployment, unchanged, for side-by-side comparison.
// /__v1?c=E11D48 picks the theme colour.
export default function V1Blob() {
  const c = new URLSearchParams(window.location.search).get('c') || '00F5D4';
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#030407' }}>
      <Scene themeColor={`#${c}`} />
    </div>
  );
}
