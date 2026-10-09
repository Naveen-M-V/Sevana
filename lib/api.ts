export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) { super(message); }
}

async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method, credentials: "same-origin", cache: "no-store",
    headers: { "x-requested-with": "sevana", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined" && !url.includes("/auth/")) {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    throw new ApiError(res.status, data?.message ?? res.statusText, data?.error);
  }
  return data as T;
}

export const api = {
  get: <T = any>(url: string) => call<T>("GET", url),
  post: <T = any>(url: string, body: unknown = {}) => call<T>("POST", url, body),
  put: <T = any>(url: string, body: unknown) => call<T>("PUT", url, body),
};

export const qs = (o: Record<string, string | number | boolean | null | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};
