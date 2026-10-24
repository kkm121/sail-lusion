import { Link } from 'react-router-dom';
import Lab from '../lab/Lab';

// Discover: v2's voyage, on its own page.
export default function Discover() {
  return (
    <div className="v4">
      <Lab />
      <section className="v4-sec v4-center">
        <h2 className="v4-h">Find your domain.</h2>
        <p className="v4-cta v4-cta-c">
          <Link className="btn btn-primary v4-btn" to="/join" viewTransition>
            Join FireFly
          </Link>
          <Link className="v4-link" to="/domains" viewTransition>
            Explore the domains
          </Link>
        </p>
      </section>
    </div>
  );
}
