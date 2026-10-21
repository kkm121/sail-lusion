import { useState } from 'react';
import { projects } from '../data/projects';

const FILTERS = ['All', 'Technical', 'Research', 'Creatives'];

export default function ProjectsSection() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedProject, setSelectedProject] = useState(null);

  const filteredProjects = projects.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Technical') return p.domain === 'technical';
    if (activeFilter === 'Research') return p.domain === 'research-development';
    if (activeFilter === 'Creatives') return p.domain === 'creatives';
    return true;
  });

  return (
    <section id="projects" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">04 // SYSTEMS & PORTFOLIO</span>
          <h2 className="v4-section-title">
            Built on silicon. Proven on test benches.
          </h2>
          <p className="v4-section-desc">
            Explore our open portfolio of robotic locomotion policies, event-vision pipelines,
            distributed agent consensus fabrics, and web systems engineered by student members.
          </p>

          <div className="v4-project-filters mono">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={`v4-project-filter ${activeFilter === f ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f} {f === 'All' ? `(${projects.length})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="v4-projects-grid">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="v4-project-card"
              onClick={() => setSelectedProject(p)}
              style={{ cursor: 'pointer' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                    {p.domainName || p.domain}
                  </span>
                  <span className="v4-project-status mono">{p.status}</span>
                </div>
                <h4>{p.name}</h4>
                <p>{p.blurb}</p>
              </div>

              <div>
                <div className="mono" style={{ fontSize: '12px', color: 'var(--ember)', marginBottom: '12px', fontWeight: 600 }}>
                  ⚡ {p.metric}
                </div>
                <div className="v4-project-stack mono">
                  {p.stack?.slice(0, 4).map((tech) => (
                    <span key={tech} className="v4-tech-tag">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Project Detail Modal */}
        {selectedProject && (
          <div className="v4-modal-backdrop" onClick={() => setSelectedProject(null)}>
            <div className="v4-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="v4-modal-header">
                <div>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--accent)' }}>
                    {selectedProject.domainName} // {selectedProject.status}
                  </span>
                  <h3 style={{ margin: '6px 0 0', fontSize: '20px' }}>{selectedProject.name}</h3>
                </div>
                <button
                  type="button"
                  className="v4-modal-close mono"
                  onClick={() => setSelectedProject(null)}
                >
                  ✕
                </button>
              </div>

              <div className="v4-modal-body">
                <p style={{ color: 'var(--text-sub)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
                  {Array.isArray(selectedProject.desc) ? selectedProject.desc.join(' ') : selectedProject.blurb}
                </p>

                <div className="mono" style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  HARDWARE & SOFTWARE SPECIFICATIONS:
                </div>
                <div className="v4-project-stack mono" style={{ marginBottom: '20px' }}>
                  {selectedProject.stack?.map((tech) => (
                    <span key={tech} className="v4-tech-tag">{tech}</span>
                  ))}
                </div>

                <div className="mono" style={{ fontSize: '12px', color: 'var(--ember)', marginBottom: '20px' }}>
                  PERFORMANCE BENCHMARK: <strong>{selectedProject.metric}</strong>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <a
                    href="https://github.com/kkm121/sail-lusion"
                    target="_blank"
                    rel="noreferrer"
                    className="v4-btn-primary mono"
                    style={{ fontSize: '13px', padding: '8px 16px', textDecoration: 'none' }}
                  >
                    Inspect Repository →
                  </a>
                  <button
                    type="button"
                    className="v4-btn-secondary mono"
                    style={{ fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => setSelectedProject(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
