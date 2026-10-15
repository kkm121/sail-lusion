import { teamNames } from './team';

const THEMES = {
  technical: { color: '#00F5D4', bg: '#04262a', text: '#d6fff7', hover: '#00F5D4', hoverText: '#02130f', art: 'robotics' },
  research: { color: '#8B5CF6', bg: '#1a1040', text: '#ece6ff', hover: '#8B5CF6', hoverText: '#ffffff', art: 'data' },
  corporate: { color: '#10B981', bg: '#052b20', text: '#d9fff0', hover: '#10B981', hoverText: '#02130f', art: 'web' },
  creatives: { color: '#EC4899', bg: '#2e0b20', text: '#ffe3f1', hover: '#EC4899', hoverText: '#ffffff', art: 'nlp' },
  operations: { color: '#3B82F6', bg: '#0a1a38', text: '#dcebff', hover: '#3B82F6', hoverText: '#ffffff', art: 'edge' },
};

export const domains = [
  {
    id: 'technical',
    code: '01',
    name: 'Technical Core & Architecture',
    shortName: 'Technical Core',
    tagline: 'Embodied Robotics, Distributed Swarms & GPU Acceleration',
    description:
      'The engineering backbone of FireFly. We architect real-time robotic locomotion engines, high-throughput message brokers, neuromorphic hardware pipelines, and 60fps WebGL spatial simulations.',
    team: 'technical',
    teamNote: 'The Technical Team, which also carries the R&D domain.',
    technologies: ['ROS2 Humble', 'PyTorch 2.3', 'Next.js 15', 'CUDA C++', 'Rust', 'Three.js / WebGL2', 'PostgreSQL', 'Docker'],
    labSpecs: {
      'Compute node': '4x NVIDIA RTX 4090 Cluster (CUDA Parallel Engine)',
      'Test bench': 'Custom Carbon-Fiber Hexapod / Quadruped Rig',
      Firmware: 'Embedded STM32H7 Real-Time FreeRTOS',
    },
    achievements: [
      { id: 'project-chiron', name: 'Project Chiron', title: 'Project Chiron: Quadrupedal Locomotion', desc: 'Reinforcement learning neural policy for dynamic terrain navigation on 12-DOF physical quadruped robotics.', status: 'Hardware Bench v2.4', metric: '4.2ms Inference' },
      { id: 'synapse-core', name: 'Synapse Core', title: 'Synapse Core: Distributed Agent Consensus', desc: 'Sub-millisecond distributed message broker for autonomous agent swarms and multi-robot collaboration.', status: 'Production Alpha', metric: '64 Concurrent Nodes' },
    ],
    ...THEMES.technical,
  },
  {
    id: 'research-development',
    code: '02',
    name: 'Research & Advanced Computing',
    shortName: 'R&D',
    tagline: 'Neuromorphic Silicon, Quantum Information & ML Publications',
    description:
      'Frontier computing laboratory exploring bio-inspired silicon event vision, quantum tensor contraction algorithms, and peer-reviewed deep learning architectures targeting IEEE, CVPR, and NeurIPS conferences.',
    team: 'technical',
    teamNote: 'R&D works inside the Technical Team, so the same three members carry both domains.',
    technologies: ['TensorFlow Quantum', 'SpikingJelly', 'Qiskit', 'JAX / Flax', 'LaTeX', 'Intel Loihi 2 SDK'],
    labSpecs: {
      'Compute node': 'JAX High-Memory Tensor Server (A100 SXM4 80GB)',
      'Test bench': 'Prophesee Metavision Event Camera Sensor Bench',
      Firmware: 'Custom FPGA Spiking Neural Accelerator',
    },
    achievements: [
      { id: 'neuromorphic-event-vision', name: 'Neuromorphic Event Vision', title: 'Neuromorphic Event-Vision Tracking', desc: 'Microsecond latency vision pipeline processing event-camera bio-inspired silicon sensor streams.', status: 'IEEE TIM Under Review', metric: '10,000 FPS Equiv' },
      { id: 'quantum-tensor-decomposition', name: 'Quantum Tensor Decomposition', title: 'Quantum State Tensor Decomposition', desc: 'Matrix product state approximation for multi-qubit entanglement simulation on classical GPUs.', status: 'arXiv:2603.04892', metric: '14.8x Speedup' },
    ],
    ...THEMES.research,
  },
  {
    id: 'corporate-relations',
    code: '03',
    name: 'Corporate Partnerships & Conclaves',
    shortName: 'Corporate & Ops',
    tagline: 'Global Hackathons, Venture Capital & Conclave Operations',
    description:
      'Corporate & Events orchestrates international technical conclaves, venture capital demo days, corporate sponsorship pipelines, and industry collaborations with top-tier technology giants.',
    team: 'corporate',
    teamNote: 'The Corporate Team.',
    technologies: ['Notion Enterprise', 'HubSpot CRM', 'Stripe Payments', 'Eventbrite API', 'Pitch Intelligence'],
    labSpecs: {
      Reach: '40,000+ Active Student Developer Network',
      Sponsors: 'NVIDIA, Google Cloud, Intel, Microsoft Founders Hub',
      'Grant vault': '$50,000+ Annual Project Funding',
    },
    achievements: [
      { id: 'autonomous-summit-2026', name: 'FireFly Autonomous Summit 2026', title: 'FireFly Autonomous Summit 2026', desc: '3-Day National AI & Robotics Conclave featuring 50+ industry speakers, 2000+ delegates, and $25,000 in hackathon grants.', status: 'Registration Active', metric: '2,000+ Delegates' },
      { id: 'industry-immersion-fellowship', name: 'Industry Immersion Fellowship', title: 'Industry Immersion Fellowship', desc: 'Direct pipeline connecting FireFly researchers with paid research internships at premier Silicon Valley & Indian AI teams.', status: 'Cohort 3 Active', metric: '100% Placement' },
    ],
    ...THEMES.corporate,
  },
  {
    id: 'creatives',
    code: '04',
    name: 'Creatives & Spatial Experience',
    shortName: 'Spatial Design',
    tagline: '3D Generative Motion, Neural Shaders & Spatial Audio',
    description:
      'Pioneering modern digital spatial aesthetics: award-winning WebGL micro-interactions, custom volumetric shaders, luxury typography systems, and binaural spatial soundscapes.',
    team: 'creatives',
    teamNote: 'The Creatives team.',
    technologies: ['Blender 4.2', 'Three.js / WebGL', 'Figma Tokens', 'Cinema 4D', 'Ableton Live 12', 'TouchDesigner'],
    labSpecs: {
      'Design system': 'Obsidian Crystalline Design Tokens (v3.0)',
      'Sound stage': '24-bit 96kHz Lossless Spatial Audio Suite',
      Rendering: 'Real-time GLSL Raymarching & Refractive Caustics',
    },
    achievements: [
      { id: 'spatial-web-world', name: 'FireFly Spatial Web World', title: 'FireFly Spatial Web World', desc: 'Awwwards Site-of-the-Day caliber interactive WebGL 3D crystal core and dynamic fluid kinematics.', status: 'Live Production', metric: '60 FPS @ 4K' },
      { id: 'binaural-haptic-audio', name: 'Binaural Haptic Audio Engine', title: 'Binaural Haptic Audio Engine', desc: 'Procedural Web Audio API synthesizer generating responsive cyber soundscapes mapped to cursor velocity.', status: 'V1.0 Deployed', metric: '24-bit Lossless' },
    ],
    ...THEMES.creatives,
  },
  {
    id: 'operations-media',
    code: '05',
    name: 'Operations & Technical Journalism',
    shortName: 'Operations & Media',
    tagline: 'Technical Publications, Documentation & Logistics Rigor',
    description:
      'Documents every breakthrough, publishes technical newsletters, curates rigorous engineering whitepapers, and leads symposium logistics across SRMIST and global engineering communities.',
    team: 'report',
    teamNote: 'The Report Team.',
    technologies: ['Markdown / MDX', 'LaTeX / KaTeX', 'Ghost CMS', 'Overleaf Enterprise', 'Zotero'],
    labSpecs: {
      Readership: '15,000+ Monthly Technical Readers',
      Publications: '12+ ArXiv & IEEE Whitepapers Published',
      Standards: 'IEEE 830 / ISO Software Documentation Rigor',
    },
    achievements: [
      { id: 'technical-review', name: 'The FireFly Technical Review', title: 'The FireFly Technical Review (Quarterly)', desc: 'Comprehensive 60-page peer-reviewed engineering journal covering cutting-edge robotics and neuromorphic AI.', status: 'Issue 04 in Print', metric: '15,000+ Readers' },
      { id: 'engineering-handbook', name: 'FireFly Engineering Handbook', title: 'Open Source FireFly Engineering Handbook', desc: 'Standard operating procedures, code standards, hardware schematics, and machine learning tutorials for fellows.', status: 'Public GitBook', metric: 'ISO Rigor' },
    ],
    ...THEMES.operations,
  },
].map((d) => ({ ...d, members: teamNames(d.team) }));

export const domainById = (id) => domains.find((d) => d.id === id);
