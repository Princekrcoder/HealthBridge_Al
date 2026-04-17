export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "";

// Direct backend URL is empty to force all traffic through Next.js reverse proxy natively.
export const DIRECT_BACKEND_URL = "";

// Alias for Socket.IO specifically to connect back to the Next.js HTTPS proxy port
export const SOCKET_URL = "";

