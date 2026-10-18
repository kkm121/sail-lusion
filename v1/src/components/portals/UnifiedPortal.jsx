import React, { useState, useEffect, useCallback } from 'react';
import { api, APPLICATION_STATUSES, ROLE_LABELS } from '../../services/api';

export function UnifiedPortal({ isOpen, onClose, onOpenApply, initialTab = 'signin' }) {
  // Authentication & Session State
  const [session, setSession] = useState(null);
  const [authTab, setAuthTab] = useState(initialTab || 'signin'); // 'signin' | 'register' | 'forgot' | 'invite'
  const [authLoading, setAuthLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Registration Form State
  const [regFullName, setRegFullName] = useState('');
  const [regNetId, setRegNetId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regYear, setRegYear] = useState('1');
  const [regDept, setRegDept] = useState('Computer Science');
  const [regPassword, setRegPassword] = useState('');
  const [botHoney, setBotHoney] = useState('');

  // Forgot Password State
  const [forgotEmail, setForgotEmail] = useState('');

  // Staff Invite Token State
  const [inviteToken, setInviteToken] = useState('');

  // Operations Quick Preview State (Staff / Admin / SuperAdmin)
  const [applications, setApplications] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Candidate Self-Service Dashboard State (Applicant)
  const [myApplications, setMyApplications] = useState([]);
  const [myAppsLoading, setMyAppsLoading] = useState(false);

  const checkExistingSession = useCallback(async () => {
    const current = await api.getCurrentUserSession();
    setSession(current);
  }, []);

  const loadApplicantData = useCallback(async () => {
    setMyAppsLoading(true);
    try {
      const apps = await api.getApplicantApplications();
      setMyApplications(apps);
    } catch (e) {
      console.error(e);
    } finally {
      setMyAppsLoading(false);
    }
  }, []);

  const loadStaffData = useCallback(async () => {
    setLoadingData(true);
    try {
      const appPage = await api.listApplicationsPaginated({
        page: 1,
        limit: 50,
        domain: 'ALL',
        status: 'ALL',
        search: searchQuery,
      });
      setApplications(appPage.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      setAuthTab(initialTab || 'signin');
      setAuthError('');
      setAuthSuccess('');
      checkExistingSession();
    }
  }, [isOpen, initialTab, checkExistingSession]);

  useEffect(() => {
    if (session) {
      if (session.user.role === 'APPLICANT') {
        loadApplicantData();
      } else {
        loadStaffData();
      }
    }
  }, [session, loadApplicantData, loadStaffData]);

  // 1. Google 1-Click OAuth Sign In / Register
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setAuthError('');
    setAuthSuccess('');
    try {
      await api.signInWithGoogle();
    } catch (err) {
      setAuthError(err.message || 'Google authentication failed.');
      setGoogleLoading(false);
    }
  };

  // 2. Email / NetID + Password Sign In Handler
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!signInEmail.trim() || !signInPassword.trim()) {
      setAuthError('Please enter your email or NetID and password.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const sess = await api.login(signInEmail, signInPassword);
      setSession(sess);
    } catch (err) {
      setAuthError(err.message || 'Invalid credentials.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 3. Email + NetID + Password Registration Handler
  const handleRegister = async (e) => {
    e.preventDefault();
    if (botHoney) {
      setAuthError('Automated request blocked by security firewall.');
      return;
    }
    if (!regFullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }
    if (!regNetId.trim()) {
      setAuthError('Please enter your mandatory SRM NetID / Registration Number.');
      return;
    }
    if (!regEmail.trim()) {
      setAuthError('Please enter your preferred email address (Gmail or SRM email).');
      return;
    }
    if (regPassword.length < 8) {
      setAuthError('Password must be at least 8 characters long.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const sess = await api.register({
        fullName: regFullName,
        email: regEmail,
        netId: regNetId,
        phoneNumber: regPhone,
        yearOfStudy: regYear,
        department: regDept,
        password: regPassword,
      });

      if (sess?.accessToken) {
        setSession(sess);
      } else {
        setAuthSuccess('Account registered successfully! You can now sign in with your email or NetID.');
        setAuthTab('signin');
        setSignInEmail(regEmail);
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 4. Forgot Password Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setAuthError('Please provide your account email address.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      await api.forgotPassword(forgotEmail);
      setAuthSuccess('Password reset link has been dispatched to your email.');
    } catch (err) {
      setAuthError(err.message || 'Password reset request failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 5. Accept Staff Invitation Handler
  const handleAcceptInvite = async (e) => {
    e.preventDefault();
    if (!inviteToken.trim()) {
      setAuthError('Please provide your invitation token.');
      return;
    }

    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      await api.acceptStaffInvitation(inviteToken.trim());
      setAuthSuccess('Staff invitation accepted. Refreshing your operations workspace...');
      await checkExistingSession();
    } catch (err) {
      setAuthError(err.message || 'Invitation acceptance failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // 6. Sign Out Handler
  const handleSignOut = async () => {
    await api.logout();
    setSession(null);
    setSelectedApp(null);
    setMyApplications([]);
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.transitionStatus(appId, newStatus);
      await loadStaffData();
      if (selectedApp && selectedApp.id === appId) {
        setSelectedApp(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message || 'Status transition failed.');
    }
  };

  const handleExportCsv = () => {
    try {
      api.exportApplicationsToCsv(applications);
    } catch (err) {
      alert(err.message || 'CSV Export failed.');
    }
  };

  if (!isOpen) return null;

  const currentRole = session?.user?.role || 'UNAUTHENTICATED';
  const roleLabel = ROLE_LABELS[currentRole] || ROLE_LABELS.APPLICANT;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/90 backdrop-blur-2xl animate-fade-in font-sans">
      <div className="w-full max-w-6xl glass-panel border border-white/[0.12] rounded-3xl p-4 sm:p-6 md:p-8 relative overflow-hidden flex flex-col h-[94vh] md:h-[90vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse shrink-0" />
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-display font-bold text-white tracking-tight">
                AMIEE Portal Ecosystem
              </h2>
              {session && (
                <p className="text-[11px] sm:text-xs font-mono text-gray-400 truncate max-w-[200px] sm:max-w-md">
                  Signed in as <span className="text-white font-semibold">{session.user.fullName || session.user.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {session && (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[11px] font-mono border font-semibold text-cyan-400 bg-cyan-400/10 border-cyan-400/30">
                  {roleLabel}
                </span>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-white/[0.08] text-xs font-mono transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.15] border border-white/[0.08] text-white flex items-center justify-center transition-colors text-sm shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STATE 1: UNAUTHENTICATED AUTH FORMS */}
        {!session ? (
          <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <div className="w-full max-w-md p-5 sm:p-7 md:p-8 rounded-3xl bg-black/70 border border-white/[0.12] space-y-5 my-auto">
              
              <div className="text-center space-y-1">
                <h3 className="text-xl sm:text-2xl font-display font-bold text-white">AMIEE Portal Access</h3>
                <p className="text-xs font-mono text-gray-400">
                  Sign in or register with Google or email credentials.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono leading-relaxed">
                  ⚠️ {authError}
                </div>
              )}
              {authSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono leading-relaxed">
                  ✓ {authSuccess}
                </div>
              )}

              {/* 1-Click Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-sans font-semibold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-white/5 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-3 font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                <div className="flex-1 h-[1px] bg-white/[0.08]" />
                <span>or credentials</span>
                <div className="flex-1 h-[1px] bg-white/[0.08]" />
              </div>

              {/* Tabs */}
              <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] font-mono text-xs">
                <button
                  type="button"
                  onClick={() => { setAuthTab('signin'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all font-semibold ${
                    authTab === 'signin' ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthTab('register'); setAuthError(''); setAuthSuccess(''); }}
                  className={`flex-1 py-2 rounded-lg transition-all font-semibold ${
                    authTab === 'register' ? 'bg-accent text-black shadow' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Register
                </button>
              </div>

              {/* TAB 1: SIGN IN */}
              {authTab === 'signin' && (
                <form onSubmit={handleSignIn} className="space-y-3.5 font-mono text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[11px]">
                      Email Address or SRM NetID
                    </label>
                    <input
                      type="text"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="user@gmail.com, ab1234@srmist.edu.in, or ab1234"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-gray-400 uppercase tracking-wider text-[11px]">Password</label>
                      <button
                        type="button"
                        onClick={() => { setAuthTab('forgot'); setAuthError(''); setAuthSuccess(''); }}
                        className="text-[11px] text-cyan-400 hover:underline"
                      >
                        Forgot?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-accent text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 text-xs"
                  >
                    {authLoading ? 'Authenticating...' : 'Sign In to Portal →'}
                  </button>
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setAuthTab('invite')}
                      className="text-[11px] text-gray-400 hover:text-cyan-400 underline"
                    >
                      Have a staff invitation token?
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: REGISTER */}
              {authTab === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3 font-mono text-xs">
                  {/* Invisible Honeypot */}
                  <input
                    type="text"
                    name="website_url_honeypot"
                    value={botHoney}
                    onChange={(e) => setBotHoney(e.target.value)}
                    style={{ display: 'none' }}
                    tabIndex="-1"
                    autoComplete="off"
                  />

                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Full Legal Name *</label>
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">
                        SRM NetID / Reg No * <span className="text-accent">(Mandatory)</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={regNetId}
                        onChange={(e) => setRegNetId(e.target.value)}
                        placeholder="e.g. RA2311003010..."
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">
                        Contact Email * <span className="text-gray-500">(Gmail / SRM)</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Mobile Number</label>
                      <input
                        type="tel"
                        required
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Year of Study</label>
                      <select
                        value={regYear}
                        onChange={(e) => setRegYear(e.target.value)}
                        className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-accent text-xs"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Department</label>
                    <input
                      type="text"
                      required
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      placeholder="e.g. CSE, CINTEL, ECE"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[10px]">Create Password (min 8 chars)</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2.5 rounded-xl bg-accent text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 text-xs mt-1"
                  >
                    {authLoading ? 'Creating Account...' : 'Register Account →'}
                  </button>
                </form>
              )}

              {/* TAB 3: FORGOT PASSWORD */}
              {authTab === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-3.5 font-mono text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[11px]">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-accent text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 text-xs"
                  >
                    {authLoading ? 'Sending link...' : 'Send Password Reset Link →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('signin')}
                    className="w-full py-2 text-center text-gray-400 hover:text-white text-[11px]"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}

              {/* TAB 4: ACCEPT STAFF INVITATION */}
              {authTab === 'invite' && (
                <form onSubmit={handleAcceptInvite} className="space-y-3.5 font-mono text-xs">
                  <div>
                    <label className="block text-gray-400 mb-1 uppercase tracking-wider text-[11px]">
                      Staff Cryptographic Invitation Token
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteToken}
                      onChange={(e) => setInviteToken(e.target.value)}
                      placeholder="INV-XXXX-XXXX-XXXX"
                      className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-accent text-xs font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-cyan-400 text-black font-bold uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 text-xs"
                  >
                    {authLoading ? 'Verifying...' : 'Accept Staff Invitation →'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthTab('signin')}
                    className="w-full py-2 text-center text-gray-400 hover:text-white text-[11px]"
                  >
                    ← Back to Sign In
                  </button>
                </form>
              )}

            </div>
          </div>
        ) : (

          /* STATE 2: AUTHENTICATED APPLICANT & STAFF PORTALS */
          <div className="flex-1 flex flex-col overflow-hidden pt-3 sm:pt-4 space-y-4">
            {session.user.role === 'APPLICANT' ? (
              /* APPLICANT DASHBOARD */
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-accent">Candidate Session Active</span>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-white mt-0.5">Welcome, {session.user.fullName}</h3>
                    <p className="text-xs font-mono text-gray-400 mt-1">Contact Email: <span className="text-white">{session.user.email}</span></p>
                  </div>
                  <button
                    onClick={onOpenApply}
                    className="px-6 py-3 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-lg shrink-0"
                  >
                    {myApplications.length > 0 ? '+ New Application' : 'Apply Now ⚡'}
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-base font-display font-bold text-white flex items-center gap-2">
                      <span>Submitted Applications</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-xs font-mono">{myApplications.length}</span>
                    </h4>
                    <button onClick={loadApplicantData} className="text-xs font-mono text-gray-400 hover:text-accent">↻ Refresh</button>
                  </div>

                  {myAppsLoading ? (
                    <div className="p-8 text-center text-xs font-mono text-gray-500">Loading your candidate submissions...</div>
                  ) : myApplications.length === 0 ? (
                    <div className="p-10 text-center rounded-2xl bg-black/40 border border-white/[0.08] space-y-3">
                      <p className="text-sm text-gray-400">No applications on file for current recruitment cycles.</p>
                      <button onClick={onOpenApply} className="px-5 py-2 rounded-xl bg-accent text-black font-bold text-xs">Apply Now →</button>
                    </div>
                  ) : (
                    myApplications.map(app => {
                      const statusMeta = APPLICATION_STATUSES.find(s => s.id === app.status) || APPLICATION_STATUSES[0];
                      return (
                        <div key={app.id} className="p-5 rounded-2xl bg-black/50 border border-white/[0.08] space-y-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-xs font-mono text-accent font-bold">{app.applicationNumber}</span>
                              <h5 className="text-lg font-bold text-white">{app.primaryDomain}</h5>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[11px] font-mono border font-bold ${statusMeta.color}`}>
                              {statusMeta.label}
                            </span>
                          </div>
                          {app.interviews && app.interviews.length > 0 && (
                            <div className="p-3 rounded-xl bg-blue-500/15 border border-blue-500/30 text-xs font-mono text-blue-300">
                              🕒 Scheduled Interview: Round {app.interviews[0].round_number} on {new Date(app.interviews[0].scheduled_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* STAFF OPERATIONS QUICK DASHBOARD */
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 font-mono text-xs">
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.08]">
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Filter candidate name or NetID..."
                      className="bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-1.5 text-white w-64"
                    />
                  </div>
                  <button
                    onClick={handleExportCsv}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white font-bold"
                  >
                    📥 Export CSV
                  </button>
                </div>

                <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-black/40">
                  <table className="w-full text-left">
                    <thead className="bg-white/[0.03] text-gray-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">App ID</th>
                        <th className="p-3">Candidate</th>
                        <th className="p-3">NetID</th>
                        <th className="p-3">Domain</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Advance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06] text-gray-300">
                      {loadingData ? (
                        <tr><td colSpan="6" className="p-8 text-center text-gray-500">Querying database...</td></tr>
                      ) : applications.slice(0, 10).map(app => (
                        <tr key={app.id} className="hover:bg-white/[0.02]">
                          <td className="p-3 text-cyan-400 font-bold">{app.applicationNumber}</td>
                          <td className="p-3 text-white font-sans">{app.fullName}</td>
                          <td className="p-3 text-gray-400">{app.netId}</td>
                          <td className="p-3">{app.primaryDomain}</td>
                          <td className="p-3 text-cyan-400 font-bold">{app.status}</td>
                          <td className="p-3 text-right">
                            <select
                              value={app.status}
                              onChange={(e) => handleStatusChange(app.id, e.target.value)}
                              className="bg-[#0a0d14] border border-white/[0.1] rounded-lg px-2 py-1 text-[11px] text-white"
                            >
                              {APPLICATION_STATUSES.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
