import { NextResponse } from "next/server";

import { getCronEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPolicies } from "@/server/policies/sync";

function isAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<Response> {
  const { CRON_SECRET } = getCronEnv();
  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncPolicies(createAdminClient());
  const hasSourceFailure = result.sources.some(
    (source) => source.error !== undefined || source.failed > 0,
  );

  console.info("Policy sync completed", result);

  return NextResponse.json(result, { status: hasSourceFailure ? 207 : 200 });
}
