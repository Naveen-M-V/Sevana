"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Permission } from "@sevana/shared";
import { api } from "./api";

export interface Me { id: string; email: string; fullName: string; roles: string[]; branchId: string | null;
  permissions: Permission[]; doctorId: string | null; hospitalName?: string }
export interface Lookups {
  branches: { id: string; name: string; code: string }[]; departments: { id: string; name: string; code: string }[];
  doctors: { id: string; name: string; departmentId: string; branchId: string; userId: string | null }[];
  services: { id: string; name: string; code: string; rate: number; category: string }[];
  wards: { id: string; name: string; branchId: string }[]; stores: { id: string; name: string; storeType: string; branchId: string }[];
  suppliers: { id: string; name: string }[]; items: { id: string; name: string; code: string; schedule: string; uom: string }[];
}

interface Toast { id: number; text: string; tone: "ok" | "crit" }
interface Ctx {
  me: Me | null; lookups: Lookups | null; can: (p: Permission) => boolean;
  refreshLookups: () => Promise<void>; toast: (text: string, tone?: "ok" | "crit") => void;
}
const SessionCtx = createContext<Ctx>(null as never);
export const useSession = () => useContext(SessionCtx);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const refreshLookups = useCallback(async () => setLookups(await api.get<Lookups>("/api/lookups")), []);
  useEffect(() => {
    if (typeof document !== "undefined" && !document.cookie.includes("sevana_sid=")) {
      const pathname = window.location.pathname;
      if (pathname !== "/login") {
        const next = pathname === "/" || pathname === "/dashboard" ? "" : `?next=${encodeURIComponent(pathname)}`;
        window.location.replace(`/login${next}`);
        return;
      }
    }
    api.get<Me>("/api/auth/me").then(setMe).catch(() => undefined);
    refreshLookups().catch(() => undefined);
  }, [refreshLookups]);
  const toast = useCallback((text: string, tone: "ok" | "crit" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === "crit" ? 7000 : 3500);
  }, []);
  const can = useCallback((p: Permission) => !!me?.permissions.includes(p), [me]);
  return (
    <SessionCtx.Provider value={{ me, lookups, can, refreshLookups, toast }}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast-${t.tone}`}>{t.text}</div>)}
      </div>
    </SessionCtx.Provider>
  );
}
