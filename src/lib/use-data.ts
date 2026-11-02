"use client";
import { useCallback, useEffect, useState, type DependencyList } from "react";

/** Loads async data for a page. `reload()` fetches again after a change. */
export function useData<T>(load: () => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    run().then((d) => { if (alive) { setData(d); setError(undefined); } })
      .catch((e: unknown) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [run, tick]);
  return { data, error, loading, reload: () => setTick((n) => n + 1), setData };
}
