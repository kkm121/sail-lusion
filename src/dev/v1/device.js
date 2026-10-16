export function isTouchDevice() {
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

export function isPhoneInDesktopMode() {
  const shortSide = Math.min(window.screen.width, window.screen.height);
  return isTouchDevice() && shortSide < 700 && window.innerWidth > shortSide * 1.35;
}