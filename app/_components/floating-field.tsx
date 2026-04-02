import type { ComponentProps } from "react";

type FloatingInputProps = {
  label: string;
  className?: string;
} & ComponentProps<"input">;

type FloatingTextareaProps = {
  label: string;
  className?: string;
} & ComponentProps<"textarea">;

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function FloatingInput({
  label,
  className,
  placeholder,
  ...props
}: FloatingInputProps) {
  return (
    <label className="floating-field">
      <input
        {...props}
        placeholder={placeholder ?? " "}
        className={joinClassNames("floating-control", className)}
      />
      <span className="floating-label">{label}</span>
    </label>
  );
}

export function FloatingTextarea({
  label,
  className,
  placeholder,
  ...props
}: FloatingTextareaProps) {
  return (
    <label className="floating-field">
      <textarea
        {...props}
        placeholder={placeholder ?? " "}
        className={joinClassNames("floating-control floating-textarea", className)}
      />
      <span className="floating-label">{label}</span>
    </label>
  );
}
