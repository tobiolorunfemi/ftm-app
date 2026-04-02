export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Trophy, ArrowLeft, Users } from "lucide-react";

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-700",
  DEF: "bg-blue-100 text-blue-700",
  MID: "bg-green-100 text-green-700",
  FWD: "bg-red-100 text-red-700",
};

export default async function TeamPortalPage({
  params,
}: {
  params: Promise<{ id: string; teamId: string }>;
}) {
  const { id, teamId } = await params;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      tournament: { select: { id: true, name: true } },
      group: true,
      players: { orderBy: [{ position: "asc" }, { name: "asc" }] },
      homeMatches: {
        where: { tournamentId: id },
        include: { awayTeam: true },
        orderBy: [{ round: "asc" }],
      },
      awayMatches: {
        where: { tournamentId: id },
        include: { homeTeam: true },
        orderBy: [{ round: "asc" }],
      },
    },
  });

  if (!team || team.tournamentId !== id) notFound();

  const allMatches = [
    ...team.homeMatches.map((m) => ({ ...m, side: "home" as const })),
    ...team.awayMatches.map((m) => ({ ...m, side: "away" as const })),
  ].sort((a, b) => a.round - b.round);

  const sortedPlayers = [...team.players].sort((a, b) => {
    const pa = POSITION_ORDER.indexOf(a.position);
    const pb = POSITION_ORDER.indexOf(b.position);
    return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
  });

  const played = allMatches.filter((m) => m.status === "FINISHED");
  const wins = played.filter((m) => {
    const homeWin = m.homeScore! > m.awayScore!;
    return m.side === "home" ? homeWin : !homeWin && m.homeScore !== m.awayScore;
  }).length;
  const draws = played.filter((m) => m.homeScore === m.awayScore).length;
  const losses = played.length - wins - draws;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Back link */}
      <Link
        href={`/tournaments/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-700"
      >
        <ArrowLeft className="w-4 h-4" /> Back to {team.tournament.name}
      </Link>

      {/* Team header */}
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
            {team.logo ? (
              <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-green-700" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              {team.group && (
                <span className="text-sm bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full">
                  {team.group.name}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{team.tournament.name}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-600 flex-wrap">
              {team.headCoach && (
                <span><span className="text-gray-400 text-xs">Head Coach</span> {team.headCoach}</span>
              )}
              {team.assistantCoach && (
                <span><span className="text-gray-400 text-xs">Asst. Coach</span> {team.assistantCoach}</span>
              )}
            </div>
          </div>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-4 gap-3 mt-5 pt-5 border-t text-center">
          {[
            { label: "Played", value: played.length },
            { label: "Won", value: wins },
            { label: "Drawn", value: draws },
            { label: "Lost", value: losses },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-green-700">{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Squad table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          <Users className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Squad ({sortedPlayers.length} players)</h2>
        </div>
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No players registered.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 text-left">
                  <th className="px-4 py-2 text-center w-10">#</th>
                  <th className="px-4 py-2">Player</th>
                  <th className="px-4 py-2">Position</th>
                  <th className="px-4 py-2 text-center">⚽ Goals</th>
                  <th className="px-4 py-2 text-center">🎯 Assists</th>
                  <th className="px-4 py-2 text-center">🟨 YC</th>
                  <th className="px-4 py-2 text-center">🟥 RC</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-center text-xs text-gray-400 font-mono">
                      {p.jerseyNumber ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${POSITION_COLORS[p.position] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.position}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{p.goals}</td>
                    <td className="px-4 py-2.5 text-center text-gray-700">{p.assists}</td>
                    <td className="px-4 py-2.5 text-center text-yellow-600">{p.yellowCards}</td>
                    <td className="px-4 py-2.5 text-center text-red-600">{p.redCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Match history */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-gray-50">
          <Trophy className="w-4 h-4 text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700">Fixtures & Results</h2>
        </div>
        {allMatches.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">No fixtures yet.</div>
        ) : (
          <div className="divide-y">
            {allMatches.map((m) => {
              const isHome = m.side === "home";
              const opponent = isHome
                ? (m as typeof team.homeMatches[0] & { side: "home" }).awayTeam
                : (m as typeof team.awayMatches[0] & { side: "away" }).homeTeam;
              const teamScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const result =
                m.status === "FINISHED"
                  ? teamScore! > oppScore!
                    ? "W"
                    : teamScore! < oppScore!
                    ? "L"
                    : "D"
                  : null;

              const resultColor =
                result === "W" ? "bg-green-100 text-green-700" :
                result === "L" ? "bg-red-100 text-red-600" :
                result === "D" ? "bg-gray-100 text-gray-600" : "";

              return (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="text-xs text-gray-400 w-16 shrink-0">
                    {m.scheduledAt
                      ? new Date(m.scheduledAt).toLocaleDateString(undefined, { dateStyle: "short" })
                      : `Rnd ${m.round}`}
                  </span>
                  <div className="flex-1 flex items-center gap-2 min-w-0">
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">
                      {isHome ? "H" : "A"}
                    </span>
                    <span className="font-medium text-gray-800 truncate">
                      {opponent?.name ?? "TBD"}
                    </span>
                  </div>
                  {m.status === "FINISHED" && teamScore !== null && oppScore !== null ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-gray-800">
                        {teamScore}–{oppScore}
                      </span>
                      {result && (
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${resultColor}`}>
                          {result}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">{m.status}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
