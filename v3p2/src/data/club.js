// Content written for v3. Nothing here is invented as fact: formats describe how the club runs,
// and dated events, speakers and partners appear only once the club announces them.

export const PILLARS = [
  { n: '01', title: 'Learn', text: 'Hands-on workshops and reading groups take anyone from first model to research paper, at their own pace.' },
  { n: '02', title: 'Build', text: 'Small teams ship real projects every term, from vision toolkits to robots, with a mentor beside them.' },
  { n: '03', title: 'Share', text: 'We demo what we make, write it down and open it up, so the next member starts further ahead.' },
];

export const FORMATS = [
  { title: 'Workshops', when: 'Through the term', text: 'Practical sessions on tools and ideas, from Python and PyTorch to 3D on the web. Open to every member.', tag: 'Learn' },
  { title: 'Build sprints', when: 'A few weeks each', text: 'Short team projects with a clear goal and a mentor. They end with something that works.', tag: 'Build' },
  { title: 'Reading groups', when: 'Fortnightly', text: 'One paper or talk, read together and argued about. A gentle way into research.', tag: 'Research' },
  { title: 'Showcase', when: 'End of term', text: 'A public demo day for everything the club has made, with friends, faculty and guests.', tag: 'Share' },
  { title: 'Speaker sessions', when: 'When announced', text: 'Conversations with people building AI in labs, startups and industry.', tag: 'Talks' },
  { title: 'Socials', when: 'Every month', text: 'Food, games and time to meet people from other domains. Building is better with friends.', tag: 'Community' },
];

export const STEPS = [
  { n: '01', title: 'Say hello', text: 'Follow FireFly on Instagram and LinkedIn. Every call for members is announced there first.' },
  { n: '02', title: 'Pick a domain', text: 'Technical, R&D, Corporate, Creatives or Operations. Choose one to start; you can try others later.' },
  { n: '03', title: 'Build with the crew', text: 'Join a team, pick up a first task with a mentor, and take your work to the end-of-term showcase.' },
];

export const WANT = [
  'Curious people who like to make things, whatever their department or year.',
  'Builders who finish: a small thing shipped beats a big thing planned.',
  'People who share: notes, code, credit and a hand to whoever is stuck.',
  'No experience needed. Willingness to learn matters more than a CV.',
];

export const FAQ = [
  { q: 'Do I need experience in AI or coding?', a: 'No. Every domain has people who will help you start, and the Creatives, Corporate and Operations domains need many skills besides code.' },
  { q: 'Which departments and years can join?', a: 'Any department and any year at SRM. FireFly works with AMIEE and welcomes everyone.' },
  { q: 'How much time does it take?', a: 'A few hours a week on average, more around build sprints and events. You choose how deep you go.' },
  { q: 'When do applications open?', a: 'The online application is still being built. Follow us on Instagram to hear the moment it opens.' },
  { q: 'Can I join more than one domain?', a: 'Start with one so you can settle in, then help in others. Technical and R&D already share one team.' },
  { q: 'Is there a fee?', a: 'Membership details are announced with each recruitment call. Ask us on Instagram if you have a question before then.' },
];

export const VALUES = [
  { title: 'Equal space', text: 'Everyone on the core team has equal space and equal responsibility. A title is only a tag.' },
  { title: 'Learn by building', text: 'We learn fastest by making something real, then improving it together.' },
  { title: 'Open by default', text: 'Notes, code and slides are shared so the whole club grows, not just the team that made them.' },
  { title: 'Keep a record', text: 'The Report Team documents every event, meeting and decision, so the club remembers what it learns.' },
];

export const PARTNER_TIERS = [
  { name: 'Community', text: 'Support a single event: a workshop, a speaker session or the showcase.', gets: ['Logo on the event page and posters', 'A slot to speak to members'] },
  { name: 'Supporter', text: 'Back a full term of workshops and build sprints.', gets: ['Everything in Community', 'Logo on the website', 'A hands-on session run by your team'] },
  { name: 'Headline', text: 'Partner with FireFly across the year.', gets: ['Everything in Supporter', 'Named build sprint or challenge', 'Early access to the showcase and talent'] },
];
