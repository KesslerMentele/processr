const LEVELS = { off: 0, error: 1, warn: 2, info: 3, debug: 4 } as const;
type LogLevel = keyof typeof LEVELS;

const getLevel = (): number => {
  const stored = localStorage.getItem('logLevel') as LogLevel | null;
  if (stored !== null && stored in LEVELS) return LEVELS[stored];
  return import.meta.env.DEV ? LEVELS.debug : LEVELS.warn;
};

export const logger = {
  get debug() { return getLevel() >= LEVELS.debug ? console.debug.bind(console) : noop; },
  get info()  { return getLevel() >= LEVELS.info  ? console.info.bind(console)  : noop; },
  get warn()  { return getLevel() >= LEVELS.warn  ? console.warn.bind(console)  : noop; },
  get error() { return getLevel() >= LEVELS.error ? console.error.bind(console) : noop; },
};
