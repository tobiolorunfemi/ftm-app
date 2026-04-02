import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  joinCode: z.string().min(1),
  teamName: z.string().min(2).max(80),
  managerId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { joinCode: parsed.data.joinCode },
    include: { _count: { select: { teams: true } } },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Invalid join code" }, { status: 404 });
  }

  if (tournament.status !== "REGISTRATION" && tournament.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Tournament is not accepting registrations" },
      { status: 400 }
    );
  }

  if (tournament._count.teams >= tournament.maxTeams) {
    return NextResponse.json({ error: "Tournament is full" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name: parsed.data.teamName,
      tournamentId: tournament.id,
      managerId: parsed.data.managerId,
    },
  });

  return NextResponse.json({ team, tournament }, { status: 201 });
}
