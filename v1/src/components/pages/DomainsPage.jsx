import React, { useState } from 'react';
import { CREATOR, teamNames } from '../../data/team';

const domainDetails = [
  {
    id: 'TECHNICAL',
    code: '01',
    name: 'Technical Core & Architecture',
    shortName: 'Technical Core',
    tagline: 'Embodied Robotics, Distributed Swarms & GPU Acceleration',
    color: '#00F5D4',
    icon: '⚡',
    description: 'The engineering backbone of FireFly. We architect real-time robotic locomotion engines, high-throughput message brokers, neuromorphic hardware pipelines, and 60fps WebGL spatial simulations.',
    leads: teamNames('technical'),
    technologies: ['ROS2 Humble', 'PyTorch 2.3', 'Next.js 15', 'CUDA C++', 'Rust', 'Three.js / WebGL2', 'PostgreSQL', 'Docker'],
    activeProjects: [
      {
        title: 'Project Chiron — Quadrupedal Locomotion',
        desc: 'Reinforcement learning neural policy for dynamic terrain navigation on 12-DOF physical quadruped robotics.',
        status: 'Hardware Bench v2.4',
        metric: '4.2ms Inference'
      },
      {
        title: 'Synapse Core — Distributed Agent Consensus',
        desc: 'Sub-millisecond distributed message broker for autonomous agent swarms and multi-robot collaboration.',
        status: 'Production Alpha',
        metric: '64 Concurrent Nodes'
      }
    ],
    labSpecs: {
      computeNode: '4x NVIDIA RTX 4090 Cluster (CUDA Parallel Engine)',
      testBench: 'Custom Carbon-Fiber Hexapod / Quadruped Rig',
      firmware: 'Embedded STM32H7 Real-Time FreeRTOS'
    }
  },
  {
    id: 'RESEARCH_AND_DEVELOPMENT',
    code: '02',
    name: 'Research & Advanced Computing',
    shortName: 'R&D Lab',
    tagline: 'Neuromorphic Silicon, Quantum Information & ML Publications',
    color: '#8B5CF6',
    icon: '🔮',
    description: 'Frontier computing laboratory exploring bio-inspired silicon event vision, quantum tensor contraction algorithms, and peer-reviewed deep learning architectures targeting IEEE, CVPR, and NeurIPS conferences.',
    leads: teamNames('technical'),
    technologies: ['TensorFlow Quantum', 'SpikingJelly', 'Qiskit', 'JAX / Flax', 'LaTeX', 'Intel Loihi 2 SDK'],
    activeProjects: [
      {
        title: 'Neuromorphic Event-Vision Tracking',
        desc: 'Microsecond latency vision pipeline processing event-camera bio-inspired silicon sensor streams.',
        status: 'IEEE TIM Under Review',
        metric: '10,000 FPS Equiv'
      },
      {
        title: 'Quantum State Tensor Decomposition',
        desc: 'Matrix product state approximation for multi-qubit entanglement simulation on classical GPUs.',
        status: 'arXiv:2603.04892',
        metric: '14.8x Speedup'
      }
    ],
    labSpecs: {
      computeNode: 'JAX High-Memory Tensor Server (A100 SXM4 80GB)',
      testBench: 'Prophesee Metavision Event Camera Sensor Bench',
      firmware: 'Custom FPGA Spiking Neural Accelerator'
    }
  },
  {
    id: 'CORPORATE_RELATIONS',
    code: '03',
    name: 'Corporate Partnerships & Conclaves',
    shortName: 'Corporate & Ops',
    tagline: 'Global Hackathons, Venture Capital & Conclave Operations',
    color: '#10B981',
    icon: '🌐',
    description: 'Corporate & Events orchestrates international technical conclaves, venture capital demo days, corporate sponsorship pipelines, and industry collaborations with top-tier technology giants.',
    leads: teamNames('corporate'),
    technologies: ['Notion Enterprise', 'HubSpot CRM', 'Stripe Payments', 'Eventbrite API', 'Pitch Intelligence'],
    activeProjects: [
      {
        title: 'FireFly Autonomous Summit 2026',
        desc: '3-Day National AI & Robotics Conclave featuring 50+ industry speakers, 2000+ delegates, and $25,000 in hackathon grants.',
        status: 'Registration Active',
        metric: '2,000+ Delegates'
      },
      {
        title: 'Industry Immersion Fellowship',
        desc: 'Direct pipeline connecting FireFly researchers with paid research internships at premier Silicon Valley & Indian AI labs.',
        status: 'Cohort 3 Active',
        metric: '100% Placement'
      }
    ],
    labSpecs: {
      reach: '40,000+ Active Student Developer Network',
      sponsors: 'NVIDIA, Google Cloud, Intel, Microsoft Founders Hub',
      grantVault: '$50,000+ Annual Project Funding'
    }
  },
  {
    id: 'CREATIVE',
    code: '04',
    name: 'Creatives & Spatial Experience',
    shortName: 'Spatial Design',
    tagline: '3D Generative Motion, Neural Shaders & Spatial Audio',
    color: '#EC4899',
    icon: '✨',
    description: 'Pioneering modern digital spatial aesthetics: award-winning WebGL micro-interactions, custom volumetric shaders, luxury typography systems, and binaural spatial soundscapes.',
    leads: teamNames('creatives'),
    technologies: ['Blender 4.2', 'Three.js / WebGL', 'Figma Tokens', 'Cinema 4D', 'Ableton Live 12', 'TouchDesigner'],
    activeProjects: [
      {
        title: 'FireFly Spatial Web World',
        desc: 'Awwwards Site-of-the-Day caliber interactive WebGL 3D crystal core and dynamic fluid kinematics.',
        status: 'Live Production',
        metric: '60 FPS @ 4K'
      },
      {
        title: 'Binaural Haptic Audio Engine',
        desc: 'Procedural Web Audio API synthesizer generating responsive cyber soundscapes mapped to cursor velocity.',
        status: 'V1.0 Deployed',
        metric: '24-bit Lossless'
      }
    ],
    labSpecs: {
      designSystem: 'Obsidian Crystalline Design Tokens (v3.0)',
      soundStage: '24-bit 96kHz Lossless Spatial Audio Suite',
      rendering: 'Real-time GLSL Raymarching & Refractive Caustics'
    }
  },
  {
    id: 'OPERATIONS_AND_MANAGEMENT',
    code: '05',
    name: 'Operations & Technical Journalism',
    shortName: 'Operations & Media',
    tagline: 'Technical Publications, Documentation & Logistics Rigor',
    color: '#3B82F6',
    icon: '📚',
    description: 'Documents every breakthrough, publishes technical newsletters, curates rigorous engineering whitepapers, and leads symposium logistics across SRMIST and global engineering communities.',
    leads: teamNames('report'),
    technologies: ['Markdown / MDX', 'LaTeX / KaTeX', 'Ghost CMS', 'Overleaf Enterprise', 'Zotero'],
    activeProjects: [
      {
        title: 'The FireFly Technical Review (Quarterly)',
        desc: 'Comprehensive 60-page peer-reviewed engineering journal covering cutting-edge robotics and neuromorphic AI.',
        status: 'Issue 04 in Print',
        metric: '15,000+ Readers'
      },
      {
        title: 'Open Source FireFly Engineering Handbook',
        desc: 'Standard operating procedures, code standards, hardware schematics, and machine learning tutorials for fellows.',
        status: 'Public GitBook',
        metric: 'ISO Rigor'
      }
    ],
    labSpecs: {
      readership: '15,000+ Monthly Technical Readers',
      publications: '12+ ArXiv & IEEE Whitepapers Published',
      standards: 'IEEE 830 / ISO Software Documentation Rigor'
    }
  }
];

