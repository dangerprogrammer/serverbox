"use client";

import { useSyncExternalStore } from "react";
import type { ReactNode } from "react";

type ThemePreference = "system" | "light" | "dark";

type ThemeSwitcherProps = {
  compact?: boolean;
  className?: string;
};

const THEME_STORAGE_KEY = "serverbox-theme";
const THEME_CHANGE_EVENT = "serverbox-theme-change";

function getSystemTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return "system";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

  return storedTheme === "light" || storedTheme === "dark" || storedTheme === "system"
    ? storedTheme
    : "system";
}

function applyThemePreference(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedTheme = preference === "system" ? getSystemTheme() : preference;
  const root = document.documentElement;

  root.dataset.themeMode = preference;
  root.dataset.theme = resolvedTheme;
  root.style.colorScheme = resolvedTheme;
}

function notifyThemeSubscribers() {
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function setThemePreference(preference: ThemePreference) {
  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  applyThemePreference(preference);
  notifyThemeSubscribers();
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const syncTheme = () => {
    applyThemePreference(getStoredThemePreference());
    onStoreChange();
  };

  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", syncTheme);
  mediaQuery.addEventListener("change", syncTheme);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", syncTheme);
    mediaQuery.removeEventListener("change", syncTheme);
  };
}

function getThemeSnapshot() {
  if (typeof document === "undefined") {
    return "system";
  }

  const mode = document.documentElement.dataset.themeMode;

  return mode === "light" || mode === "dark" || mode === "system"
    ? mode
    : "system";
}

function getServerThemeSnapshot(): ThemePreference {
  return "system";
}

function SystemIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.75 5.75h14.5v9.5H4.75z" />
      <path d="M9 19.25h6" />
      <path d="M12 15.25v4" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 7.75a4.25 4.25 0 1 1 0 8.5 4.25 4.25 0 0 1 0-8.5Z" />
      <path d="M12 2.75v2M12 19.25v2M4.72 4.72l1.42 1.42M17.86 17.86l1.42 1.42M2.75 12h2M19.25 12h2M4.72 19.28l1.42-1.42M17.86 6.14l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19.25 14.2A7.5 7.5 0 0 1 9.8 4.75 7.5 7.5 0 1 0 19.25 14.2Z" />
    </svg>
  );
}

const themeOptions = [
  { value: "system", label: "Sistema", icon: SystemIcon },
  { value: "light", label: "Claro", icon: SunIcon },
  { value: "dark", label: "Escuro", icon: MoonIcon },
] satisfies Array<{
  value: ThemePreference;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
}>;

export function ThemeSwitcher({ compact = false, className }: ThemeSwitcherProps) {
  const activeTheme = useSyncExternalStore(
    subscribeToThemeChanges,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  return (
    <div
      className={[
        "theme-switcher",
        compact ? "theme-switcher-compact" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Tema"
    >
      {themeOptions.map((option) => {
        const Icon = option.icon;
        const isActive = activeTheme === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className="theme-option"
            data-theme-option={option.value}
            aria-pressed={isActive}
            title={option.label}
            onClick={() => setThemePreference(option.value)}
          >
            <Icon className="size-4 shrink-0" />
            <span className={compact ? "sr-only" : ""}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
