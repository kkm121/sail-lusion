import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Domains from './pages/Domains';
import Events from './pages/Events';
import { ProjectDetail, Projects } from './pages/Projects';
import Team from './pages/Team';
import Partners from './pages/Partners';
import Join from './pages/Join';
import { SignIn, SignUp } from './pages/Auth';
import Cli from './pages/Cli';

function NotFound() {
  return (
    <section className="section nf">
      <div className="wrap" style={{ display: 'grid', gap: 20, justifyItems: 'center' }}>
        <span className="eyebrow">Error 404</span>
        <h1 className="display">Lost in the dark.</h1>
        <Link className="btn btn-ink" to="/">
          Back to FireFly
        </Link>
      </div>
    </section>
  );
}

export default function App() {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return (
    <BrowserRouter basename={base || undefined}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="domains" element={<Domains />} />
          <Route path="events" element={<Events />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="team" element={<Team />} />
          <Route path="partners" element={<Partners />} />
          <Route path="join" element={<Join />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="cli" element={<Cli />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
