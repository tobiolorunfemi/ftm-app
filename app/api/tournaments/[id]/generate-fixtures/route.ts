import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  generateLeagueFixtures,
  generateKnockoutFixtures,
  generateGroupKnockoutFixtures,
} from "@/lib/fixture-generator";
import { requireTournamentOwner } from "@/lib/apiAuth";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: { teams: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  if (tournament.teams.length < 2) {
    return NextResponse.json(
      { error: "Need at least 2 teams to generate fixtures" },
      { status: 400 }
    );
  }

  // Delete existing matches & groups
  await prisma.match.deleteMany({ where: { tournamentId: id } });
  await prisma.group.deleteMany({ where: { tournamentId: id } });
  await prisma.standing.deleteMany({ where: { tournamentId: id } });

  const teams = tournament.teams.map((t) => ({ id: t.id, name: t.name }));

  if (tournament.format === "LEAGUE") {
    const fixtures = generateLeagueFixtures(teams);
    await prisma.match.createMany({
      data: fixtures.map((f) => ({
        ...f,
        tournamentId: id,
      })),
    });
    // Create standings for each team
    await prisma.standing.createMany({
      data: teams.map((t) => ({ teamId: t.id, tournamentId: id, groupId: null })),
    });
  } else if (tournament.format === "KNOCKOUT") {
    const fixtures = generateKnockoutFixtures(teams);
    await prisma.match.createMany({
      data: fixtures.map((f) => ({
        ...f,
        tournamentId: id,
      })),
    });
  } else if (tournament.format === "GROUP_KNOCKOUT") {
    const groupCount = tournament.groupCount ?? 4;
    const teamsPerGroup = tournament.teamsPerGroup ?? Math.floor(teams.length / groupCount);

    const { groupFixtures, groups, knockoutPlaceholders } = generateGroupKnockoutFixtures(
      teams,
      groupCount,
      teamsPerGroup
    );

    // Create groups in DB
    const createdGroups: Record<string, string> = {};
    for (const g of groups) {
      const created = await prisma.group.create({
        data: {
          name: g.name,
          tournamentId: id,
          teams: { connect: g.teamIds.map((tid) => ({ id: tid })) },
        },
      });
      createdGroups[g.id] = created.id;

      // Create standings for each team in group
      await prisma.standing.createMany({
        data: g.teamIds.map((tid) => ({
          teamId: tid,
          tournamentId: id,
          groupId: created.id,
        })),
      });
    }

    // Create group fixtures with real group IDs
    await prisma.match.createMany({
      data: groupFixtures.map((f) => ({
        round: f.round,
        matchNumber: f.matchNumber,
        stage: f.stage,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        tournamentId: id,
        groupId: createdGroups[f.groupId],
        status: "SCHEDULED",
      })),
    });

    // Create knockout placeholder matches
    await prisma.match.createMany({
      data: knockoutPlaceholders.map((f) => ({
        ...f,
        tournamentId: id,
        homeTeamId: null,
        awayTeamId: null,
        status: "SCHEDULED",
      })),
    });
  }

  // Update tournament status to ACTIVE
  await prisma.tournament.update({
    where: { id },
    data: { status: "ACTIVE" },
  });

  const updated = await prisma.tournament.findUnique({
    where: { id },
    include: {
      matches: {
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        include: { homeTeam: true, awayTeam: true },
      },
      groups: { include: { teams: true } },
    },
  });

  return NextResponse.json(updated);
}
