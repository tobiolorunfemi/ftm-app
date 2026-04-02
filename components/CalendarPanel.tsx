"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays, MapPin, Clock } from "lucide-react";

type Match = {
  id: string;
  stage: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string | null;
  venue: string | null;
  venueLocation: string | null;
  homeTeam: { name: string } | null;
  awayTeam: { name: string } | null;
};

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: "bg-gray-400",
  LIVE: "bg-red-500",
  FINISHED: "bg-green-500",
  POSTPONED: "bg-yellow-500",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function CalendarPanel({ tournament }: { tournament: any }) {
  const matches: Match[] = tournament.matches;
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [view, setView] = useState<"month" | "upcoming">("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Map date-string → matches
  const matchesByDate: Record<string, Match[]> = {};
  for (const m of matches) {
    if (!m.scheduledAt) continue;
    const d = new Date(m.scheduledAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    matchesByDate[key] = matchesByDate[key] ?? [];
    matchesByDate[key].push(m);
  }

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const cellKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Upcoming matches (scheduled, not yet played, sorted by date)
  const upcoming = matches
    .filter((m) => m.scheduledAt && m.status === "SCHEDULED")
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 10);

  const selectedMatches = selectedDate ? (matchesByDate[selectedDate] ?? []) : [];

  return (
    <div className="space-y-6">
      {/* View switcher */}
      <div className="flex items-center gap-2">
        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
          <button
            onClick={() => setView("month")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${view === "month" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Month
          </button>
          <button
            onClick={() => setView("upcoming")}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors ${view === "upcoming" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {view === "upcoming" ? (
        <UpcomingView matches={upcoming} />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-gray-700">
              {MONTHS[month]} {year}
            </h3>
            <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 text-gray-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 divide-x divide-y">
            {cells.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="bg-gray-50 h-16 sm:h-20" />;
              const key = cellKey(day);
              const dayMatches = matchesByDate[key] ?? [];
              const isToday = key === todayKey;
              const isSelected = key === selectedDate;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(isSelected ? null : key)}
                  className={`h-16 sm:h-20 p-1 text-left hover:bg-green-50 transition-colors relative ${
                    isSelected ? "bg-green-50 ring-2 ring-inset ring-green-400" : ""
                  }`}
                >
                  <span
                    className={`text-xs font-medium block mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday ? "bg-green-700 text-white" : "text-gray-600"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="space-y-0.5 overflow-hidden">
                    {dayMatches.slice(0, 2).map((m) => (
                      <div key={m.id} className="flex items-center gap-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[m.status] ?? "bg-gray-400"}`} />
                        <span className="text-[9px] text-gray-600 truncate leading-tight">
                          {m.homeTeam?.name ?? "TBD"} v {m.awayTeam?.name ?? "TBD"}
                        </span>
                      </div>
                    ))}
                    {dayMatches.length > 2 && (
                      <span className="text-[9px] text-gray-400">+{dayMatches.length - 2} more</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected date matches */}
          {selectedDate && selectedMatches.length > 0 && (
            <div className="border-t p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(undefined, { dateStyle: "long" })}
              </p>
              {selectedMatches.map((m) => (
                <MatchSummaryRow key={m.id} match={m} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MatchSummaryRow({ match }: { match: Match }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[match.status] ?? "bg-gray-400"}`} />
        <span className="font-medium text-gray-800 truncate">
          {match.homeTeam?.name ?? "TBD"} vs {match.awayTeam?.name ?? "TBD"}
        </span>
        {match.status === "FINISHED" && (
          <span className="text-xs font-bold text-green-700 shrink-0">
            {match.homeScore}–{match.awayScore}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
        {match.scheduledAt && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(match.scheduledAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
          </span>
        )}
        {match.venue && (
          <span className="flex items-center gap-1 truncate max-w-[160px]">
            <MapPin className="w-3 h-3 shrink-0" />
            {match.venue}{match.venueLocation ? `, ${match.venueLocation}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function UpcomingView({ matches }: { matches: Match[] }) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No upcoming scheduled matches.</p>
        <p className="text-sm mt-1">Set kick-off times on your fixtures to see them here.</p>
      </div>
    );
  }

  // Group by date
  const byDate: Record<string, Match[]> = {};
  for (const m of matches) {
    const d = new Date(m.scheduledAt!);
    const key = d.toLocaleDateString(undefined, { dateStyle: "full" });
    byDate[key] = byDate[key] ?? [];
    byDate[key].push(m);
  }

  return (
    <div className="space-y-6">
      {Object.entries(byDate).map(([date, dayMatches]) => (
        <div key={date}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{date}</h3>
          <div className="bg-white rounded-xl border shadow-sm divide-y">
            {dayMatches.map((m) => (
              <div key={m.id} className="px-4 py-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex-1 text-sm font-medium text-right text-gray-800">
                    {m.homeTeam?.name ?? "TBD"}
                  </span>
                  <div className="text-center min-w-[60px]">
                    {m.scheduledAt && (
                      <p className="text-xs font-semibold text-green-700">
                        {new Date(m.scheduledAt).toLocaleTimeString(undefined, { timeStyle: "short" })}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400">{m.stage}</p>
                  </div>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {m.awayTeam?.name ?? "TBD"}
                  </span>
                </div>
                {m.venue && (
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 justify-center">
                    <MapPin className="w-3 h-3" />
                    {m.venue}{m.venueLocation ? `, ${m.venueLocation}` : ""}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
