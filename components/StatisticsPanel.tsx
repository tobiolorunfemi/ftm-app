"use client";

import { useState, useEffect } from "react";
import { Loader2, Trophy, Target, ShieldCheck } from "lucide-react";

type Player = {
  id: string;
  name: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  position: string;
  team: { id: string; name: string };
};

type CleanSheet = {
  team: { id: string; name: string; players: { id: string; name: string }[] };
  count: number;
};

type Stats = {
  topScorers: Player[];
  assistLeaders: Player[];
  cleanSheets: CleanSheet[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StatisticsPanel({ tournament }: { tournament: any }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournament.id}/stats`)
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); });
  }, [tournament.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading statistics...
      </div>
    );
  }

  if (!stats) return null;

  const hasData =
    stats.topScorers.length > 0 ||
    stats.assistLeaders.length > 0 ||
    stats.cleanSheets.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No statistics yet.</p>
        <p className="text-sm mt-1">Stats will appear once match events (goals, assists, cards) are logged.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top Scorers */}
      <LeaderboardCard
        title="Top Scorers"
        icon={<Trophy className="w-4 h-4 text-yellow-500" />}
        rows={stats.topScorers.map((p, i) => ({
          rank: i + 1,
          name: p.name,
          team: p.team.name,
          stat: p.goals,
          statLabel: "Goals",
          secondary: p.assists > 0 ? `${p.assists} assists` : undefined,
        }))}
      />

      {/* Assist Leaders */}
      <LeaderboardCard
        title="Assist Leaders"
        icon={<Target className="w-4 h-4 text-blue-500" />}
        rows={stats.assistLeaders.map((p, i) => ({
          rank: i + 1,
          name: p.name,
          team: p.team.name,
          stat: p.assists,
          statLabel: "Assists",
          secondary: p.goals > 0 ? `${p.goals} goals` : undefined,
        }))}
      />

      {/* Clean Sheets */}
      <LeaderboardCard
        title="Clean Sheets"
        icon={<ShieldCheck className="w-4 h-4 text-green-500" />}
        rows={stats.cleanSheets.map((cs, i) => ({
          rank: i + 1,
          name: cs.team.name,
          team: cs.team.players.length > 0
            ? `GK: ${cs.team.players.map((p) => p.name).join(", ")}`
            : "",
          stat: cs.count,
          statLabel: "Clean Sheets",
        }))}
      />
    </div>
  );
}

type LeaderboardRow = {
  rank: number;
  name: string;
  team: string;
  stat: number;
  statLabel: string;
  secondary?: string;
};

function LeaderboardCard({
  title,
  icon,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  rows: LeaderboardRow[];
}) {
  const rankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-700 font-bold";
    if (rank === 2) return "bg-gray-100 text-gray-600 font-semibold";
    if (rank === 3) return "bg-orange-50 text-orange-600 font-semibold";
    return "bg-white text-gray-500";
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
        {icon}
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">No data yet</div>
      ) : (
        <div className="divide-y">
          {rows.map((row) => (
            <div key={`${row.rank}-${row.name}`} className="flex items-center gap-3 px-4 py-2.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${rankStyle(row.rank)}`}
              >
                {row.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {row.team}
                  {row.secondary && ` · ${row.secondary}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold text-green-700">{row.stat}</div>
                <div className="text-[10px] text-gray-400">{row.statLabel}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
