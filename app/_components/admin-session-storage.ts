'use client';

import { useSyncExternalStore } from "react";

import { ADMIN_SESSION_STORAGE_KEY } from "@/lib/auth/session-constants";

const SESSION_CHANGE_EVENT = "serverbox-admin-session-change";

function emitSessionChange() {
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

function getSnapshot() {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(ADMIN_SESSION_STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return "";
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SESSION_CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SESSION_CHANGE_EVENT, callback);
  };
}

export function getStoredAdminSessionToken() {
  return getSnapshot();
}

export function setStoredAdminSessionToken(sessionToken: string) {
  localStorage.setItem(ADMIN_SESSION_STORAGE_KEY, sessionToken);
  emitSessionChange();
}

export function clearStoredAdminSessionToken() {
  localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
  emitSessionChange();
}

export function useStoredAdminSessionToken() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
