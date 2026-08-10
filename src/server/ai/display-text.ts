import { EMPLOYMENT_STATUS_OPTIONS, REGION_OPTIONS } from "../../features/profile/profile-schema";
import {
  SAVED_POLICY_PRIORITY_OPTIONS,
  SAVED_POLICY_STATUS_OPTIONS,
} from "../../features/saved-policies/saved-policy-schema";
import { replaceYouthCenterEligibilityCodes } from "../policies/adapters/normalize-utils";

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  jobs_startup: "일자리·창업",
  housing: "주거",
  education: "교육",
  finance: "금융",
  welfare_culture: "복지·문화",
  participation_rights: "참여·권리",
  other: "기타",
};

const FIT_STATUS_LABELS: Readonly<Record<string, string>> = {
  matches: "조건 일치",
  needs_confirmation: "확인 필요",
  potential_mismatch: "불일치 가능성",
};

function toLabelMap(options: readonly Readonly<{ label: string; value: string }>[]): Readonly<Record<string, string>> {
  return Object.fromEntries(options.map((option) => [option.value, option.label]));
}

const EMPLOYMENT_STATUS_LABELS = toLabelMap(EMPLOYMENT_STATUS_OPTIONS);
const REGION_LABELS = toLabelMap(REGION_OPTIONS);
const SAVED_STATUS_LABELS = toLabelMap(SAVED_POLICY_STATUS_OPTIONS);
const PRIORITY_LABELS = toLabelMap(SAVED_POLICY_PRIORITY_OPTIONS);
const DISPLAY_CODE_LABELS: Readonly<Record<string, string>> = {
  ...EMPLOYMENT_STATUS_LABELS,
  ...SAVED_STATUS_LABELS,
  ...PRIORITY_LABELS,
  ...CATEGORY_LABELS,
  ...FIT_STATUS_LABELS,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceRegionCodes(value: string): string {
  return Object.entries(REGION_LABELS).reduce((text, [code, label]) => {
    const pattern = new RegExp(
      `((?:(?:프로필|정책)\\s*)?지역\\s*코드|region(?:Code|_codes?))(\\s*[:=]?\\s*[([]?\\s*)${escapeRegExp(code)}(\\s*[)\\]]?)`,
      "gi",
    );
    return text.replace(pattern, `$1$2${label}$3`);
  }, value);
}

export function replaceAiDisplayCodes(value: string): string {
  return Object.entries(DISPLAY_CODE_LABELS)
    .sort(([firstCode], [secondCode]) => secondCode.length - firstCode.length)
    .reduce((text, [code, label]) => {
      const pattern = new RegExp(`(?<![A-Za-z0-9_])${escapeRegExp(code)}(?![A-Za-z0-9_])`, "g");
      return text.replace(pattern, label);
    }, replaceRegionCodes(replaceYouthCenterEligibilityCodes(value)));
}

export function getEmploymentStatusLabel(value: string | null): string | null {
  return value ? EMPLOYMENT_STATUS_LABELS[value] ?? value : null;
}

export function getRegionLabel(value: string | null): string | null {
  return value ? REGION_LABELS[value] ?? value : null;
}

export function getSavedStatusLabel(value: string): string {
  return SAVED_STATUS_LABELS[value] ?? value;
}

export function getPriorityLabel(value: string): string {
  return PRIORITY_LABELS[value] ?? value;
}

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}
