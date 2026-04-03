import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/standings";
import { z } from "zod";
import { requireTournamentOwner } from "@/lib/apiAuth";

const updateSchema = z.object({
  homeScore: z.number().int().min(0).optional(),
  awayScore: z.number().int().min(0).optional(),
  status: z.enum(["SCHEDULED", "LIVE", "FINISHED", "POSTPONED"]).optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  round: z.number().int().min(1).optional(),
  stage: z.string().optional(),
  venue: z.string().max(200).optional(),
  venueLocation: z.string().max(200).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { homeTeam: true, awayTeam: true, group: true, tournament: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.match.findUnique({ where: { id }, select: { tournamentId: true } });
  if (!existing) return NextResponse.json({ error: "Match not found" }, { status: 404 });
  const guard = await requireTournamentOwner(existing.tournamentId);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "FINISHED") {
    updateData.playedAt = new Date().toISOString();
  }
  if (parsed.data.status === "SCHEDULED") {
    // Reset scores and playedAt when reverting to scheduled
    updateData.homeScore = null;
    updateData.awayScore = null;
    updateData.playedAt = null;
  }

  const match = await prisma.match.update({
    where: { id },
    data: updateData,
    include: { homeTeam: true, awayTeam: true },
  });

  // Recalculate standings on any status or score change
  if (
    parsed.data.status === "FINISHED" ||
    parsed.data.status === "SCHEDULED" ||
    parsed.data.status === "POSTPONED" ||
    parsed.data.homeScore !== undefined
  ) {
    await recalculateStandings(match.tournamentId);
  }

  return NextResponse.json(match);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  const guard = await requireTournamentOwner(match.tournamentId);
  if ("error" in guard) return guard.error;

  await prisma.match.delete({ where: { id } });

  // Recalculate standings after deletion
  await recalculateStandings(match.tournamentId);

  return NextResponse.json({ ok: true });
}
