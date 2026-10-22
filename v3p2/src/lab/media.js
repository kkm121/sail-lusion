// Paths for the voyage's assets (served from /public).
const b = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const asset = (p) => (p ? (p.startsWith('/') && b && !p.startsWith(b + '/') ? `${b}${p}` : p) : null);
export const MEDIA = { navigator: asset('/models/navigator.glb') };
export const HAVE = { navigator: true };
