// The night sky behind the dark heroes: two slow ember glows and a faint star field, all CSS.
// (v3 drew this with a WebGL shader; v3p2 keeps the look with no canvas, no context and almost no memory.)
export default function Backdrop() {
  return (
    <div className="sky is-css" aria-hidden="true">
      <i className="g1" />
      <i className="g2" />
      <i className="stars" />
    </div>
  );
}
