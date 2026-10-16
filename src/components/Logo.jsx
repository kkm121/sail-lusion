// The FireFly mark: the red brush-stroke bird. 'mark' is the artwork itself; 'ember' paints the same silhouette with
// a live flame gradient through a CSS mask, so it can glow, flicker and take any colour.
export default function Logo({ variant = 'mark', className = '', title }) {
  if (variant === 'ember') return <span className={`ff-logo ff-logo--ember ${className}`.trim()} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : 'true'} />;
  return <img className={`ff-logo ${className}`.trim()} src="/brand/firefly-mark.png" alt={title || ''} aria-hidden={title ? undefined : 'true'} draggable="false" decoding="async" />;
}
