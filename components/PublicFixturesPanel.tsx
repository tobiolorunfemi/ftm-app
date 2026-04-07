"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Clock } from "lucide-react";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";

const statusStyle: Record<MatchStatus, string> = {
  SCHEDULED: "bg-gray-100 text-gray-600",
  LIVE: "bg-red-100 text-red-600 animate-pulse",
  FINISHED: "bg-green-100 text-green-700",
  POSTPONED: "bg-yellow-100 text-yellow-700",
};

const statusLabel: Record<MatchStatus, string> = {
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  FINISHED: "Full Time",
  POSTPONED: "Postponed",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicFixturesPanel({ tournament }: { tournament: any }) {
  const [filter, setFilter] = useState<"all" | "scheduled" | "finished">("all");

  const allMatches = tournament.matches;

  if (allMatches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No fixtures yet.</p>
      </div>
    );
  }

  const filtered = allMatches.filter((m: { status: MatchStatus }) => {
    if (filter === "scheduled") return m.status === "SCHEDULED" || m.status === "LIVE";
    if (filter === "finished") return m.status === "FINISHED";
    return true;
  });

  // Group by round
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byRound: Record<number, any[]> = {};
  for (const m of filtered) {
    byRound[m.round] = byRound[m.round] ?? [];
    byRound[m.round].push(m);
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex bg-gray-100 p-1 rounded-lg gap-1 w-fit">
        {(["all", "scheduled", "finished"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
              filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f === "scheduled" ? "Upcoming" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {Object.keys(byRound).length === 0 && (
        <div className="text-center py-10 text-gray-400 text-sm">No matches in this category.</div>
      )}

      {Object.entries(byRound).map(([round, matches]) => (
        <div key={round}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {matches[0].stage === "LEAGUE" || matches[0].stage === "GROUP"
              ? `Matchday ${round}`
              : matches[0].stage}
          </h3>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {matches.map((match: any) => (
              <div key={match.id} className="bg-white rounded-xl border shadow-sm px-3 sm:px-4 py-3">
                {/* Date + venue row */}
                {(match.scheduledAt || match.venue) && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-2.5 pb-2 border-b border-gray-100">
                    {match.scheduledAt && (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                        <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                        {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        <Clock className="w-3.5 h-3.5 shrink-0 ml-1" />
                        {new Date(match.scheduledAt).toLocaleTimeString(undefined, {
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                    {match.venue && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {match.venue}
                        {match.venueLocation ? `, ${match.venueLocation}` : ""}
                      </span>
                    )}
                  </div>
                )}

                {/* Teams + score */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <span className="text-sm font-semibold text-right text-gray-800 truncate">
                    {match.homeTeam?.name ?? "TBD"}
                  </span>

                  <div className="flex flex-col items-center min-w-[72px]">
                    {match.status === "FINISHED" ? (
                      <span className="text-lg font-bold text-gray-900 leading-none">
                        {match.homeScore} – {match.awayScore}
                      </span>
                    ) : match.status === "LIVE" ? (
                      <span className="text-lg font-bold text-red-600 leading-none">
                        {match.homeScore ?? 0} – {match.awayScore ?? 0}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">vs</span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${
                        statusStyle[match.status as MatchStatus] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {statusLabel[match.status as MatchStatus] ?? match.status}
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-gray-800 truncate">
                    {match.awayTeam?.name ?? "TBD"}
                  </span>
                </div>

                {/* Group label if present */}
                {match.group?.name && (
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">{match.group.name}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