const SPEC_MESSAGE = 'The full specification for this initiative is being written and will be published here soon.';

export function DomainsPage({ onOpenApply, onShowProgress, onSetThemeColor }) {
  const [selectedDomain, setSelectedDomain] = useState(domainDetails[0]);

  const handleSelectDomain = (domain) => {
    setSelectedDomain(domain);
    if (onSetThemeColor) {
      onSetThemeColor(domain.color);
    }
  };

  return (
    <div className="relative z-10 min-h-screen pt-32 pb-24 px-4 sm:px-8 md:px-16 lg:px-24 font-sans selection:bg-cyan-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Apple-Grade Headline Section */}
        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase text-gray-300 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.1] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>02 // Autonomous Research Laboratories</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white tracking-tight leading-[1.08]">
            Built for extreme <br />
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              engineering rigor.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans max-w-xl mx-auto">
            Five specialized research laboratories operating with dedicated compute nodes, physical hardware test benches, and elite faculty mentorship.
          </p>
        </div>

        {/* Apple-Style Segmented Floating Tab Bar */}
        <div className="flex justify-center">
          <div className="p-1.5 rounded-full bg-black/60 border border-white/[0.12] backdrop-blur-3xl flex flex-wrap justify-center gap-1 shadow-[0_10px_40px_rgba(0,0,0,0.6)] max-w-full overflow-x-auto max-md:flex-nowrap max-md:justify-start max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden">
            {domainDetails.map((d) => {
              const isSelected = selectedDomain.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDomain(d)}
                  className={`px-4 sm:px-6 py-2.5 rounded-full text-xs font-mono transition-all duration-300 flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-white text-black font-bold shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-100'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{d.icon}</span>
                  <span>{d.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Apple-Style Hero Bento Feature Container */}
        <div className="p-8 sm:p-12 md:p-14 rounded-3xl bg-gradient-to-b from-white/[0.06] via-black/80 to-black/95 backdrop-blur-3xl border border-white/[0.12] space-y-12 shadow-[0_20px_80px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Ambient Glow Arc */}
          <div 
            className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[140px] max-md:hidden pointer-events-none opacity-25 transition-all duration-700"
            style={{ backgroundColor: selectedDomain.color }}
          />

          {/* Division Header & Action */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 border-b border-white/[0.08] pb-10 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span 
                  className="text-xs font-mono font-bold px-3.5 py-1 rounded-full border shadow-sm"
                  style={{ borderColor: `${selectedDomain.color}50`, color: selectedDomain.color, backgroundColor: `${selectedDomain.color}15` }}
                >
                  DIVISION {selectedDomain.code} // {selectedDomain.id}
                </span>
                <span className="text-xs font-mono text-gray-500">SRMIST KTR Research Core</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
                {selectedDomain.name}
              </h2>
              <p className="text-sm font-mono text-gray-400">{selectedDomain.tagline}</p>
            </div>

            <button
              onClick={onOpenApply}
              className="px-8 py-3.5 rounded-full text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_30px_rgba(0,245,212,0.3)] shrink-0 self-start lg:self-auto hover:scale-105"
              style={{ backgroundColor: selectedDomain.color }}
            >
              Apply to {selectedDomain.shortName} →
            </button>
          </div>

          {/* Bento Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            
            {/* Mission & Stack Card */}
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block">
                  Mandate & Scope
                </span>
                <p className="text-base text-gray-200 font-sans leading-relaxed">
                  {selectedDomain.description}
                </p>
              </div>

              {/* Technologies Bento */}
              <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-4">
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block">
                  Production Engineering Stack
                </span>
                <div className="flex flex-wrap gap-2.5 font-mono text-xs">
                  {selectedDomain.technologies.map((tech, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hardware & Infrastructure Card */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] backdrop-blur-xl space-y-6 font-mono text-xs flex flex-col justify-between">
              <div className="space-y-6">
                <span className="text-[11px] text-gray-400 uppercase tracking-widest block border-b border-white/[0.08] pb-3">
                  Dedicated Hardware Infrastructure
                </span>

                {Object.entries(selectedDomain.labSpecs).map(([key, val], idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{key}</span>
                    <span className="text-white text-xs block font-sans font-semibold leading-snug">{val}</span>
                  </div>
                ))}
              </div>

              {selectedDomain.leads.length > 0 && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block mb-1">Division Team</span>
                  <span className="text-gray-300 text-xs font-sans">
                    {selectedDomain.leads.map((n, i) => (
                      <React.Fragment key={n}>
                        {i > 0 && ' | '}
                        {n === CREATOR ? <span className="text-gold-shine font-semibold">{n}</span> : n}
                      </React.Fragment>
                    ))}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Active Flagship Projects Bento */}
          <div className="space-y-6 relative z-10">
            <span className="text-[11px] font-mono text-gray-400 uppercase tracking-widest block">
              Active Flagship Initiatives
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedDomain.activeProjects.map((p, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => onShowProgress?.(p.title, SPEC_MESSAGE)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onShowProgress?.(p.title, SPEC_MESSAGE); }}
                  className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.2] transition-all space-y-4 group hover:bg-white/[0.04] cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-xl font-display font-bold text-white group-hover:text-cyan-400 transition-colors">
                      {p.title}
                    </h4>
                    <span className="text-[10px] font-mono px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1] text-gray-300">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">{p.desc}</p>
                  <div className="pt-2 flex items-center justify-between font-mono text-xs text-gray-500">
                    <span>Performance: <strong className="text-white font-sans">{p.metric}</strong></span>
                    <span className="text-cyan-400 group-hover:translate-x-1 transition-transform">Explore Spec →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
