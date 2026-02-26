import { supabase } from "./supabase";

// ── Base URL ────────────────────────────────────────────────────────────────
// In development: http://localhost:3001  (local Express server)
// In production:  https://kinpath-production.up.railway.app
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001";

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Get the current Supabase session JWT (auto-refreshes if needed). */
async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Build standard headers: JSON content-type + Bearer auth. */
async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ── Generic request function ────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  status: number;
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${path}`;
  const headers = await authHeaders();

  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });

    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const body = isJson ? await res.json() : null;

    if (!res.ok) {
      return {
        data: null,
        error: body?.error ?? `Request failed (${res.status})`,
        status: res.status,
      };
    }

    return { data: body as T, error: null, status: res.status };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Network error",
      status: 0,
    };
  }
}

// ── API client ──────────────────────────────────────────────────────────────
// Route-specific helpers match the Express routes in packages/api/src/index.ts.
// Usage:  const { data, error } = await api.ai.chat({ message: "...", child_id: "..." });

export const api = {
  // Generic HTTP methods
  get: <T = unknown>(path: string) => request<T>(path, { method: "GET" }),

  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),

  // AI
  ai: {
    chat: (body: {
      message: string;
      child_id?: string;
      conversation_id?: string;
    }) => request("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
    usage: () => request("/ai/usage", { method: "GET" }),
  },

  // Conversations
  chat: {
    save: (body: { conversation_id: string; title?: string }) =>
      request("/chat/save", { method: "POST", body: JSON.stringify(body) }),
    unsave: (body: { conversation_id: string }) =>
      request("/chat/unsave", { method: "POST", body: JSON.stringify(body) }),
  },

  // Household
  household: {
    invite: (body: { email: string }) =>
      request("/household/invite", { method: "POST", body: JSON.stringify(body) }),
    remove: (body: { partner_id: string }) =>
      request("/household/remove", {
        method: "POST",
        body: JSON.stringify(body),
      }),
  },

  // Account
  account: {
    delete: () => request("/account", { method: "DELETE" }),
  },

  // Stripe / Payments
  stripe: {
    checkout: (body: { plan: string; interval: string }) =>
      request("/stripe/checkout", { method: "POST", body: JSON.stringify(body) }),
    portal: () => request("/stripe/portal", { method: "POST" }),
  },
};
