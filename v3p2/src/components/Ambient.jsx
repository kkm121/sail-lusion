// A very quiet living background for the light pages: three soft colour washes that drift slowly.
// Pure CSS (a transform animation on the compositor): no JavaScript, no WebGL context, almost no memory.
export default function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}
