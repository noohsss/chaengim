import "server-only";

import { z } from "zod";

import { getPublicApiEnv } from "../../lib/env/server";

const jsonObjectSchema = z.record(z.string(), z.unknown());

export class PublicApiClientError extends Error {
  constructor(
    message: string,
    readonly source: "youth_center" | "gov24",
  ) {
    super(message);
    this.name = "PublicApiClientError";
  }
}

type PublicApiRequest = Readonly<{
  source: "youth_center" | "gov24";
  path: string;
  params: Readonly<Record<string, string | number | undefined>>;
}>;

function buildUrl(baseUrl: string, path: string): URL {
  if (path.length === 0) {
    return new URL(baseUrl);
  }

  const base = new URL(`${baseUrl.replace(/\/$/, "")}/`);
  const normalizedPath = path.replace(/^\//, "");
  return new URL(normalizedPath, base);
}

async function requestJson(
  request: PublicApiRequest,
  fetcher: typeof fetch = fetch,
): Promise<Record<string, unknown>> {
  const env = getPublicApiEnv();
  const baseUrl =
    request.source === "youth_center"
      ? env.YOUTH_CENTER_API_BASE_URL
      : env.GOV24_API_BASE_URL;
  const url = buildUrl(baseUrl, request.path);

  for (const [key, value] of Object.entries(request.params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const keyName = request.source === "youth_center" ? "apiKeyNm" : "serviceKey";
  const apiKey =
    request.source === "youth_center"
      ? env.YOUTH_CENTER_API_KEY
      : env.GOV24_API_KEY;
  if (!apiKey) {
    throw new PublicApiClientError(
      "정부24 API 키가 설정되지 않았습니다",
      request.source,
    );
  }
  url.searchParams.set(keyName, apiKey);

  let response: Response;
  try {
    response = await fetcher(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "네트워크 오류";
    throw new PublicApiClientError(`공공 API 요청 실패: ${detail}`, request.source);
  }

  if (!response.ok) {
    throw new PublicApiClientError(
      `공공 API가 HTTP ${response.status}를 반환했습니다`,
      request.source,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PublicApiClientError("공공 API 응답이 JSON이 아닙니다", request.source);
  }

  const parsed = jsonObjectSchema.safeParse(payload);
  if (!parsed.success) {
    throw new PublicApiClientError("공공 API 응답 형식이 올바르지 않습니다", request.source);
  }

  return parsed.data;
}

export async function fetchGov24ServiceList(
  params: Readonly<{ page?: number; perPage?: number; returnType?: string }>,
  fetcher?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson(
    {
      source: "gov24",
      path: "serviceList",
      params: {
        page: params.page ?? 1,
        perPage: params.perPage ?? 100,
        returnType: params.returnType ?? "JSON",
      },
    },
    fetcher,
  );
}

export async function fetchGov24ServiceDetail(
  serviceId: string,
  fetcher?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson(
    {
      source: "gov24",
      path: "serviceDetail",
      params: { serviceId, returnType: "JSON" },
    },
    fetcher,
  );
}

export async function fetchYouthCenterPolicies(
  params: Readonly<{
    pageNum?: number;
    pageSize?: number;
    pageType?: "1" | "2";
    plcyNo?: string;
    plcyKywdNm?: string;
    plcyExplnCn?: string;
    plcyNm?: string;
    zipCd?: string;
    lclsfNm?: string;
    mclsfNm?: string;
  }>,
  fetcher?: typeof fetch,
): Promise<Record<string, unknown>> {
  return requestJson(
    {
      source: "youth_center",
      path: "",
      params: {
        pageNum: params.pageNum ?? 1,
        pageSize: params.pageSize ?? 100,
        pageType: params.pageType,
        plcyNo: params.plcyNo,
        plcyKywdNm: params.plcyKywdNm,
        plcyExplnCn: params.plcyExplnCn,
        plcyNm: params.plcyNm,
        zipCd: params.zipCd,
        lclsfNm: params.lclsfNm,
        mclsfNm: params.mclsfNm,
        rtnType: "json",
      },
    },
    fetcher,
  );
}
