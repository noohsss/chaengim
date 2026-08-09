"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactElement } from "react";
import { useFormStatus } from "react-dom";

type AiSubmitButtonProps = Readonly<{
  idleLabel: string;
  pendingLabel: string;
}>;

export function AiSubmitButton({
  idleLabel,
  pendingLabel,
}: AiSubmitButtonProps): ReactElement {
  const { pending } = useFormStatus();

  return (
    <button
      aria-busy={pending}
      className="ui-primary-action disabled:cursor-wait disabled:opacity-75"
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
      ) : null}
      <span>{pending ? pendingLabel : idleLabel}</span>
    </button>
  );
}
