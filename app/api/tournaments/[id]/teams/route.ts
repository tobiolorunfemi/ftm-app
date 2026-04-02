import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addTeamSchema = z.object({
  name: z.string().min(2).max(80),
  managerId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const teams = await prisma.team.findMany({
    where: { tournamentId: id },
    include: { standings: true, group: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(teams);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const parsed = addTeamSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  const teamCount = await prisma.team.count({ where: { tournamentId: id } });
  if (teamCount >= tournament.maxTeams) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      tournamentId: id,
      managerId: parsed.data.managerId,
    },
  });

  return NextResponse.json(team, { status: 201 });
}
