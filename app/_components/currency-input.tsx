'use client';

import { useState } from "react";

type CurrencyInputProps = {
  label: string;
  name: string;
  className?: string;
  defaultValueInCents?: number;
  onChange?: (cents: number) => void;
  value?: string;
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
  onChange,
  value: controlledValue,
}: CurrencyInputProps) {
  const [internalValue, setInternalValue] = useState(formatCurrencyFromCents(defaultValueInCents));
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyFromDigits(event.target.value);
    
    if (!isControlled) {
      setInternalValue(formatted);
    }
    
    if (onChange) {
      const digits = event.target.value.replace(/\D/g, "");
      const cents = Number(digits || "0");
      onChange(cents);
    }
  };

  return (
    <label className="floating-field">
      <span className="floating-label">{label}</span>
      <input
        name={name}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        className={joinClassNames("floating-control", className)}
      />
    </label>
  );
}
