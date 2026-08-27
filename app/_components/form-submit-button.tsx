'use client';

import { useFormStatus } from "react-dom";

type FormSubmitButtonProps = {
  idleLabel: string;
  pendingLabel: string;
  disabled?: boolean;
  disabledLabel?: string;
  className?: string;
};

export function FormSubmitButton({
  idleLabel,
  pendingLabel,
  disabled = false,
  disabledLabel,
  className,
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  const label = pending
    ? pendingLabel
    : disabled && disabledLabel
      ? disabledLabel
      : idleLabel;

  return (
    <button type="submit" disabled={isDisabled} className={className}>
      {label}
    </button>
  );
}
