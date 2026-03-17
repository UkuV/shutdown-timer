/**
 * Converts hours, minutes, seconds to total seconds.
 * Returns 0 if any value is invalid or the total is 0.
 */
export function toTotalSeconds(hours, minutes, seconds) {
  const h = parseInt(hours, 10) || 0;
  const m = parseInt(minutes, 10) || 0;
  const s = parseInt(seconds, 10) || 0;
  if (h < 0 || m < 0 || s < 0) return 0;
  return h * 3600 + m * 60 + s;
}

/**
 * Clamps a value between min and max. Returns min for NaN/below-min values.
 */
export function clampValue(val, min, max) {
  const n = parseInt(val, 10);
  if (isNaN(n) || n < min) return min;
  if (n > max) return max;
  return n;
}

export const actionLabels = {
  shutdown: "Shutting down",
  restart: "Restarting",
  sleep: "Sleeping",
  hibernate: "Hibernating",
  logoff: "Logging off",
  lock: "Locking",
};

/**
 * Formats a number of seconds as HH:MM:SS.
 */
export function formatCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}
