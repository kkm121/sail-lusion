import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Lab, { labTier } from '../lab/Lab';

// Discover: v2's voyage, on its own page.
// The new voyage is for desktop computers. Phones, tablets and lighter machines get the earlier, lighter voyage, which
// lives on with the previous edition of the site at /v4/.
const isDesktop = () => /[?&]full/.test(location.search) || (labTier() === 'full' && !matchMedia('(hover: none), (pointer: coarse)').matches);

export default function Discover() {
  const [desktop] = useState(isDesktop);
  useEffect(() => {
    if (!desktop) location.replace('/v4/discover');
  }, [desktop]);
  if (!desktop) return null;
  return (
    <div className="v4">
      <Lab />
      <p className="lusion-credit">
        The voyage's corridor, crystal tunnel, blue room and glass are by{' '}
        <a href="https://lusion.co" target="_blank" rel="noreferrer">
          Lusion.co
        </a>
        , used with their kind permission.
      </p>
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
