"use client";

import { apiFetch } from "@/lib/api-client";

export function getToken() {
  return null;
}

export function setToken() {}

export function removeToken() {
  return null;
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function setRole(role) {
  if (typeof window === "undefined") return;
  localStorage.setItem("role", role);
}

export function removeRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("role");
}

export async function logout() {
  await apiFetch("/api/logout", { method: "POST" }).catch(() => null);
  removeToken();
  removeRole();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function isAuthenticated() {
  const role = getRole();
  return !!role;
}
