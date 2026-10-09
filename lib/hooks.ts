"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";

/** Fetch JSON with loading/error state. `reload()` refetches. Pass null to skip. */
export function useData<T = any>(url: string | null, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!url);
  const seq = useRef(0);
  const reload = useCallback(async () => {
    if (!url) return;
    const n = ++seq.current;
    setLoading(true);
    try {
      const d = await api.get<T>(url);
      if (n === seq.current) { setData(d); setError(null); }
    } catch (e: any) {
      if (n === seq.current) setError(e.message);
    } finally {
      if (n === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}

/** Subscribe to server-sent events; calls onEvent for matching types. */
export function useEvents(types: string[], onEvent: () => void) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  useEffect(() => {
    const es = new EventSource("/api/events");
    const h = () => cb.current();
    types.forEach((t) => es.addEventListener(t, h));
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(",")]);
}
