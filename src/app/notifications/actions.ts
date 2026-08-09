"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const notificationIdSchema = z.uuid();
const userIdSchema = z.uuid();

async function getAuthenticatedClient() {
  const client = await createClient();
  const { data, error } = await client.auth.getClaims();
  const userId = userIdSchema.safeParse(data?.claims.sub);

  if (error || !userId.success) {
    redirect("/login?next=%2Fnotifications");
  }

  return client;
}

export async function markNotificationRead(formData: FormData): Promise<never> {
  const notificationId = notificationIdSchema.safeParse(
    formData.get("notificationId"),
  );

  if (!notificationId.success) {
    redirect("/notifications?status=invalid");
  }

  const client = await getAuthenticatedClient();
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId.data)
    .is("read_at", null);

  if (error) {
    console.error("Notification read update failed", { code: error.code });
    redirect("/notifications?status=failed");
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  redirect("/notifications?status=read");
}

export async function markAllNotificationsRead(): Promise<never> {
  const client = await getAuthenticatedClient();
  const { error } = await client
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  if (error) {
    console.error("All notifications read update failed", {
      code: error.code,
    });
    redirect("/notifications?status=failed");
  }

  revalidatePath("/notifications");
  revalidatePath("/");
  redirect("/notifications?status=all_read");
}
