import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const eventSchema = z.object({
  type: z.enum(["GOAL", "ASSIST", "YELLOW_CARD", "RED_CARD"]),
  minute: z.number().int().min(1).max(120).optional(),
  playerId: z.string().optional(),
  teamId: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const events = await prisma.matchEvent.findMany({
    where: { matchId: id },
    include: { player: true, team: true },
    orderBy: { minute: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const match = await prisma.match.findUnique({ where: { id } });
  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const body = await req.json();
  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const event = await prisma.matchEvent.create({
    data: { ...parsed.data, matchId: id },
    include: { team: true },
  });

  // Update player stats
  if (parsed.data.playerId) {
    const statUpdate: Record<string, unknown> = {};
    if (parsed.data.type === "GOAL") statUpdate.goals = { increment: 1 };
    else if (parsed.data.type === "ASSIST") statUpdate.assists = { increment: 1 };
    else if (parsed.data.type === "YELLOW_CARD") statUpdate.yellowCards = { increment: 1 };
    else if (parsed.data.type === "RED_CARD") statUpdate.redCards = { increment: 1 };

    if (Object.keys(statUpdate).length > 0) {
      await prisma.player.update({
        where: { id: parsed.data.playerId },
        data: statUpdate,
      });
    }
  }

  // Re-fetch with updated player stats
  const eventWithPlayer = await prisma.matchEvent.findUnique({
    where: { id: event.id },
    include: { player: true, team: true },
  });

  return NextResponse.json(eventWithPlayer, { status: 201 });
}
