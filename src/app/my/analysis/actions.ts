"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AnalysisError, runAnalysis } from "@/server/ai/analysis";

export async function requestAnalysis(): Promise<never> {
  try {
    await runAnalysis(await createClient());
    redirect("/my/analysis?status=completed");
  } catch (error: unknown) {
    if (error instanceof AnalysisError) {
      redirect(`/my/analysis?status=${error.code}`);
    }
    throw error;
  }
}
