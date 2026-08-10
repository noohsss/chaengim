import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPolicyComparisonRows,
  buildPolicyFact,
  sortPolicyFactsForAction,
  type PolicyFactInput,
} from "../policy-facts";
import { normalizeComparisonText } from "../../ai/comparison-text";
import { normalizeAnalysisText } from "../../ai/analysis-text";
import { replaceAiDisplayCodes } from "../../ai/display-text";

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

test("translates external eligibility and internal profile codes in comparison text", () => {
  const policyId = "7ad0e4a5-23d2-4eab-a74f-a3796683f5d4";
  const result = normalizeComparisonText({
    overview: "취업 상태 코드(0013003, 0013006), 프로필 지역 코드(11), 사용자 프로필(unemployed) 간 대조가 필요합니다.",
    comparisonRows: [{
      label: "조건",
      values: [{ policyId, value: "0013003 또는 jobs_startup 대상" }],
      difference: "planning_to_apply 상태이고 우선순위는 high입니다.",
    }],
    priorityPolicy: { policyId, reason: "unemployed 조건 확인" },
    needsConfirmation: [],
    policyAssessments: [{ policyId, strengths: ["region은 별도 확인"], cautions: ["0013006 확인"] }],
  }, { [policyId]: "청년 정책" });

  assert.equal(result.overview, "취업 상태 코드(미취업자, (예비)창업자), 프로필 지역 코드(서울특별시), 사용자 프로필(미취업) 간 대조가 필요합니다.");
  assert.equal(result.comparisonRows[0]?.values[0]?.value, "미취업자 또는 일자리·창업 대상");
  assert.equal(result.comparisonRows[0]?.difference, "신청 예정 상태이고 우선순위는 높음입니다.");
  assert.equal(result.policyAssessments[0]?.cautions[0], "(예비)창업자 확인");
});

test("translates codes across every free-text analysis field", () => {
  const policyId = "7ad0e4a5-23d2-4eab-a74f-a3796683f5d4";
  const result = normalizeAnalysisText({
    overview: `${policyId}의 unemployed 조건을 확인하세요.`,
    priorityPolicy: { policyId, reason: "priority가 high입니다." },
    urgentPolicies: [{ policyId, reason: "0013003 대상입니다." }],
    needsConfirmation: [{ policyId, reason: "0013006 여부 확인" }],
    nextSteps: ["planning_to_apply로 변경"],
    fitChecks: [{ policyId, status: "needs_confirmation", criterion: "jobs_startup 분야", reason: "unemployed 대조 필요" }],
    recommendedActions: [{ policyId, action: "0013003 조건 문의", reason: "reviewing 상태이기 때문입니다." }],
  }, { [policyId]: "청년 정책" });

  assert.equal(result.overview, "청년 정책의 미취업 조건을 확인하세요.");
  assert.equal(result.priorityPolicy?.reason, "priority가 높음입니다.");
  assert.equal(result.urgentPolicies[0]?.reason, "미취업자 대상입니다.");
  assert.equal(result.needsConfirmation[0]?.reason, "(예비)창업자 여부 확인");
  assert.equal(result.nextSteps[0], "신청 예정로 변경");
  assert.equal(result.fitChecks[0]?.criterion, "일자리·창업 분야");
  assert.equal(result.recommendedActions[0]?.reason, "확인 중 상태이기 때문입니다.");
});

test("leaves unknown codes unchanged", () => {
  assert.equal(replaceAiDisplayCodes("알 수 없는 코드 0099999"), "알 수 없는 코드 0099999");
});
