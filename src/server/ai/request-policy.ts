export const AI_REQUEST_WINDOW_MS = 10 * 60 * 1000;
export const AI_REQUEST_LIMIT = 5;

export function isAiRequestRateLimited(
  requestTimes: readonly string[],
  nowMs: number = Date.now(),
  windowMs: number = AI_REQUEST_WINDOW_MS,
  limit: number = AI_REQUEST_LIMIT,
): boolean {
  const windowStartMs = nowMs - windowMs;
  const recentRequestCount = requestTimes.filter((createdAt) => {
    const createdAtMs = Date.parse(createdAt);
    return Number.isFinite(createdAtMs) && createdAtMs >= windowStartMs;
  }).length;
  return recentRequestCount >= limit;
}
