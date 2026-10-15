export const START = 0.58;
export const Z0 = 6.6;
export const ZTOT = 310;
export const CAGE_END = -120;
export const LAT_RINGS = 28;
export const LAT_STEP = 2.5;
export const ROOM_START = CAGE_END - LAT_RINGS * LAT_STEP;
export const ROOM_END = ROOM_START - 62;
export const CONNECT_END = -283;

const pAt = (z) => START + (1 - START) * ((Z0 - z) / ZTOT);

export const CHAPTERS = [
  { num: 'I', verb: 'Build', domain: 'Technical Core', line: 'Structure comes first.', color: '#00f5d4', from: 0.6, to: pAt(CAGE_END) },
  { num: 'II', verb: 'Discover', domain: 'R&D', line: 'A network finds its shape.', color: '#8b5cf6', from: pAt(CAGE_END), to: pAt(ROOM_START) },
  { num: 'III', verb: 'Create', domain: 'Spatial Design', line: 'Colour and light arrive.', color: '#ff4d8d', from: pAt(ROOM_START), to: pAt(ROOM_END) },
  { num: 'IV', verb: 'Connect', domain: 'Corporate and Operations', line: 'Other worlds, other crews.', color: '#38bdf8', from: pAt(ROOM_END), to: pAt(CONNECT_END) },
  { num: 'V', verb: 'Record', domain: 'Operations and Media', line: 'The voyage is written down.', color: '#f5c84b', from: pAt(CONNECT_END), to: 1.001 },
];

export const chapterAt = (p) => CHAPTERS.findIndex((c) => p >= c.from && p < c.to);

export const pAtZ = (z) => START + (1 - START) * ((Z0 - z) / ZTOT);
