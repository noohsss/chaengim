import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { todayInSeoul } from "./policy-lifecycle";

const publicPolicyRowSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  summary: z.string().nullable(),
  application_end_date: z.iso.date().nullable(),
  application_period_text: z.string().nullable(),
  is_rolling: z.boolean(),
  category: z.enum([
    "jobs_startup",
    "housing",
    "education",
    "finance",
    "welfare_culture",
    "participation_rights",
    "other",
  ]),
  region_codes: z.array(z.string()),
  organization_name: z.string().nullable(),
});

export type PublicPolicy = z.infer<typeof publicPolicyRowSchema>;

export type PolicySearchParams = Readonly<{
  search?: string;
  category?: string;
  region?: string;
  page?: number;
}>;

export type PublicPolicyPage = Readonly<{
  policies: PublicPolicy[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}>;

export const PUBLIC_POLICY_PAGE_SIZE = 12;

const categoryValues = new Set([
  "jobs_startup",
  "housing",
  "education",
  "finance",
  "welfare_culture",
  "participation_rights",
  "other",
]);
const regionCodePattern = /^\d{2}$/;

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

function optionalFilter(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

export async function listPublicPolicies(
  client: SupabaseClient,
  params: PolicySearchParams = {},
): Promise<PublicPolicyPage> {
  const search = optionalFilter(params.search);
  const category = optionalFilter(params.category);
  const region = optionalFilter(params.region);
  const requestedPage = params.page ?? 1;
  const page = Number.isInteger(requestedPage) && requestedPage >= 1
    ? requestedPage
    : 1;
  const pageSize = PUBLIC_POLICY_PAGE_SIZE;
  const from = (page - 1) * pageSize;

  let query = client
    .from("policies")
    .select(
      "id,title,summary,application_end_date,application_period_text,is_rolling,category,region_codes,organization_name",
      { count: "exact" },
    )
    .eq("lifecycle_status", "active")
    .or(
      `application_end_date.is.null,is_rolling.eq.true,application_end_date.gte.${todayInSeoul()}`,
    )
    .order("application_end_date", { ascending: true, nullsFirst: false })
    .range(from, from + pageSize - 1);

  if (search) query = query.ilike("title", `%${escapeIlike(search)}%`);
  if (category && categoryValues.has(category)) query = query.eq("category", category);
  if (region) {
    if (regionCodePattern.test(region)) {
      query = query.or(`region_codes.cs.{${region}},region_codes.cs.{00}`);
    } else {
      query = query.contains("region_codes", [region]);
    }
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`정책 목록을 불러오지 못했습니다: ${error.message}`);

  const parsed = z.array(publicPolicyRowSchema).safeParse(data);
  if (!parsed.success) throw new Error("정책 데이터 형식이 올바르지 않습니다");

  const totalCount = count ?? 0;
  return {
    policies: parsed.data,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}
