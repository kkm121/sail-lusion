export default function MissionBento() {
  return (
    <section id="philosophy" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">01 // PHILOSOPHY & METRICS</span>
          <h2 className="v4-section-title">
            Engineered for depth, not superficial metrics.
          </h2>
          <p className="v4-section-desc">
            We reject boilerplate tutorial repositories. FireFly is dedicated to authentic computational craft:
            bench-testing physical hardware, writing neural locomotion policies, and deploying distributed infrastructure.
          </p>
        </div>

        <div className="v4-bento-grid">
          <div className="v4-bento-card v4-col-8">
            <div>
              <span className="v4-eyebrow mono">RESEARCH & REPRODUCIBILITY</span>
              <h3>Authentic Code over Superficial Demos</h3>
              <p>
                Every project built by our members is benchmarked against real-world metrics—latency in milliseconds,
                hardware thermal envelopes, and validation loss. If it cannot run on physical silicon or handle production concurrency,
                it does not ship.
              </p>
            </div>
            <div className="v4-tag-row mono">
              <span className="v4-tag-pill">PyTorch 2.3</span>
              <span className="v4-tag-pill">ROS2 Humble</span>
              <span className="v4-tag-pill">CUDA C++</span>
              <span className="v4-tag-pill">Rust Systems</span>
              <span className="v4-tag-pill">WebGL 60FPS</span>
            </div>
          </div>

          <div className="v4-bento-card v4-col-4">
            <div>
              <span className="v4-eyebrow mono">EQUAL REPRESENTATION</span>
              <div className="v4-big-stat">
                17<span>*</span>
              </div>
              <h3>Uniform Representation</h3>
              <p>
                No titles for namesake. All 17 crew members share equal space, equal ownership, and equal technical credit.
              </p>
            </div>
          </div>

          <div className="v4-bento-card v4-col-4">
            <div>
              <span className="v4-eyebrow mono">DOMAINS</span>
              <div className="v4-big-stat">
                05<span>+</span>
              </div>
              <h3>Specialized Chapters</h3>
              <p>
                Cross-disciplinary collaboration across Vision, Reasoning, Robotics, Spatial 3D, and Distributed Systems.
              </p>
            </div>
          </div>

          <div className="v4-bento-card v4-col-8">
            <div>
              <span className="v4-eyebrow mono">INSTITUTIONAL ACCREDITATION</span>
              <h3>Associated with AMIEE · SRMIST</h3>
              <p>
                Operating with the guidance and backing of the Department of Advanced Machine Intelligence & Emerging Electronics
                at SRM Institute of Science and Technology, Kattankulathur, Chennai.
              </p>
            </div>
            <div className="v4-tag-row mono">
              <span className="v4-tag-pill">SRMIST Chennai</span>
              <span className="v4-tag-pill">AMIEE Department</span>
              <span className="v4-tag-pill">Student-Run</span>
              <span className="v4-tag-pill">Batch 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
