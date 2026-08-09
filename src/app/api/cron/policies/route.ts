import { NextResponse } from "next/server";

import { getCronEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncPolicies } from "@/server/policies/sync";
import { createPolicyChangedNotifications } from "@/server/notifications/notification-generator";

function isAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<Response> {
  const { CRON_SECRET } = getCronEnv();
  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncPolicies(createAdminClient());
  const changedPolicyIds = result.sources.flatMap(
    (source) => source.changedPolicyIds,
  );
  const notifications = await createPolicyChangedNotifications(
    createAdminClient(),
    changedPolicyIds,
  );
  const hasSourceFailure = result.sources.some(
    (source) => source.error !== undefined || source.failed > 0,
  );

  console.info("Policy sync completed", result);

  return NextResponse.json(
    { ...result, notifications },
    { status: hasSourceFailure ? 207 : 200 },
  );
}
