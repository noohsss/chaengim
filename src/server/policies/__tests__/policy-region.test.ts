import assert from "node:assert/strict";
import test from "node:test";

import { doesPolicyMatchRegion } from "../policy-region";

test("treats missing profile region as requiring confirmation rather than a mismatch", () => {
  assert.equal(doesPolicyMatchRegion(null, ["11"]), true);
});

test("matches nationwide policies for every profile region", () => {
  assert.equal(doesPolicyMatchRegion("11", ["00"]), true);
});

test("matches a policy that includes the profile region", () => {
  assert.equal(doesPolicyMatchRegion("11", ["11", "26"]), true);
});

test("does not match a policy limited to another region", () => {
  assert.equal(doesPolicyMatchRegion("11", ["26"]), false);
});
