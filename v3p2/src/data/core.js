import { CREATOR, fellowsOrder } from './team';

export const CREATOR_TAG = 'Creator of this website';

const PEOPLE = {
  Aarya: {
    area: 'All domains',
    tag: 'President',
    about: 'Works across every domain of the club, helping teams stay connected, projects moving and the community welcoming to new members.',
  },
  'Bedabrata Bhattacharjee': {
    area: 'All domains · Report Team',
    tag: 'Secretary',
    about: 'Works across all domains, keeps the club accounts in order and helps the Report Team with event records, minutes of meetings and schedules.',
  },
  'Sai Srikanth': {
    area: 'All domains · Technical Team',
    tag: 'Secretary',
    about: 'Works across all domains and is also active in the Technical Team, keeping teams connected and answering questions from members and newcomers.',
  },
  [CREATOR]: {
    area: 'Technical Team',
    tag: CREATOR_TAG,
    about: 'Designed and built this website, and works with the Technical Team on registration pages, databases and the infrastructure behind the club projects.',
  },
  Harshini: {
    area: 'Creatives',
    about: 'Contributes to media campaigns and event content, helping every project and programme look as good as the work behind it.',
  },
  Tharun: {
    area: 'Technical Team',
    tag: 'Head',
    about: 'Works on the club website, event registration pages and databases, and on the technical projects the club takes up through the year.',
  },
  'Akash Priyan G': {
    area: 'Report Team',
    tag: 'Head',
    about: 'Looks after the official records, documenting each event with minutes of meetings and timelines so nothing is lost along the way.',
  },
  Monisha: {
    area: 'Creatives',
    about: 'Works on promotion and visibility, shaping the posts, posters and stories that carry the club work out to the community.',
  },
  Esakkimadan: {
    area: 'Creatives · Report Team',
    tag: 'Lead',
    about: 'Works on media campaigns and content for the Creatives team, and helps the Report Team document events accurately.',
  },
  Krithika: {
    area: 'Creatives',
    about: 'Covers event photography and media content, and helps promote everything the club runs so it reaches the whole campus.',
  },
  Dharun: {
    area: 'Technical Team',
    about: 'Builds and maintains the club technical projects and the tools behind its events, from registration pages to the data underneath.',
  },
  Prithviraj: {
    area: 'Creatives',
    about: 'Creates visuals and content that give the club events and projects a recognisable look, from campaigns to event media.',
  },
  Amrita: {
    area: 'Report Team',
    about: 'Supports compliance paperwork and event documentation so every activity the club runs is properly recorded.',
  },
  Kiruthika: {
    area: 'Report Team',
    about: 'Records meetings and events accurately, helping the club keep a clear and dependable history of what it has done.',
  },
  Tamilselvan: {
    area: 'Report Team',
    about: 'Keeps the official documents up to date, from event records and timelines to the paperwork each activity needs.',
  },
  Nethra: {
    area: 'Corporate Team',
    about: 'Plans sponsorships and outreach, building the connections with companies and founders that help support the club events.',
  },
  Harish: {
    area: 'Corporate Team',
    tag: 'Mentor',
    about: 'Guides the Corporate Team on sponsorships, partnerships and outreach to the companies and founders the club works with.',
  },
};

// Public profiles. Only accounts confirmed as the right person are listed; a photo is the person's own GitHub picture,
// served from /public/team. Anyone without a photo shows their initial.
const PROFILES = {
  [CREATOR]: { github: 'kkm121', linkedin: 'm-muthu-kumaran-expert', photo: '/team/muthu.jpg' },
  Aarya: { github: 'Aarya21106', photo: '/team/aarya21106.jpg' },
  Esakkimadan: { github: 'ESAKKIMADAN', photo: '/team/esakkimadan.jpg' },
  Tharun: { github: 'Tharunoff' },
  'Sai Srikanth': { linkedin: 'saisrikanths', photo: '/team/saisrikanth.jpg' },
  'Bedabrata Bhattacharjee': { linkedin: 'bedabrata-bhattacharjee-b2b62437b', photo: '/team/bedabrata.jpg' },
  Kiruthika: { linkedin: 'kiruthika-n-827b43381', photo: '/team/kiruthika.jpg' },
  Monisha: { linkedin: 'monisha-n-7abb532b1', photo: '/team/monisha.jpg' },
  Nethra: { linkedin: 'nethra-b-0925752a6', photo: '/team/nethra.jpg' },
  Tamilselvan: { photo: '/team/tamilselvan.jpg' },
};

export const coreTeam = [...fellowsOrder, 'Harish'].map((name, i) => ({
  name,
  index: String(i + 1).padStart(2, '0'),
  creator: name === CREATOR,
  ...PEOPLE[name],
  ...PROFILES[name],
}));
