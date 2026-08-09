import assert from "node:assert/strict";
import test from "node:test";

import { isAiRequestRateLimited } from "../../ai/request-policy";

const nowMs = Date.parse("2026-08-09T00:00:00.000Z");

test("allows an empty request history", () => {
  assert.equal(isAiRequestRateLimited([], nowMs), false);
});

test("limits five successful requests in the rolling ten-minute window", () => {
  const recentRequests = Array.from({ length: 5 }, (_, index) => new Date(nowMs - index * 1_000).toISOString());
  assert.equal(isAiRequestRateLimited(recentRequests, nowMs), true);
  assert.equal(isAiRequestRateLimited([...recentRequests, new Date(nowMs - 10 * 60 * 1_000).toISOString()], nowMs), true);
  assert.equal(isAiRequestRateLimited(recentRequests.slice(0, 4), nowMs), false);
});

test("ignores malformed and expired request timestamps", () => {
  assert.equal(isAiRequestRateLimited(["not-a-date", "2026-08-08T23:49:59.999Z"], nowMs), false);
});
