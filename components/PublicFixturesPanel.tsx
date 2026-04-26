"use client";

import { useState } from "react";
import { CalendarDays, MapPin, Clock, Info, ShieldCheck } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED" | "CANCELLED" | "WALKOVER";

const statusStyle: Record<string, string> = {
  SCHEDULED: "bg-gray-100 text-gray-500",
  LIVE: "bg-red-100 text-red-600 animate-pulse",
  FINISHED: "bg-green-100 text-green-700",
  POSTPONED: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-red-50 text-red-400",
  WALKOVER: "bg-orange-100 text-orange-700",
};

const statusLabel: Record<string, string> = {
  SCHEDULED: "Scheduled",
  LIVE: "Live",
  FINISHED: "Full Time",
  POSTPONED: "Postponed",
  CANCELLED: "Cancelled",
  WALKOVER: "Walkover",
};

const EVENT_ICON: Record<string, string> = {
  GOAL: "⚽",
  ASSIST: "🎯",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MatchDetailContent({ match }: { match: any }) {
  const hasVenue = match.venue || match.venueLocation;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const homeEvents = (match.events ?? []).filter((e: any) => e.teamId === match.homeTeamId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const awayEvents = (match.events ?? []).filter((e: any) => e.teamId === match.awayTeamId);
  const hasEvents = match.events && match.events.length > 0;

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-1.5 text-right">
            <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center mx-auto overflow-hidden">
              {match.homeTeam?.logo
                ? <img src={match.homeTeam.logo} alt="" className="w-full h-full object-cover" />
                : <ShieldCheck className="w-6 h-6 text-gray-300" />}
            </div>
            <p className="text-sm font-bold text-gray-900">{match.homeTeam?.name ?? "TBD"}</p>
            <p className="text-xs text-gray-400">Home</p>
          </div>
          <div className="flex flex-col items-center">
            {match.status === "FINISHED" || match.status === "LIVE" || match.status === "WALKOVER" ? (
              <span className={`text-3xl font-black ${match.status === "LIVE" ? "text-red-600" : "text-gray-900"}`}>
                {match.homeScore ?? 0} – {match.awayScore ?? 0}
              </span>
            ) : (
              <span className="text-xl font-bold text-gray-300">vs</span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${statusStyle[match.status] ?? "bg-gray-100 text-gray-500"}`}>
              {statusLabel[match.status] ?? match.status}
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-left">
            <div className="w-12 h-12 rounded-full bg-white border flex items-center justify-center mx-auto overflow-hidden">
              {match.awayTeam?.logo
                ? <img src={match.awayTeam.logo} alt="" className="w-full h-full object-cover" />
                : <ShieldCheck className="w-6 h-6 text-gray-300" />}
            </div>
            <p className="text-sm font-bold text-gray-900">{match.awayTeam?.name ?? "TBD"}</p>
            <p className="text-xs text-gray-400">Away</p>
          </div>
        </div>
      </div>

      {/* Match info */}
      <div className="space-y-2">
        {match.stage && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">Stage</span>
            <span>{match.group?.name ?? match.stage} · Matchday {match.round}</span>
          </div>
        )}
        {match.scheduledAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">Date</span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-green-600" />
              {new Date(match.scheduledAt).toLocaleDateString(undefined, {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
        )}
        {match.scheduledAt && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">Kick-off</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-green-600" />
              {new Date(match.scheduledAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
            </span>
          </div>
        )}
        {hasVenue && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="text-xs font-medium text-gray-400 w-20 shrink-0">Venue</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              {[match.venue, match.venueLocation].filter(Boolean).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Match events */}
      {hasEvents && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Match Events</h3>
          <div className="bg-gray-50 rounded-xl divide-y">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(match.events ?? []).map((e: any) => {
              const isHome = e.teamId === match.homeTeamId;
              return (
                <div key={e.id} className={`flex items-center gap-2 px-3 py-2 text-xs ${isHome ? "" : "flex-row-reverse"}`}>
                  <span className="text-base">{EVENT_ICON[e.type] ?? "•"}</span>
                  <div className={`flex-1 ${isHome ? "text-left" : "text-right"}`}>
                    <span className="font-medium text-gray-800">{e.player?.name ?? e.team?.name ?? "—"}</span>
                    {e.minute && <span className="text-gray-400 ml-1">{e.minute}&apos;</span>}
                  </div>
                  <span className="text-[10px] text-gray-400 w-10 shrink-0 text-center">
                    {isHome ? match.homeTeam?.name?.split(" ")[0] : match.awayTeam?.name?.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MatchCard({ match, onClick }: { match: any; onClick: () => void }) {
  const hasVenue = match.venue || match.venueLocation;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-xl border shadow-sm px-3 sm:px-4 py-3 text-left hover:shadow-md hover:border-green-200 transition-all group"
    >
      {/* Top: date + venue preview */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
          {match.scheduledAt && (
            <span className="flex items-center gap-0.5">
              <CalendarDays className="w-3 h-3" />
              {new Date(match.scheduledAt).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
              {" · "}
              {new Date(match.scheduledAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
            </span>
          )}
          {hasVenue && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {match.venue ?? match.venueLocation}
            </span>
          )}
        </div>
        <Info className="w-3.5 h-3.5 text-gray-300 group-hover:text-green-500 shrink-0 transition-colors" />
      </div>

      {/* Teams + score */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-right text-gray-800 truncate">
            {match.homeTeam?.name ?? "TBD"}
          </span>
          <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
            {match.homeTeam?.logo
              ? <img src={match.homeTeam.logo} alt="" className="w-full h-full object-cover" />
              : <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />}
          </div>
        </div>
        <div className="flex flex-col items-center min-w-[64px]">
          {match.status === "FINISHED" || match.status === "LIVE" || match.status === "WALKOVER" ? (
            <span className={`text-base font-black leading-none ${match.status === "LIVE" ? "text-red-600" : "text-gray-900"}`}>
              {match.homeScore ?? 0} – {match.awayScore ?? 0}
            </span>
          ) : (
            <span className="text-xs font-medium text-gray-300">vs</span>
          )}
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full mt-1 ${statusStyle[match.status] ?? "bg-gray-100 text-gray-500"}`}>
            {statusLabel[match.status] ?? match.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-6 h-6 rounded-full bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
            {match.awayTeam?.logo
              ? <img src={match.awayTeam.logo} alt="" className="w-full h-full object-cover" />
              : <ShieldCheck className="w-3.5 h-3.5 text-gray-300" />}
          </div>
          <span className="text-sm font-semibold text-gray-800 truncate">
            {match.awayTeam?.name ?? "TBD"}
          </span>
        </div>
      </div>
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicFixturesPanel({ tournament }: { tournament: any }) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "results">("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<any | null>(null);

  const allMatches = tournament.matches;

  if (allMatches.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No fixtures yet.</p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filtered = allMatches.filter((m: any) => {
    if (filter === "upcoming") return m.status === "SCHEDULED" || m.status === "LIVE" || m.status === "POSTPONED";
    if (filter === "results") return m.status === "FINISHED";
    return true;
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const byRound: Record<number, any[]> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const m of filtered) {
    byRound[m.round] = byRound[m.round] ?? [];
    byRound[m.round].push(m);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Filter */}
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1 w-fit">
          {(["all", "upcoming", "results"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${
                filter === f ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {Object.keys(byRound).length === 0 && (
          <div className="text-center py-10 text-gray-400 text-sm">No matches in this category.</div>
        )}

        {Object.entries(byRound).map(([round, matches]) => (
          <div key={round}>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              {matches[0].stage === "LEAGUE" || matches[0].stage === "GROUP"
                ? `Matchday ${round}`
                : matches[0].stage}
            </h3>
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {matches.map((match: any) => (
                <MatchCard key={match.id} match={match} onClick={() => setSelected(match)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Match detail sheet */}
      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.homeTeam?.name ?? "TBD"} vs ${selected.awayTeam?.name ?? "TBD"}` : ""}
      >
        {selected && <MatchDetailContent match={selected} />}
      </BottomSheet>
    </>
  );
}
