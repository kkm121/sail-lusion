import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { DOMAINS, APPLICATION_STATUSES, ROLE_LABELS, RECOMMENDATIONS } from '../data/recruitment';

export { DOMAINS, APPLICATION_STATUSES, ROLE_LABELS, RECOMMENDATIONS };

/**
 * Standardized Domain Error Handler
 */
function createDomainError(code, message, details = null) {
  const err = new Error(message);
  err.code = code;
  err.details = details;
  err.requestId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  return err;
}

/**
 * Production-Grade Recruitment Domain API Service V5
 * AMIEE Recruitment Platform - Architectural Master Layer
 */
export const api = {
  // ==========================================
  // 1. AUTHENTICATION & IDENTITY (Server-Driven)
  // ==========================================

  async signInWithGoogle() {
    if (!isSupabaseConfigured()) {
      throw createDomainError('CLIENT_NOT_CONFIGURED', 'Supabase client is not configured.');
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw createDomainError('AUTH_ERROR', error.message);
    return data;
  },

  async login(emailOrNetId, password) {
    if (!isSupabaseConfigured()) {
      throw createDomainError('CLIENT_NOT_CONFIGURED', 'Supabase client is not configured.');
    }

    let normalizedEmail = (emailOrNetId || '').toLowerCase().trim();

    if (!normalizedEmail.includes('@')) {
      try {
        const { data: st } = await supabase
          .from('students')
          .select('srm_email')
          .ilike('net_id', normalizedEmail)
          .maybeSingle();

        if (st?.srm_email) {
          normalizedEmail = st.srm_email.toLowerCase().trim();
        } else {
          normalizedEmail = `${normalizedEmail}@srmist.edu.in`;
        }
      } catch {
        normalizedEmail = `${normalizedEmail}@srmist.edu.in`;
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password: password,
    });

    if (authError || !authData?.session || !authData?.user) {
      throw createDomainError('INVALID_CREDENTIALS', authError?.message || 'Invalid email/NetID or password.');
    }

    return await this.resolveAuthoritativeSession(authData.session, authData.user);
  },

  async register({ fullName, email, srmEmail, netId, phoneNumber, yearOfStudy, department, password }) {
    const cleanEmail = (email || srmEmail || '').toLowerCase().trim();
    const cleanName = (fullName || '').trim();
    const cleanPhone = (phoneNumber || '').trim();
    const cleanDept = (department || 'General').trim();
    const cleanYear = Number(yearOfStudy || 1);
    const cleanNetId = (netId || '').trim();

    if (!cleanNetId) {
      throw createDomainError('MISSING_NETID', 'Mandatory SRM NetID or Registration Number is required.');
    }

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw createDomainError('INVALID_EMAIL', 'Please enter a valid email address.');
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw createDomainError('WEAK_PASSWORD', 'Password must be at least 8 characters long.');
    }

    if (!Number.isInteger(cleanYear) || cleanYear < 1 || cleanYear > 5) {
      throw createDomainError('INVALID_YEAR', 'Year of study must be between 1 and 5.');
    }

    if (!isSupabaseConfigured()) {
      throw createDomainError('CLIENT_NOT_CONFIGURED', 'Supabase client is not configured.');
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
      options: {
        data: {
          full_name: cleanName,
          phone_number: cleanPhone,
          year_of_study: cleanYear,
          department: cleanDept,
          net_id: cleanNetId,
        },
      },
    });

    if (authError) {
      throw createDomainError('SIGNUP_FAILED', authError.message);
    }

    if (authData?.session) {
      return await this.resolveAuthoritativeSession(authData.session, authData.user);
    }

    return {
      accessToken: null,
      user: {
        email: cleanEmail,
        netId: cleanNetId,
        fullName: cleanName,
        role: 'APPLICANT',
      },
      message: 'Account registered successfully. If confirmation email is required, please check your inbox before signing in.',
    };
  },

  async forgotPassword(email) {
    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw createDomainError('MISSING_EMAIL', 'Please provide your account email address.');
    }

    const redirectBase = typeof window !== 'undefined' ? window.location.origin : '';
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectBase ? `${redirectBase}/#type=recovery` : undefined,
    });
    // Always return success to avoid account enumeration; a missing account
    // still shows the generic dispatch message.
    if (error) {
      return { success: true, message: 'If an account exists, password reset instructions have been dispatched.' };
    }
    return { success: true, message: 'Password reset instructions dispatched to your email.' };
  },

  async resetPassword(newPassword) {
    if ((newPassword || '').length < 8) {
      throw createDomainError('WEAK_PASSWORD', 'Password must be at least 8 characters long.');
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw createDomainError('UPDATE_FAILED', error.message);
    return { success: true, message: 'Password updated successfully.' };
  },

  /**
   * Pure Server-Side Role Resolution
   * Invariant: auth.uid() -> admin_users.auth_user_id (NO email fallback string matches)
   */
  async resolveAuthoritativeSession(session, authUser) {
    if (!session || !authUser) return null;

    try {
      const { data: adminRecord } = await supabase
        .from('admin_users')
        .select('id, role, is_active, full_name, email, department')
        .eq('auth_user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (adminRecord) {
        return {
          accessToken: session.access_token,
          user: {
            id: adminRecord.id,
            authUserId: authUser.id,
            email: adminRecord.email || authUser.email,
            fullName: adminRecord.full_name,
            role: adminRecord.role,
            department: adminRecord.department || 'Operations',
          },
        };
      }
    } catch {
      // Fall through to applicant resolution; never downgrade silently with a log
      // containing PII. Disabled staff simply resolve as applicant with no admin rights.
    }

    let studentProfile = null;
    try {
      const { data: studentData } = await supabase
        .from('students')
        .select('id, full_name, srm_email, net_id')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      studentProfile = studentData;
    } catch {
      studentProfile = null;
    }

    return {
      accessToken: session.access_token,
      user: {
        id: studentProfile?.id || authUser.id,
        authUserId: authUser.id,
        email: authUser.email,
        fullName: studentProfile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        role: 'APPLICANT',
        student: studentProfile,
      },
    };
  },

  async getCurrentUserSession() {
    if (!isSupabaseConfigured()) return null;
    const { data, error } = await supabase.auth.getSession();
    const session = data?.session;
    if (error || !session) return null;
    return await this.resolveAuthoritativeSession(session, session.user);
  },

  async logout() {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Best-effort: caller clears local session regardless.
      }
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('amiee_app_draft');
      }
    } catch { /* noop */ }
    this._memoryDraft = null;
  },

  // ==========================================
  // 2. TURNSTILE BOT PROTECTION (Edge Function)
  // ==========================================

  async verifyTurnstile(token) {
    if (!token) throw createDomainError('MISSING_TOKEN', 'Turnstile verification token is missing.');

    const { data, error } = await supabase.functions.invoke('verify-turnstile', {
      body: { token },
    });

    if (error || !data?.success) {
      throw createDomainError('BOT_CHALLENGE_FAILED', data?.error || error?.message || 'Bot challenge verification failed.');
    }

    return data;
  },

  // ==========================================
  // 3. CANDIDATE APPLICATION INTAKE (Atomic RPC)
  // ==========================================

  async submitApplication(formData) {
    const cleanEmail = (formData.email || formData.srmEmail || '').toLowerCase().trim();
    const cleanNetId = (formData.netId || '').trim();
    const cleanName = (formData.fullName || '').trim();
    const cleanPhone = (formData.phoneNumber || '').trim();
    const rawYear = Number(formData.yearOfStudy);
    const cleanYear = Number.isInteger(rawYear) ? rawYear : NaN;
    const cleanDept = (formData.department || '').trim();

    if (!cleanNetId) {
      throw createDomainError('MISSING_NETID', 'Mandatory SRM NetID or Registration Number is required.');
    }
    if (!formData.dpdpConsent) {
      throw createDomainError('MISSING_DPDP_CONSENT', 'Affirmative DPDP Act 2023 consent is required to submit an application.');
    }
    if (!Number.isInteger(cleanYear) || cleanYear < 1 || cleanYear > 5) {
      throw createDomainError('INVALID_YEAR', 'Year of study must be between 1 and 5.');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw createDomainError('INVALID_EMAIL', 'Please enter a valid email address.');
    }
    const portfolioUrl = formData.responses?.portfolioUrl?.trim() || '';
    if (portfolioUrl && !/^https?:\/\/.+\..+/.test(portfolioUrl)) {
      throw createDomainError('INVALID_URL', 'Portfolio URL must start with http(s)://.');
    }
    if ((formData.responses?.whyJoin || '').trim().length < 15) {
      throw createDomainError('INVALID_MOTIVATION', 'Statement of motivation must be at least 15 characters.');
    }

    const { data, error } = await supabase.rpc('submit_recruitment_application', {
      p_full_name: cleanName,
      p_srm_email: cleanEmail,
      p_net_id: cleanNetId,
      p_phone_number: cleanPhone,
      p_year_of_study: cleanYear,
      p_department: cleanDept,
      p_primary_domain: formData.primaryDomain,
      p_secondary_domain: formData.secondaryDomain || null,
      p_why_join: formData.responses?.whyJoin || '',
      p_contribution: formData.responses?.contribution || '',
      p_portfolio_url: formData.responses?.portfolioUrl || null,
      p_additional_info: formData.responses?.additionalInfo || null,
      p_resume_url: formData.resumeUrl || null,
      p_resume_file_name: formData.resumeFileName || null,
      p_resume_file_size: formData.resumeFileSize || null,
      p_dpdp_consent: Boolean(formData.dpdpConsent),
      p_dpdp_version: '2026.1',
      p_custom_answers: formData.customAnswers || {},
    });

    if (error) {
      const msg = error?.message || '';
      if (msg.includes('DUPLICATE_APPLICATION')) {
        throw createDomainError('DUPLICATE_APPLICATION', 'An active application for this candidate is already registered in the active recruitment cycle.');
      }
      if (msg.includes('INACTIVE_CYCLE')) {
        throw createDomainError('INACTIVE_CYCLE', 'Recruitment cycle is closed or outside active submission dates.');
      }
      if (msg.includes('INVALID_MOTIVATION')) {
        throw createDomainError('INVALID_MOTIVATION', 'Please provide a meaningful statement of motivation (min 15 characters).');
      }
      if (msg.includes('UNAUTHENTICATED')) {
        throw createDomainError('UNAUTHENTICATED', 'You must sign in with your student account before submitting your application.');
      }
      throw createDomainError('SUBMISSION_FAILED', msg || 'Application submission failed.');
    }

    if (!data || !data.applicationNumber) {
      throw createDomainError('SUBMISSION_REJECTED', 'Database transaction did not return a confirmed application receipt.');
    }

    // Use module reference (not `this`) so destructured calls don't throw.
    try { await api.clearApplicationDraft(); } catch { /* draft clear is best-effort */ }

    return {
      applicationNumber: data.applicationNumber,
      trackingSecret: data.trackingSecret,
      status: data.status || 'NEW',
      submittedAt: data.submittedAt,
    };
  },

  // ==========================================
  // 4. DRAFT MANAGEMENT (Local + Server-Side)
  // ==========================================

  _memoryDraft: null,

  saveApplicationDraft(draftData) {
    const payload = { v: 1, data: draftData, savedAt: new Date().toISOString() };
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('amiee_app_draft', JSON.stringify(payload));
      }
      this._memoryDraft = payload;
      return true;
    } catch {
      // Quota/disabled storage: keep memory copy but report failure so UI can warn.
      this._memoryDraft = payload;
      return false;
    }
  },

  loadApplicationDraft() {
    const TTL_MS = 7 * 24 * 60 * 60 * 1000;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem('amiee_app_draft');
        if (raw) {
          const parsed = JSON.parse(raw);
          const savedAt = Date.parse(parsed?.savedAt || '');
          if (Number.isNaN(savedAt) || Date.now() - savedAt > TTL_MS) {
            try { window.localStorage.removeItem('amiee_app_draft'); } catch { /* noop */ }
            return null;
          }
          return parsed;
        }
      }
      return this._memoryDraft;
    } catch {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('amiee_app_draft');
        }
      } catch { /* noop */ }
      return null;
    }
  },

  clearApplicationDraft() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem('amiee_app_draft');
      }
      this._memoryDraft = null;
    } catch {
      this._memoryDraft = null;
    }
  },

  async saveServerDraft(cycleId, draftPayload) {
    const { data, error } = await supabase.rpc('save_application_draft', {
      p_cycle_id: cycleId,
      p_draft_payload: draftPayload,
    });
    if (error) throw createDomainError('DRAFT_SAVE_FAILED', error.message);
    return data;
  },

  async getServerDraft(cycleId) {
    const { data, error } = await supabase.rpc('get_my_application_draft', {
      p_cycle_id: cycleId,
    });
    if (error) throw createDomainError('DRAFT_FETCH_FAILED', error.message);
    return data;
  },

  async deleteServerDraft(cycleId) {
    const { data, error } = await supabase.rpc('delete_application_draft', {
      p_cycle_id: cycleId,
    });
    if (error) throw createDomainError('DRAFT_DELETE_FAILED', error.message);
    return data;
  },

  // ==========================================
  // 5. RESUME STORAGE (2MB Limit & Magic Byte Verification)
  // ==========================================

  async uploadResumeFile(file) {
    if (!file) throw createDomainError('NO_FILE', 'No file selected.');

    // Strict 2MB Limit (Section 69)
    if (file.size > 2 * 1024 * 1024) {
      throw createDomainError('FILE_TOO_LARGE', 'Resume file size exceeds the 2MB limit for recruitment processing.');
    }

    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      throw createDomainError('INVALID_FORMAT', 'Only PDF documents (.pdf) are permitted.');
    }

    // PDF Magic Bytes (0x25, 0x50, 0x44, 0x46)
    const headerBuffer = await file.slice(0, 4).arrayBuffer();
    const headerBytes = new Uint8Array(headerBuffer);
    const isPdf = headerBytes[0] === 0x25 && headerBytes[1] === 0x50 && headerBytes[2] === 0x44 && headerBytes[3] === 0x46;
    if (!isPdf) {
      throw createDomainError('INVALID_MAGIC_BYTES', 'Invalid file format. File is not an authentic PDF document.');
    }

    const { data: uploadTarget, error: pathErr } = await supabase.rpc('request_resume_upload', {
      p_file_name: file.name,
      p_file_size: file.size,
    });

    if (pathErr || !uploadTarget?.storagePath) {
      throw createDomainError('STORAGE_PATH_REJECTED', pathErr?.message || 'Could not generate authorized storage path.');
    }

    const { data, error } = await supabase.storage
      .from('recruitment-private')
      .upload(uploadTarget.storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf',
      });

    if (error) {
      throw createDomainError('UPLOAD_FAILED', `Resume upload failed: ${error.message}`);
    }

    return {
      storagePath: data?.path || uploadTarget.storagePath,
      fileName: file.name,
      fileSize: file.size,
    };
  },

  async getResumeDownloadUrl(applicationIdOrPath) {
    if (!applicationIdOrPath) return null;

    // UUID-only: raw storage paths are never accepted from the caller, so a
    // compromised/compromised-guessed path cannot bypass the ownership RPC.
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(applicationIdOrPath)) {
      throw createDomainError('INVALID_INPUT', 'A valid application ID is required to download a resume.');
    }

    const { data: authData, error: authError } = await supabase.rpc('request_resume_download', {
      p_application_id: applicationIdOrPath,
    });
    if (authError || !authData?.storagePath) {
      throw createDomainError('FORBIDDEN_DOWNLOAD', authError?.message || 'Access to candidate resume denied.');
    }
    const targetPath = authData.storagePath;

    const { data, error } = await supabase.storage
      .from('recruitment-private')
      .createSignedUrl(targetPath, 900); // 15-minute TTL

    if (error) throw createDomainError('SIGNED_URL_FAILED', error.message);
    if (!data?.signedUrl) throw createDomainError('SIGNED_URL_FAILED', 'Could not generate a signed download URL.');
    return data.signedUrl;
  },

  // ==========================================
  // 6. CANDIDATE APPLICANT SELF-SERVICE
  // ==========================================

  async getApplicantApplications() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return [];

    try {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!student) return [];

      // NOTE: application_decisions is ADMIN-only via RLS, so it is NOT joined
      // here (join would 403 the whole query for applicants). Decisions are
      // fetched per-application via get_my_application_decision RPC below.
      const baseSelect = `
          id,
          application_number,
          year_of_study,
          department,
          primary_domain,
          secondary_domain,
          status,
          resume_file_name,
          submitted_at,
          application_responses (
            why_join,
            contribution,
            portfolio_url,
            additional_info
          ),
          interviews (
            id,
            round_number,
            interview_type,
            scheduled_at,
            duration_minutes,
            location,
            meeting_url,
            status
          )
        `;
      const { data: apps, error } = await supabase
        .from('applications')
        .select(baseSelect)
        .eq('student_id', student.id)
        .neq('interviews.status', 'CANCELLED')
        .order('submitted_at', { ascending: false });

      if (error || !apps) return [];

      const mapped = await Promise.all((apps || []).map(async (a) => {
          const resp = Array.isArray(a.application_responses) ? a.application_responses[0] : (a.application_responses || {});
          let candidateMessage = null;
          let decidedAt = null;
          try {
            const { data: dec } = await supabase.rpc('get_my_application_decision', { p_application_id: a.id });
            candidateMessage = dec?.candidateMessage || null;
            decidedAt = dec?.decidedAt || null;
          } catch { /* decision unavailable yet */ }
          return {
            id: a.id,
            applicationNumber: a.application_number,
            yearOfStudy: a.year_of_study,
            department: a.department,
            primaryDomain: a.primary_domain,
            secondaryDomain: a.secondary_domain,
            status: a.status,
            resumeFileName: a.resume_file_name,
            resumeUrl: null,
            submittedAt: a.submitted_at,
            responses: resp || {},
            candidateMessage,
            decidedAt,
            interviews: (a.interviews || []).filter((i) => i.status !== 'CANCELLED'),
          };
        }));
      return mapped;
    } catch {
      return [];
    }
  },

  async withdrawApplication(applicationId, reason) {
    const { data, error } = await supabase.rpc('withdraw_application_atomic', {
      p_application_id: applicationId,
      p_reason: reason || 'Candidate requested withdrawal',
    });
    if (error) throw createDomainError('WITHDRAW_FAILED', error.message);
    return data;
  },

  async getApplicationTrackingStatus(applicationNumber, trackingSecret) {
    const cleanNum = (applicationNumber || '').trim();
    const cleanSec = (trackingSecret || '').trim();
    if (!cleanNum || !cleanSec) {
      throw createDomainError('MISSING_CREDENTIALS', 'Application Number and Secret Key are required.');
    }
    if (!/^AMIEE-\d{4}-\d{4,}$/i.test(cleanNum)) {
      throw createDomainError('INVALID_FORMAT', 'Application number format is invalid.');
    }

    const { data, error } = await supabase.rpc('get_sanitized_application_by_secret', {
      p_application_number: cleanNum,
      p_tracking_secret: cleanSec,
    });

    if (error) {
      throw createDomainError('INVALID_TRACKING_CREDENTIALS', 'Invalid Application Number or Tracking Secret.');
    }

    return data;
  },

  getStatusBySecret(appNum, sec) {
    return api.getApplicationTrackingStatus(appNum, sec);
  },

  // ==========================================
  // 7. ADMIN PIPELINE & BUSINESS OPERATIONS
  // ==========================================

  async listApplicationsPaginated({
    page = 1,
    limit = 20,
    domain = 'ALL',
    status = 'ALL',
    search = '',
    sortBy = 'submitted_at',
    ascending = false,
  }) {
    const safePage = Number.isInteger(Number(page)) && Number(page) >= 1 ? Math.min(Number(page), 1000) : 1;
    const safeLimit = Number.isInteger(Number(limit)) ? Math.min(Math.max(Number(limit), 1), 100) : 20;
    const ALLOWED_SORT = new Set(['submitted_at', 'application_number', 'status', 'primary_domain', 'department', 'year_of_study']);
    const safeSort = ALLOWED_SORT.has(sortBy) ? sortBy : 'submitted_at';
    const session = await api.getCurrentUserSession();
    const role = session?.user?.role || 'APPLICANT';
    const canViewSensitiveContact = role === 'ADMIN' || role === 'SUPER_ADMIN';
    const from = (safePage - 1) * safeLimit;
    const to = from + safeLimit - 1;
    const studentSelectFields = canViewSensitiveContact
      ? 'id, full_name, srm_email, net_id, phone_number'
      : 'id, full_name, net_id';

    let query = supabase
      .from('applications')
      .select(`
        id,
        application_number,
        year_of_study,
        department,
        primary_domain,
        secondary_domain,
        status,
        submitted_at,
        students!inner (
          ${studentSelectFields}
        )
      `, { count: 'exact' });

    if (domain !== 'ALL') {
      query = query.eq('primary_domain', domain);
    }

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const cleanSearch = typeof search === 'string' ? search.trim().replace(/[%_,()_l.:]/g, '').slice(0, 64) : '';
    if (cleanSearch) {
      const term = `%${cleanSearch}%`;
      query = query.or(`application_number.ilike.${term},department.ilike.${term},students.full_name.ilike.${term},students.net_id.ilike.${term}`);
    }

    query = query.order(safeSort, { ascending: Boolean(ascending) }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw createDomainError('QUERY_FAILED', error.message);

    const items = (data || []).map(a => ({
      id: a.id,
      applicationNumber: a.application_number,
      fullName: a.students?.full_name || 'N/A',
      email: canViewSensitiveContact ? (a.students?.srm_email || 'N/A') : 'Restricted',
      netId: a.students?.net_id || 'N/A',
      phoneNumber: canViewSensitiveContact ? (a.students?.phone_number || 'N/A') : 'Restricted',
      department: a.department,
      yearOfStudy: a.year_of_study,
      primaryDomain: a.primary_domain,
      secondaryDomain: a.secondary_domain,
      status: a.status,
      submittedAt: a.submitted_at,
    }));

    return {
      items,
      totalCount: count || 0,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil((count || 0) / safeLimit),
    };
  },

  async getApplicationDossier(applicationId) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        id,
        application_number,
        year_of_study,
        department,
        primary_domain,
        secondary_domain,
        status,
        resume_url,
        resume_file_name,
        submitted_at,
        students (
          id,
          full_name,
          srm_email,
          net_id,
          phone_number,
          year_of_study,
          department
        ),
        application_responses (
          why_join,
          contribution,
          portfolio_url,
          additional_info
        ),
        interviews (
          id,
          round_number,
          interview_type,
          scheduled_at,
          duration_minutes,
          location,
          meeting_url,
          status
        ),
        application_evaluations (
          id,
          interview_id,
          technical_score,
          problem_solving_score,
          communication_score,
          teamwork_score,
          domain_score,
          weighted_total,
          recommendation,
          strengths,
          concerns,
          is_finalized,
          reviewer_id,
          admin_users (full_name, email)
        ),
        application_decisions (
          id,
          decision,
          rejection_reason,
          decision_notes,
          candidate_message,
          override_reason,
          decided_at,
          admin_users (full_name)
        ),
        application_notes (
          id,
          note_text,
          created_at,
          admin_users (full_name, email)
        ),
        application_events (
          id,
          event_type,
          from_status,
          to_status,
          reason,
          created_at,
          actor_email
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error) throw createDomainError('DOSSIER_NOT_FOUND', error.message);
    return data;
  },

  async transitionStatus(applicationId, newStatus, reason) {
    const ALLOWED = new Set(['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'SELECTED', 'REJECTED', 'WITHDRAWN']);
    if (!applicationId) throw createDomainError('INVALID_INPUT', 'Application ID is required.');
    if (!ALLOWED.has(newStatus)) throw createDomainError('INVALID_STATUS', 'Invalid application status.');
    const { data, error } = await supabase.rpc('transition_application_status_atomic', {
      p_application_id: applicationId,
      p_to_status: newStatus,
      p_reason: (reason || 'Pipeline status transition').slice(0, 1000),
    });
    if (error) throw createDomainError('TRANSITION_FAILED', error.message);
    return data;
  },

  async addNote(applicationId, noteText) {
    const clean = typeof noteText === 'string' ? noteText.trim() : '';
    if (!applicationId) throw createDomainError('INVALID_INPUT', 'Application ID is required.');
    if (!clean) throw createDomainError('INVALID_NOTE', 'Note text is required.');
    if (clean.length > 5000) throw createDomainError('INVALID_NOTE', 'Note text must be under 5,000 characters.');
    const { data, error } = await supabase.rpc('add_application_note_atomic', {
      p_application_id: applicationId,
      p_note_text: clean,
    });
    if (error) throw createDomainError('NOTE_FAILED', error.message);
    return data;
  },

  // ==========================================
  // 8. INTERVIEW SUBSYSTEM OPERATIONS (Atomic)
  // ==========================================

  async scheduleInterview({ applicationId, roundNumber = 1, interviewType = 'TECHNICAL', scheduledAt, durationMinutes = 30, location, meetingUrl, panelStaffIds = [] }) {
    if (!applicationId) {
      throw createDomainError('INVALID_INPUT', 'Application ID is required.');
    }
    if (!scheduledAt || Number.isNaN(Date.parse(scheduledAt))) {
      throw createDomainError('INVALID_SCHEDULE', 'Scheduled date and time are required.');
    }
    const safeRound = Number(roundNumber);
    const safeDuration = Number(durationMinutes);
    if (!Number.isInteger(safeRound) || safeRound < 1 || safeRound > 20) {
      throw createDomainError('INVALID_SCHEDULE', 'Round number must be between 1 and 20.');
    }
    if (!Number.isInteger(safeDuration) || safeDuration < 5 || safeDuration > 480) {
      throw createDomainError('INVALID_SCHEDULE', 'Duration must be between 5 and 480 minutes.');
    }
    const safePanel = Array.isArray(panelStaffIds) ? panelStaffIds : [];
    const cleanMeeting = (meetingUrl || '').trim();
    if (cleanMeeting && !/^https?:\/\/.+\..+/.test(cleanMeeting)) {
      throw createDomainError('INVALID_URL', 'Meeting URL must start with http(s)://.');
    }

    const { data, error } = await supabase.rpc('schedule_interview_atomic', {
      p_application_id: applicationId,
      p_round_number: safeRound,
      p_interview_type: interviewType,
      p_scheduled_at: scheduledAt,
      p_duration_minutes: safeDuration,
      p_location: (location || 'Online / SRM Tech Lab').slice(0, 255),
      p_meeting_url: cleanMeeting || null,
      p_panel_staff_ids: safePanel.length > 0 ? safePanel : null,
    });

    if (error) throw createDomainError('SCHEDULE_FAILED', error.message);
    return data;
  },

  async submitEvaluation({
    interviewId,
    applicationId,
    technicalScore = 8,
    problemSolvingScore = 8,
    communicationScore = 8,
    teamworkScore = 8,
    domainScore = 8,
    recommendation = 'CONSIDER',
    strengths = '',
    concerns = '',
    isFinalized = false,
  }) {
    const scores = [technicalScore, problemSolvingScore, communicationScore, teamworkScore, domainScore].map(Number);
    if (scores.some(s => isNaN(s) || s < 1 || s > 10)) {
      throw createDomainError('INVALID_SCORES', 'Evaluation scores must be between 1.0 and 10.0.');
    }

    const { data, error } = await supabase.rpc('submit_interview_evaluation_atomic', {
      p_application_id: applicationId,
      p_interview_id: interviewId,
      p_technical_score: Number(technicalScore),
      p_problem_solving_score: Number(problemSolvingScore),
      p_communication_score: Number(communicationScore),
      p_teamwork_score: Number(teamworkScore),
      p_domain_score: Number(domainScore),
      p_recommendation: recommendation,
      p_strengths: strengths,
      p_concerns: concerns,
      p_is_finalized: isFinalized,
    });

    if (error) throw createDomainError('EVALUATION_FAILED', error.message);
    return data;
  },

  async makeDecision({ applicationId, decision, rejectionReason, decisionNotes, candidateMessage, overrideReason }) {
    if (!decision || !['SELECTED', 'REJECTED'].includes(decision)) {
      throw createDomainError('INVALID_DECISION', 'Decision must be either SELECTED or REJECTED.');
    }

    const { data, error } = await supabase.rpc('make_final_decision_atomic', {
      p_application_id: applicationId,
      p_decision: decision,
      p_rejection_reason: rejectionReason || null,
      p_decision_notes: decisionNotes || null,
      p_candidate_message: candidateMessage || null,
      p_override_reason: overrideReason || null,
    });

    if (error) throw createDomainError('DECISION_FAILED', error.message);
    return data;
  },

  async getInterviewCalendar() {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        id,
        round_number,
        interview_type,
        scheduled_at,
        duration_minutes,
        location,
        meeting_url,
        status,
        applications (
          id,
          application_number,
          primary_domain,
          students (full_name, srm_email, net_id)
        )
      `)
      .order('scheduled_at', { ascending: true });

    if (error) throw createDomainError('CALENDAR_FETCH_FAILED', error.message);
    return data || [];
  },

  // ==========================================
  // 9. STAFF MANAGEMENT & INVITATIONS
  // ==========================================

  async inviteStaffMember({ email, role }) {
    const { data, error } = await supabase.rpc('invite_staff_member', {
      p_email: email,
      p_role: role,
    });
    if (error) throw createDomainError('INVITE_FAILED', error.message);
    return data;
  },

  async acceptStaffInvitation(inviteToken) {
    if (!inviteToken || !inviteToken.trim()) {
      throw createDomainError('INVALID_TOKEN', 'Invitation token is required.');
    }

    const { data, error } = await supabase.rpc('accept_staff_invitation', {
      p_invite_token: inviteToken.trim(),
    });
    if (error) throw createDomainError('ACCEPT_INVITE_FAILED', error.message);
    return data;
  },

  async changeStaffRole(staffId, newRole) {
    const { data, error } = await supabase.rpc('change_staff_role_atomic', {
      p_staff_id: staffId,
      p_new_role: newRole,
    });
    if (error) throw createDomainError('ROLE_CHANGE_FAILED', error.message);
    return data;
  },

  async disableStaffMember(staffId) {
    const { data, error } = await supabase.rpc('disable_staff_member_atomic', {
      p_staff_id: staffId,
    });
    if (error) throw createDomainError('DISABLE_STAFF_FAILED', error.message);
    return data;
  },

  async restoreStaffMember(staffId) {
    const { data, error } = await supabase.rpc('restore_staff_member_atomic', {
      p_staff_id: staffId,
    });
    if (error) throw createDomainError('RESTORE_STAFF_FAILED', error.message);
    return data;
  },

  async assignUserRole({ email, newRole, userId, userType }) {
    if (userType === 'STAFF' && userId) {
      return this.changeStaffRole(userId, newRole);
    }
    return this.inviteStaffMember({ email, role: newRole });
  },

  async cleanupExpiredResumes(retentionDays = 180) {
    const { data, error } = await supabase.rpc('cleanup_expired_resumes_atomic', {
      p_retention_days: retentionDays,
    });
    if (error) throw createDomainError('RETENTION_CLEANUP_FAILED', error.message);
    return data;
  },

  async listStaffDirectory() {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, email, full_name, role, is_active, department, created_at')
      .order('created_at', { ascending: false });

    if (error) throw createDomainError('STAFF_DIRECTORY_FETCH_FAILED', error.message);

    return (data || []).map((s) => ({
      id: s.id,
      email: s.email,
      fullName: s.full_name,
      role: s.role,
      isActive: s.is_active,
      userType: 'STAFF',
      department: s.department || 'Operations',
      createdAt: s.created_at,
    }));
  },

  async listApplicantDirectory() {
    const { data, error } = await supabase
      .from('students')
      .select('id, srm_email, net_id, full_name, year_of_study, department, created_at')
      .order('created_at', { ascending: false });

    if (error) throw createDomainError('APPLICANT_DIRECTORY_FETCH_FAILED', error.message);

    return (data || []).map((st) => ({
      id: st.id,
      email: st.srm_email,
      netId: st.net_id,
      fullName: st.full_name,
      role: 'APPLICANT',
      isActive: true,
      userType: 'APPLICANT',
      department: st.department || 'Computer Science',
      yearOfStudy: st.year_of_study || 1,
      createdAt: st.created_at,
    }));
  },

  // ==========================================
  // 10. RECRUITMENT CYCLE MANAGEMENT & DYNAMIC QUESTIONS
  // ==========================================

  async getActiveCycle() {
    const { data, error } = await supabase
      .from('recruitment_cycles')
      .select('*')
      .eq('status', 'ACTIVE')
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      throw createDomainError('NO_ACTIVE_CYCLE', 'No active recruitment cycle currently open for application submissions.');
    }

    return { ...data, academicYear: data.academic_year };
  },

  async listCycles() {
    const { data, error } = await supabase
      .from('recruitment_cycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw createDomainError('CYCLES_FETCH_FAILED', error.message);
    return data || [];
  },

  async createCycle({ name, academicYear, startDate, endDate }) {
    const { data, error } = await supabase.rpc('create_recruitment_cycle_atomic', {
      p_name: name,
      p_academic_year: academicYear,
      p_start_date: startDate || new Date().toISOString(),
      p_end_date: endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
    });
    if (error) throw createDomainError('CYCLE_CREATE_FAILED', error.message);
    return data;
  },

  async openCycle(cycleId) {
    const { data, error } = await supabase.rpc('open_recruitment_cycle_atomic', { p_cycle_id: cycleId });
    if (error) throw createDomainError('CYCLE_OPEN_FAILED', error.message);
    return data;
  },

  async pauseCycle(cycleId) {
    const { data, error } = await supabase.rpc('pause_recruitment_cycle_atomic', { p_cycle_id: cycleId });
    if (error) throw createDomainError('CYCLE_PAUSE_FAILED', error.message);
    return data;
  },

  async closeCycle(cycleId) {
    const { data, error } = await supabase.rpc('close_recruitment_cycle_atomic', { p_cycle_id: cycleId });
    if (error) throw createDomainError('CYCLE_CLOSE_FAILED', error.message);
    return data;
  },

  async archiveCycle(cycleId) {
    const { data, error } = await supabase.rpc('archive_recruitment_cycle_atomic', { p_cycle_id: cycleId });
    if (error) throw createDomainError('CYCLE_ARCHIVE_FAILED', error.message);
    return data;
  },

  // ==========================================
  // 11. PRIVILEGED SERVER-SIDE ANALYTICS (Zero Fake Fallback)
  // ==========================================

  async getPipelineAnalytics(cycleId = null) {
    const { data, error } = await supabase.rpc('get_pipeline_analytics', {
      p_cycle_id: cycleId,
    });

    if (error) {
      throw createDomainError('ANALYTICS_UNAVAILABLE', error.message || 'Pipeline analytics service is currently unavailable.');
    }

    return data;
  },

  // ==========================================
  // 12. DPDP ACT 2023 DATA PRIVACY RIGHTS
  // ==========================================

  async requestDpdpDataErasure() {
    // Edge Function is authoritative: it deletes physical storage objects via
    // service_role BEFORE anonymising the DB. No direct-RPC fallback — falling
    // back would retain PDFs while reporting success.
    const { data, error } = await supabase.functions.invoke('privacy-deletion', {
      body: { confirmation: 'DELETE_MY_ACCOUNT_PERMANENTLY' },
    });

    if (error || !data?.success) {
      throw createDomainError('ERASURE_FAILED', data?.error || error?.message || 'Privacy deletion failed. Please retry while online.');
    }
    await api.logout();
    return data;
  },

  // ==========================================
  // 13. FORMULA-INJECTION SAFE CSV EXPORT
  // ==========================================

  sanitizeCsvCell(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    // Excel trims leading spaces/dots before evaluating formulas, so strip
    // them for the prefix test as well.
    const probe = str.replace(/^[ \t\uFEFF.]+/, '');
    if (/^[=+\-@\t\r\n|%;]/.test(str) || /^[=+\-@|%;]/.test(probe)) {
      str = "'" + str;
    }
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  },

  exportApplicationsToCsv(applications) {
    if (!applications || applications.length === 0) {
      throw createDomainError('EMPTY_EXPORT', 'No candidate records available to export.');
    }

    const headers = [
      'Application Number',
      'Candidate Name',
      'SRM NetID',
      'Contact Email',
      'Phone Number',
      'Department',
      'Year of Study',
      'Primary Domain',
      'Secondary Domain',
      'Status',
      'Submission Timestamp',
    ];

    const rows = applications.map(app => [
      api.sanitizeCsvCell(app.application_number || app.applicationNumber),
      api.sanitizeCsvCell(app.candidate_name || app.fullName),
      api.sanitizeCsvCell(app.net_id || app.netId),
      api.sanitizeCsvCell(app.srm_email || app.email),
      api.sanitizeCsvCell(app.phone_number || app.phoneNumber),
      api.sanitizeCsvCell(app.department),
      api.sanitizeCsvCell(app.year_of_study || app.yearOfStudy),
      api.sanitizeCsvCell(app.primary_domain || app.primaryDomain),
      api.sanitizeCsvCell(app.secondary_domain || app.secondaryDomain || 'N/A'),
      api.sanitizeCsvCell(app.status),
      api.sanitizeCsvCell(app.submitted_at || app.submittedAt),
    ]);

    const csvContent = ['﻿' + headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AMIEE_Recruitment_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  },
};
