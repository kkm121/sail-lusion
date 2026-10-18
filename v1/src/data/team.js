export const CREATOR = 'M Muthu Kumaran';

export const leadershipTeam = [
  {
    name: 'Aarya',
    role: 'President',
    division: 'Executive Leadership',
    badge: 'PRESIDENT',
    badgeStyle: 'bg-red-500/15 text-red-400 border-red-500/30',
    bio: 'Sets the direction of FireFly, represents the club, and guides every team towards its goals.',
  },
  {
    name: 'Bedabrata Bhattacharjee',
    role: 'Secretary',
    division: 'Executive Leadership',
    badge: 'SECRETARY',
    badgeStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bio: 'Coordinates across all domains as a core pillar of the club, serves as Treasurer managing club finances, and supports the Report Team with event records, minutes of meetings, and scheduling.',
  },
  {
    name: 'Sai Srikanth',
    role: 'Secretary',
    division: 'Executive Leadership',
    badge: 'SECRETARY',
    badgeStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    bio: 'Leads internal coordination across all domains as a core pillar of the club, and is also active within the Technical Team. First point of contact for queries.',
  },
];

export const teams = [
  {
    id: 'technical',
    name: 'Technical Team',
    accent: 'text-cyan-400',
    blurb: 'Builds and maintains the club website, builds registration pages and databases for every event, and owns all technical and project work for the lab. Secretary Sai Srikanth also works within this team.',
    lead: { name: 'Tharun', role: 'Head' },
    members: ['Dharun', CREATOR],
  },
  {
    id: 'corporate',
    name: 'Corporate Team',
    accent: 'text-emerald-400',
    blurb: 'Plans sponsorships and outreach, and builds connections with sponsors, founders, and companies to support club events.',
    lead: null,
    mentor: 'Harish',
    members: ['Nethra'],
  },
  {
    id: 'creatives',
    name: 'Creatives',
    accent: 'text-pink-400',
    blurb: 'Runs media campaigns, event photography and content, and promotion and visibility for everything the club runs.',
    lead: { name: 'Esakkimadan', role: 'Lead' },
    members: ['Prithviraj', 'Krithika', 'Monisha', 'Harshini'],
  },
  {
    id: 'report',
    name: 'Report Team',
    accent: 'text-purple-400',
    blurb: 'Maintains all official club records, documents every event with minutes of meetings and timelines, and handles compliance paperwork.',
    lead: { name: 'Akash Priyan G', role: 'Head' },
    members: ['Esakkimadan', 'Tamilselvan', 'Kiruthika', 'Amrita'],
  },
];

export const teamNames = (id) => {
  const team = teams.find((t) => t.id === id);
  if (!team) return [];
  return [...(team.lead ? [team.lead.name] : []), ...team.members, ...(team.mentor ? [team.mentor] : [])];
};
export const fellowsOrder = [
  'Aarya',
  'Bedabrata Bhattacharjee',
  'Sai Srikanth',
  CREATOR,
  'Harshini',
  'Tharun',
  'Akash Priyan G',
  'Monisha',
  'Esakkimadan',
  'Krithika',
  'Dharun',
  'Prithviraj',
  'Amrita',
  'Kiruthika',
  'Tamilselvan',
  'Nethra',
];
