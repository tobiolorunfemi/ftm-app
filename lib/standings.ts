// Standings recalculation engine
import { prisma } from "./prisma";

export async function recalculateStandings(tournamentId: string) {
  // Fetch all teams in this tournament (needed to preserve zero-stat rows)
  const allTeams = await prisma.team.findMany({
    where: { tournamentId },
    select: { id: true, groupId: true },
  });

  // Fetch all finished matches
  const matches = await prisma.match.findMany({
    where: { tournamentId, status: "FINISHED" },
    select: {
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      groupId: true,
    },
  });

  // Build a map: "teamId::groupId" → accumulated stats
  type StatsEntry = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  };
  const statsMap: Record<string, StatsEntry> = {};

  const mapKey = (teamId: string, groupId: string | null) =>
    `${teamId}::${groupId ?? ""}`;

  const ensure = (teamId: string, groupId: string | null) => {
    const k = mapKey(teamId, groupId);
    if (!statsMap[k]) {
      statsMap[k] = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
    }
    return statsMap[k];
  };

  for (const match of matches) {
    if (
      match.homeTeamId == null ||
      match.awayTeamId == null ||
      match.homeScore == null ||
      match.awayScore == null
    )
      continue;

    const home = ensure(match.homeTeamId, match.groupId);
    const away = ensure(match.awayTeamId, match.groupId);

    home.played++;
    away.played++;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won++;
      away.lost++;
    } else if (match.homeScore < match.awayScore) {
      away.won++;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
    }
  }

  // Delete all existing standings and recreate from scratch.
  // This avoids the upsert/null composite-unique-key issue with SQLite
  // and ensures no stale rows survive between recalculations.
  await prisma.standing.deleteMany({ where: { tournamentId } });

  if (allTeams.length === 0) return;

  await prisma.standing.createMany({
    data: allTeams.map((team) => {
      const stats = statsMap[mapKey(team.id, team.groupId)] ?? {
        played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
      };
      const points = stats.won * 3 + stats.drawn;
      const goalDiff = stats.goalsFor - stats.goalsAgainst;
      return {
        teamId: team.id,
        groupId: team.groupId,
        tournamentId,
        played: stats.played,
        won: stats.won,
        drawn: stats.drawn,
        lost: stats.lost,
        goalsFor: stats.goalsFor,
        goalsAgainst: stats.goalsAgainst,
        goalDiff,
        points,
      };
    }),
  });
}
