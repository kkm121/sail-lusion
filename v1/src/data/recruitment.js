export const DOMAINS = [
  { id: 'TECHNICAL', label: 'Technical Core', desc: 'Robotics, RL, WebGL, High-Performance Systems' },
  { id: 'RESEARCH_AND_DEVELOPMENT', label: 'R&D & Quantum', desc: 'Applied Mathematics, Neuromorphic & Tensor Compute' },
  { id: 'CREATIVE', label: 'Creative & Design', desc: 'Spatial UI/UX, Motion Design & 3D Shaders' },
  { id: 'OPERATIONS_AND_MANAGEMENT', label: 'Operations & Events', desc: 'Symposium Logistics, Hackathons & Club Governance' },
  { id: 'CORPORATE_RELATIONS', label: 'Corporate & PR', desc: 'Industry Partnerships, Grants & Outreach' },
];

export const APPLICATION_STATUSES = [
  { id: 'NEW', label: 'Under Review', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30' },
  { id: 'REVIEWING', label: 'In Evaluation', color: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  { id: 'SHORTLISTED', label: 'Shortlisted', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  { id: 'INTERVIEW', label: 'Interview Scheduled', color: 'text-blue-400 bg-blue-400/10 border-blue-400/30' },
  { id: 'SELECTED', label: 'Selected / Offer', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  { id: 'REJECTED', label: 'Rejected', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
  { id: 'WITHDRAWN', label: 'Withdrawn', color: 'text-gray-400 bg-gray-400/10 border-gray-400/30' },
];

export const ROLE_LABELS = {
  SUPER_ADMIN: '👑 Super Administrator',
  ADMIN: '★ Administrator',
  INTERVIEWER: '⚡ Interviewer Panelist',
  VIEWER: '👁️ Faculty Viewer',
  APPLICANT: '📝 Candidate Applicant',
};

export const RECOMMENDATIONS = [
  { id: 'STRONG_HIRE', label: 'Strong Hire', color: 'text-emerald-400' },
  { id: 'HIRE', label: 'Hire', color: 'text-cyan-400' },
  { id: 'CONSIDER', label: 'Consider', color: 'text-amber-400' },
  { id: 'NO_HIRE', label: 'No Hire', color: 'text-orange-400' },
  { id: 'STRONG_NO_HIRE', label: 'Strong No Hire', color: 'text-rose-400' },
];
