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

export const MEDIA = {
  crew: { src: '/media/crew.jpg', fallback: '/media/crew.jpg' },
  build: { src: '/media/build.jpg', fallback: '/media/build.jpg' },
  reel: { desktop: '/media/reel.mp4', mobile: '/media/reel-mobile.mp4', fallbackDesktop: '/video/reel-desktop.mp4', fallbackMobile: '/video/reel-mobile.mp4', poster: '/media/lab-screen.jpg' },
  lab: { src: '/media/lab-screen.jpg', fallback: '/media/build.jpg' },
  navigator: '/models/navigator.glb',
};

export const projectMedia = (p) => (HAVE.projects.has(p.id) ? `/media/projects/${p.id}.jpg` : null);
