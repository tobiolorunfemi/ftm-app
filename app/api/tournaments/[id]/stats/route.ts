import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  // Top scorers
  const topScorers = await prisma.player.findMany({
    where: { team: { tournamentId: id }, goals: { gt: 0 } },
    include: { team: { select: { id: true, name: true } } },
    orderBy: [{ goals: "desc" }, { assists: "desc" }, { name: "asc" }],
    take: 20,
  });

  // Assist leaders
  const assistLeaders = await prisma.player.findMany({
    where: { team: { tournamentId: id }, assists: { gt: 0 } },
    include: { team: { select: { id: true, name: true } } },
    orderBy: [{ assists: "desc" }, { goals: "desc" }, { name: "asc" }],
    take: 20,
  });

  // Clean sheets: teams that kept opponent score at 0 as either home or away
  const finishedMatches = await prisma.match.findMany({
    where: { tournamentId: id, status: "FINISHED" },
    select: { homeTeamId: true, awayTeamId: true, homeScore: true, awayScore: true },
  });

  const cleanSheetMap: Record<string, number> = {};
  for (const m of finishedMatches) {
    if (m.homeTeamId && m.awayScore === 0) {
      cleanSheetMap[m.homeTeamId] = (cleanSheetMap[m.homeTeamId] ?? 0) + 1;
    }
    if (m.awayTeamId && m.homeScore === 0) {
      cleanSheetMap[m.awayTeamId] = (cleanSheetMap[m.awayTeamId] ?? 0) + 1;
    }
  }

  const teamIds = Object.keys(cleanSheetMap);
  const teamsWithCleanSheets = teamIds.length
    ? await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, name: true, players: { where: { position: "GK" }, select: { id: true, name: true } } },
      })
    : [];

  const cleanSheets = teamsWithCleanSheets
    .map((t) => ({ team: t, count: cleanSheetMap[t.id] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({ topScorers, assistLeaders, cleanSheets });
}
