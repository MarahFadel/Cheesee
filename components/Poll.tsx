"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ResultsChart from "@/components/ResultsChart";
import Toast, { type ToastData } from "@/components/Toast";
import VoteButtons from "@/components/VoteButtons";
import { EMPTY_COUNTS, fetchCounts, getSupabase, isSeason, type Counts, type Season } from "@/lib/supabase";

type Connection = "connecting" | "live" | "offline";

export default function Poll() {
  const [counts, setCounts] = useState<Counts>(EMPTY_COUNTS);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = getSupabase();

  const showToast = useCallback((message: string, tone: ToastData["tone"]) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message, tone });
    toastTimer.current = setTimeout(() => setToast(null), tone === "success" ? 1500 : 3500);
  }, []);

  const sync = useCallback(async () => {
    if (!supabase) return;
    try {
      setCounts(await fetchCounts(supabase));
      setLoadError(null);
    } catch {
      setLoadError("Couldn't load the latest results. Retrying when the connection returns.");
    }
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    void sync();

    const channel = supabase
      .channel("votes-inserts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "votes" }, (payload) => {
        const season = (payload.new as { season?: unknown }).season;
        if (isSeason(season)) {
          setCounts((prev) => ({ ...prev, [season]: prev[season] + 1 }));
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnection("live");
          // Fires on first join and on every rejoin: catch up on anything missed.
          void sync();
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          setConnection("offline");
        }
      });

    const onFocus = () => {
      if (document.visibilityState === "visible") void sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
      void supabase.removeChannel(channel);
    };
  }, [supabase, sync]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const vote = useCallback(
    async (season: Season) => {
      if (!supabase) return;
      const { error } = await supabase.from("votes").insert({ season });
      if (error) {
        showToast("Vote failed — please try again.", "error");
        return;
      }
      showToast("Vote counted!", "success");
      // Without a live channel the insert event won't arrive, so pull fresh totals.
      if (connection !== "live") void sync();
    },
    [supabase, connection, showToast, sync],
  );

  if (!supabase) {
    return (
      <p className="rounded-xl bg-red-100 p-4 text-red-800 dark:bg-red-950 dark:text-red-200">
        Supabase isn&apos;t configured. Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> (see <code>.env.example</code>).
      </p>
    );
  }

  return (
    <>
      <VoteButtons onVote={vote} />

      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-bold sm:text-2xl">Live results</h2>
        <ConnectionBadge connection={connection} />
      </div>

      {(loadError || connection === "offline") && (
        <p role="alert" className="rounded-xl bg-amber-100 p-3 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          {loadError ?? "Live updates paused — reconnecting…"}
        </p>
      )}

      <ResultsChart counts={counts} />
      <Toast toast={toast} />
    </>
  );
}

function ConnectionBadge({ connection }: { connection: Connection }) {
  const styles: Record<Connection, [string, string]> = {
    connecting: ["bg-slate-400", "Connecting"],
    live: ["bg-emerald-500 animate-pulse", "Live"],
    offline: ["bg-red-500", "Offline"],
  };
  const [dot, label] = styles[connection];
  return (
    <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
