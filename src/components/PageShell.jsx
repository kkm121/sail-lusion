import Ambient from './Ambient';
import GLStage from './GLStage';
import Header from './Header';
import { End, Footer } from './Sections';
import '../styles/pages.css';

export default function PageShell({ back, next, accent, children }) {
  const style = accent ? { '--accent': accent } : undefined;
  return (
    <main className="sail sl-sub" style={style}>
      <Ambient />
      <GLStage />
      <Header back={back} />
      {children}
      <End />
      <Footer next={next} />
    </main>
  );
}
