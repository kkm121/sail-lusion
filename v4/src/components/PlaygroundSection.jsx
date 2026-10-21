import DiscoverInteractive from './DiscoverInteractive';
import NeuralPlayground from './NeuralPlayground';

export default function PlaygroundSection() {
  return (
    <section id="playground" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">03 // INTERACTIVE LABS</span>
          <h2 className="v4-section-title">
            Test the math in real time.
          </h2>
          <p className="v4-section-desc">
            We build open tools that anyone can inspect and interact with. Explore our 2D spatial physics engine
            or test decision boundaries in our real-time neural tensor sandbox.
          </p>
        </div>

        <div className="v4-playground-grid">
          {/* Lab 01: 2D Spatial Physics */}
          <div className="v4-lab-panel">
            <div className="v4-lab-panel-header">
              <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)' }}>LAB 01 // KINEMATICS</span>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: '4px 0 0' }}>Spatial Physics Sandbox</h3>
            </div>
            <div className="v4-physics-container">
              <DiscoverInteractive />
            </div>
          </div>

          {/* Lab 02: Neural Tensor Simulator */}
          <div className="v4-lab-panel">
            <div className="v4-lab-panel-header">
              <span className="mono" style={{ fontSize: '11px', color: 'var(--ember)' }}>LAB 02 // TENSOR MANIFOLDS</span>
              <h3 style={{ fontSize: '18px', color: '#fff', margin: '4px 0 0' }}>Neural Decision Field</h3>
            </div>
            <div className="v4-neural-container">
              <NeuralPlayground />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
