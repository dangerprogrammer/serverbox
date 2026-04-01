'use client';

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({
  idleLabel,
  pendingLabel,
  className,
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      type="submit"
      disabled={isDisabled}
      className={className}
    >
      {pending ? pendingLabel : idleLabel}
    </button>
  );
}
