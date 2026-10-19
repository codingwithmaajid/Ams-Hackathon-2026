import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "./api";

/**
 * Backend reachability. Render's free plan sleeps the API after inactivity and
 * the first request takes ~1 minute to wake it, so "not answering yet" is a
 * normal state (waking), not an error. We ping /health until it answers or
 * until WAKE_BUDGET_MS passes, then show "offline" with a retry button.
 */
export type BackendState = "checking" | "online" | "waking" | "offline";

interface BackendContextValue {
  state: BackendState;
  /** Increments each time the backend comes (back) online; data hooks refetch on change. */
  epoch: number;
  service: string | null;
  lastError: string | null;
  waitingSeconds: number;
  retry: () => void;
  /** Call when a data request fails with a network error, to re-enter the waking loop. */
  reportUnreachable: () => void;
}

const BackendContext = createContext<BackendContextValue | null>(null);

const WAKE_BUDGET_MS = 120_000;
const PING_INTERVAL_MS = 4_000;
const ONLINE_RECHECK_MS = 30_000;

export function BackendProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BackendState>("checking");
  const [epoch, setEpoch] = useState(0);
  const [service, setService] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const run = useRef(0);
  const stateRef = useRef<BackendState>("checking");
  stateRef.current = state;

  const loop = useCallback(async () => {
    const id = ++run.current;
    const t0 = Date.now();
    setStartedAt(t0);
    let first = true;
    while (run.current === id) {
      try {
        const h = await api.health(first ? 8000 : 15000);
        if (run.current !== id) return;
        setService(h.service);
        setLastError(null);
        if (stateRef.current !== "online") {
          setState("online");
          setEpoch((e) => e + 1);
        }
        return;
      } catch (e) {
        if (run.current !== id) return;
        setLastError(e instanceof ApiError ? e.message : String(e));
        if (Date.now() - t0 > WAKE_BUDGET_MS) {
          setState("offline");
          return;
        }
        setState("waking");
        first = false;
        await new Promise((r) => setTimeout(r, PING_INTERVAL_MS));
      }
    }
  }, []);

  useEffect(() => {
    void loop();
    return () => {
      run.current++;
    };
  }, [loop]);

  // Ticker for the "waiting Ns" counter.
  useEffect(() => {
    if (state !== "waking" && state !== "checking") return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state]);

  // While online, re-check occasionally so a sleeping backend is noticed.
  useEffect(() => {
    if (state !== "online") return;
    const t = setInterval(async () => {
      try {
        await api.health(10000);
      } catch {
        if (stateRef.current === "online") void loop();
      }
    }, ONLINE_RECHECK_MS);
    return () => clearInterval(t);
  }, [state, loop]);

  const retry = useCallback(() => {
    setState("checking");
    void loop();
  }, [loop]);

  const reportUnreachable = useCallback(() => {
    if (stateRef.current === "online") {
      setState("waking");
      void loop();
    }
  }, [loop]);

  return (
    <BackendContext.Provider
      value={{
        state,
        epoch,
        service,
        lastError,
        waitingSeconds: Math.max(0, Math.round((now - startedAt) / 1000)),
        retry,
        reportUnreachable,
      }}
    >
      {children}
    </BackendContext.Provider>
  );
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error("useBackend must be used inside <BackendProvider>");
  return ctx;
}

interface ApiState<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Fetch from the backend once it is online; refetch when it comes back, when
 * deps change, and every `intervalMs` if given.
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  opts: { intervalMs?: number; enabled?: boolean } = {},
): ApiState<T> {
  const { state, epoch, reportUnreachable } = useBackend();
  const { intervalMs, enabled = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const online = state === "online";

  useEffect(() => {
    if (!online || !enabled) return;
    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e instanceof ApiError ? e : new ApiError("network", String(e));
        setError(err);
        if (err.kind !== "http") reportUnreachable();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, enabled, epoch, tick, ...deps]);

  useEffect(() => {
    if (!online || !enabled || !intervalMs) return;
    const t = setInterval(() => setTick((n) => n + 1), intervalMs);
    return () => clearInterval(t);
  }, [online, enabled, intervalMs]);

  return { data, error, loading, reload: () => setTick((n) => n + 1) };
}
