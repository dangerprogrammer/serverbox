'use client';

import { useState } from "react";

type CurrencyInputProps = {
  label: string;
  name: string;
  className?: string;
  defaultValueInCents?: number;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatCurrencyFromDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  const numericValue = Number(digits || "0") / 100;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numericValue);
}

function formatCurrencyFromCents(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format((Number.isFinite(value) ? value : 0) / 100);
}

export function CurrencyInput({
  label,
  name,
  className,
  defaultValueInCents = 0,
}: CurrencyInputProps) {
  const [value, setValue] = useState(formatCurrencyFromCents(defaultValueInCents));

  return (
    <label className="floating-field">
      <span className="floating-label">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(event) => {
          setValue(formatCurrencyFromDigits(event.target.value));
        }}
        className={joinClassNames("floating-control", className)}
      />
    </label>
  );
}
