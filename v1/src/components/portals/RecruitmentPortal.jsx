import React, { useState, useEffect, useRef } from 'react';
import { api, DOMAINS } from '../../services/api';

export function RecruitmentPortal({ isOpen, onClose }) {
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Resume upload state
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeUploadSuccess, setResumeUploadSuccess] = useState(false);

  // DPDP Consent State (Mandatory itemized consent under DPDP Act 2023)
  const [dpdpConsent, setDpdpConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [activeCycleId, setActiveCycleId] = useState(null);
  const [serverDraftReady, setServerDraftReady] = useState(false);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetIdRef = useRef(null);

  const initialForm = {
    fullName: '',
    email: '',
    netId: '',
    phoneNumber: '',
    yearOfStudy: '2',
    department: 'Computer Science and Engineering',
    primaryDomain: 'TECHNICAL',
    secondaryDomain: 'RESEARCH_AND_DEVELOPMENT',
    resumeUrl: '',
    resumeFileName: '',
    resumeFileSize: null,
    responses: {
      whyJoin: '',
      contribution: '',
      portfolioUrl: '',
      additionalInfo: '',
    }
  };

  const [formData, setFormData] = useState(initialForm);
  const copyTimer = useRef(null);

  useEffect(() => {
    return () => { if (copyTimer.current) clearTimeout(copyTimer.current); };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset PII-heavy state on close so a shared device never reopens a receipt.
      setStep(1);
      setError('');
      setReceipt(null);
      setCopied(false);
      setDpdpConsent(false);
      setTurnstileToken('');
      setResumeUploadSuccess(false);
      setResumeUploading(false);
      setFormData(initialForm);
      return;
    }

    const draft = api.loadApplicationDraft();
    if (draft?.data) {
      setFormData(prev => ({ ...prev, ...draft.data }));
      setDpdpConsent(Boolean(draft.data.dpdpConsent));
    }

    const loadServerDraft = async () => {
      setServerDraftReady(false);
      try {
        const activeCycle = await api.getActiveCycle();
        setActiveCycleId(activeCycle.id);
        const serverDraft = await api.getServerDraft(activeCycle.id);
        if (serverDraft?.hasDraft && serverDraft?.draft) {
          setFormData(prev => ({
            ...prev,
            ...serverDraft.draft,
            responses: { ...prev.responses, ...(serverDraft.draft.responses || {}) },
          }));
          setDpdpConsent(Boolean(serverDraft.draft.dpdpConsent));
        }
      } catch (draftErr) {
        console.warn('[DRAFT] Server draft unavailable:', draftErr.message);
      } finally {
        setServerDraftReady(true);
      }
    };

    loadServerDraft();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 3 || !turnstileSiteKey || !turnstileContainerRef.current) return;

    const renderTurnstile = () => {
      if (!window.turnstile || !turnstileContainerRef.current) return;
      if (turnstileWidgetIdRef.current !== null) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
        return;
      }
      turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => setTurnstileToken(token),
        'expired-callback': () => setTurnstileToken(''),
        'error-callback': () => setTurnstileToken(''),
      });
    };

    if (window.turnstile) {
      renderTurnstile();
      return;
    }

    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderTurnstile);
    return () => script.removeEventListener('load', renderTurnstile);
  }, [isOpen, step, turnstileSiteKey]);

  useEffect(() => {
    if (!isOpen || !activeCycleId || !serverDraftReady || step === 4) return;

    const timer = setTimeout(() => {
      const payload = { ...formData, dpdpConsent };
      api.saveServerDraft(activeCycleId, payload).catch((draftErr) => {
        console.warn('[DRAFT] Server autosave failed:', draftErr.message);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, dpdpConsent, activeCycleId, serverDraftReady, isOpen, step]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('responses.')) {
      const field = name.split('.')[1];
      setFormData(prev => {
        const next = {
          ...prev,
          responses: { ...prev.responses, [field]: value }
        };
        api.saveApplicationDraft(next);
        return next;
      });
    } else {
      setFormData(prev => {
        const next = { ...prev, [name]: value };
        api.saveApplicationDraft(next);
        return next;
      });
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setResumeUploading(true);
    try {
      const uploadRes = await api.uploadResumeFile(file);
      setFormData(prev => ({
        ...prev,
        resumeUrl: uploadRes.storagePath,
        resumeFileName: uploadRes.fileName,
        resumeFileSize: uploadRes.fileSize,
      }));
      setResumeUploadSuccess(true);
    } catch (err) {
      setError(err.message || 'Resume upload failed.');
      setResumeUploadSuccess(false);
    } finally {
      setResumeUploading(false);
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Please enter your full legal name.';
    if (!formData.netId.trim() || formData.netId.trim().length < 3) {
      return 'Please enter your mandatory SRM NetID / Register Number.';
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      return 'Please enter a valid contact email (Gmail, SRM email, or personal email).';
    }
    if (!formData.phoneNumber.trim() || formData.phoneNumber.length < 10) {
      return 'Please enter a valid 10-digit phone number.';
    }
    return '';
  };

  const validateStep2 = () => {
    if (!formData.primaryDomain) {
      return 'Please select a primary division.';
    }
    if (formData.secondaryDomain && formData.primaryDomain === formData.secondaryDomain) {
      return 'Secondary division cannot be identical to your primary division.';
    }
    return '';
  };

  const validateStep3 = () => {
    if (!formData.responses.whyJoin.trim() || formData.responses.whyJoin.length < 15) {
      return 'Please provide a meaningful statement on why you wish to join AMIEE (min 15 chars).';
    }
    if (!formData.responses.contribution.trim() || formData.responses.contribution.length < 15) {
      return 'Please describe how you plan to contribute to AMIEE projects (min 15 chars).';
    }
    if (!dpdpConsent) {
      return 'You must review and affirmatively accept the DPDP Act 2023 Data Privacy Notice to submit.';
    }
    return '';
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      // Fail-closed: misconfigured bot protection must block intake, not bypass it.
      if (!turnstileSiteKey) {
        throw new Error('Bot protection is not configured. Submission is temporarily disabled.');
      }
      if (!turnstileToken) {
        throw new Error('Please complete the Turnstile challenge before submitting.');
      }
      await api.verifyTurnstile(turnstileToken);

      const result = await api.submitApplication({ ...formData, dpdpConsent });
      if (activeCycleId) {
        await api.deleteServerDraft(activeCycleId);
      }
      setReceipt(result);
      setStep(4);
    } catch (err) {
      setError(err.message || 'Submission failed. Please check your connection.');
    } finally {
      if (turnstileWidgetIdRef.current !== null && window.turnstile) {
        window.turnstile.reset(turnstileWidgetIdRef.current);
      }
      setTurnstileToken('');
      setLoading(false);
    }
  };

  const copyApplicationNumber = () => {
    if (receipt?.applicationNumber) {
      navigator.clipboard.writeText(receipt.applicationNumber);
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
      <div className="w-full max-w-3xl glass-panel border border-white/[0.12] rounded-3xl p-6 md:p-10 relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.08] relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span className="text-[10px] font-mono text-accent uppercase tracking-[0.25em]">
                AMIEE Recruitment Protocol
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-white">
              {step === 4 ? 'Application Dispatched' : 'Candidate Application'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/[0.05] hover:bg-white/[0.15] border border-white/[0.08] text-white flex items-center justify-center transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        {step < 4 && (
          <div className="flex items-center justify-between py-4 text-xs font-mono border-b border-white/[0.06] text-gray-400">
            <span className={step >= 1 ? 'text-accent font-semibold' : ''}>01 // Profile</span>
            <span>→</span>
            <span className={step >= 2 ? 'text-accent font-semibold' : ''}>02 // Domain</span>
            <span>→</span>
            <span className={step >= 3 ? 'text-accent font-semibold' : ''}>03 // Dossier & Privacy</span>
          </div>
        )}

        {error && (
          <div className="my-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono leading-relaxed">
            ⚠️ {error}
          </div>
        )}

        {/* Modal Scrollable Content Body */}
        <div className="overflow-y-auto py-6 pr-2 space-y-6 flex-1 text-sm text-gray-300">
          
          {/* STEP 1: Applicant Profile */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                    SRM NetID / Register Number * <span className="text-accent">(Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    name="netId"
                    value={formData.netId}
                    onChange={handleChange}
                    placeholder="e.g. RA2311003010... or ab1234"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                  />
                  <span className="text-[10px] font-mono text-gray-500 mt-1 block">Required for student verification</span>
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Contact Email * <span className="text-gray-400">(Gmail / SRM)</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. user@gmail.com or netid@srmist.edu.in"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                  />
                  <span className="text-[10px] font-mono text-gray-500 mt-1 block">Your primary contact address</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                    Year of Study
                  </label>
                  <select
                    name="yearOfStudy"
                    value={formData.yearOfStudy}
                    onChange={handleChange}
                    className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                  >
                    <option value="1">1st Year (B.Tech / Core)</option>
                    <option value="2">2nd Year (B.Tech / Core)</option>
                    <option value="3">3rd Year (B.Tech / Core)</option>
                    <option value="4">4th Year (Senior / R&D)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Academic Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Computer Science & Engineering (Core / AI / IoT)"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-sans text-xs"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Domain Preferences */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-3">
                  Primary Specialization Domain *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {DOMAINS.map((domain) => (
                    <button
                      key={domain.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primaryDomain: domain.id }))}
                      className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 ${
                        formData.primaryDomain === domain.id
                          ? 'border-accent bg-accent/10 shadow-[0_0_15px_rgba(0,245,212,0.15)]'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.2]'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-display font-bold text-white text-sm">{domain.label}</span>
                        {formData.primaryDomain === domain.id && (
                          <span className="text-accent text-xs">✓ Primary</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 leading-snug">{domain.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Secondary Domain (Optional Alternate)
                </label>
                <select
                  name="secondaryDomain"
                  value={formData.secondaryDomain}
                  onChange={handleChange}
                  className="w-full bg-[#0a0d14] border border-white/[0.1] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                >
                  <option value="">None (Primary Only)</option>
                  {DOMAINS.filter(d => d.id !== formData.primaryDomain).map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 3: Qualitative Dossier & Privacy Consent */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Statement of Intent & Motivation *
                </label>
                <textarea
                  name="responses.whyJoin"
                  rows="3"
                  value={formData.responses.whyJoin}
                  onChange={handleChange}
                  placeholder="Why do you wish to join AMIEE? What specific technical or leadership problems do you want to solve?"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-sans text-xs resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Technical Contributions & Capabilities *
                </label>
                <textarea
                  name="responses.contribution"
                  rows="3"
                  value={formData.responses.contribution}
                  onChange={handleChange}
                  placeholder="Describe your relevant technical skills, past projects, hackathons, or architectures you've built."
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-sans text-xs resize-none"
                />
              </div>

              {/* Resume / Portfolio File Upload */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                <label className="block text-xs font-mono text-gray-300 uppercase tracking-wider">
                  Resume / CV Upload (PDF, max 2MB)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleResumeUpload}
                    disabled={resumeUploading}
                    className="text-xs font-mono text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-mono file:bg-accent/20 file:text-accent hover:file:bg-accent/30 cursor-pointer"
                  />
                  {resumeUploading && <span className="text-xs font-mono text-accent animate-pulse">Uploading PDF...</span>}
                  {resumeUploadSuccess && (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      ✓ {formData.resumeFileName} (Attached)
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-400 uppercase tracking-wider mb-2">
                  Portfolio / GitHub / Research Link (Optional)
                </label>
                <input
                  type="url"
                  name="responses.portfolioUrl"
                  value={formData.responses.portfolioUrl}
                  onChange={handleChange}
                  placeholder="https://github.com/your-handle or portfolio URL"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-accent transition-colors font-mono text-xs"
                />
              </div>

              {/* DPDP Act 2023 Explicit Consent Notice */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="dpdpConsent"
                    checked={dpdpConsent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setDpdpConsent(checked);
                      api.saveApplicationDraft({ ...formData, dpdpConsent: checked });
                    }}
                    className="mt-1 w-4 h-4 rounded border-gray-700 text-accent focus:ring-accent accent-[#00F5D4] cursor-pointer"
                  />
                  <label htmlFor="dpdpConsent" className="text-xs text-gray-300 leading-relaxed cursor-pointer font-sans">
                    <strong className="text-white">DPDP Act 2023 Data Consent:</strong> I hereby give my explicit consent to AMIEE Student Chapter to process my personal data, SRM NetID, and technical dossier solely for recruitment evaluation and admissions communications. I understand that I retain the right to access, rectify, or request erasure of my application at any time.
                  </label>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <span className="block text-xs font-mono text-gray-300 uppercase tracking-wider">
                  Bot Protection Challenge *
                </span>
                {!turnstileSiteKey && (
                  <p className="text-[11px] text-red-300 font-mono">
                    Turnstile is not configured for this environment.
                  </p>
                )}
                <div ref={turnstileContainerRef} className="min-h-[65px]" />
                <p className={`text-[11px] font-mono ${turnstileToken ? 'text-emerald-400' : 'text-gray-500'}`}>
                  {turnstileToken ? '✓ Challenge verified' : 'Complete the challenge to unlock submission.'}
                </p>
              </div>

              {/* Final Submit Advisory */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300">
                ℹ️ You are about to submit this application. After submission, your primary dossier will be locked for recruitment review.
              </div>
            </div>
          )}

          {/* STEP 4: Success Receipt */}
          {step === 4 && receipt && (
            <div className="space-y-6 text-center animate-fade-in py-6">
              <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent flex items-center justify-center mx-auto text-2xl">
                ⚡
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-white">Application Recorded</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Your candidate application has been securely written and committed to the AMIEE PostgreSQL recruitment engine.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-md mx-auto text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                  <span className="text-gray-500 uppercase text-[10px]">Application ID</span>
                  <button 
                    onClick={copyApplicationNumber}
                    className="text-accent font-bold hover:underline flex items-center gap-1.5"
                  >
                    <span>{receipt.applicationNumber}</span>
                    <span>{copied ? '✓ Copied' : '📋'}</span>
                  </button>
                </div>
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                  <span className="text-gray-500 uppercase text-[10px]">Tracking Secret Key</span>
                  <span className="text-amber-400 font-bold tracking-widest">{receipt.trackingSecret}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                  <span className="text-gray-500 uppercase text-[10px]">Contact Email</span>
                  <span className="text-white">{formData.email}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                  <span className="text-gray-500 uppercase text-[10px]">SRM NetID</span>
                  <span className="text-white">{formData.netId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 uppercase text-[10px]">Pipeline Status</span>
                  <span className="text-emerald-400 font-semibold">{receipt.status}</span>
                </div>
              </div>
              <p className="text-[11px] font-mono text-gray-500">
                Save your tracking secret. You can use your Application ID and Secret to track your evaluation progress at any time.
              </p>
            </div>
          )}

        </div>

        {/* Modal Action Controls Footer */}
        <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between relative z-10">
          {step < 4 ? (
            <>
              <button
                type="button"
                onClick={() => step > 1 ? setStep(step - 1) : onClose()}
                className="px-5 py-2.5 rounded-full text-xs font-mono text-gray-400 hover:text-white transition-colors"
              >
                {step > 1 ? '← Back' : 'Cancel'}
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)]"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all shadow-[0_0_15px_rgba(0,245,212,0.3)] disabled:opacity-50"
                >
                  {loading ? 'Committing...' : 'Submit Application ⚡'}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-full bg-accent text-black font-mono text-xs font-bold uppercase tracking-wider hover:bg-white transition-all"
            >
              Done
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
