export const roles = ["Citizen", "ASHA Worker", "Sub-Center", "Doctor", "Clinical", "Admin"];
export const roleDisplayNames = {
    Citizen: "Citizen Portal",
    "ASHA Worker": "ASHA Worker",
    "Sub-Center": "Sub-Center (SC)",
    Doctor: "Doctor / MO",
    Clinical: "Clinical Login",
    Admin: "Admin / Govt",
};
export const roleDescriptions = {
    Citizen: "Access AI symptom checker, book appointments, and view your health records instantly.",
    "ASHA Worker": "Manage village health tracking, immunization schedules, and maternal care visits.",
    "Sub-Center": "Primary screening, basic diagnostics, and referral management at the village level.",
    Doctor: "Diagnose patients, review referrals, and manage treatments via tele-consultation.",
    Clinical: "OPD management, laboratory reports, and smart referral systems for PHC/CHC.",
    Admin: "Real-time analytics, infrastructure monitoring, and system-wide audit logs.",
};
export const roleRoutes = {
    Citizen: "/citizen/dashboard",
    "ASHA Worker": "/asha/dashboard",
    "Sub-Center": "/sub-center/dashboard",
    Doctor: "/doctor/dashboard",
    Clinical: "/clinical/dashboard",
    Admin: "/admin/dashboard",
};
