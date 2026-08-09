import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPolicyComparisonRows,
  buildPolicyFact,
  sortPolicyFactsForAction,
  type PolicyFactInput,
} from "../policy-facts";
import { normalizeComparisonText } from "../../ai/comparison-text";

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

test("replaces full and shortened policy IDs in comparison text", () => {
  const firstId = "7ad0e4a5-23d2-4eab-a74f-a3796683f5d4";
  const secondId = "d898605e-2777-459b-a90d-727aa3f7c868";
  const result = normalizeComparisonText({
    overview: `정책 ${firstId}와 ${secondId}를 비교합니다.`,
    comparisonRows: [{
      label: "지원 내용",
      values: [{ policyId: firstId, value: "정책 7ad0e4a5의 지원" }, { policyId: secondId, value: "정책 d898605e의 지원" }],
      difference: "7ad0e4a5와 d898605e의 차이",
    }],
    priorityPolicy: { policyId: firstId, reason: "7ad0e4a5를 먼저 확인" },
    needsConfirmation: [{ policyId: secondId, reason: "d898605e의 조건 확인" }],
    policyAssessments: [{ policyId: firstId, strengths: ["7ad0e4a5의 장점"], cautions: ["7ad0e4a5의 주의점"] }],
  }, { [firstId]: "올해의 K-스타트업", [secondId]: "청년 AI 자격증 취득 지원" });

  assert.equal(result.overview, "정책 올해의 K-스타트업와 청년 AI 자격증 취득 지원를 비교합니다.");
  assert.equal(result.comparisonRows[0]?.difference, "올해의 K-스타트업와 청년 AI 자격증 취득 지원의 차이");
  assert.equal(result.priorityPolicy.reason, "올해의 K-스타트업를 먼저 확인");
});
