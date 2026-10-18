import React, { useState, useEffect, useCallback } from 'react';
import { api, DOMAINS, APPLICATION_STATUSES } from '../../services/api';

export function AdminPortalPage({ session, onSignOut }) {
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'interviews' | 'cycles' | 'team' | 'audit'
  
  // Pipeline & Applications State
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [totalPages, setTotalPages] = useState(1);
  const [filterDomain, setFilterDomain] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  // Candidate Dossier Modal State
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [dossierLoading, setDossierLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Interview Subsystem State
  const [interviewCalendar, setInterviewCalendar] = useState([]);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    roundNumber: 1,
    interviewType: 'TECHNICAL',
    scheduledAt: '',
    durationMinutes: 30,
    location: 'Online / SRM Tech Lab',
    meetingUrl: '',
  });

  // Evaluation Rubric Form State
  const [evalForm, setEvalForm] = useState({
    technicalScore: 8,
    problemSolvingScore: 8,
    communicationScore: 8,
    teamworkScore: 8,
    domainScore: 8,
    recommendation: 'STRONG_HIRE',
    strengths: '',
    concerns: '',
  });

  // Cycles State
  const [cycles, setCycles] = useState([]);
  const [createCycleModal, setCreateCycleModal] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleYear, setNewCycleYear] = useState('2026-2027');

  // Team & User Governance State
  const [allUsers, setAllUsers] = useState([]);
  const [userFilterRole, setUserFilterRole] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');

  // Super Admin Specific State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('INTERVIEWER');
  const [generatedInviteToken, setGeneratedInviteToken] = useState('');
  const [retentionModalOpen, setRetentionModalOpen] = useState(false);
  const [retentionDays, setRetentionDays] = useState(180);
  const [retentionLoading, setRetentionLoading] = useState(false);
  const [decisionOverrideReason, setDecisionOverrideReason] = useState('');

  // PII Masking Security Helpers
  const isPrivileged = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

  const maskPhone = useCallback((phone) => {
    if (!phone) return 'N/A';
    if (isPrivileged) return phone;
    const str = String(phone).trim();
    if (str.length <= 4) return '••••';
    return str.slice(0, 3) + ' ••••• ' + str.slice(-2);
  }, [isPrivileged]);

  const maskEmail = useCallback((email) => {
    if (!email) return 'N/A';
    if (isPrivileged) return email;
    const [user, domain] = email.split('@');
    if (!domain) return '•••••@srmist.edu.in';
    return user.slice(0, 2) + '••••@' + domain;
  }, [isPrivileged]);

  const loadAnalytics = useCallback(async () => {
    try {
      const stats = await api.getPipelineAnalytics();
      setAnalytics(stats);
    } catch (e) {
      console.error('Analytics fetch failed:', e);
    }
  }, []);

  const loadPipelineData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listApplicationsPaginated({
        page: currentPage,
        limit: pageSize,
        domain: filterDomain,
        status: filterStatus,
        search: searchQuery,
      });
      setApplications(res.items || []);
      setTotalCount(res.totalCount || 0);
      const safeTotalPages = Math.max(1, res.totalPages || 1);
      setTotalPages(safeTotalPages);
      if (currentPage > safeTotalPages) {
        setCurrentPage(1);
      }
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filterDomain, filterStatus, searchQuery]);

  const loadInterviews = useCallback(async () => {
    try {
      const cal = await api.getInterviewCalendar();
      setInterviewCalendar(cal);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadCycles = useCallback(async () => {
    try {
      const list = await api.listCycles();
      setCycles(list);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const loadAllUsers = useCallback(async () => {
    try {
      const [staffMembers, applicantMembers] = await Promise.all([
        api.listStaffDirectory(),
        api.listApplicantDirectory(),
      ]);
      const users = [...staffMembers, ...applicantMembers]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllUsers(users);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadPipelineData();
    loadAnalytics();
  }, [loadPipelineData, loadAnalytics]);

  useEffect(() => {
    if (activeTab === 'interviews') {
      loadInterviews();
    } else if (activeTab === 'cycles') {
      loadCycles();
    } else if (activeTab === 'team') {
      loadAllUsers();
    }
  }, [activeTab, loadInterviews, loadCycles, loadAllUsers]);

  const handleOpenDossier = async (appId) => {
    setSelectedAppId(appId);
    setDossierLoading(true);
    try {
      const data = await api.getApplicationDossier(appId);
      setDossier(data);
    } catch (e) {
      alert(e.message || 'Failed to load candidate dossier.');
    } finally {
      setDossierLoading(false);
    }
  };

  const handleStatusTransition = async (appId, newStatus) => {
    try {
      await api.transitionStatus(appId, newStatus);
      await loadPipelineData();
      await loadAnalytics();
      if (selectedAppId === appId) {
        await handleOpenDossier(appId);
      }
    } catch (e) {
      alert(e.message || 'Status transition failed.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || !selectedAppId) return;

    setNoteLoading(true);
    try {
      await api.addNote(selectedAppId, newNote);
      setNewNote('');
      await handleOpenDossier(selectedAppId);
    } catch (e) {
      alert(e.message || 'Failed to save note.');
    } finally {
      setNoteLoading(false);
    }
  };

  const [selectedInterviewId, setSelectedInterviewId] = useState('');
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('SELECTED'); // 'SELECTED' | 'REJECTED'
  const [decisionMessage, setDecisionMessage] = useState('');
  const [decisionNotes, setDecisionNotes] = useState('');

  const handleMakeDecision = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;

    try {
      await api.makeDecision({
        applicationId: selectedAppId,
        decision: decisionType,
        rejectionReason: decisionType === 'REJECTED' ? 'Did not meet technical threshold' : null,
        decisionNotes: decisionNotes,
        candidateMessage: decisionMessage || (decisionType === 'SELECTED' ? 'Congratulations! You have been selected for the AMIEE core division.' : 'Thank you for participating. We encourage you to re-apply in future recruitment cycles.'),
        overrideReason: session?.user?.role === 'SUPER_ADMIN' && decisionOverrideReason ? decisionOverrideReason : null,
      });
      setDecisionModalOpen(false);
      setDecisionMessage('');
      setDecisionNotes('');
      setDecisionOverrideReason('');
      await handleOpenDossier(selectedAppId);
      await loadPipelineData();
      alert(`Candidate final decision (${decisionType}) recorded in immutable audit log!`);
    } catch (e) {
      alert(e.message || 'Decision submission failed.');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!selectedAppId || !scheduleForm.scheduledAt) {
      alert('Please specify an interview timestamp.');
      return;
    }

    try {
      await api.scheduleInterview({
        applicationId: selectedAppId,
        roundNumber: Number(scheduleForm.roundNumber),
        interviewType: scheduleForm.interviewType,
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: Number(scheduleForm.durationMinutes),
        location: scheduleForm.location,
        meetingUrl: scheduleForm.meetingUrl,
      });
      setScheduleModalOpen(false);
      await handleOpenDossier(selectedAppId);
      await loadPipelineData();
      alert('Interview scheduled successfully!');
    } catch (e) {
      alert(e.message || 'Scheduling failed.');
    }
  };

  const handleSubmitEvaluation = async (e) => {
    e.preventDefault();
    if (!selectedAppId) return;

    const targetInterviewId = selectedInterviewId || dossier?.interviews?.[0]?.id;
    if (!targetInterviewId) {
      alert('Please schedule an interview round before submitting an evaluation.');
      return;
    }

    try {
      await api.submitEvaluation({
        interviewId: targetInterviewId,
        applicationId: selectedAppId,
        technicalScore: Number(evalForm.technicalScore),
        problemSolvingScore: Number(evalForm.problemSolvingScore),
        communicationScore: Number(evalForm.communicationScore),
        teamworkScore: Number(evalForm.teamworkScore),
        domainScore: Number(evalForm.domainScore),
        recommendation: evalForm.recommendation || 'CONSIDER',
        strengths: evalForm.strengths,
        concerns: evalForm.concerns,
        isFinalized: true,
      });
      await handleOpenDossier(selectedAppId);
      alert('Evaluation finalized and locked in audit trail!');
    } catch (e) {
      alert(e.message || 'Failed to submit evaluation.');
    }
  };

  const handleExportCsv = () => {
    try {
      api.exportApplicationsToCsv(applications);
    } catch (e) {
      alert(e.message || 'Export failed.');
    }
  };

  const handleAssignRole = async (user, newRole) => {
    if (newRole === 'SUPER_ADMIN') {
      alert('Security Invariant: SUPER_ADMIN cannot be assigned via UI.');
      return;
    }
    if (session.user.role === 'ADMIN' && newRole === 'ADMIN') {
      alert('Security Policy: Only Super Administrators can appoint Administrators.');
      return;
    }

    try {
      await api.assignUserRole({
        email: user.email,
        fullName: user.fullName,
        newRole: newRole,
        userId: user.id,
        userType: user.userType,
      });
      await loadAllUsers();
      alert(`Role for ${user.fullName} updated to ${newRole}!`);
    } catch (e) {
      alert(e.message || 'Failed to assign role.');
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!newCycleName.trim()) return;

    try {
      await api.createCycle({
        name: newCycleName.trim(),
        academicYear: newCycleYear.trim(),
      });
      setCreateCycleModal(false);
      setNewCycleName('');
      await loadCycles();
      alert('New recruitment cycle opened!');
    } catch (e) {
      alert(e.message || 'Failed to create cycle.');
    }
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    try {
      const res = await api.inviteStaffMember({
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setGeneratedInviteToken(res.inviteToken);
      await loadAllUsers();
    } catch (err) {
      alert(err.message || 'Failed to issue staff invitation.');
    }
  };

  const handleCleanupRetention = async () => {
    if (!confirm(`Trigger atomic storage retention cleanup for cycles older than ${retentionDays} days? This will mark expired resumes as purged.`)) return;
    setRetentionLoading(true);
    try {
      const res = await api.cleanupExpiredResumes(Number(retentionDays));
      alert(`Cleanup completed: ${res.purgedCount || 0} candidate resumes purged.`);
      setRetentionModalOpen(false);
    } catch (err) {
      alert(err.message || 'Retention cleanup failed.');
    } finally {
      setRetentionLoading(false);
    }
  };

  const handleToggleStaffActive = async (user) => {
    try {
      if (user.isActive) {
        await api.disableStaffMember(user.id);
        alert(`Staff member ${user.fullName} disabled.`);
      } else {
        await api.restoreStaffMember(user.id);
        alert(`Staff member ${user.fullName} restored.`);
      }
      await loadAllUsers();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    }
  };

  const filteredUsers = allUsers.filter(u => {
    if (userFilterRole === 'STAFF' && u.userType !== 'STAFF') return false;
    if (userFilterRole === 'APPLICANT' && u.userType !== 'APPLICANT') return false;
    if (['ADMIN', 'INTERVIEWER', 'VIEWER'].includes(userFilterRole) && u.role !== userFilterRole) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (u.fullName || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.netId || '').toLowerCase().includes(q);
    }
    return true;
  });

  // CRITICAL: Authorization wall — only staff roles can see admin content
  if (!session?.user?.role || session.user.role === 'APPLICANT') {
    return (
      <div className="relative z-10 min-h-screen pt-40 pb-24 px-8 font-sans text-center">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-black/80 border border-red-500/30 backdrop-blur-2xl space-y-4">
          <span className="text-4xl block">🔒</span>
          <h2 className="text-xl font-display font-bold text-white">Unauthorized Access</h2>
          <p className="text-sm text-gray-400">You do not have the required role to access this operations hub.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen pt-32 pb-24 px-4 sm:px-8 md:px-12 lg:px-16 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Command Center Header */}
        <div className="p-6 sm:p-8 rounded-3xl bg-black/80 border border-white/[0.1] backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>AMIEE Operations Core • {session.user.role}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Recruitment Operations Hub
            </h1>
            <p className="text-xs font-mono text-gray-400">
              Authenticated identity: <span className="text-white font-semibold">{session.user.email}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] text-gray-300 border border-white/[0.08] text-xs font-mono transition-colors flex items-center gap-2"
            >
              <span>📥 Export CSV (Filtered)</span>
            </button>
            <button
              onClick={onSignOut}
              className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-mono transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Analytics Top Bar */}
        {analytics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] font-mono text-xs">
              <span className="text-gray-500 text-[10px] uppercase block">Total Intake</span>
              <span className="text-2xl font-bold text-white">{analytics.total}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20 font-mono text-xs">
              <span className="text-cyan-400 text-[10px] uppercase block">Under Review</span>
              <span className="text-2xl font-bold text-cyan-400">{analytics.byStatus?.NEW || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-purple-500/20 font-mono text-xs">
              <span className="text-purple-400 text-[10px] uppercase block">Evaluating</span>
              <span className="text-2xl font-bold text-purple-400">{analytics.byStatus?.REVIEWING || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-amber-500/20 font-mono text-xs">
              <span className="text-amber-400 text-[10px] uppercase block">Shortlisted</span>
              <span className="text-2xl font-bold text-amber-400">{analytics.byStatus?.SHORTLISTED || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-blue-500/20 font-mono text-xs">
              <span className="text-blue-400 text-[10px] uppercase block">Interview</span>
              <span className="text-2xl font-bold text-blue-400">{analytics.byStatus?.INTERVIEW || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-emerald-500/20 font-mono text-xs">
              <span className="text-emerald-400 text-[10px] uppercase block">Selected</span>
              <span className="text-2xl font-bold text-emerald-400">{analytics.byStatus?.SELECTED || 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-black/60 border border-rose-500/20 font-mono text-xs">
              <span className="text-rose-400 text-[10px] uppercase block">Archived</span>
              <span className="text-2xl font-bold text-rose-400">{analytics.byStatus?.REJECTED || 0}</span>
            </div>
          </div>
        )}

        {/* Primary Subsystem Navigation Tabs */}
        <div className="flex p-1.5 rounded-2xl bg-black/60 border border-white/[0.08] font-mono text-xs overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'pipeline' ? 'bg-cyan-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Application Pipeline
          </button>
          <button
            onClick={() => setActiveTab('interviews')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'interviews' ? 'bg-cyan-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            🎙️ Interview Subsystem & Rubrics
          </button>
          <button
            onClick={() => setActiveTab('cycles')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'cycles' ? 'bg-cyan-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            🔄 Recruitment Cycles
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'team' ? 'bg-cyan-400 text-black shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            👥 User & Role Governance
          </button>
        </div>

        {/* TAB 1: APPLICATION PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="space-y-6">
            {/* Filters Bar */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, NetID, application number..."
                  className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 w-full sm:w-64"
                />

                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Domains</option>
                  {DOMAINS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="ALL">All Statuses</option>
                  {APPLICATION_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2 text-gray-400">
                <span>Showing {applications.length} of {totalCount} records</span>
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-3xl bg-black/60 border border-white/[0.1] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-white/[0.03] border-b border-white/[0.08] text-gray-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-4">App ID</th>
                      <th className="p-4">Candidate</th>
                      <th className="p-4">SRM NetID</th>
                      <th className="p-4">Domain</th>
                      <th className="p-4">Department / Year</th>
                      <th className="p-4">Pipeline Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06] text-gray-300">
                    {loading ? (
                      <tr><td colSpan="7" className="p-12 text-center text-gray-500">Querying recruitment database...</td></tr>
                    ) : applications.length === 0 ? (
                      <tr><td colSpan="7" className="p-12 text-center text-gray-500">No candidate applications found for the active filter.</td></tr>
                    ) : (
                      applications.map((app) => {
                        const statusMeta = APPLICATION_STATUSES.find(s => s.id === app.status) || APPLICATION_STATUSES[0];
                        return (
                          <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 font-bold text-cyan-400">{app.applicationNumber}</td>
                            <td className="p-4 font-sans font-semibold text-white">{app.fullName}</td>
                            <td className="p-4 text-gray-400">{app.netId}</td>
                            <td className="p-4 text-gray-300">{app.primaryDomain}</td>
                            <td className="p-4 text-gray-400">{app.department} (Yr {app.yearOfStudy})</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusMeta.color}`}>
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleOpenDossier(app.id)}
                                className="px-3 py-1.5 rounded-xl bg-cyan-400/10 hover:bg-cyan-400 text-cyan-400 hover:text-black font-bold border border-cyan-400/30 transition-all text-[11px]"
                              >
                                View Dossier →
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-gray-400">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] disabled:opacity-30"
                  >
                    ← Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] disabled:opacity-30"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: INTERVIEW SUBSYSTEM */}
        {activeTab === 'interviews' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-display font-bold text-white">Scheduled Candidate Interview Panel</h2>
              <button
                onClick={loadInterviews}
                className="text-xs font-mono text-gray-400 hover:text-cyan-400"
              >
                ↻ Refresh Schedule
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {interviewCalendar.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-black/60 rounded-3xl border border-white/[0.08] text-gray-500">
                  No active interviews currently scheduled. Open a candidate dossier to schedule an evaluation round.
                </div>
              ) : (
                interviewCalendar.map(int => (
                  <div key={int.id} className="p-5 rounded-3xl bg-black/60 border border-white/[0.1] space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-cyan-400 font-bold uppercase text-[10px]">Round {int.round_number} // {int.interview_type}</span>
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                        {int.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-display font-bold text-white">
                        {int.applications?.students?.full_name || 'Candidate'}
                      </h4>
                      <p className="text-gray-400 text-xs">{int.applications?.students?.srm_email}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-1 text-[11px] text-gray-300">
                      <div>🕒 {new Date(int.scheduled_at).toLocaleString()} ({int.duration_minutes}m)</div>
                      <div>📍 {int.location}</div>
                    </div>
                    {int.meeting_url && (
                      <a
                        href={int.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-2 rounded-xl bg-cyan-400 text-black font-bold text-center hover:bg-white transition-colors text-[11px]"
                      >
                        Enter Meeting Room →
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: RECRUITMENT CYCLES */}
        {activeTab === 'cycles' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Recruitment Cycle Governance</h2>
                <p className="text-gray-400 text-xs">Manage intake cycles and academic admission sessions.</p>
              </div>
              <div className="flex items-center gap-3">
                {session?.user?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setRetentionModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 transition-colors font-bold"
                  >
                    🧹 Storage Retention Purge
                  </button>
                )}
                <button
                  onClick={() => setCreateCycleModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white transition-colors"
                >
                  + New Cycle
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cycles.map(c => (
                <div key={c.id} className="p-6 rounded-3xl bg-black/60 border border-white/[0.1] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">AY: {c.academic_year}</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : c.status === 'PAUSED'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-white">{c.name}</h3>
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {c.status === 'ACTIVE' ? (
                      <button
                        onClick={() => api.pauseCycle(c.id).then(loadCycles).catch(err => alert(err.message || 'Failed to pause cycle.'))}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      >
                        Pause Submissions
                      </button>
                    ) : c.status !== 'CLOSED' && c.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => api.openCycle(c.id).then(loadCycles).catch(err => alert(err.message || 'Failed to open cycle.'))}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      >
                        Set Active
                      </button>
                    )}
                    {c.status !== 'CLOSED' && c.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => api.closeCycle(c.id).then(loadCycles).catch(err => alert(err.message || 'Failed to close cycle.'))}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                      >
                        Close Cycle
                      </button>
                    )}
                    {session?.user?.role === 'SUPER_ADMIN' && c.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => api.archiveCycle(c.id).then(loadCycles).catch(err => alert(err.message || 'Failed to archive cycle.'))}
                        className="px-3 py-1.5 rounded-lg bg-gray-500/20 text-gray-300 hover:bg-gray-500/30"
                      >
                        Archive
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: USER & ROLE GOVERNANCE */}
        {activeTab === 'team' && (
          <div className="space-y-6 font-mono text-xs">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-display font-bold text-white">Staff & Access Governance</h2>
                <p className="text-gray-400 text-xs">Authorize interviewers, assign reviewer roles, and issue invitations.</p>
              </div>
              {session?.user?.role === 'SUPER_ADMIN' && (
                <button
                  onClick={() => { setGeneratedInviteToken(''); setInviteModalOpen(true); }}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white transition-colors"
                >
                  + Invite Staff Member
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-white/[0.08] flex flex-wrap items-center justify-between gap-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search staff, applicants, email..."
                className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400 w-64"
              />
              <div className="flex items-center gap-2">
                {['ALL', 'STAFF', 'APPLICANT', 'ADMIN', 'INTERVIEWER'].map(r => (
                  <button
                    key={r}
                    onClick={() => setUserFilterRole(r)}
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold ${
                      userFilterRole === r ? 'bg-cyan-400 text-black border-cyan-400' : 'border-white/[0.08] text-gray-400'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-black/60 border border-white/[0.1] overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-white/[0.03] border-b border-white/[0.08] text-gray-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-4">Name / Identity</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Current Role</th>
                    <th className="p-4 text-right">Assign Authority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-gray-300">
                  {filteredUsers.map(u => (
                    <tr key={u.email} className="hover:bg-white/[0.02]">
                      <td className="p-4 font-bold text-white font-sans">{u.fullName}</td>
                      <td className="p-4 text-gray-400">{u.email}</td>
                      <td className="p-4 text-gray-400">{u.userType}</td>
                      <td className="p-4">
                        {u.userType === 'STAFF' ? (
                          <span className={`px-2 py-0.5 rounded text-[10px] ${u.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-[10px]">Active</span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-cyan-400">{u.role}</td>
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {u.role === 'SUPER_ADMIN' ? (
                            <span className="text-[10px] text-amber-400 font-bold uppercase">👑 Locked Root Owner</span>
                          ) : (
                            <>
                              <select
                                value={u.role}
                                onChange={(e) => handleAssignRole(u, e.target.value)}
                                className="bg-[#0a0d14] border border-white/[0.15] rounded-xl px-2.5 py-1 text-white text-[11px]"
                              >
                                <option value="APPLICANT">Applicant / Student</option>
                                <option value="VIEWER">Faculty Viewer</option>
                                <option value="INTERVIEWER">Interviewer Panelist</option>
                                {session.user.role === 'SUPER_ADMIN' && <option value="ADMIN">Appoint Admin</option>}
                              </select>

                              {session.user.role === 'SUPER_ADMIN' && u.userType === 'STAFF' && (
                                <button
                                  onClick={() => handleToggleStaffActive(u)}
                                  className={`px-2.5 py-1 rounded-xl border text-[10px] font-bold ${
                                    u.isActive
                                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                                  }`}
                                >
                                  {u.isActive ? 'Disable' : 'Restore'}
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* CANDIDATE DOSSIER MODAL */}
      {selectedAppId && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
          <div className="w-full max-w-4xl glass-panel border border-white/[0.12] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{dossier?.application_number}</span>
                <h2 className="text-2xl font-display font-bold text-white">{dossier?.students?.full_name}</h2>
              </div>
              <button onClick={() => setSelectedAppId(null)} className="text-gray-400 hover:text-white text-lg">✕</button>
            </div>

            {dossierLoading ? (
              <div className="p-16 text-center text-xs font-mono text-gray-500">Retrieving candidate dossier from PostgreSQL...</div>
            ) : dossier && (
              <div className="overflow-y-auto py-6 pr-2 space-y-6 flex-1 text-sm font-sans text-gray-300">
                
                {/* Candidate Metadata with Role-Based PII Masking */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Candidate NetID</span>
                    <span className="text-white font-bold">{dossier.students?.net_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Department / Year</span>
                    <span className="text-gray-300">{dossier.students?.department} (Yr {dossier.students?.year_of_study})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">SRM Email</span>
                    <span className="text-gray-300">{maskEmail(dossier.students?.srm_email)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block uppercase">Phone</span>
                    <span className="text-gray-300">{maskPhone(dossier.students?.phone_number)}</span>
                  </div>
                </div>

                {/* Resume Download Action (Signed URL Authorization) */}
                {dossier.resume_url && (
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-xs font-mono">
                    <div className="flex items-center gap-2 text-cyan-300">
                      <span>📄</span>
                      <span className="font-semibold">Candidate Resume PDF</span>
                      <span className="text-[10px] text-gray-400">({dossier.primary_domain})</span>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          const url = await api.getResumeDownloadUrl(dossier.id);
                          window.open(url, '_blank', 'noopener,noreferrer');
                        } catch (err) {
                          alert(err.message || 'Failed to generate secure resume download link.');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white transition-colors text-[11px]"
                    >
                      View Resume PDF ↗
                    </button>
                  </div>
                )}

                {/* Status & Quick Actions (Role Protected) */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Current Status:</span>
                    <span className="text-cyan-400 font-bold">{dossier.status}</span>
                  </div>
                  {session?.user?.role !== 'VIEWER' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleStatusTransition(dossier.id, 'REVIEWING')}
                        className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                      >
                        → Mark Reviewing
                      </button>
                      <button
                        onClick={() => handleStatusTransition(dossier.id, 'SHORTLISTED')}
                        className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                      >
                        → Shortlist
                      </button>
                      <button
                        onClick={() => setScheduleModalOpen(true)}
                        className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                      >
                        📅 Schedule Interview
                      </button>
                      <button
                        onClick={() => { setDecisionType('SELECTED'); setDecisionModalOpen(true); }}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold"
                      >
                        ✓ Select Candidate (Decision RPC)
                      </button>
                      <button
                        onClick={() => { setDecisionType('REJECTED'); setDecisionModalOpen(true); }}
                        className="px-3 py-1 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold"
                      >
                        ✕ Reject Candidate (Decision RPC)
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">👁️ Viewer Read-Only Access</span>
                  )}
                </div>

                {/* Candidate Responses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <span className="text-gray-500 uppercase text-[10px]">Motivation & Problem Solving</span>
                    <p className="text-gray-300 font-sans leading-relaxed">{dossier.application_responses?.[0]?.why_join || 'N/A'}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <span className="text-gray-500 uppercase text-[10px]">Technical Capabilities</span>
                    <p className="text-gray-300 font-sans leading-relaxed">{dossier.application_responses?.[0]?.contribution || 'N/A'}</p>
                  </div>
                </div>

                {/* Structured Interview Evaluation Rubric Form (Role Protected) */}
                {session?.user?.role !== 'VIEWER' && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/30 space-y-4 font-mono text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-cyan-400 font-bold uppercase tracking-wider block">
                        Technical Evaluation Rubric (1-10 Scale)
                      </span>
                      {dossier.interviews && dossier.interviews.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-gray-400">Target Interview Round *:</label>
                          <select
                            value={selectedInterviewId || dossier.interviews[0].id}
                            onChange={(e) => setSelectedInterviewId(e.target.value)}
                            className="bg-[#0a0d14] border border-white/[0.15] rounded-lg px-2.5 py-1 text-white text-[11px]"
                          >
                            {dossier.interviews.map(i => (
                              <option key={i.id} value={i.id}>
                                Round {i.round_number} ({i.interview_type}) — {new Date(i.scheduled_at).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="text-[10px] text-amber-400">⚠️ Please schedule an interview round above before grading</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Technical (25%)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalForm.technicalScore}
                          onChange={(e) => setEvalForm(prev => ({ ...prev, technicalScore: e.target.value }))}
                          className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Problem Solving (25%)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalForm.problemSolvingScore}
                          onChange={(e) => setEvalForm(prev => ({ ...prev, problemSolvingScore: e.target.value }))}
                          className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Domain (20%)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalForm.domainScore}
                          onChange={(e) => setEvalForm(prev => ({ ...prev, domainScore: e.target.value }))}
                          className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Communication (15%)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalForm.communicationScore}
                          onChange={(e) => setEvalForm(prev => ({ ...prev, communicationScore: e.target.value }))}
                          className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 block mb-1">Teamwork (15%)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={evalForm.teamworkScore}
                          onChange={(e) => setEvalForm(prev => ({ ...prev, teamworkScore: e.target.value }))}
                          className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitEvaluation}
                      className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-bold uppercase text-[11px] hover:bg-white transition-colors"
                    >
                      Commit Final Evaluation Score ⚡
                    </button>
                  </div>
                )}

                {/* Reviewer Notes Section */}
                <div className="space-y-3 font-mono text-xs">
                  <span className="text-gray-400 uppercase tracking-wider block">Internal Reviewer Notes</span>
                  <div className="space-y-2">
                    {(dossier.application_notes || []).map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                        <p className="text-gray-300 font-sans">{n.note_text}</p>
                        <span className="text-[10px] text-gray-500 mt-1 block">{new Date(n.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  {session?.user?.role !== 'VIEWER' && (
                    <form onSubmit={handleAddNote} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add an internal observation or score note..."
                        className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-cyan-400"
                      />
                      <button
                        type="submit"
                        disabled={noteLoading}
                        className="px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-cyan-400 hover:text-black font-bold transition-colors"
                      >
                        {noteLoading ? 'Saving...' : 'Add Note'}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-blue-500/40 space-y-4 font-mono text-xs">
            <h3 className="text-xl font-display font-bold text-white">Schedule Evaluation Round</h3>
            <form onSubmit={handleScheduleInterview} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Round & Type</label>
                <select
                  value={scheduleForm.interviewType}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, interviewType: e.target.value }))}
                  className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                >
                  <option value="TECHNICAL">Technical Deep-Dive</option>
                  <option value="PORTFOLIO_REVIEW">Portfolio & Code Review</option>
                  <option value="EXECUTIVE">Executive / Cultural Fit</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Scheduled Date & Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduleForm.scheduledAt}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Meeting URL (Google Meet / Zoom)</label>
                <input
                  type="url"
                  value={scheduleForm.meetingUrl}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, meetingUrl: e.target.value }))}
                  placeholder="https://meet.google.com/xyz"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setScheduleModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400">Save Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CYCLE MODAL */}
      {createCycleModal && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-cyan-500/40 space-y-4 font-mono text-xs">
            <h3 className="text-xl font-display font-bold text-white">Create Recruitment Cycle</h3>
            <form onSubmit={handleCreateCycle} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Cycle Title *</label>
                <input
                  type="text"
                  required
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  placeholder="e.g. AMIEE 2026 Autumn Intake"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Academic Year</label>
                <input
                  type="text"
                  value={newCycleYear}
                  onChange={(e) => setNewCycleYear(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setCreateCycleModal(false)} className="text-gray-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white">Open Cycle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FINAL DECISION ATOMIC MODAL */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-[9996] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in font-mono text-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-white/[0.15] space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-display font-bold text-white">
                Commit Final Decision: <span className={decisionType === 'SELECTED' ? 'text-emerald-400' : 'text-rose-400'}>{decisionType}</span>
              </h3>
              <button onClick={() => setDecisionModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleMakeDecision} className="space-y-3">
              <div>
                <label className="text-gray-400 block mb-1">Decision Determination</label>
                <select
                  value={decisionType}
                  onChange={(e) => setDecisionType(e.target.value)}
                  className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                >
                  <option value="SELECTED">SELECTED (Offer Admission)</option>
                  <option value="REJECTED">REJECTED (Candidate Release)</option>
                </select>
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Candidate Visible Message</label>
                <textarea
                  rows="3"
                  value={decisionMessage}
                  onChange={(e) => setDecisionMessage(e.target.value)}
                  placeholder={decisionType === 'SELECTED' ? 'Congratulations! Welcome to the AMIEE engineering division...' : 'Thank you for your application...'}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl p-3 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Internal Committee Rationale (Confidential)</label>
                <input
                  type="text"
                  value={decisionNotes}
                  onChange={(e) => setDecisionNotes(e.target.value)}
                  placeholder="e.g. Unanimous panel approval on robotics track"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none"
                />
              </div>
              {session?.user?.role === 'SUPER_ADMIN' && (
                <div>
                  <label className="text-amber-400 block mb-1">👑 Super Admin Override Reason (Optional)</label>
                  <input
                    type="text"
                    value={decisionOverrideReason}
                    onChange={(e) => setDecisionOverrideReason(e.target.value)}
                    placeholder="e.g. Executive admission override before rubric finalization"
                    className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              )}
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setDecisionModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl font-bold ${decisionType === 'SELECTED' ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-rose-500 text-white hover:bg-rose-400'}`}
                >
                  Commit Decision & Audit Event ⚡
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVITE STAFF MODAL (SUPER ADMIN) */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in font-mono text-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-cyan-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-display font-bold text-white">
                👑 Issue Staff Invitation Token
              </h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            {generatedInviteToken ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-widest block font-bold">Secure Invitation Token Issued</span>
                  <div className="p-3 bg-black/80 rounded-xl border border-cyan-500/20 text-white font-mono text-sm break-all select-all font-bold">
                    {generatedInviteToken}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Share this token with <span className="text-white font-bold">{inviteEmail}</span>. They can accept it upon signing in to immediately assume the <span className="text-cyan-400 font-bold">{inviteRole}</span> role.
                  </p>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteToken);
                      alert('Invitation token copied to clipboard!');
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white transition-colors"
                  >
                    📋 Copy Token
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedInviteToken('');
                      setInviteEmail('');
                      setInviteModalOpen(false);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteStaff} className="space-y-3">
                <div>
                  <label className="text-gray-400 block mb-1">Staff Member Email *</label>
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@srmist.edu.in"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-gray-400 block mb-1">Assigned Privilege Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="INTERVIEWER">INTERVIEWER (Panel Evaluator)</option>
                    <option value="ADMIN">ADMIN (Operations & Logistics)</option>
                    <option value="VIEWER">VIEWER (Read-Only Auditor)</option>
                  </select>
                </div>
                <p className="text-[10px] text-gray-500">
                  Invitations are valid for 7 days and cryptographically hashed with SHA-256 in the PostgreSQL database.
                </p>
                <div className="flex justify-between items-center pt-2">
                  <button type="button" onClick={() => setInviteModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-400 text-black font-bold hover:bg-white"
                  >
                    Generate Invite Token ⚡
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* STORAGE RETENTION CLEANUP MODAL (SUPER ADMIN) */}
      {retentionModalOpen && (
        <div className="fixed inset-0 z-[9997] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in font-mono text-xs">
          <div className="w-full max-w-md p-6 rounded-3xl bg-black border border-purple-500/40 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/[0.08] pb-3">
              <h3 className="text-lg font-display font-bold text-white">
                🧹 Automated Resume Retention Purge
              </h3>
              <button onClick={() => setRetentionModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <p className="text-gray-400 leading-relaxed">
                Trigger server-side atomic retention cleanup. Candidates in closed/archived cycles or rejected status older than the specified retention window will have their resumes archived and purged according to DPDP policies.
              </p>
              <div>
                <label className="text-gray-400 block mb-1">Retention Window (Days)</label>
                <input
                  type="number"
                  min="30"
                  max="730"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setRetentionModalOpen(false)} className="text-gray-400 hover:text-white">Cancel</button>
                <button
                  onClick={handleCleanupRetention}
                  disabled={retentionLoading}
                  className="px-5 py-2 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 disabled:opacity-50"
                >
                  {retentionLoading ? 'Executing...' : 'Run Purge RPC ⚡'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
