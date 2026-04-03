import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recalculateStandings } from "@/lib/standings";
import { z } from "zod";
import { requireTournamentOwner } from "@/lib/apiAuth";

const updateTeamSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  logo: z.string().max(500).optional(),
  headCoach: z.string().max(100).optional(),
  assistantCoach: z.string().max(100).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const { id, teamId } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  const body = await req.json();
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const team = await prisma.team.update({
    where: { id: teamId },
    data: parsed.data,
    include: { group: true },
  });
  return NextResponse.json(team);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  const { id, teamId } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  // Delete matches involving this team
  await prisma.match.deleteMany({
    where: {
      tournamentId: id,
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    },
  });

  // Delete standings for this team
  await prisma.standing.deleteMany({ where: { teamId } });

  // Delete the team
  await prisma.team.delete({ where: { id: teamId } });

  // Recalculate standings
  await recalculateStandings(id);

  return NextResponse.json({ ok: true });
}
