import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import { Arrow } from '../components/ui';
import { domains } from '../data/domains';
import { projects } from '../data/projects';
import { leadershipTeam } from '../data/team';
import { VALUES } from '../data/club';
import { SITE } from '../data/site';

export default function Cli() {
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState('');
  const [cmdIndex, setCmdIndex] = useState(-1);
  const [pastCmds, setPastCmds] = useState([]);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-typing initial intro command
  useEffect(() => {
    let timer1;
    let timer2;
    let timer3;

    const initialText = 'firefly --help';
    let typed = '';
    let i = 0;

    timer1 = setInterval(() => {
      if (i < initialText.length) {
        typed += initialText[i];
        setInput(typed);
        i++;
      } else {
        clearInterval(timer1);
        timer2 = setTimeout(() => {
          setInput('');
          runCommand('help');
        }, 300);
      }
    }, 45);

    return () => {
      clearInterval(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const runCommand = (raw) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    setPastCmds((p) => [...p, raw]);
    setCmdIndex(-1);

    if (cmd === 'clear') {
      setHistory([]);
      return;
    }

    let output = null;

    switch (cmd) {
      case 'help':
      case 'firefly --help':
      case '--help':
      case '-h':
        output = (
          <div className="cli-out">
            <p className="cli-banner">
              FireFly CLI v3.2.0 · AMIEE / SRM Institute of Science and Technology
              <br />
              Type any command below or click a shortcut to execute:
            </p>
            <div className="cli-table">
              <div><span className="cli-cmd-pill" onClick={() => runCommand('about')}>about</span> — Club mission, history, and AMIEE association</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('domains')}>domains</span> — List all 5 technical domains</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('projects')}>projects</span> — Flagship member projects and build status</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('team')}>team</span> — Executive leadership and crew breakdown</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('join')}>join</span> — Recruitment steps and how to apply</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('clear')}>clear</span> — Clear terminal window buffer</div>
              <div><span className="cli-cmd-pill" onClick={() => runCommand('help')}>help</span> — Print this manual</div>
            </div>
          </div>
        );
        break;

      case 'about':
        output = (
          <div className="cli-out">
            <p>
              <b>FireFly</b> is a student-run artificial intelligence club at SRM Institute of Science and Technology (Kattankulathur, Chennai), associated with <b>AMIEE</b>.
            </p>
            <p style={{ marginTop: 8 }}>
              <b>Core Philosophy:</b> &quot;Small lights, built together.&quot;
            </p>
            <p style={{ marginTop: 8 }}>
              <b>Club Values:</b> {VALUES.map((v) => v.title).join(' · ')}
            </p>
          </div>
        );
        break;

      case 'domains':
        output = (
          <div className="cli-out">
            <p><b>TECHNICAL DOMAINS (5 CHAPTERS, ONE CREW):</b></p>
            <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'grid', gap: 6 }}>
              {domains.map((d) => (
                <li key={d.id}>
                  <b style={{ color: d.color }}>[{d.code}] {d.shortName}:</b> {d.tagline}
                  <br />
                  <small style={{ opacity: 0.7 }}>Stack: {d.technologies.slice(0, 5).join(', ')}</small>
                </li>
              ))}
            </ul>
          </div>
        );
        break;

      case 'projects':
        output = (
          <div className="cli-out">
            <p><b>FLAGSHIP MEMBER PROJECTS:</b></p>
            <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'grid', gap: 6 }}>
              {projects.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <b>{p.name}</b> [{p.status}] — {p.blurb}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 8, opacity: 0.8 }}>
              Note: All listed project metrics and implementations are sample mockup records.
            </p>
          </div>
        );
        break;

      case 'team':
        output = (
          <div className="cli-out">
            <p><b>EXECUTIVE LEADERSHIP:</b></p>
            <ul style={{ paddingLeft: 18, margin: '8px 0', display: 'grid', gap: 4 }}>
              {leadershipTeam.map((m) => (
                <li key={m.name}>
                  <b>{m.name}</b> — {m.role}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 8 }}>
              <b>Associated Institution:</b> AMIEE SRMIST · Year {SITE.year}
            </p>
          </div>
        );
        break;

      case 'join':
        output = (
          <div className="cli-out">
            <p><b>MEMBERSHIP & ADMISSIONS:</b></p>
            <p style={{ marginTop: 6 }}>
              Open to students from all SRM departments and all years. No prior experience is required—only curiosity and commitment.
            </p>
            <p style={{ marginTop: 8 }}>
              Visit our online guide: <Link to="/join" className="link" style={{ color: 'var(--ember-1)' }}>/join <Arrow /></Link>
            </p>
          </div>
        );
        break;

      default:
        output = (
          <div className="cli-out" style={{ color: 'var(--ember-1)' }}>
            firefly: &apos;{cmd}&apos;: command under construction. Type &apos;help&apos; for available commands.
          </div>
        );
        break;
    }

    setHistory((h) => [...h, { cmd: raw, output }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!pastCmds.length) return;
      const nextIdx = cmdIndex === -1 ? pastCmds.length - 1 : Math.max(0, cmdIndex - 1);
      setCmdIndex(nextIdx);
      setInput(pastCmds[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (cmdIndex === -1) return;
      const nextIdx = cmdIndex + 1;
      if (nextIdx >= pastCmds.length) {
        setCmdIndex(-1);
        setInput('');
      } else {
        setCmdIndex(nextIdx);
        setInput(pastCmds[nextIdx] || '');
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  };

  return (
    <div>
      <PageHero
        eyebrow="Interactive Interface"
        title={<>FireFly <span className="ember-text">Command Line.</span></>}
        lede="Explore club architecture, research domains, active projects and team records directly from the terminal."
      />

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cli-window">
            <div className="cli-header">
              <div className="cli-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <div className="cli-title mono">firefly@workstation: ~/club</div>
              <div className="cli-badge mono">zsh 5.9</div>
            </div>

            <div className="cli-body mono" onClick={() => inputRef.current?.focus()}>
              {history.map((item, idx) => (
                <div key={idx} className="cli-entry">
                  <div className="cli-prompt-line">
                    <span className="cli-prompt">guest@firefly:~$</span>
                    <span className="cli-cmd-echo">{item.cmd}</span>
                  </div>
                  {item.output}
                </div>
              ))}

              <div className="cli-input-line">
                <span className="cli-prompt">guest@firefly:~$</span>
                <input
                  ref={inputRef}
                  type="text"
                  className="cli-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  spellCheck="false"
                  autoCapitalize="off"
                  autoComplete="off"
                />
              </div>
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
