"use client";

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
}

export function removeToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function setRole(role) {
  if (typeof window === "undefined") return;
  // Normalize role to lowercase to match backend/convention if needed, 
  // but keeping it as is for now based on current usage.
  localStorage.setItem("role", role);
}

export function removeRole() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("role");
}

export function logout() {
  removeToken();
  removeRole();
  if (typeof window !== "undefined") {
    window.location.href = "/";
  }
}

export function isAuthenticated() {
  const token = getToken();
  return !!token;
}
