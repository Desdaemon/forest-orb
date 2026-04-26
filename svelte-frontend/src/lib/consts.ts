export const isBrowser = typeof document !== 'undefined';
export const hasTouchscreen = isBrowser && window.matchMedia('(hover: none), (pointer: coarse)').matches;
