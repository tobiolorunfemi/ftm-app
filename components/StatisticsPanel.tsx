"use client";

import { useState, useEffect } from "react";
import { Loader2, Trophy, Target, ShieldCheck } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";

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

const rankStyle = (rank: number) => {
  if (rank === 1) return "bg-yellow-400 text-white font-black";
  if (rank === 2) return "bg-gray-300 text-gray-700 font-bold";
  if (rank === 3) return "bg-orange-300 text-white font-bold";
  return "bg-gray-100 text-gray-500";
};

function PlayerDetailContent({ player, rank }: { player: Player; rank: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mx-auto mb-2 ${rankStyle(rank)}`}>
          {rank}
        </div>
        <p className="text-lg font-bold text-gray-900">{player.name}</p>
        <p className="text-sm text-gray-500">{player.team.name}</p>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1 inline-block">{player.position}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Goals", value: player.goals, color: "text-gray-900" },
          { label: "Assists", value: player.assists, color: "text-blue-600" },
          { label: "Yellow Cards", value: player.yellowCards, color: "text-yellow-600" },
          { label: "Red Cards", value: player.redCards, color: "text-red-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border rounded-xl p-3 text-center">
            <div className={`text-2xl font-black ${color}`}>{value}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CleanSheetDetailContent({ cs, rank }: { cs: CleanSheet; rank: number }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm mx-auto mb-2 ${rankStyle(rank)}`}>
          {rank}
        </div>
        <p className="text-lg font-bold text-gray-900">{cs.team.name}</p>
        <div className="text-3xl font-black text-green-700 mt-2">{cs.count}</div>
        <p className="text-xs text-gray-400">Clean Sheets</p>
      </div>
      {cs.team.players.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Goalkeepers</h3>
          <div className="space-y-1">
            {cs.team.players.map((p) => (
              <div key={p.id} className="bg-white border rounded-lg px-3 py-2 text-sm text-gray-800">{p.name}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardCard({
  title,
  icon,
  rows,
  renderDetail,
}: {
  title: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: { rank: number; name: string; team: string; stat: number; statLabel: string; raw: any }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderDetail: (raw: any, rank: number) => React.ReactNode;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selected, setSelected] = useState<{ raw: any; rank: number } | null>(null);

  return (
    <>
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
              <button
                key={`${row.rank}-${row.name}`}
                onClick={() => setSelected({ raw: row.raw, rank: row.rank })}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors group text-left"
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${rankStyle(row.rank)}`}>
                  {row.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{row.name}</p>
                  <p className="text-xs text-gray-400 truncate">{row.team}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-green-700">{row.stat}</div>
                  <div className="text-[10px] text-gray-400">{row.statLabel}</div>
                </div>
                <span className="text-gray-300 group-hover:text-green-500 transition-colors">›</span>
              </button>
            ))}
          </div>
        )}
        {rows.length > 0 && (
          <p className="text-[10px] text-gray-400 text-center pb-2">Tap a row for full stats</p>
        )}
      </div>

      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? rows.find((r) => r.rank === selected.rank)?.name ?? title : title}
      >
        {selected && renderDetail(selected.raw, selected.rank)}
      </BottomSheet>
    </>
  );
}

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

  const hasData = stats.topScorers.length > 0 || stats.assistLeaders.length > 0 || stats.cleanSheets.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-20 text-gray-400">
        <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p>No statistics yet.</p>
        <p className="text-sm mt-1">Stats appear once match events (goals, assists, cards) are logged.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <LeaderboardCard
        title="Top Scorers"
        icon={<Trophy className="w-4 h-4 text-yellow-500" />}
        rows={stats.topScorers.map((p, i) => ({
          rank: i + 1, name: p.name, team: p.team.name,
          stat: p.goals, statLabel: "Goals", raw: p,
        }))}
        renderDetail={(raw, rank) => <PlayerDetailContent player={raw} rank={rank} />}
      />
      <LeaderboardCard
        title="Assist Leaders"
        icon={<Target className="w-4 h-4 text-blue-500" />}
        rows={stats.assistLeaders.map((p, i) => ({
          rank: i + 1, name: p.name, team: p.team.name,
          stat: p.assists, statLabel: "Assists", raw: p,
        }))}
        renderDetail={(raw, rank) => <PlayerDetailContent player={raw} rank={rank} />}
      />
      <LeaderboardCard
        title="Clean Sheets"
        icon={<ShieldCheck className="w-4 h-4 text-green-500" />}
        rows={stats.cleanSheets.map((cs, i) => ({
          rank: i + 1, name: cs.team.name, team: `${cs.count} clean sheets`,
          stat: cs.count, statLabel: "Clean Sheets", raw: cs,
        }))}
        renderDetail={(raw, rank) => <CleanSheetDetailContent cs={raw} rank={rank} />}
      />
    </div>
  );
}
