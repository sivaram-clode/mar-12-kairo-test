const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  qr_count?: number;
}

export interface QRCode {
  id: number;
  user_id: number;
  user_email?: string;
  title: string;
  url: string;
  scan_count: number;
  is_active: boolean;
  created_at: string;
}

export interface ScanStats {
  total_scans: number;
  daily: { date: string; count: number }[];
}

export interface LoginResponse {
  token: string;
  user: { id: number; email: string; role: string };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(body || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  getUsers: () => request<User[]>("/admin/users"),

  toggleUser: (userId: number, active: boolean) =>
    request<User>(`/admin/users/${userId}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: active }),
    }),

  getQRCodes: () => request<QRCode[]>("/admin/qrcodes"),

  getScanStats: () => request<ScanStats>("/admin/stats/scans"),
};
