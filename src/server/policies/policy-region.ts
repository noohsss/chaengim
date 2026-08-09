export function doesPolicyMatchRegion(
  profileRegionCode: string | null,
  policyRegionCodes: readonly string[],
): boolean {
  if (!profileRegionCode || policyRegionCodes.includes("00")) return true;
  return policyRegionCodes.includes(profileRegionCode);
}
