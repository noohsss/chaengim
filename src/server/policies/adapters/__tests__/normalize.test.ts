import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

import {
  normalizeGov24Policy,
  normalizeYouthCenterPolicy,
} from "../index";

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

async function readFixture(fileName: string): Promise<unknown> {
  const contents = await readFile(join(fixturesDir, fileName), "utf8");
  return JSON.parse(contents) as unknown;
}
