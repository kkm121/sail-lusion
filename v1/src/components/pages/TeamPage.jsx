import React from 'react';
import { CREATOR, teams } from '../../data/team';
import { coreTeam } from '../../data/core';

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.4 7.1L22 12l-7.6 2.9L12 22l-2.4-7.1L2 12l7.6-2.9L12 2z" />
    </svg>
  );
}

const initial = (name) => name.trim().charAt(0).toUpperCase();

function MemberTile({ name }) {
  if (name === CREATOR) {
    return (
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-br from-gold/[0.14] via-white/[0.03] to-transparent border border-gold/60 space-y-3 animate-gold-pulse">
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-amber-100/20 to-transparent -skew-x-12 animate-gold-sweep pointer-events-none" />
        <span className="relative flex items-center gap-1.5 text-gold text-[10px] uppercase tracking-wider">
          <SparkIcon />
          <span>Creator of this website</span>
        </span>
        <span className="relative text-gold-shine text-base font-display font-bold block">{name}</span>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.2] transition-colors space-y-3">
      <span className="text-gray-500 text-[10px] uppercase tracking-wider block">Member</span>
      <span className="text-white text-sm font-display font-semibold block">{name}</span>
    </div>
  );
}

export function TeamPage({ onOpenApply }) {
  return (
    <div className="relative z-10 min-h-screen pt-32 pb-24 px-4 sm:px-8 md:px-16 lg:px-24 font-sans selection:bg-cyan-400 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-16">

        <div className="text-center space-y-5 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono tracking-[0.25em] uppercase text-gray-300 bg-white/[0.04] px-4 py-1.5 rounded-full border border-white/[0.1] backdrop-blur-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>04 // Core Crew · Equal Representation</span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-display font-black text-white tracking-tight leading-[1.08]">
            Architects behind <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
              the revolution.
            </span>
          </h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed font-sans max-w-xl mx-auto">
            {coreTeam.length} members, equal space and shared responsibility. A title is only a tag; everyone here shares the work, decisions and credit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {coreTeam.map((member, idx) => {
            const isCreator = member.creator;
            return (
              <div
                key={member.name}
                className={`p-8 sm:p-10 rounded-3xl backdrop-blur-3xl border transition-all duration-500 space-y-6 flex flex-col justify-between group ${
                  isCreator
                    ? 'bg-gradient-to-b from-amber-500/[0.12] via-black/85 to-black/95 border-amber-400/50 shadow-[0_0_40px_rgba(255,180,50,0.25)] hover:border-amber-300'
                    : 'bg-gradient-to-b from-white/[0.05] via-black/80 to-black/95 border-white/[0.1] hover:border-white/[0.25] shadow-[0_20px_60px_rgba(0,0,0,0.6)]'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-display font-bold text-lg group-hover:scale-105 transition-transform ${
                        isCreator
                          ? 'bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(255,180,50,0.4)]'
                          : 'bg-white/[0.06] border border-white/[0.12] text-white'
                      }`}
                    >
                      {initial(member.name)}
                    </div>
                    {isCreator ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono border font-bold bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(255,180,50,0.3)]">
                        ★ CREATOR & ARCHITECT
                      </span>
                    ) : member.tag ? (
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono border font-semibold bg-white/[0.06] text-gray-300 border-white/[0.15]">
                        {member.tag}
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-[10px] font-mono border font-semibold bg-white/[0.03] text-gray-500 border-white/[0.08]">
                        CORE MEMBER
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] font-mono text-gray-500 mb-1">{member.index}</div>
                    <h3
                      className={`text-2xl font-display font-bold transition-colors ${
                        isCreator
                          ? 'text-amber-200 group-hover:text-amber-100 drop-shadow-[0_0_12px_rgba(255,180,50,0.4)]'
                          : 'text-white group-hover:text-cyan-400'
                      }`}
                    >
                      {member.name}
                    </h3>
                    <p className={`text-xs font-mono mt-1 ${isCreator ? 'text-amber-300 font-semibold' : 'text-gray-400'}`}>
                      {isCreator ? '★ Lead Website Creator & System Architect' : member.area}
                    </p>
                  </div>

                  <p className="text-xs text-gray-300 font-sans leading-relaxed pt-2">
                    {member.about || 'Contributes to club initiatives, technical programs, and collaborative research.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-8">
          {teams.map((team) => (
            <div
              key={team.id}
              className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/90 border border-white/[0.1] backdrop-blur-3xl space-y-10 shadow-[0_20px_80px_rgba(0,0,0,0.8)]"
            >
              <div className="space-y-2 border-b border-white/[0.08] pb-8">
                <span className={`text-xs font-mono uppercase tracking-widest block ${team.accent}`}>Team</span>
                <h2 className="text-3xl sm:text-4xl font-display font-black text-white">{team.name}</h2>
                <p className="text-xs sm:text-sm font-sans text-gray-400 max-w-2xl">{team.blurb}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-mono text-xs">
                {team.lead && (
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.2] space-y-3">
                    <span className={`font-bold block text-xs ${team.accent}`}>{team.lead.role}</span>
                    <span className="text-white text-lg font-display font-semibold block">{team.lead.name}</span>
                  </div>
                )}
                {team.members.map((name) => (
                  <MemberTile key={name} name={name} />
                ))}
                {team.mentor && (
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/[0.2] space-y-3">
                    <span className={`font-bold block text-xs ${team.accent}`}>Mentor</span>
                    <span className="text-white text-sm font-display font-semibold block">{team.mentor}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-white/[0.04] to-black/90 border border-white/[0.1] backdrop-blur-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
          <div className="space-y-2">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest block">Join Us</span>
            <h2 className="text-3xl sm:text-4xl font-display font-black text-white">Become part of FireFly</h2>
          </div>
          <button
            onClick={onOpenApply}
            className="px-6 py-3 rounded-full bg-white text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-cyan-400 transition-all shrink-0 self-start md:self-auto"
          >
            Join the Fellowship →
          </button>
        </div>

      </div>
    </div>
  );
}
