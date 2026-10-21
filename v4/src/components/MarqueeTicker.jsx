export default function MarqueeTicker({ text, reverse = false, speed = 35 }) {
  const content = text || 'WHERE CURIOSITY IGNITES INTELLIGENCE · ENGINEERING THE AUTONOMOUS FRONTIER · 17 MINDS · INFINITE COMPUTE · SRMIST × AMIEE';

  return (
    <div className="v4-marquee-wrap" aria-hidden="true">
      <div
        className={`v4-marquee-track ${reverse ? 'is-reverse' : ''}`}
        style={{ animationDuration: `${speed}s` }}
      >
        <span className="v4-marquee-text mono">{content}</span>
        <span className="v4-marquee-text mono">{content}</span>
        <span className="v4-marquee-text mono">{content}</span>
        <span className="v4-marquee-text mono">{content}</span>
      </div>
    </div>
  );
}
