import { CREATOR, fellowsOrder } from './team';

export const CREATOR_TAG = 'Creator of this website';

const PEOPLE = {
  Aarya: {
    area: 'All domains',
    tag: 'President',
    about: 'Works across every domain of the lab, helping teams stay connected, projects moving and the community welcoming to new members.',
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
    about: 'Designed and built this website, and works with the Technical Team on registration pages, databases and the infrastructure behind the lab projects.',
  },
  Harshini: {
    area: 'Creatives',
    about: 'Contributes to media campaigns and event content, helping every project and programme look as good as the work behind it.',
  },
  Tharun: {
    area: 'Technical Team',
    tag: 'Head',
    about: 'Works on the club website, event registration pages and databases, and on the technical projects the lab takes up through the year.',
  },
  'Akash Priyan G': {
    area: 'Report Team',
    tag: 'Head',
    about: 'Looks after the official records, documenting each event with minutes of meetings and timelines so nothing is lost along the way.',
  },
  Monisha: {
    area: 'Creatives',
    about: 'Works on promotion and visibility, shaping the posts, posters and stories that carry the lab work out to the community.',
  },
  Esakkimadan: {
    area: 'Creatives · Report Team',
    tag: 'Lead',
    about: 'Works on media campaigns and content for the Creatives team, and helps the Report Team document events accurately.',
  },
  Krithika: {
    area: 'Creatives',
    about: 'Covers event photography and media content, and helps promote everything the lab runs so it reaches the whole campus.',
  },
  Dharun: {
    area: 'Technical Team',
    about: 'Builds and maintains the lab technical projects and the tools behind its events, from registration pages to the data underneath.',
  },
  Prithviraj: {
    area: 'Creatives',
    about: 'Creates visuals and content that give the lab events and projects a recognisable look, from campaigns to event media.',
  },
  Amrita: {
    area: 'Report Team',
    about: 'Supports compliance paperwork and event documentation so every activity the lab runs is properly recorded.',
  },
  Kiruthika: {
    area: 'Report Team',
    about: 'Records meetings and events accurately, helping the lab keep a clear and dependable history of what it has done.',
  },
  Tamilselvan: {
    area: 'Report Team',
    about: 'Keeps the official documents up to date, from event records and timelines to the paperwork each activity needs.',
  },
  Nethra: {
    area: 'Corporate Team',
    about: 'Plans sponsorships and outreach, building the connections with companies and founders that help support the lab events.',
  },
  Harish: {
    area: 'Corporate Team',
    tag: 'Mentor',
    about: 'Guides the Corporate Team on sponsorships, partnerships and outreach to the companies and founders the lab works with.',
  },
};

export const coreTeam = [...fellowsOrder, 'Harish'].map((name, i) => ({
  name,
  index: String(i + 1).padStart(2, '0'),
  creator: name === CREATOR,
  ...PEOPLE[name],
}));
