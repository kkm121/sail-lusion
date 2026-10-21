import { useState } from 'react';
import { STEPS, WANT, FAQ } from '../data/club';

export default function AdmissionsSection({ onOpenCli }) {
  const [openFaq, setOpenFaq] = useState(0); // 0 is initially open

  const toggleFaq = (idx) => {
    setOpenFaq(cur => cur === idx ? -1 : idx);
  };

  return (
    <section id="admissions" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">08 // RECRUITMENT & ADMISSIONS</span>
          <h2 className="v4-section-title">
            Build the next frontier with us.
          </h2>
          <p className="v4-section-desc">
            Recruitment at FireFly is open to every student across SRMIST. We value curiosity, consistency,
            and the drive to finish real projects over existing resumes or test scores.
          </p>
        </div>

        {/* 3 Step Roadmap */}
        <div className="v4-steps-grid">
          {STEPS.map((s) => (
            <div key={s.n} className="v4-step-card">
              <span className="v4-step-num mono">{s.n}</span>
              <h3 className="v4-step-title">{s.title}</h3>
              <p className="v4-step-text">{s.text}</p>
            </div>
          ))}
        </div>

        {/* Who We Want & Requirements */}
        <div className="v4-admissions-criteria-grid" style={{ marginTop: '36px' }}>
          <div className="v4-criteria-card">
            <h3 className="v4-criteria-title">Who we look for</h3>
            <ul className="v4-criteria-list">
              {WANT.map((w, idx) => (
                <li key={idx}>
                  <span className="v4-check-bullet mono">✓</span>
                  <span>{w}</span>
                </li>
              ))}
            </ul>

            <div className="v4-admissions-cta-box" style={{ marginTop: '24px' }}>
              <div className="mono" style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                COHORT 2026 // ADMISSIONS PORTAL
              </div>
              <button
                type="button"
                className="v4-btn-primary"
                onClick={onOpenCli}
              >
                <span>Launch Application in Terminal</span>
                <span>⌘K</span>
              </button>
            </div>
          </div>

          {/* Interactive FAQ Accordion */}
          <div className="v4-faq-container">
            <h3 className="v4-criteria-title" style={{ marginBottom: '16px' }}>Frequently Asked Questions</h3>
            <div className="v4-faq-list">
              {FAQ.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q} className={`v4-faq-item ${isOpen ? 'is-open' : ''}`}>
                    <button
                      type="button"
                      className="v4-faq-question"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="v4-faq-icon mono">{isOpen ? '−' : '+'}</span>
                    </button>
                    <div className="v4-faq-answer">
                      <p>{item.a}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
