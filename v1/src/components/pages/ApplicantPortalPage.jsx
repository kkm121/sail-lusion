import React, { useState, useEffect, useCallback } from 'react';
import { api, APPLICATION_STATUSES } from '../../services/api';

export function ApplicantPortalPage({ session, onOpenApply, onSignOut }) {
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [privacyTab, setPrivacyTab] = useState(false);

  const loadApplicantData = useCallback(async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const apps = await api.getApplicantApplications();
      setMyApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    loadApplicantData();
  }, [loadApplicantData]);

  const handleWithdraw = async (appId) => {
    const confirmWithdraw = window.confirm(
      'Are you sure you wish to withdraw this application? This action will mark your application as WITHDRAWN in the active cycle.'
    );
    if (!confirmWithdraw) return;

    setWithdrawLoading(true);
    try {
      await api.withdrawApplication(appId, 'Candidate withdrew application self-service');
      await loadApplicantData();
    } catch (e) {
      alert(e.message || 'Failed to withdraw application.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.trim() !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
      alert('Please type DELETE_MY_ACCOUNT_PERMANENTLY exactly to confirm.');
      return;
    }

    setDeleteLoading(true);
    try {
      await api.requestDpdpDataErasure();
      alert('Your account deletion request has been processed. Recruitment data has been removed according to platform policy.');
      if (onSignOut) onSignOut();
    } catch (err) {
      alert(err.message || 'Erasure request failed.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="relative z-10 min-h-screen pt-32 pb-24 px-4 sm:px-8 md:px-16 lg:px-24 font-sans">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-accent/15 via-black/60 to-black/80 border border-accent/30 backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_0_50px_rgba(0,245,212,0.1)]">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-widest bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Candidate Session Active</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-white">
              Welcome, {session.user.fullName || session.user.email}
            </h1>
            <p className="text-xs sm:text-sm font-mono text-gray-400">
              Contact Identifier: <span className="text-white font-medium">{session.user.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setPrivacyTab(!privacyTab)}
              className="px-4 py-3 rounded-full bg-white/[0.05] hover:bg-white/[0.12] text-gray-300 border border-white/[0.08] text-xs font-mono transition-colors"
            >
              🔒 DPDP Privacy Center
            </button>
            <button
              onClick={onOpenApply}
              className="px-6 py-3 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_20px_rgba(0,245,212,0.3)]"
            >
              {myApplications.length > 0 ? '+ New Application' : 'Apply Now ⚡'}
            </button>
            <button
              onClick={onSignOut}
              className="px-4 py-3 rounded-full bg-white/[0.05] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/[0.08] text-xs font-mono transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* DPDP Act 2023 Self-Service Privacy Drawer */}
        {privacyTab && (
          <div className="p-6 sm:p-8 rounded-3xl bg-black/80 border border-cyan-500/30 backdrop-blur-2xl space-y-6 animate-fade-in font-mono text-xs text-gray-300">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white">DPDP Act 2023 — Data Principal Privacy Center</h3>
                <p className="text-gray-400 text-xs mt-1">Exercise your statutory rights under India's Digital Personal Data Protection Act 2023.</p>
              </div>
              <button onClick={() => setPrivacyTab(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-accent font-bold block">1. Right to Access (Section 11)</span>
                <p className="text-[11px] text-gray-400">View all personal data, NetIDs, and evaluation records processed by the chapter.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                <span className="text-accent font-bold block">2. Right to Correction (Section 12)</span>
                <p className="text-[11px] text-gray-400">Update inaccurate contact info or portfolio URLs before candidate shortlisting.</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2">
                <span className="text-red-400 font-bold block">3. Right to Erasure (Section 12)</span>
                <p className="text-[11px] text-gray-400">Irreversibly delete your account, resume files, and all historical applications.</p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[11px] font-bold transition-colors w-full text-center"
                >
                  Delete My Account & Data ✕
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applications Feed */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
              <span>Your Submitted Applications</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/[0.08] text-white text-xs font-mono">
                {myApplications.length}
              </span>
            </h2>
            <button
              onClick={loadApplicantData}
              className="text-xs font-mono text-gray-400 hover:text-accent transition-colors"
            >
              ↻ Refresh Live Pipeline
            </button>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs font-mono text-gray-500">Querying database for your applications...</div>
          ) : myApplications.length === 0 ? (
            <div className="p-12 sm:p-16 text-center rounded-3xl bg-black/50 border border-white/[0.08] space-y-4">
              <span className="text-4xl block">📝</span>
              <h3 className="text-xl font-display font-bold text-white">No Applications Registered</h3>
              <p className="text-sm font-sans text-gray-400 max-w-md mx-auto">
                You have not submitted an application for the current recruitment cycle yet.
              </p>
              <button
                onClick={onOpenApply}
                className="px-6 py-2.5 rounded-xl bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg"
              >
                Submit Candidate Application Now →
              </button>
            </div>
          ) : (
            myApplications.map((app) => {
              const statusMeta = APPLICATION_STATUSES.find(s => s.id === app.status) || APPLICATION_STATUSES[0];
              const isLocked = ['SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN'].includes(app.status);
              const activeInterviews = (app.interviews || [])
                .filter(i => i.status !== 'CANCELLED')
                .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());
              const latestInterview = activeInterviews[0];
              const hasInterview = Boolean(latestInterview);

              return (
                <div key={app.id} className="p-6 sm:p-8 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/[0.1] space-y-6">
                  
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
                    <div>
                      <span className="text-xs font-mono text-accent font-bold">{app.applicationNumber}</span>
                      <h3 className="text-2xl font-display font-bold text-white mt-1">Domain: {app.primaryDomain}</h3>
                      {app.secondaryDomain && (
                        <p className="text-xs font-mono text-gray-400">Secondary: {app.secondaryDomain}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-mono border font-bold ${statusMeta.color}`}>
                        {statusMeta.label}
                      </span>
                      {!isLocked && (
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          disabled={withdrawLoading}
                          className="px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-red-500/15 text-gray-400 hover:text-red-400 border border-white/[0.08] text-xs font-mono transition-colors"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status Progression Timeline (Section 69) */}
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3 font-mono text-xs">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest block">Application Lifecycle Pipeline</span>
                    <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                      {[
                        { key: 'NEW', label: '1. Submitted' },
                        { key: 'REVIEWING', label: '2. Under Review' },
                        { key: 'SHORTLISTED', label: '3. Shortlisted' },
                        { key: 'INTERVIEW', label: '4. Interview' },
                        { key: 'SELECTED', label: '5. Decision' },
                      ].map((step, idx) => {
                        const stepOrder = ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED'];
                        const currentIdx = stepOrder.indexOf(app.status);
                        const isDone = currentIdx >= idx || app.status === 'SELECTED';
                        const isCurrent = app.status === step.key;

                        return (
                          <div
                            key={step.key}
                            className={`p-2 rounded-xl border transition-all ${
                              isCurrent
                                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                                : isDone
                                ? 'bg-white/[0.04] border-white/[0.15] text-gray-300'
                                : 'border-white/[0.04] text-gray-600'
                            }`}
                          >
                            <span>{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Candidate Decision Communication Notice (Section 70) */}
                  {app.candidateMessage && (
                    <div className={`p-5 rounded-2xl border font-mono text-xs space-y-2 ${
                      app.status === 'SELECTED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}>
                      <span className="font-bold uppercase tracking-wider block">
                        {app.status === 'SELECTED' ? '🎉 Formal Selection Offer Communication' : 'Notice of Candidate Status'}
                      </span>
                      <p className="font-sans text-sm leading-relaxed text-gray-200">{app.candidateMessage}</p>
                    </div>
                  )}

                  {/* Scheduled Interview Banner (if active) */}
                  {hasInterview && latestInterview && (
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-transparent border border-blue-500/40 space-y-3 font-mono text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-400 font-bold">
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                          <span>INTERVIEW SCHEDULED — ROUND {latestInterview.round_number} ({latestInterview.interview_type})</span>
                        </div>
                        <span className="text-gray-400">{new Date(latestInterview.scheduled_at).toLocaleString()}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
                        <span className="text-gray-300">Location: {latestInterview.location || 'Online'} ({latestInterview.duration_minutes} min)</span>
                        {latestInterview.meeting_url && (
                          <a
                            href={latestInterview.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-colors shrink-0"
                          >
                            Join Meeting Room →
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submission Responses Snapshot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase">Statement of Motivation</span>
                      <p className="text-gray-300 font-sans text-xs line-clamp-3">{app.responses?.whyJoin || 'N/A'}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] text-gray-500 uppercase">Technical Contribution</span>
                      <p className="text-gray-300 font-sans text-xs line-clamp-3">{app.responses?.contribution || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Attached Resume */}
                  {app.resumeFileName && (
                    <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-400">Attached Dossier: <strong className="text-white">{app.resumeFileName}</strong></span>
                      <button
                        onClick={async () => {
                          const target = app.id || app.resumeUrl;
                          if (!target) {
                            alert('No resume file reference found.');
                            return;
                          }
                          try {
                            const url = await api.getResumeDownloadUrl(target);
                            if (url) {
                              window.open(url, '_blank', 'noopener,noreferrer');
                            } else {
                              alert('Resume file is securely stored.');
                            }
                          } catch (e) {
                            alert(e.message || 'Resume access requires active session authorization.');
                          }
                        }}
                        className="text-cyan-400 hover:underline font-bold"
                      >
                        Download Document ↗
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-red-500/40 space-y-5 font-mono text-xs">
            <div className="space-y-2">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-xl font-display font-bold text-white">Confirm DPDP Data Erasure</h3>
              <p className="text-gray-400 leading-relaxed font-sans text-xs">
                This will permanently delete your applicant account, student record, resumes, and all recruitment submissions. This action is irreversible.
              </p>
            </div>

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1 text-[11px]">Type "DELETE_MY_ACCOUNT_PERMANENTLY" to confirm:</label>
                <input
                  type="text"
                  required
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE_MY_ACCOUNT_PERMANENTLY"
                  className="w-full bg-white/[0.04] border border-red-500/30 rounded-xl px-3 py-2 text-red-400 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || deleteConfirmText.trim() !== 'DELETE_MY_ACCOUNT_PERMANENTLY'}
                  className="px-5 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 disabled:opacity-40 transition-colors"
                >
                  {deleteLoading ? 'Erasing...' : 'Confirm Permanent Erasure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
