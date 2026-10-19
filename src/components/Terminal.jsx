import { useEffect, useRef, useState } from 'react';
import { domains } from '../data/domains';
import { projects } from '../data/projects';
import { coreTeam } from '../data/core';
import { CREATOR } from '../data/team';
import { SITE } from '../data/site';
import '../styles/portals.css';

const BANNER = String.raw`  _____   ___   ____    _____   _____   _     __   __
 |  ___| |_ _| |  _ \  | ____| |  ___| | |    \ \ / /
 | |_     | |  | |_) | |  _|   | |_    | |     \ V / 
 |  _|    | |  |  _ <  | |___  |  _|   | |___   | |  
 |_|     |___| |_| \_\ |_____| |_|     |_____|  |_|  `;

const IN_PROGRESS = 'Recruitment, sign-in and sign-up are currently being built. Check back soon.';

const COMMANDS = ['help', 'team', 'domains', 'projects', 'socials', 'creator', 'status'];

const HELP = `commands
  help        show this list
  about       what FireFly is
  team        the core team (equal representation)
  domains     the five domains and who runs them
  projects    every project and its status
  socials     where to follow us
  creator     who built this site
  status      site and recruitment status
  apply, login, signup   currently building
  clear       clear the screen
  exit        close the console`;

const BOOT = [
  { type: 'art', text: BANNER },
  { type: 'dim', text: 'FireFly Club · associated with AMIEE' },
  { type: 'dim', text: "firefly console · type a command or tap a chip below\n" },
];

function run(cmd) {
  switch (cmd) {
    case 'help':
      return { type: 'out', text: HELP };
    case 'about':
      return { type: 'out', text: `${SITE.name} is ${SITE.fullName}, associated with AMIEE.\nA student-run club for vision, language, robotics and interactive 3D.` };
    case 'team':
      return {
        type: 'out',
        text: [
          `core team · ${coreTeam.length} members (equal representation)`,
          'one team, equal space and shared responsibility; everyone shares the work.',
          '',
          ...coreTeam.map((m) => {
            const role = m.creator
              ? '[MEMBER · CREATOR]'
              : m.tag
              ? `[${m.tag}]`
              : '[MEMBER]';
            const detail = m.creator ? ' (Technical Team · Creator of this website)' : '';
            return `  ${m.index}  ${m.name.padEnd(25)} ${role.padEnd(24)}${detail} — ${m.area}`;
          }),
        ].join('\n'),
      };
    case 'domains':
      return { type: 'out', text: domains.map((d) => `[${d.code}] ${d.name}\n     ${d.tagline}\n     team: ${d.members.join(', ')}`).join('\n\n') };
    case 'projects':
    case 'papers':
      return { type: 'out', text: `projects · ${projects.length}\n` + projects.map((p, i) => `  ${String(i + 1).padStart(2, '0')}  ${p.name.padEnd(30)}${p.domainName.padEnd(18)}${p.status}`).join('\n') };
    case 'socials':
      return { type: 'out', text: `instagram  ${SITE.instagram}\nlinkedin   ${SITE.linkedin}` };
    case 'creator':
    case 'whoami':
      return { type: 'out', text: `designed and built by ${CREATOR} (Technical Team · Creator of this website).` };
    case 'status':
      return { type: 'out', text: 'site            online\nrecruitment     currently building\nsign-in/up      currently building' };
    case 'apply':
    case 'track':
    case 'stats':
    case 'admin':
    case 'login':
    case 'signin':
    case 'signup':
      return { type: 'err', text: IN_PROGRESS };
    default:
      return undefined;
  }
}

export default function Terminal({ open, onClose }) {
  const [history, setHistory] = useState(BOOT);
  const [input, setInput] = useState('');
  const [past, setPast] = useState([]);
  const [idx, setIdx] = useState(-1);
  const outRef = useRef(null);
  const field = useRef(null);

  useEffect(() => {
    if (!open) {
      setHistory(BOOT);
      setInput('');
      setPast([]);
      setIdx(-1);
      return undefined;
    }
    const t = setTimeout(() => field.current?.focus(), 120);
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [history]);

  if (!open) return null;

  const exec = (raw) => {
    const text = raw.trim();
    if (!text) return;
    const cmd = text.split(/\s+/)[0].toLowerCase();
    setPast((p) => [text, ...p]);
    setIdx(-1);
    if (cmd === 'clear') {
      setHistory([]);
    } else if (['exit', 'close', 'quit'].includes(cmd)) {
      onClose();
      return;
    } else {
      setHistory((h) => [...h, { type: 'cmd', text }, run(cmd) || { type: 'err', text: `command not found: ${text}. try help` }]);
    }
    setInput('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') exec(input);
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (past.length) {
        const n = Math.min(idx + 1, past.length - 1);
        setIdx(n);
        setInput(past[n]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (idx > 0) {
        setIdx(idx - 1);
        setInput(past[idx - 1]);
      } else {
        setIdx(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const m = COMMANDS.find((c) => input && c.startsWith(input.toLowerCase()));
      if (m) setInput(m);
    }
  };

  return (
    <div className="sl-cli" role="dialog" aria-modal="true" aria-label="FireFly console" onClick={onClose}>
      <div className="sl-cli-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sl-cli-bar">
          <span>
            <i /> firefly@amiee
          </span>
          <span className="keys">tab complete · ↑ history · esc close</span>
          <button type="button" onClick={onClose} aria-label="Close console">
            ✕
          </button>
        </div>
        <div className="sl-cli-out" ref={outRef} onClick={() => field.current?.focus()}>
          {history.map((h, i) => (
            <div key={i} className={`ln ${h.type}`}>
              {h.type === 'cmd' ? (
                <>
                  <span className="p">firefly@amiee:~$</span> {h.text}
                </>
              ) : (
                h.text
              )}
            </div>
          ))}
        </div>
        <div className="sl-cli-chips">
          {COMMANDS.map((c) => (
            <button key={c} type="button" onClick={() => exec(c)}>
              {c}
            </button>
          ))}
        </div>
        <label className="sl-cli-in">
          <span>firefly@amiee:~$</span>
          <input ref={field} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} spellCheck={false} autoComplete="off" autoCapitalize="off" aria-label="Command" />
          <i aria-hidden="true" />
        </label>
      </div>
    </div>
  );
}
