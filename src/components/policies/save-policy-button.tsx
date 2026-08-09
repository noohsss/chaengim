"use client";

import { Bookmark, BookmarkCheck, X } from "lucide-react";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

type SavePolicyButtonProps = Readonly<{
  isAuthenticated: boolean;
  isSaved: boolean;
  loginPath: string;
  onSave: (formData: FormData) => void;
  policyId: string;
}>;

export function SavePolicyButton({ isAuthenticated, isSaved, loginPath, onSave, policyId }: SavePolicyButtonProps): ReactElement {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoginModalOpen) return;
    modalRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") setIsLoginModalOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLoginModalOpen]);

  if (isAuthenticated) {
    return (
      <form action={onSave} className="shrink-0">
        <input name="intent" type="hidden" value={isSaved ? "remove" : "save"} />
        <input name="policyId" type="hidden" value={policyId} />
        <button aria-label={isSaved ? "챙기기 취소" : "챙기기"} aria-pressed={isSaved} className="group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" type="submit">
          {isSaved ? <BookmarkCheck aria-hidden="true" fill="currentColor" size={25} /> : <Bookmark aria-hidden="true" size={25} />}
          <span>{isSaved ? "챙기기 취소" : "챙기기"}</span>
        </button>
      </form>
    );
  }

  return (
    <>
      <button aria-label="챙기기" className="group flex min-h-16 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 text-xs font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={() => setIsLoginModalOpen(true)} type="button">
        <Bookmark aria-hidden="true" size={25} />
        <span>챙기기</span>
      </button>
      {isLoginModalOpen ? (
        <div aria-labelledby="save-login-modal-title" aria-modal="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-5" onClick={() => setIsLoginModalOpen(false)} ref={modalRef} role="dialog" tabIndex={-1}>
          <div className="ui-card w-full max-w-sm p-6 sm:p-8" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="ui-eyebrow">안전하게 이어가기</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em]" id="save-login-modal-title">정책을 챙기려면 로그인해 주세요</h2>
              </div>
              <button aria-label="로그인 안내 닫기" className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" onClick={() => setIsLoginModalOpen(false)} type="button">
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">로그인하면 챙긴 정책과 진행 상태를 안전하게 저장할 수 있어요.</p>
            <a className="mt-6 flex min-h-11 items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" href={loginPath}>로그인하러 가기</a>
          </div>
        </div>
      ) : null}
    </>
  );
}
