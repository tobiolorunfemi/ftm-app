import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const playerSchema = z.object({
  name: z.string().min(2).max(80),
  position: z.enum(["GK", "DEF", "MID", "FWD"]).default("MID"),
  jerseyNumber: z.number().int().min(1).max(99).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const players = await prisma.player.findMany({
    where: { teamId },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(players);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const body = await req.json();
  const parsed = playerSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const player = await prisma.player.create({
    data: { ...parsed.data, teamId },
  });
  return NextResponse.json(player, { status: 201 });
}
