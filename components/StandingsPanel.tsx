"use client";

import { BarChart3 } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StandingsTable({ standings, title }: { standings: any[]; title?: string }) {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {title && (
        <div className="bg-gray-50 border-b px-4 py-2">
          <h3 className="font-semibold text-sm text-gray-700">{title}</h3>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-xs text-gray-500 font-medium">
              <th className="text-left px-4 py-2 w-8">#</th>
              <th className="text-left px-4 py-2">Team</th>
              <th className="text-center px-2 py-2">P</th>
              <th className="text-center px-2 py-2">W</th>
              <th className="text-center px-2 py-2">D</th>
              <th className="text-center px-2 py-2">L</th>
              <th className="text-center px-2 py-2">GF</th>
              <th className="text-center px-2 py-2">GA</th>
              <th className="text-center px-2 py-2">GD</th>
              <th className="text-center px-4 py-2 font-bold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {standings.map((s: any, i: number) => (
              <tr
                key={s.id}
                className={`transition-colors ${i === 0 ? "bg-green-50" : "hover:bg-gray-50"}`}
              >
                <td className="px-4 py-2.5 text-gray-500 font-medium">{i + 1}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{s.team.name}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.played}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.won}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.drawn}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.lost}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.goalsFor}</td>
                <td className="px-2 py-2.5 text-center text-gray-600">{s.goalsAgainst}</td>
                <td className={`px-2 py-2.5 text-center font-medium ${s.goalDiff > 0 ? "text-green-600" : s.goalDiff < 0 ? "text-red-500" : "text-gray-600"}`}>
                  {s.goalDiff > 0 ? `+${s.goalDiff}` : s.goalDiff}
                </td>
                <td className="px-4 py-2.5 text-center font-bold text-gray-900">{s.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function StandingsPanel({ tournament }: { tournament: any }) {
  // Group_Knockout: show per-group standings
  if (tournament.groups.length > 0) {
    return (
      <div className="space-y-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {tournament.groups.map((group: any) => (
          <StandingsTable
            key={group.id}
            title={group.name}
            standings={group.standings}
          />
        ))}
      </div>
    );
  }

  // League: show overall standings (grouped by null groupId)
  const allStandings = tournament.teams.flatMap(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (t: any) => t.standings.map((s: any) => ({ ...s, team: t }))
  ).sort((a: { points: number; goalDiff: number; goalsFor: number }, b: { points: number; goalDiff: number; goalsFor: number }) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });

  if (allStandings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-40" />
        <p>Standings will appear once matches are played.</p>
      </div>
    );
  }

  return <StandingsTable standings={allStandings} />;
}
