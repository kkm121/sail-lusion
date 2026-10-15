// Text whose letters roll upward one after another when the parent (.sl-roll-host) is hovered.
export default function Roll({ text, className = '' }) {
  return (
    <span className={`sl-roll ${className}`.trim()} aria-label={text}>
      <span aria-hidden="true" className="sl-roll-in">
        {[...text].map((c, i) => (
          <span className="rc" key={i} style={{ '--i': i }}>
            <span>{c === ' ' ? ' ' : c}</span>
            <span>{c === ' ' ? ' ' : c}</span>
          </span>
        ))}
      </span>
    </span>
  );
}
