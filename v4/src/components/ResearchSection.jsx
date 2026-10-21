const PAPERS = [
  {
    id: 'paper-1',
    title: 'Neuromorphic Event-Vision Tracking with Microsecond Temporal Resolution',
    venue: 'IEEE Transactions on Instrumentation & Measurement (Under Review)',
    code: 'arXiv:2603.11042',
    year: '2026',
    authors: 'Technical & R&D Team, FireFly SRMIST',
    domain: 'Research & Advanced Computing',
    abstract: 'A spiking neural network tracking pipeline consuming continuous asynchronous neuromorphic sensor streams with sub-millisecond latency on embedded FPGA platforms.',
    tags: ['Neuromorphic', 'Spiking Neural Nets', 'Event Vision', 'FPGA']
  },
  {
    id: 'paper-2',
    title: 'Synapse: Low-Latency Distributed Agent Consensus for Heterogeneous Multi-Robot Swarms',
    venue: 'Autonomous Cybernetics & Robotics Symposium',
    code: 'Preprint v1.4',
    year: '2025',
    authors: 'Robotics & Distributed Systems Core, FireFly SRMIST',
    domain: 'Technical Core',
    abstract: 'Decentralized gossip consensus protocol achieving <4ms state synchronization across 64 edge robotics nodes over lossy 802.11s ad-hoc mesh networks.',
    tags: ['Multi-Agent', 'Distributed Systems', 'ROS2', 'Mesh Networks']
  },
  {
    id: 'paper-3',
    title: 'Quantum State Tensor Decomposition via Matrix Product States on Classical GPU Clusters',
    venue: 'Frontiers in Quantum Information Science',
    code: 'arXiv:2603.04892',
    year: '2025',
    authors: 'Quantum R&D Division, FireFly SRMIST',
    domain: 'Research & Advanced Computing',
    abstract: 'Efficient variational matrix product state approximation algorithm accelerating 50-qubit circuit simulation by 14.8x compared to full state vector benchmarks.',
    tags: ['Quantum Computing', 'MPS', 'JAX', 'CUDA']
  },
  {
    id: 'paper-4',
    title: 'Bio-Signal Decoding for Low-Cost Myoelectric Prosthetic Control Using TinyML',
    venue: 'Biomedical Cybernetics Workshop',
    code: 'Open Hardware · MIT',
    year: '2025',
    authors: 'Bio-Robotics Sub-Group, FireFly SRMIST',
    domain: 'Technical Core',
    abstract: 'Quantized 8-bit convolutional model running on STM32 microcontrollers for real-time 8-gesture surface EMG intent recognition with 98.4% accuracy.',
    tags: ['TinyML', 'EMG', 'Prosthetics', 'Embedded AI']
  }
];

export default function ResearchSection() {
  return (
    <section id="research" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">06 // RESEARCH & PUBLICATIONS</span>
          <h2 className="v4-section-title">
            Peer-reviewed science from undergraduate minds.
          </h2>
          <p className="v4-section-desc">
            FireFly conducts rigorous, reproducible research in neuromorphic vision, multi-agent systems,
            and quantum state simulations. Every paper ships with open datasets and verifiable code.
          </p>
        </div>

        <div className="v4-research-grid">
          {PAPERS.map((paper) => (
            <div key={paper.id} className="v4-paper-card">
              <div className="v4-paper-meta mono">
                <span className="v4-tag">{paper.code}</span>
                <span style={{ color: 'var(--accent)' }}>{paper.year}</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span style={{ color: 'var(--text-muted)' }}>{paper.domain}</span>
              </div>

              <h3 className="v4-paper-title">{paper.title}</h3>
              <div className="v4-paper-authors mono">{paper.authors}</div>
              <p className="v4-paper-abstract">{paper.abstract}</p>

              <div className="v4-paper-tags mono">
                {paper.tags.map(t => (
                  <span key={t} className="v4-paper-tag">#{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
