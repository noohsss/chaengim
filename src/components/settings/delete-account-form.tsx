"use client";

import type { ReactElement } from "react";

import { beginAccountDeletion } from "@/app/settings/actions";

export function DeleteAccountForm(): ReactElement {
  return (
    <form
      action={beginAccountDeletion}
      onSubmit={(event) => {
        if (
          !window.confirm(
            "회원 탈퇴를 진행할까요? 챙긴 정책과 모든 기록이 영구 삭제됩니다.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        className="min-h-11 rounded-[var(--radius-control)] border border-destructive px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-[color-mix(in_srgb,var(--destructive)_8%,white)]"
        type="submit"
      >
        회원 탈퇴
      </button>
    </form>
  );
}
