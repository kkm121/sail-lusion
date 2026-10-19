import React, { useState, useRef, useEffect } from 'react';
import { DOMAINS } from '../../data/recruitment';
import { CREATOR, leadershipTeam, teams } from '../../data/team';
import { coreTeam } from '../../data/core';
import { SOCIAL_LINKS } from '../../data/links';

const IN_PROGRESS = '[IN PROGRESS] Recruitment and sign-in are being built. Check back soon.';

const STATIC_HELP = `AVAILABLE COMMANDS:
  help                    - Display this command manual
  about                   - About FireFly
  team                    - List all crew members with equal representation
  domains                 - List the lab domains
  projects                - List current projects
  socials                 - Instagram and LinkedIn links
  creator                 - Who built this website
  status                  - Site and recruitment status
  apply / track / login   - Recruitment and sign-in (in progress)
  clear                   - Clear the console
  exit / close            - Close the terminal`;

function staticCommand(cmd) {
  switch (cmd) {
    case 'help':
      return { type: 'output', text: STATIC_HELP };
    case 'about':
      return { type: 'output', text: 'FireFly - student AI club, associated with AMIEE.\nEngineer. Innovate. Lead.' };
    case 'team': {
      const lines = [
        `FIREFLY CORE CREW · ${coreTeam.length} MEMBERS (EQUAL REPRESENTATION)`,
        'One team, equal space and shared responsibility. Titles are only tags; everyone shares the work.',
        '',
      ];
      coreTeam.forEach((m) => {
        const creatorMark = m.name === CREATOR
          ? ' ★ [CREATOR & ARCHITECT] (Designed & built this site with AI)'
          : m.tag
          ? ` [${m.tag}]`
          : ' [MEMBER]';
        lines.push(`  ${m.index}  ${m.name.padEnd(25)} : ${m.area}${creatorMark}`);
      });
      return { type: 'output', text: lines.join('\n') };
    }
    case 'domains':
      return {
        type: 'output',
        text: 'FIREFLY DOMAINS:\n' + DOMAINS.map((d, i) => `  [0${i + 1}] ${d.label.toUpperCase()}\n       ${d.desc}`).join('\n\n'),
      };
    case 'projects':
    case 'papers':
      return {
        type: 'output',
        text: 'PROJECTS (placeholders, under work):\n  [1] firefly-vision-core\n  [2] firefly-nlp-playground\n  [3] firefly-robotics-sim\n  [4] firefly-data-lab\n  [5] firefly-web',
      };
    case 'socials':
      return { type: 'output', text: `Instagram : ${SOCIAL_LINKS.instagram}\nLinkedIn  : ${SOCIAL_LINKS.linkedin}` };
    case 'creator':
    case 'whoami':
      return { type: 'output', text: `This website was designed and built by ${CREATOR} (Technical Team).` };
    case 'status':
      return { type: 'output', text: 'SITE: ONLINE\nRECRUITMENT: IN PROGRESS\nSIGN-IN: IN PROGRESS' };
    case 'apply':
    case 'track':
    case 'stats':
    case 'admin':
    case 'login':
    case 'signin':
      return { type: 'error', text: IN_PROGRESS };
    default:
      return undefined;
  }
}

