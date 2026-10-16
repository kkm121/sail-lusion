// Projects, achievements and numbers on this site are sample content that shows the design.
// These labels say so plainly wherever that content appears.
export function MockBadge({ className = '' }) {
  return (
    <span className={`sl-mock ${className}`.trim()} title="Sample content that shows the design, not a real project yet">
      Mockup
    </span>
  );
}

export function MockNote({ children }) {
  return (
    <div className="sl-mock-note" role="note">
      <MockBadge />
      <p>{children}</p>
    </div>
  );
}
