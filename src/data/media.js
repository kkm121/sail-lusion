export const HAVE = {
  crew: true,
  build: true,
  reel: false,
  lab: true,
  navigator: true,
  projects: new Set([
    'vision-core',
    'language-playground',
    'robotics-sim',
    'data-lab',
    'sail-web',
    'edge-intelligence',
    'project-chiron',
    'synapse-core',
    'neuromorphic-event-vision',
    'quantum-tensor-decomposition',
    'autonomous-summit-2026',
    'industry-immersion-fellowship',
    'spatial-web-world',
    'binaural-haptic-audio',
    'technical-review',
    'engineering-handbook',
  ]),
};

const b = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const asset = (p) => (p ? (p.startsWith('/') && b && !p.startsWith(b + '/') ? `${b}${p}` : p) : null);

export const MEDIA = {
  crew: { src: asset('/media/crew.jpg'), fallback: asset('/media/crew.jpg') },
  build: { src: asset('/media/build.jpg'), fallback: asset('/media/build.jpg') },
  reel: { desktop: asset('/media/reel.mp4'), mobile: asset('/media/reel-mobile.mp4'), fallbackDesktop: asset('/video/reel-desktop.mp4'), fallbackMobile: asset('/video/reel-mobile.mp4'), poster: asset('/media/lab-screen.jpg') },
  lab: { src: asset('/media/lab-screen.jpg'), fallback: asset('/media/build.jpg') },
  navigator: asset('/models/navigator.glb'),
};

export const projectMedia = (p) => (HAVE.projects.has(p.id) ? asset(`/media/projects/${p.id}.jpg`) : null);
