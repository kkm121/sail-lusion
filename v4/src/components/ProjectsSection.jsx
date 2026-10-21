const FLAGSHIP_PROJECTS = [
  {
    id: 'chiron',
    name: 'Project Chiron',
    category: 'EMBODIED ROBOTICS',
    status: 'HARDWARE BENCH v2.4',
    metric: '4.2ms INFERENCE',
    description: 'Reinforcement learning neural policy for dynamic terrain navigation executed on custom 12-DOF physical quadruped robotics.',
    stack: ['ROS2 Humble', 'PyTorch 2.3', 'C++20', 'STM32 FreeRTOS'],
  },
  {
    id: 'synapse',
    name: 'Synapse Core',
    category: 'DISTRIBUTED SYSTEMS',
    status: 'PRODUCTION ALPHA',
    metric: '64 CONCURRENT NODES',
    description: 'Sub-millisecond distributed message broker and consensus fabric for autonomous agent swarms and multi-robot collaboration.',
    stack: ['Rust', 'Tokio Async', 'gRPC', 'ZeroMQ'],
  },
  {
    id: 'neuromorphic',
    name: 'Event Vision Pipeline',
    category: 'BIO-INSPIRED SILICON',
    status: 'RESEARCH PAPER',
    metric: '120k EVENTS / SEC',
    description: 'Microsecond optical flow reconstruction and object tracking utilizing neuromorphic event cameras and spiking neural networks.',
    stack: ['SpikingJelly', 'FPGA Verilog', 'CUDA C++', 'JAX'],
  },
];

export default function ProjectsSection() {
  return (
    <section id="projects" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">03 // FLAGSHIP INITIATIVES</span>
          <h2 className="v4-section-title">
            Built on silicon. Proven on test benches.
          </h2>
          <p className="v4-section-desc">
            A curated selection of core research systems engineered and benchmarked inside FireFly labs.
          </p>
        </div>

        <div className="v4-projects-grid">
          {FLAGSHIP_PROJECTS.map((p) => (
            <div key={p.id} className="v4-project-card">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{p.category}</span>
                  <span className="v4-project-status mono">{p.status}</span>
                </div>
                <h4>{p.name}</h4>
                <p>{p.description}</p>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '12px', color: 'var(--ember)', marginBottom: '12px', fontWeight: 600 }}>
                  ⚡ {p.metric}
                </div>
                <div className="v4-tag-row mono">
                  {p.stack.map((s) => (
                    <span key={s} className="v4-tag-pill">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
