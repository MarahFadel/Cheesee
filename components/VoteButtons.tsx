"use client";

import { SEASONS, type Season } from "@/lib/supabase";

type Props = {
  onVote: (season: Season) => void;
  disabled?: boolean;
};

export default function VoteButtons({ onVote, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {SEASONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onVote(s.id)}
          disabled={disabled}
          className={`${s.color} ${s.text} ${s.ring} flex flex-col items-center justify-center gap-1 rounded-2xl px-4 py-6 shadow-lg transition-transform duration-100 ease-out select-none hover:scale-[1.03] hover:brightness-110 focus:outline-none focus-visible:ring-4 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 sm:py-8 lg:py-10`}
        >
          <span className="text-5xl sm:text-6xl" aria-hidden>
            {s.emoji}
          </span>
          <span className="text-xl font-bold sm:text-2xl">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