export function TerminalPortal({ isOpen, onClose, onOpenApply, onOpenAdmin, session, portalsEnabled = true }) {
  const isStaff = session && session.user?.role && session.user.role !== 'APPLICANT';
  const [history, setHistory] = useState([
    { type: 'system', text: 'FIREFLY CYBER TERMINAL // NEURAL PROTOCOL v6.0' },
    { type: 'system', text: 'Type "help" to list available telemetry & operational commands.\n' }
  ]);
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      // Clear secrets/PII buffer on close for shared-device safety.
      setHistory([
        { type: 'system', text: 'FIREFLY CYBER TERMINAL // NEURAL PROTOCOL v6.0' },
        { type: 'system', text: 'Type "help" to list available telemetry & operational commands.\n' }
      ]);
      setInput('');
      setCommandHistory([]);
      setHistoryIndex(-1);
      return;
    }
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = async (cmdStr) => {
    const raw = cmdStr.trim();
    if (!raw) return;

    const parts = raw.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const newHistory = [...history, { type: 'user', text: `$ ${raw}` }];
    setCommandHistory(prev => [raw, ...prev]);
    setHistoryIndex(-1);

    if (!portalsEnabled) {
      const handled = staticCommand(cmd);
      if (handled) {
        setHistory([...newHistory, handled]);
        setInput('');
        return;
      }
    }

    switch (cmd) {
      case 'help':
        newHistory.push({
          type: 'output',
          text: `AVAILABLE PROTOCOLS & COMMANDS:
  help                    - Display this operational command manual
  status                  - Check cluster compute & active recruitment cycle
  domains                 - List all 5 engineering & research divisions
  stats                   - Query live application counts & pipeline telemetry
  apply                   - Launch the Candidate Recruitment Portal
  track [APP_ID] [SECRET] - Query live candidate status from database${isStaff ? `
  admin                   - Launch the Administrative Operations Center` : ''}
  papers                  - View flagship research publications
  clear                   - Purge terminal console buffer
  exit / close            - Terminate terminal session`
        });
        break;

      case 'status':
        try {
          const { api } = await import('../../services/api');
          const cycle = await api.getActiveCycle();
          newHistory.push({
            type: 'output',
            text: `[CLUSTER TELEMETRY — ALL SYSTEMS NOMINAL]
  Cycle:        ${cycle?.name || 'Active Cycle'}
  Academic Yr:  ${cycle?.academic_year || '2026-2027'}
  Cycle Status: ${cycle?.status || 'ACTIVE'} (OPEN FOR SUBMISSIONS)
  WebGL Engine: Three.js R185 + Monolithic Crystal Core
  Vault Status: Zero-Trust RLS Policies Verified`
          });
        } catch {
          newHistory.push({ type: 'error', text: 'Failed to fetch cluster status.' });
        }
        break;

      case 'domains':
        newHistory.push({
          type: 'output',
          text: `AMIEE RESEARCH & ENGINEERING DIVISIONS:\n` +
            DOMAINS.map((d, i) => `  [0${i+1}] ${d.label.toUpperCase()}\n       ${d.desc}`).join('\n\n')
        });
        break;

      case 'stats':
        try {
          const { api } = await import('../../services/api');
          const stats = await api.getPipelineAnalytics();
          newHistory.push({
            type: 'output',
            text: `LIVE PIPELINE METRICS:
  Total Applicants:     ${stats.total}
  Under Review:         ${stats.byStatus?.NEW || 0}
  Evaluating:           ${stats.byStatus?.REVIEWING || 0}
  Shortlisted:          ${stats.byStatus?.SHORTLISTED || 0}
  Interviews Scheduled: ${stats.byStatus?.INTERVIEW || 0}
  Selected / Offers:    ${stats.byStatus?.SELECTED || 0}`
          });
        } catch {
          newHistory.push({ type: 'error', text: 'Failed to query telemetry stats.' });
        }
        break;

      case 'apply':
        newHistory.push({ type: 'output', text: 'Launching Candidate Recruitment Portal...' });
        onClose();
        if (onOpenApply) onOpenApply();
        break;

      case 'track':
        if (args.length < 2) {
          newHistory.push({ type: 'error', text: 'Usage: track <APPLICATION_ID> <TRACKING_SECRET>\nExample: track AMIEE-2026-001001 SEC-A1B2C3D4E5F6G7H8' });
        } else {
          try {
            const { api } = await import('../../services/api');
            const data = await api.getApplicationTrackingStatus(args[0], args[1]);
            newHistory.push({
              type: 'output',
              text: `[CANDIDATE DOSSIER LOCATED]
  Applicant:      ${data.candidateName}
  Application ID: ${data.applicationNumber}
  Primary Domain: ${data.primaryDomain}
  Department:     ${data.department}
  Live Status:    ${data.status}
  Submitted At:   ${new Date(data.submittedAt).toLocaleString()}`
            });
          } catch (e) {
            newHistory.push({ type: 'error', text: `Lookup Failed: ${e.message}` });
          }
        }
        break;

      case 'admin':
        if (!session) {
          newHistory.push({ type: 'error', text: 'ACCESS DENIED: You must sign in before accessing the Operations Center.' });
        } else if (!isStaff) {
          newHistory.push({ type: 'error', text: 'ACCESS DENIED: Insufficient privileges. Your account does not have administrative authorization.' });
        } else {
          newHistory.push({ type: 'output', text: 'Redirecting to Admin Operations Center...' });
          onClose();
          if (onOpenAdmin) onOpenAdmin();
        }
        break;

      case 'papers':
        newHistory.push({
          type: 'output',
          text: `FLAGSHIP RESEARCH PUBLICATIONS:
  [1] "Low-Power Spiking Neural Encoders for Quadruped Locomotion" (IEEE 2026)
  [2] "Distributed Real-Time Trajectory Optimization on FPGA Testbeds" (AMIEE-TR-04)
  [3] "Transformer-Based Orbital Vision for Climate Anomaly Detection" (arXiv:2608.0124)`
        });
        break;

      case 'clear':
        setHistory([]);
        setInput('');
        return;

      case 'exit':
      case 'close':
      case 'quit':
        onClose();
        return;

      default:
        newHistory.push({
          type: 'error',
          text: `Unknown command: "${raw}". Type "help" to view available protocols.`
        });
        break;
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInput(commandHistory[nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 md:p-8 bg-black/90 backdrop-blur-2xl animate-fade-in font-mono text-xs">
      <div className="w-full max-w-4xl h-[85vh] glass-panel border border-white/[0.12] rounded-3xl p-6 md:p-8 relative overflow-hidden flex flex-col shadow-2xl">
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10 text-gray-400">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500/80 cursor-pointer" onClick={onClose}></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
            <span className="text-white font-bold ml-2">FIREFLY // NEURAL CLI</span>
          </div>
          <div className="text-[10px] text-gray-500">SESSION: ACTIVE (ENCRYPTED)</div>
        </div>

        {/* Output Screen */}
        <div className="flex-1 overflow-y-auto py-4 space-y-2 select-text" onClick={() => inputRef.current?.focus()}>
          {history.map((h, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap leading-relaxed ${
                h.type === 'user'
                  ? 'text-accent font-semibold'
                  : h.type === 'error'
                  ? 'text-red-400'
                  : h.type === 'system'
                  ? 'text-cyan-300'
                  : 'text-gray-300'
              }`}
            >
              {h.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Command Line Input */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center gap-2 relative z-10">
          <span className="text-accent font-bold">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={portalsEnabled ? 'Type command (e.g. help, status, stats, apply, track)...' : 'Type command (e.g. help, team, domains, projects, creator)...'}
            className="flex-1 bg-transparent text-white focus:outline-none placeholder-gray-600 font-mono text-xs"
            autoFocus
          />
        </div>

      </div>
    </div>
  );
}
