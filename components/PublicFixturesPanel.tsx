"use client";

import { CalendarDays, MapPin, Clock } from "lucide-react";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";

const statusStyle: Record<MatchStatus, string> = {
  SCHEDULED: "bg-gray-100 text-gray-600",
  LIVE: "bg-red-100 text-red-600 animate-pulse",
  FINISHED: "bg-green-100 text-green-700",
  POSTPONED: "bg-yellow-100 text-yellow-700",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicFixturesPanel({ tournament }: { tournament: any }) {
  if (tournament.matches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No fixtures yet.</p>
      </div>
    );
  }

  // Group matches by round
  const byRound: Record<number, typeof tournament.matches> = {};
  for (const m of tournament.matches) {
    byRound[m.round] = byRound[m.round] ?? [];
    byRound[m.round].push(m);
  }

  return (
    <div className="space-y-6">
      {Object.entries(byRound).map(([round, matches]) => (
        <div key={round}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {matches[0].stage === "LEAGUE" || matches[0].stage === "GROUP"
              ? `Matchday ${round}`
              : matches[0].stage}
          </h3>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {matches.map((match: any) => (
              <div key={match.id} className="bg-white rounded-xl border shadow-sm px-4 py-3">
                {(match.venue || match.scheduledAt) && (
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2">
                    {match.venue && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {match.venue}{match.venueLocation ? `, ${match.venueLocation}` : ""}
                      </span>
                    )}
                    {match.scheduledAt && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(match.scheduledAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex-1 text-sm font-medium text-right text-gray-800">
                    {match.homeTeam?.name ?? "TBD"}
                  </span>

                  <div className="flex flex-col items-center min-w-[80px]">
                    {match.status === "FINISHED" ? (
                      <span className="text-lg font-bold text-gray-900">
                        {match.homeScore} – {match.awayScore}
                      </span>
                    ) : match.status === "LIVE" ? (
                      <span className="text-lg font-bold text-red-600">
                        {match.homeScore ?? 0} – {match.awayScore ?? 0}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">vs</span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${
                        statusStyle[match.status as MatchStatus]
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {match.awayTeam?.name ?? "TBD"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
