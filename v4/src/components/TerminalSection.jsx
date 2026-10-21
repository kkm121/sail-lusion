import { useRef, useState } from 'react';
import { coreTeam } from '../data/core';
import { domains } from '../data/domains';

const BANNER = `
  _____   ___   ____    _____   _____   _     __   __
 |  ___| |_ _| |  _ \\  | ____| |  ___| | |    \\ \\ / /
 | |_     | |  | |_) | |  _|   | |_    | |     \\ V / 
 |  _|    | |  |  _ <  | |___  |  _|   | |___   | |  
 |_|     |___| |_| \\_\\ |_____| |_|     |_____|  |_|  
`;

const INITIAL_LOGS = [
  { type: 'art', text: BANNER },
  { type: 'dim', text: 'FireFly OS v4.0.2 · Associated with AMIEE · SRMIST' },
  { type: 'out', text: "Type 'help' or click any quick command chip below to inspect." },
];

export default function TerminalSection() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  const runCommand = (rawCmd) => {
    const cmd = rawCmd.trim().toLowerCase();
    if (!cmd) return;

    setHistory((prev) => [...prev, rawCmd]);
    setHistoryIdx(-1);

    let output = null;

    switch (cmd) {
      case 'help':
        output = `Available commands:
  about       - FireFly club mission and AMIEE association
  domains     - List all 5 technical research chapters
  projects    - Flagship systems and benchmark metrics
  team        - All 17 crew members with equal representation
  creator     - Website creator spotlight
  status      - Cluster health and hardware benches
  join        - 2026 admissions and recruitment steps
  clear       - Clear console buffer`;
        break;

      case 'about':
        output = `FireFly is a student-run AI club at SRM Institute of Science and Technology (KTR), associated with AMIEE.
Core Philosophy: "Small lights, built together."
Focus: Embodied robotics, vision-language models, WebGL graphics, and distributed ML.`;
        break;

      case 'domains':
        output = domains
          .map((d) => `[${d.code}] ${d.name} (${d.technologies.slice(0, 4).join(', ')})`)
          .join('\n');
        break;

      case 'projects':
        output = `1. Project Chiron   [BENCH v2.4] - 12-DOF Quadrupedal RL Locomotion (4.2ms inference)
2. Synapse Core     [ALPHA]      - Sub-ms Distributed Agent Swarm Fabric (64 nodes)
3. Event Vision     [RESEARCH]   - Microsecond Neuromorphic Sensor Pipeline`;
        break;

      case 'team':
        output = `All 17 Crew Members (Equal Representation):\n` +
          coreTeam.map((m) => `  #${m.index} ${m.name.padEnd(26)} [${m.area}]`).join('\n');
        break;

      case 'creator':
        output = `Website engineered by M Muthu Kumaran (Technical Team · Creator of this website), built with React 19, Vite 8, and custom 60 FPS physics engines.`;
        break;

      case 'status':
        output = `Cluster Status: HEALTHY
4x RTX 4090 Parallel Cluster: ONLINE
Hardware Bench: 12-DOF Chiron Quadruped Operational
AMIEE Uplink: SECURE ESTABLISHED`;
        break;

      case 'join':
      case 'apply':
        output = `Admissions are open to all SRMIST students from any year and branch.
No prior background in machine learning is required—only curiosity and consistency.
Visit SRMIST Tech Park Room 402 or apply via AMIEE portal.`;
        break;

      case 'clear':
        setLogs([]);
        return;

      default:
        output = `command not found: '${rawCmd}'. Type 'help' for available commands.`;
    }

    setLogs((prev) => [
      ...prev,
      { type: 'cmd', text: `firefly@amiee:~$ ${rawCmd}` },
      { type: 'out', text: output },
    ]);

    // Keep window scroll stationary, only scroll internal terminal body
    setTimeout(() => {
      if (bodyRef.current) {
        bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
      }
    }, 10);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx] || '');
      }
    }
  };

  return (
    <section id="terminal" className="v4-section">
      <div className="wrap">
        <div className="v4-section-header">
          <span className="v4-eyebrow mono">05 // INTERACTIVE TERMINAL</span>
          <h2 className="v4-section-title">
            The club CLI. Fast, stationary, transparent.
          </h2>
          <p className="v4-section-desc">
            Directly query research chapters, project benchmarks, team records, or admission steps.
          </p>
        </div>

        <div className="v4-cli-card">
          <div className="v4-cli-bar mono">
            <div className="v4-cli-dots">
              <span className="v4-cli-dot" />
              <span className="v4-cli-dot" />
              <span className="v4-cli-dot" />
            </div>
            <span>firefly@amiee: ~/v4 (zsh 5.9)</span>
            <span style={{ color: 'var(--green)' }}>● ONLINE</span>
          </div>

          <div
            ref={bodyRef}
            className="v4-cli-body mono"
            onClick={() => inputRef.current?.focus()}
          >
            {logs.map((log, i) => (
              <div
                key={i}
                style={{
                  color:
                    log.type === 'art'
                      ? 'var(--ember)'
                      : log.type === 'cmd'
                      ? '#fff'
                      : log.type === 'dim'
                      ? 'var(--text-dim)'
                      : 'var(--text-muted)',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '8px',
                }}
              >
                {log.text}
              </div>
            ))}

            <div className="v4-cli-prompt-line">
              <span className="v4-cli-prompt-sym">firefly@amiee:~$</span>
              <input
                ref={inputRef}
                type="text"
                className="v4-cli-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="type 'help'..."
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <div className="v4-cli-chips mono">
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', alignSelf: 'center' }}>QUICK:</span>
            {['help', 'about', 'domains', 'projects', 'team', 'creator', 'status', 'join', 'clear'].map((chip) => (
              <button
                key={chip}
                type="button"
                className="v4-cli-chip"
                onClick={() => runCommand(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '32px',
          padding: '24px 28px',
          background: 'rgba(255, 90, 31, 0.05)',
          border: '1px solid rgba(255, 90, 31, 0.2)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <h4 style={{ color: '#fff', fontSize: '18px', marginBottom: '4px' }}>Join the FireFly 2026 Cohort</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Admissions open to all SRMIST students. Zero prerequisites—curiosity and commitment are all you need.
            </p>
          </div>
          <button
            type="button"
            className="v4-btn-primary"
            onClick={() => runCommand('join')}
          >
            <span>Apply to Club</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
