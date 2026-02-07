"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRole, logout } from "@/lib/auth";
import { isTokenExpired } from "@/lib/jwt";

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

    // 🚫 Role mismatch
    if (role !== expectedRole) {
      router.replace("/login");
    }
  }, [expectedRole, router]);
}
