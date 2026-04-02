import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  status: z.enum(["DRAFT", "REGISTRATION", "ACTIVE", "COMPLETED"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      teams: { include: { standings: true } },
      groups: { include: { teams: true, standings: { include: { team: true } } } },
      matches: {
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
        include: { homeTeam: true, awayTeam: true, group: true },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json(tournament);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json(tournament);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Cascade: delete standings, matches, groups, teams, then tournament
  await prisma.standing.deleteMany({ where: { tournamentId: id } });
  await prisma.match.deleteMany({ where: { tournamentId: id } });
  await prisma.group.deleteMany({ where: { tournamentId: id } });
  await prisma.team.deleteMany({ where: { tournamentId: id } });
  await prisma.tournament.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
