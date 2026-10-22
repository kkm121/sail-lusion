// Shared flags between the voyage's DOM side and its 3D scene. Kept free of three.js so the page bundle stays small.
// warm: true during the first frames, when every chapter must draw once so its shaders are compiled
export const labState = { nav: false, warm: false };
