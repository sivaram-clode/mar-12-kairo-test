const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "API request failed");
  }

  return res.json();
}

export async function login(email: string, password: string) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string, name: string) {
  return apiFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function getQRCodes() {
  return apiFetch("/qr");
}

export async function getQRCode(id: string) {
  return apiFetch(`/qr/${id}`);
}

export async function createQRCode(label: string, destination_url: string) {
  return apiFetch("/qr", {
    method: "POST",
    body: JSON.stringify({ label, destination_url }),
  });
}

export async function updateQRCode(id: string, destination_url: string) {
  return apiFetch(`/qr/${id}`, {
    method: "PUT",
    body: JSON.stringify({ destination_url }),
  });
}

export async function deleteQRCode(id: string) {
  return apiFetch(`/qr/${id}`, {
    method: "DELETE",
  });
}

export async function getQRScans(id: string) {
  return apiFetch(`/qr/${id}/scans`);
}

export function getQRImageUrl(shortCode: string): string {
  return `${API_BASE_URL}/qr/${shortCode}/image`;
}
