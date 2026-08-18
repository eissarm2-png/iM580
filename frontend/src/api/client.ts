import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
export const API_BASE = `${BASE}/api`;
export const WS_BASE = `${BASE?.replace(/^http/, "ws")}/api`;

const TOKEN_KEY = "abqour_token";

export async function getToken(): Promise<string | null> {
  return storage.secureGet<string>(TOKEN_KEY, "").then((t) => (t ? (t as string) : null));
}
export async function setToken(t: string) {
  await storage.secureSet(TOKEN_KEY, t);
}
export async function clearToken() {
  await storage.secureRemove(TOKEN_KEY);
}

async function request(path: string, options: RequestInit = {}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = body?.detail || "حدث خطأ ما";
    throw new Error(typeof detail === "string" ? detail : "حدث خطأ ما");
  }
  return body;
}

export const api = {
  get: (p: string) => request(p),
  post: (p: string, data?: any) =>
    request(p, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: (p: string, data?: any) =>
    request(p, { method: "PUT", body: JSON.stringify(data ?? {}) }),
  del: (p: string) => request(p, { method: "DELETE" }),
};
