/**
 * Development-only logger utility.
 * Prevents debug logs from appearing in production builds.
 */
export const logDev = (...args) => {
  if (import.meta.env.DEV) {
    console.log(...args);
  }
};

export const warnDev = (...args) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

export const errorDev = (...args) => {
  if (import.meta.env.DEV) {
    console.error(...args);
  }
};

export default {
  log: logDev,
  warn: warnDev,
  error: errorDev
};
