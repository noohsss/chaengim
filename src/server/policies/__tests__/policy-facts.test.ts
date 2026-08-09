import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPolicyComparisonRows,
  buildPolicyFact,
  sortPolicyFactsForAction,
  type PolicyFactInput,
} from "../policy-facts";

const baseInput: PolicyFactInput = {
  id: "policy-a",
  title: "정책 A",
  status: "interested",
  priority: "normal",
  summary: null,
  supportContent: "교육비 지원",
  eligibility: "취업상태\n0013010",
  applicationStartDate: "2026-08-01",
  applicationEndDate: "2026-08-31",
  applicationPeriodText: null,
  isRolling: false,
  applicationMethod: null,
  applicationUrl: null,
  organizationName: "청년지원기관",
};

test("builds exact action facts and translates eligibility codes", () => {
  const fact = buildPolicyFact(baseInput, "2026-08-09");
  assert.equal(fact.deadlineLabel, "D-22");
  assert.equal(fact.daysRemaining, 22);
  assert.equal(fact.eligibility, "취업상태\n제한없음");
  assert.equal(fact.applicationMethod, "원문에 정보 없음");
});

test("sorts high priority before an earlier normal-priority deadline", () => {
  const normal = buildPolicyFact(baseInput, "2026-08-09");
  const high = buildPolicyFact({ ...baseInput, id: "policy-b", priority: "high", applicationEndDate: "2026-12-31" }, "2026-08-09");
  assert.deepEqual(sortPolicyFactsForAction([normal, high]).map((fact) => fact.id), ["policy-b", "policy-a"]);
});

test("fills every comparison cell with source data or an explicit missing label", () => {
  const first = buildPolicyFact(baseInput, "2026-08-09");
  const second = buildPolicyFact({ ...baseInput, id: "policy-b", supportContent: null, summary: null }, "2026-08-09");
  const rows = buildPolicyComparisonRows([first, second]);
  const supportRow = rows.find((row) => row.label === "지원 내용");
  assert.equal(supportRow?.values["policy-a"], "교육비 지원");
  assert.equal(supportRow?.values["policy-b"], "원문에 정보 없음");
});
