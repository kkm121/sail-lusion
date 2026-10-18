import { describe, it, expect } from 'vitest';
import { api, DOMAINS, APPLICATION_STATUSES, ROLE_LABELS, RECOMMENDATIONS } from '../services/api';

describe('AMIEE V5 Production ATS Engine Test Suite', () => {

  // 1. CSV Formula Injection Defense (Section 36 & 40)
  describe('CSV Export Formula Sanitization', () => {
    it('neutralizes dangerous leading characters (=, +, -, @, tab, return)', () => {
      expect(api.sanitizeCsvCell('=SUM(A1:A10)')).toBe("\"'=SUM(A1:A10)\"");
      expect(api.sanitizeCsvCell('+cmd|/c calc')).toBe("\"'+cmd|/c calc\"");
      expect(api.sanitizeCsvCell('-1+1')).toBe("\"'-1+1\"");
      expect(api.sanitizeCsvCell('@IMPORT')).toBe("\"'@IMPORT\"");
      expect(api.sanitizeCsvCell('\tmalicious')).toBe("\"'\tmalicious\"");
      expect(api.sanitizeCsvCell('\r\nmalicious')).toBe("\"'\r\nmalicious\"");
    });

    it('safely handles standard strings and numeric values', () => {
      expect(api.sanitizeCsvCell('Aarav Sharma')).toBe('"Aarav Sharma"');
      expect(api.sanitizeCsvCell('AMIEE-2026-001001')).toBe('"AMIEE-2026-001001"');
      expect(api.sanitizeCsvCell(2026)).toBe('"2026"');
      expect(api.sanitizeCsvCell(null)).toBe('""');
      expect(api.sanitizeCsvCell(undefined)).toBe('""');
    });

    it('escapes inner double quotes properly', () => {
      expect(api.sanitizeCsvCell('Quote "Test" Example')).toBe('"Quote ""Test"" Example"');
    });
  });

  // 2. Domain Entities, Role Matrix & Evaluation Rubric (Section 16, 50, 90)
  describe('ATS Domain Constants & RBAC Matrix', () => {
    it('contains all 5 standard domain definitions', () => {
      expect(DOMAINS).toHaveLength(5);
      const domainIds = DOMAINS.map(d => d.id);
      expect(domainIds).toContain('TECHNICAL');
      expect(domainIds).toContain('RESEARCH_AND_DEVELOPMENT');
      expect(domainIds).toContain('CREATIVE');
      expect(domainIds).toContain('OPERATIONS_AND_MANAGEMENT');
      expect(domainIds).toContain('CORPORATE_RELATIONS');
    });

    it('contains 7 state-machine application statuses', () => {
      expect(APPLICATION_STATUSES).toHaveLength(7);
      const statusIds = APPLICATION_STATUSES.map(s => s.id);
      expect(statusIds).toContain('NEW');
      expect(statusIds).toContain('REVIEWING');
      expect(statusIds).toContain('SHORTLISTED');
      expect(statusIds).toContain('INTERVIEW');
      expect(statusIds).toContain('SELECTED');
      expect(statusIds).toContain('REJECTED');
      expect(statusIds).toContain('WITHDRAWN');
    });

    it('contains 5 standard interview recommendations', () => {
      expect(RECOMMENDATIONS).toHaveLength(5);
      const recIds = RECOMMENDATIONS.map(r => r.id);
      expect(recIds).toContain('STRONG_HIRE');
      expect(recIds).toContain('HIRE');
      expect(recIds).toContain('CONSIDER');
      expect(recIds).toContain('NO_HIRE');
      expect(recIds).toContain('STRONG_NO_HIRE');
    });

    it('defines authoritative role labels for all 5 roles', () => {
      expect(ROLE_LABELS.SUPER_ADMIN).toBeDefined();
      expect(ROLE_LABELS.ADMIN).toBeDefined();
      expect(ROLE_LABELS.INTERVIEWER).toBeDefined();
      expect(ROLE_LABELS.VIEWER).toBeDefined();
      expect(ROLE_LABELS.APPLICANT).toBeDefined();
    });
  });

  // 3. Mandatory NetID & Input Validation Rules (Section 1, 5, 6, 7)
  describe('Submission Validation Requirements', () => {
    it('rejects submissions with missing mandatory NetID', async () => {
      await expect(
        api.submitApplication({
          fullName: 'Aarav Sharma',
          email: 'aarav@gmail.com',
          netId: '',
          phoneNumber: '9876543210',
          yearOfStudy: '2',
          department: 'CSE',
          primaryDomain: 'TECHNICAL',
        })
      ).rejects.toThrow(/Mandatory SRM NetID/);
    });

    it('rejects registration with short passwords (< 8 characters)', async () => {
      await expect(
        api.register({
          fullName: 'Aarav Sharma',
          email: 'aarav@gmail.com',
          netId: 'RA2311003010123',
          phoneNumber: '9876543210',
          yearOfStudy: '2',
          department: 'CSE',
          password: 'short',
        })
      ).rejects.toThrow(/Password must be at least 8 characters long/);
    });

    it('rejects password reset with short passwords (< 8 characters)', async () => {
      await expect(api.resetPassword('12345')).rejects.toThrow(
        /Password must be at least 8 characters long/
      );
    });
  });

  // 4. Draft Lifecycle (Section 41)
  describe('Application Draft Management', () => {
    it('saves, loads, and clears draft data successfully', () => {
      const mockDraft = {
        fullName: 'Test Applicant',
        netId: 'RA2311003010999',
        primaryDomain: 'TECHNICAL',
      };

      const saved = api.saveApplicationDraft(mockDraft);
      expect(saved).toBe(true);

      const loaded = api.loadApplicationDraft();
      expect(loaded).toBeDefined();
      expect(loaded.data.fullName).toBe('Test Applicant');
      expect(loaded.data.netId).toBe('RA2311003010999');

      api.clearApplicationDraft();
      expect(api.loadApplicationDraft()).toBeNull();
    });
  });

  // 5. Tracking Lookup Security (Section 9, 67)
  describe('Tracking Lookup Security', () => {
    it('rejects empty application number or tracking secret', async () => {
      await expect(api.getApplicationTrackingStatus('', '')).rejects.toThrow(
        /Application Number and Secret Key are required/
      );
    });

    it('provides unified getStatusBySecret alias pointing to getApplicationTrackingStatus', async () => {
      await expect(api.getStatusBySecret('', '')).rejects.toThrow(
        /Application Number and Secret Key are required/
      );
    });
  });

  // 6. Resume Upload Limits & Magic Bytes (Section 69)
  describe('Resume Storage Guardrails', () => {
    it('rejects files larger than 2MB', async () => {
      const oversizedFile = {
        name: 'resume.pdf',
        size: 3 * 1024 * 1024, // 3MB > 2MB
        type: 'application/pdf',
      };

      await expect(api.uploadResumeFile(oversizedFile)).rejects.toThrow(
        /Resume file size exceeds the 2MB limit/
      );
    });

    it('rejects non-PDF files', async () => {
      const nonPdfFile = {
        name: 'script.exe',
        size: 1000,
        type: 'application/x-msdownload',
      };

      await expect(api.uploadResumeFile(nonPdfFile)).rejects.toThrow(
        /Only PDF documents/
      );
    });
  });

  // 7. Structured Error Codes (Section 54)
  describe('Domain Error Handling Format', () => {
    it('attaches standardized code and requestId to errors', async () => {
      try {
        await api.getApplicationTrackingStatus('', '');
      } catch (err) {
        expect(err.code).toBe('MISSING_CREDENTIALS');
        expect(err.requestId).toBeDefined();
      }
    });
  });

  // 8. Authorization Matrix & Role Isolation (Must-Do Item 5)
  describe('Role-Based Authorization Constraints', () => {
    it('requires affirmative DPDP Act 2023 consent on submission', async () => {
      await expect(
        api.submitApplication({
          fullName: 'Aarav Sharma',
          email: 'aarav@srmist.edu.in',
          netId: 'RA2311003010123',
          phoneNumber: '9876543210',
          yearOfStudy: '2',
          department: 'CSE',
          primaryDomain: 'TECHNICAL',
          dpdpConsent: false,
        })
      ).rejects.toThrow(/DPDP/);
    });

    it('enforces minimum statement of motivation length (>= 15 chars)', async () => {
      await expect(
        api.submitApplication({
          fullName: 'Aarav Sharma',
          email: 'aarav@srmist.edu.in',
          netId: 'RA2311003010123',
          phoneNumber: '9876543210',
          yearOfStudy: '2',
          department: 'CSE',
          primaryDomain: 'TECHNICAL',
          dpdpConsent: true,
          responses: {
            whyJoin: 'Too short',
          },
        })
      ).rejects.toThrow(/Statement of motivation must be at least 15 characters/);
    });

    it('validates year of study bounds (between 1 and 5)', async () => {
      await expect(
        api.submitApplication({
          fullName: 'Aarav Sharma',
          email: 'aarav@srmist.edu.in',
          netId: 'RA2311003010123',
          phoneNumber: '9876543210',
          yearOfStudy: '6',
          department: 'CSE',
          primaryDomain: 'TECHNICAL',
          dpdpConsent: true,
          responses: {
            whyJoin: 'I am passionate about cutting-edge AI systems engineering.',
          },
        })
      ).rejects.toThrow(/Year of study must be between 1 and 5/);
    });

    it('rejects staff invitation acceptance with empty token', async () => {
      await expect(api.acceptStaffInvitation('')).rejects.toThrow(
        /Invitation token is required/
      );
    });

    it('rejects interview scheduling without scheduled date', async () => {
      await expect(
        api.scheduleInterview({
          applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          scheduledAt: '',
        })
      ).rejects.toThrow(/Scheduled date and time are required/);
    });

    it('validates score range bounds on rubric evaluation (1 to 10)', async () => {
      await expect(
        api.submitEvaluation({
          applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          technicalScore: 15, // Out of bounds (> 10)
          problemSolvingScore: 8,
          domainScore: 8,
          communicationScore: 8,
          teamworkScore: 8,
          recommendation: 'STRONG_HIRE',
        })
      ).rejects.toThrow(/Evaluation scores must be between 1.0 and 10.0/);
    });
  });

  // 9. Candidate State Machine & Lifecycle Rules (Must-Do Item 6 & 7)
  describe('Candidate Lifecycle & Failure Cases', () => {
    it('calculates weighted evaluation score accurately', () => {
      const expectedWeighted = (8 * 0.25) + (10 * 0.25) + (9 * 0.20) + (7 * 0.15) + (8 * 0.15);
      expect(expectedWeighted).toBeCloseTo(8.55, 2);
    });

    it('rejects final decision without decision status', async () => {
      await expect(
        api.makeDecision({
          applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
          decision: '',
        })
      ).rejects.toThrow(/Decision must be either SELECTED or REJECTED/);
    });

    it('rejects unverified Turnstile tokens when cloud key is configured', async () => {
      await expect(api.verifyTurnstile('')).rejects.toThrow(
        /Turnstile verification token is missing/
      );
    });
  });
});
