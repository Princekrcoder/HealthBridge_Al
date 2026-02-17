"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole, logout } from "@/lib/auth";
import { isTokenExpired } from "@/lib/jwt";
import { backendRoles } from "@/lib/types";

export function useAuthGuard(expectedRole) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const role = getRole();

    // ❌ Not logged in
    if (!token || !role) {
      logout();
      router.replace("/login");
      return;
    }

    // ⏰ Token expired
    if (isTokenExpired(token)) {
      logout();
      router.replace("/login");
      return;
    }

    // 🚫 Role mismatch - normalize both roles before comparison
    // Convert both to backend format for comparison (lowercase)
    const normalizedExpected = backendRoles[expectedRole] || expectedRole.toLowerCase();
    const normalizedActual = backendRoles[role] || role.toLowerCase();

    if (normalizedActual !== normalizedExpected) {
      router.replace("/login");
    }
  }, [expectedRole, router]);
}
