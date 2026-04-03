import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/standings";
import { z } from "zod";
import { requireTournamentOwner } from "@/lib/apiAuth";

const createMatchSchema = z.object({
  round: z.number().int().min(1),
  stage: z.string().min(1),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "POSTPONED"]).default("SCHEDULED"),
  groupId: z.string().optional(),
  scheduledAt: z.string().optional(),
  venue: z.string().max(200).optional(),
  venueLocation: z.string().max(200).optional(),
});

const bulkCreateSchema = z.object({
  matches: z.array(createMatchSchema),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  const body = await req.json();

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Bulk create: { matches: [...] }
  if (body.matches) {
    const parsed = bulkCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Get current max match number
    const maxMatch = await prisma.match.findFirst({
      where: { tournamentId: id },
      orderBy: { matchNumber: "desc" },
      select: { matchNumber: true },
    });
    let matchNumber = (maxMatch?.matchNumber ?? 0) + 1;

    const created = await prisma.match.createMany({
      data: parsed.data.matches.map((m) => ({
        round: m.round,
        matchNumber: matchNumber++,
        stage: m.stage,
        homeTeamId: m.homeTeamId,
        awayTeamId: m.awayTeamId,
        homeScore: m.homeScore ?? null,
        awayScore: m.awayScore ?? null,
        status: m.homeScore !== undefined && m.awayScore !== undefined ? (m.status ?? "FINISHED") : m.status,
        groupId: m.groupId ?? null,
        venue: m.venue ?? null,
        venueLocation: m.venueLocation ?? null,
        scheduledAt: m.scheduledAt ? new Date(m.scheduledAt) : null,
        playedAt: m.status === "FINISHED" ? new Date() : null,
        tournamentId: id,
      })),
    });

    // Recalculate standings if any finished matches
    if (parsed.data.matches.some((m) => m.status === "FINISHED" || (m.homeScore !== undefined && m.awayScore !== undefined))) {
      await recalculateStandings(id);
    }

    return NextResponse.json({ count: created.count }, { status: 201 });
  }

  // Single match creation
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const maxMatch = await prisma.match.findFirst({
    where: { tournamentId: id },
    orderBy: { matchNumber: "desc" },
    select: { matchNumber: true },
  });

  const hasScores = parsed.data.homeScore !== undefined && parsed.data.awayScore !== undefined;
  const status = hasScores ? (parsed.data.status ?? "FINISHED") : parsed.data.status;

  const match = await prisma.match.create({
    data: {
      round: parsed.data.round,
      matchNumber: (maxMatch?.matchNumber ?? 0) + 1,
      stage: parsed.data.stage,
      homeTeamId: parsed.data.homeTeamId,
      awayTeamId: parsed.data.awayTeamId,
      homeScore: parsed.data.homeScore ?? null,
      awayScore: parsed.data.awayScore ?? null,
      status,
      groupId: parsed.data.groupId ?? null,
      venue: parsed.data.venue ?? null,
      venueLocation: parsed.data.venueLocation ?? null,
      scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
      playedAt: status === "FINISHED" ? new Date() : null,
      tournamentId: id,
    },
    include: { homeTeam: true, awayTeam: true },
  });

  if (status === "FINISHED") {
    await recalculateStandings(id);
  }

  return NextResponse.json(match, { status: 201 });
}
