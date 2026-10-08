import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const SEASONS = [
  { id: "spring", label: "Spring", emoji: "🌸", color: "bg-pink-500", text: "text-white", ring: "focus-visible:ring-pink-300" },
  { id: "summer", label: "Summer", emoji: "☀️", color: "bg-amber-400", text: "text-amber-950", ring: "focus-visible:ring-amber-200" },
  { id: "autumn", label: "Autumn", emoji: "🍂", color: "bg-orange-600", text: "text-white", ring: "focus-visible:ring-orange-300" },
  { id: "winter", label: "Winter", emoji: "❄️", color: "bg-sky-500", text: "text-white", ring: "focus-visible:ring-sky-300" },
] as const;

export type Season = (typeof SEASONS)[number]["id"];
export type Counts = Record<Season, number>;

export const EMPTY_COUNTS: Counts = { spring: 0, summer: 0, autumn: 0, winter: 0 };

export function isSeason(value: unknown): value is Season {
  return SEASONS.some((s) => s.id === value);
}

let client: SupabaseClient | null = null;

/** Returns the browser client, or null when env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  client = createClient(url, anonKey, { auth: { persistSession: false } });
  return client;
}

export async function fetchCounts(supabase: SupabaseClient): Promise<Counts> {
  const { data, error } = await supabase.rpc("get_vote_counts");
  if (error) throw error;
  const counts: Counts = { ...EMPTY_COUNTS };
  for (const row of (data ?? []) as { season: string; count: number | string }[]) {
    if (isSeason(row.season)) counts[row.season] = Number(row.count);
  }
  return counts;
}
