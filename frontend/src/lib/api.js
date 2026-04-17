import { apiFetch } from "@/lib/api-client";

export async function fetchDashboardData(role) {
  const res = await apiFetch(`/api/dashboard/${role}`);

  if (!res.ok) {
    const text = await res.text();
    console.error(`fetchDashboardData Error: ${res.status} ${res.statusText}`, text);
    throw new Error(`Failed to fetch dashboard data: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function fetchDashboardSummary() {
  const res = await apiFetch("/api/dashboard/summary");

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }

  return res.json();
}
