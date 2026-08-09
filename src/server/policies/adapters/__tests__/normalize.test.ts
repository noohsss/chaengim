import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import {
  normalizeGov24Policy,
  normalizeYouthCenterPolicy,
  normalizedPolicyToRow,
} from "../index";
import { getPolicyLifecycleStatus } from "../../policy-lifecycle";

const fixturesDir = join(
  process.cwd(),
  "src/server/policies/adapters/__fixtures__",
);

test("normalizes a Gov24 service detail into the internal policy shape", async () => {
  const [detail, listItem, supportConditions] = await Promise.all([
    readFixture("gov24-service-detail.json"),
    readFixture("gov24-service-list-item.json"),
    readFixture("gov24-support-conditions.json"),
  ]);

  const policy = normalizeGov24Policy({
    detail,
    listItem,
    supportConditions,
  });

  assert.equal(policy.title, "청년 월세 지원");
  assert.equal(policy.category, "housing");
  assert.deepEqual(policy.regionCodes, ["11"]);
  assert.equal(policy.applicationStartDate, "2026-03-01");
  assert.equal(policy.applicationEndDate, "2026-04-30");
  assert.equal(policy.isRolling, false);
  assert.equal(policy.sources[0], "gov24");
  assert.equal(policy.sourceRefs.gov24?.externalId, "GOV24-2026-0001");
  assert.match(policy.eligibility ?? "", /연령 19~34세/);
  assert.match(policy.eligibility ?? "", /구직자\/실업자/);
  assert.doesNotMatch(policy.eligibility ?? "", /대학생\/대학원생/);
  assert.match(policy.versionHash, /^[a-f0-9]{64}$/);
});

test("normalizes a Youth Center policy into the internal policy shape", async () => {
  const sourcePolicy = await readFixture("youth-center-policy.json");

  const policy = normalizeYouthCenterPolicy(sourcePolicy);

  assert.equal(policy.title, "청년 취업 준비 지원금");
  assert.equal(policy.category, "jobs_startup");
  assert.deepEqual(policy.regionCodes, ["41"]);
  assert.equal(policy.applicationStartDate, "2026-05-01");
  assert.equal(policy.applicationEndDate, "2026-05-31");
  assert.equal(policy.sources[0], "youth_center");
  assert.equal(policy.sourceRefs.youth_center?.externalId, "YC-2026-0001");
  assert.match(policy.eligibility ?? "", /중위소득 150% 이하/);
  assert.match(policy.versionHash, /^[a-f0-9]{64}$/);
});

test("omits an empty Youth Center application method", async () => {
  const sourcePolicy = await readFixture("youth-center-policy.json");
  if (!isRecord(sourcePolicy)) {
    throw new TypeError("Youth Center fixture must be an object");
  }

  const policy = normalizeYouthCenterPolicy({
    ...sourcePolicy,
    plcyAplyMthdCn: "",
  });

  assert.equal(policy.applicationMethod, undefined);
});

test("maps a normalized policy to the policies table shape", async () => {
  const sourcePolicy = await readFixture("youth-center-policy.json");
  const row = normalizedPolicyToRow(normalizeYouthCenterPolicy(sourcePolicy));

  assert.equal(row.title, "청년 취업 준비 지원금");
  assert.equal(row.summary, "구직 청년의 취업 준비 비용을 지원합니다.");
  assert.equal(row.application_start_date, "2026-05-01");
  assert.equal(row.application_end_date, "2026-05-31");
  assert.equal(row.lifecycle_status, "active");
  assert.deepEqual(row.sources, ["youth_center"]);
  assert.deepEqual(row.source_refs.youth_center?.externalId, "YC-2026-0001");
});

test("archives a policy whose application deadline has passed", async () => {
  const sourcePolicy = await readFixture("youth-center-policy.json");
  const policy = normalizeYouthCenterPolicy(sourcePolicy);
  const row = normalizedPolicyToRow(
    policy,
    getPolicyLifecycleStatus(policy, "2026-06-01"),
  );

  assert.equal(row.lifecycle_status, "archived");
});

test("keeps a policy active through its application deadline", async () => {
  const sourcePolicy = await readFixture("youth-center-policy.json");
  const policy = normalizeYouthCenterPolicy(sourcePolicy);

  assert.equal(
    getPolicyLifecycleStatus(policy, "2026-05-31"),
    "active",
  );
});

async function readFixture(fileName: string): Promise<unknown> {
  const contents = await readFile(join(fixturesDir, fileName), "utf8");
  return JSON.parse(contents) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
