import { useEffect } from 'react';
import { setReady } from '../lib/ready';
import Header from './Header';
import { End, Footer } from './Sections';
import '../styles/pages.css';
import '../styles/about.css';
import '../styles/sub.css';

// Shell of every inner page: dark backdrop, header, closing call to action and footer. Each page draws its own hero backdrop.
export default function PageShell({ back, next, accent, className = '', children }) {
  const style = accent ? { '--accent': accent } : undefined;
  useEffect(() => setReady(), []);
  return (
    <main className={`sail sl-sub is-bare ${className}`.trim()} style={style}>
      <Header back={back} />
      {children}
      <End />
      <Footer next={next} />
    </main>
  );
}
