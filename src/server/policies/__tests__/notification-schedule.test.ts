import assert from "node:assert/strict";
import test from "node:test";

import {
  daysUntilDeadline,
  getDeadlineNotificationType,
  makeNotificationEventKey,
} from "../../notifications/notification-schedule";

test("calculates deadline days using calendar dates", () => {
  assert.equal(daysUntilDeadline("2026-08-16", "2026-08-09"), 7);
  assert.equal(daysUntilDeadline("2026-08-10", "2026-08-09"), 1);
});

test("creates only seven-day and one-day alerts for non-rolling policies", () => {
  assert.equal(
    getDeadlineNotificationType("2026-08-16", false, "2026-08-09"),
    "deadline_7_days",
  );
  assert.equal(
    getDeadlineNotificationType("2026-08-10", false, "2026-08-09"),
    "deadline_1_day",
  );
  assert.equal(
    getDeadlineNotificationType("2026-08-16", true, "2026-08-09"),
    undefined,
  );
  assert.equal(getDeadlineNotificationType(null, false, "2026-08-09"), undefined);
});

test("builds idempotent event keys", () => {
  assert.equal(
    makeNotificationEventKey("deadline_7_days", "policy-1", "2026-08-16"),
    "deadline_7_days:policy-1:2026-08-16",
  );
});
