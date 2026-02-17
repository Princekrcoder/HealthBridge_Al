export async function fetchDashboardData(role) {
  const token = localStorage.getItem("token");

  const res = await fetch(
    `http://localhost:5000/api/dashboard/${role}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard data");
  }

  return res.json();
}

export async function fetchDashboardSummary() {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:5000/api/dashboard/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }

  return res.json();
}
