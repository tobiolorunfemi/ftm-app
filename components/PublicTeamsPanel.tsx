"use client";

import { useState } from "react";
import { Users, Loader2, ShieldCheck } from "lucide-react";
import BottomSheet from "@/components/BottomSheet";

type Player = {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

type Team = {
  id: string;
  name: string;
  logo?: string | null;
  headCoach?: string | null;
  assistantCoach?: string | null;
  group?: { name: string } | null;
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-700",
  DEF: "bg-blue-100 text-blue-700",
  MID: "bg-green-100 text-green-700",
  FWD: "bg-red-100 text-red-700",
};

function TeamDetailContent({ team }: { team: Team }) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Auto-fetch on mount
  if (!fetched) {
    setFetched(true);
    setLoading(true);
    fetch(`/api/teams/${team.id}/players`)
      .then((r) => r.json())
      .then((data) => { setPlayers(data); setLoading(false); });
  }

  const sorted = players
    ? [...players].sort((a, b) => {
        const pa = POSITION_ORDER.indexOf(a.position);
        const pb = POSITION_ORDER.indexOf(b.position);
        if (pa !== pb) return pa - pb;
        return (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99);
      })
    : [];

  return (
    <div className="space-y-4">
      {/* Team header */}
      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-green-700" />
          )}
        </div>
        <div>
          <p className="font-bold text-gray-900">{team.name}</p>
          {team.group && <p className="text-xs text-blue-600">{team.group.name}</p>}
          {team.headCoach && <p className="text-xs text-gray-500">HC: {team.headCoach}</p>}
          {team.assistantCoach && <p className="text-xs text-gray-500">AC: {team.assistantCoach}</p>}
        </div>
      </div>

      {/* Squad */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Squad</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading squad...
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
            No players registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-left">
                  <th className="px-3 py-2 text-center w-8">#</th>
                  <th className="px-3 py-2">Player</th>
                  <th className="px-3 py-2">Pos</th>
                  <th className="px-3 py-2 text-center">⚽</th>
                  <th className="px-3 py-2 text-center">🎯</th>
                  <th className="px-3 py-2 text-center">🟨</th>
                  <th className="px-3 py-2 text-center">🟥</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-center text-gray-400 font-mono">{p.jerseyNumber ?? "—"}</td>
                    <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                    <td className="px-3 py-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${POSITION_COLORS[p.position] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.position}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700">{p.goals}</td>
                    <td className="px-3 py-2 text-center text-gray-700">{p.assists}</td>
                    <td className="px-3 py-2 text-center text-yellow-600">{p.yellowCards}</td>
                    <td className="px-3 py-2 text-center text-red-600">{p.redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicTeamsPanel({ tournament }: { tournament: any }) {
  const [selected, setSelected] = useState<Team | null>(null);

  if (tournament.teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No teams registered yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {tournament.teams.map((team: Team) => (
          <button
            key={team.id}
            onClick={() => setSelected(team)}
            className="flex items-center gap-3 bg-white rounded-xl border shadow-sm px-4 py-3 text-left hover:shadow-md hover:border-green-200 transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
              {team.logo ? (
                <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-green-700" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{team.name}</p>
              {team.headCoach && (
                <p className="text-xs text-gray-400 truncate">HC: {team.headCoach}</p>
              )}
            </div>
            {team.group && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
                {team.group.name}
              </span>
            )}
            <span className="text-xs text-gray-300 group-hover:text-green-500 transition-colors shrink-0">›</span>
          </button>
        ))}
      </div>

      <BottomSheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name ?? "Team"}
      >
        {selected && <TeamDetailContent key={selected.id} team={selected} />}
      </BottomSheet>
    </>
  );
}
