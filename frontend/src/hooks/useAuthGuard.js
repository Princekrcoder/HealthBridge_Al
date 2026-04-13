"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { backendRoles } from "@/lib/types";

export function useAuthGuard(expectedRole) {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user?.role) {
      router.replace("/select-role");
      return;
    }

    // 🚫 Role mismatch - normalize both roles before comparison
    const normalizedExpected = backendRoles[expectedRole] || expectedRole.toLowerCase();
    const normalizedActual = user.role.toLowerCase();

    if (normalizedActual !== normalizedExpected) {
      logout();
      router.replace("/select-role");
    }
  }, [expectedRole, isLoading, logout, router, user]);
}
