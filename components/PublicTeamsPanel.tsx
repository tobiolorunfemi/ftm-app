"use client";

import { useState } from "react";
import { Users, Loader2, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

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

function PublicTeamCard({ team }: { team: Team }) {
  const [expanded, setExpanded] = useState(false);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!expanded && players === null) {
      setLoading(true);
      const res = await fetch(`/api/teams/${team.id}/players`);
      const data = await res.json();
      setPlayers(data);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  const sortedPlayers = players
    ? [...players].sort((a, b) => {
        const pa = POSITION_ORDER.indexOf(a.position);
        const pb = POSITION_ORDER.indexOf(b.position);
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-green-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{team.name}</p>
          {(team.headCoach || team.assistantCoach) && (
            <p className="text-xs text-gray-400 truncate">
              {team.headCoach && `HC: ${team.headCoach}`}
              {team.headCoach && team.assistantCoach && " · "}
              {team.assistantCoach && `AC: ${team.assistantCoach}`}
            </p>
          )}
        </div>

        {team.group && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
            {team.group.name}
          </span>
        )}

        <button onClick={toggle} className="text-gray-400 hover:text-gray-600 ml-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading squad...
            </div>
          ) : sortedPlayers.length > 0 ? (
            <div className="overflow-x-auto">
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
                  {sortedPlayers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-center text-xs text-gray-500 font-mono">
                        {p.jerseyNumber ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-800">{p.name}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${POSITION_COLORS[p.position] ?? "bg-gray-100 text-gray-600"}`}>
                          {p.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-sm text-gray-700">{p.goals}</td>
                      <td className="px-3 py-2 text-center text-sm text-gray-700">{p.assists}</td>
                      <td className="px-3 py-2 text-center text-sm text-yellow-600">{p.yellowCards}</td>
                      <td className="px-3 py-2 text-center text-sm text-red-600">{p.redCards}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
              No players registered yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicTeamsPanel({ tournament }: { tournament: any }) {
  if (tournament.teams.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>No teams registered yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tournament.teams.map((team: Team) => (
        <PublicTeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
