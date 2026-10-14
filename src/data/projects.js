import { domains, domainById } from './domains';

const NOTE = 'Placeholder project. This page will carry the real write-up, repository and demo once the work is published.';

const base = [
  {
    id: 'vision-core',
    art: 'vision',
    domain: 'technical',
    name: 'SAIL Vision Core',
    tags: 'computer vision • python • pytorch • research',
    status: 'Under work',
    metric: 'Python · MIT',
    stack: ['Python', 'PyTorch', 'OpenCV', 'Jupyter', 'GitHub Actions'],
    blurb: 'An open toolkit for image classification, detection and segmentation, built by lab members.',
    desc: [
      'Vision Core is the lab’s starter kit for computer vision: datasets, training scripts and evaluation notebooks in one reproducible place.',
      NOTE,
    ],
    services: ['Dataset curation', 'Model training', 'Evaluation', 'Research write-ups'],
  },
  {
    id: 'language-playground',
    art: 'nlp',
    domain: 'research-development',
    name: 'Language Playground',
    tags: 'natural language • transformers • retrieval',
    status: 'Planning',
    metric: 'Python · MIT',
    stack: ['Python', 'Transformers', 'scikit-learn', 'FastAPI'],
    blurb: 'Experiments in text classification, summarisation and retrieval with modern language models.',
    desc: [
      'A shared space for the lab’s language experiments, from small classifiers to retrieval pipelines.',
      NOTE,
    ],
    services: ['Text classification', 'Summarisation', 'Retrieval', 'Prompt design'],
  },
  {
    id: 'robotics-sim',
    art: 'robotics',
    domain: 'technical',
    name: 'Robotics Sim',
    tags: 'robotics • simulation • control • embedded',
    status: 'Under work',
    metric: 'C++ · MIT',
    stack: ['ROS2', 'C++', 'Python', 'Gazebo'],
    blurb: 'Simulation, path planning and control projects for robots, from arms to rovers.',
    desc: [
      'Robotics Sim brings the lab’s control and planning work together in simulation before it ever touches hardware.',
      NOTE,
    ],
    services: ['Simulation', 'Path planning', 'Control', 'Embedded systems'],
  },
  {
    id: 'data-lab',
    art: 'data',
    domain: 'research-development',
    name: 'Data Lab',
    tags: 'data science • benchmarks • reproducible research',
    status: 'Planning',
    metric: 'Python · MIT',
    stack: ['Python', 'Pandas', 'JAX', 'DVC'],
    blurb: 'Shared datasets, benchmarks and reproducible research from across the lab.',
    desc: [
      'Data Lab keeps the lab’s datasets and benchmarks versioned, documented and easy to reuse.',
      NOTE,
    ],
    services: ['Datasets', 'Benchmarks', 'Analysis', 'Reproducibility'],
  },
  {
    id: 'sail-web',
    art: 'web',
    domain: 'creatives',
    name: 'SAIL Web',
    tags: 'web • design • webgl • development',
    status: 'Under work',
    metric: 'JavaScript · MIT',
    stack: ['React', 'Three.js', 'GSAP', 'Vite'],
    blurb: 'The lab’s own website and event pages, designed and built by the Technical and Creatives teams.',
    desc: [
      'SAIL Web is where the Technical and Creatives teams meet: a living site with interactive 3D, motion and the lab’s story.',
      NOTE,
    ],
    services: ['Design', 'Frontend', 'WebGL', 'Motion'],
  },
  {
    id: 'edge-intelligence',
    art: 'edge',
    domain: 'technical',
    name: 'Edge Intelligence',
    tags: 'edge ai • embedded • optimisation',
    status: 'Planning',
    metric: 'Python · C++',
    stack: ['TensorFlow Lite', 'ONNX', 'C++', 'STM32'],
    blurb: 'Small, fast models that run on tiny devices without the cloud.',
    desc: [
      'Edge Intelligence explores how far a small model can go on a microcontroller or phone.',
      NOTE,
    ],
    services: ['Model compression', 'On-device inference', 'Benchmarking', 'Prototyping'],
  },
];

const flagship = domains.flatMap((d, di) =>
  d.achievements.map((a, i) => ({
    id: a.id,
    art: d.art,
    artVariant: ((di + i) % 3) + 1,
    domain: d.id,
    name: a.name,
    title: a.title,
    tags: `${d.shortName.toLowerCase()} • flagship • ${a.status.toLowerCase()}`,
    status: a.status,
    metric: a.metric,
    stack: d.technologies.slice(i * 3, i * 3 + 4),
    blurb: a.desc,
    desc: [a.desc, `Part of the ${d.shortName} domain. Performance: ${a.metric}. Status: ${a.status}.`],
    services: d.technologies.slice(i * 3, i * 3 + 4),
    flagship: true,
  }))
);

export const projects = [...base, ...flagship].map((p) => {
  const d = domainById(p.domain);
  return { ...p, bg: d.bg, text: d.text, hover: d.hover, hoverText: d.hoverText, color: d.color, domainName: d.shortName };
});

export const projectById = (id) => projects.find((p) => p.id === id);
export const projectsByDomain = (id) => projects.filter((p) => p.domain === id);
export const artUrl = (p) => `/media/projects/${p.id}.jpg`;
