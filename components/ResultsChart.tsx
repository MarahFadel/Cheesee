import { SEASONS, type Counts } from "@/lib/supabase";

export default function ResultsChart({ counts }: { counts: Counts }) {
  const total = SEASONS.reduce((sum, s) => sum + counts[s.id], 0);

  return (
    <section aria-label="Live results" className="space-y-4">
      <ul className="space-y-3">
        {SEASONS.map((s) => {
          const n = counts[s.id];
          const pct = total ? (n / total) * 100 : 0;
          return (
            <li key={s.id}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-base sm:text-lg">
                <span className="font-semibold">
                  <span aria-hidden>{s.emoji}</span> {s.label}
                </span>
                <span className="tabular-nums text-slate-600 dark:text-slate-300">
                  {n.toLocaleString()} · {pct.toFixed(1)}%
                </span>
              </div>
              <div
                className="h-5 overflow-hidden rounded-full bg-slate-200 sm:h-6 dark:bg-slate-800"
                role="progressbar"
                aria-label={`${s.label} votes`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct)}
              >
                <div
                  className={`${s.color} h-full rounded-full transition-[width] duration-700 ease-out`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-center text-lg font-medium tabular-nums sm:text-xl">
        Total votes: {total.toLocaleString()}
      </p>
    </section>
  );
}
