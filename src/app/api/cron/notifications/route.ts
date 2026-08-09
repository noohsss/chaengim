import { NextResponse } from "next/server";

import { getCronEnv } from "@/lib/env/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createDeadlineNotifications } from "@/server/notifications/notification-generator";

function isAuthorized(request: Request, secret: string): boolean {
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request): Promise<Response> {
  const { CRON_SECRET } = getCronEnv();
  if (!isAuthorized(request, CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await createDeadlineNotifications(createAdminClient());
  console.info("Deadline notifications completed", result);
  return NextResponse.json(result);
}
