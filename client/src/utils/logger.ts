const LEVELS = { off: 0, error: 1, warn: 2, info: 3, debug: 4 } as const;
type LogLevel = keyof typeof LEVELS;

const getLevel = (): number => {
  const stored = localStorage.getItem('logLevel') as LogLevel | null;
  if (stored !== null && stored in LEVELS) return LEVELS[stored];
  return import.meta.env.DEV ? LEVELS.debug : LEVELS.warn;
};

export const logger = {
  debug: (msg: string) => { if (getLevel() >= LEVELS.debug) console.debug(msg); },
  info:  (msg: string) => { if (getLevel() >= LEVELS.info)  console.info(msg); },
  warn:  (msg: string) => { if (getLevel() >= LEVELS.warn)  console.warn(msg); },
  error: (msg: string) => { if (getLevel() >= LEVELS.error) console.error(msg); },
};
