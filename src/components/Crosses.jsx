// A row of "+" marks, the registration crosses used across the dark pages.
export default function Crosses({ n = 5, className = '' }) {
  return (
    <div className={`sl-ab-crosses ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i}>+</span>
      ))}
    </div>
  );
}
