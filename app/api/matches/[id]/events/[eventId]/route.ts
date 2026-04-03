import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTournamentOwner } from "@/lib/apiAuth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  const { eventId } = await params;

  const event = await prisma.matchEvent.findUnique({
    where: { id: eventId },
    include: { match: { select: { tournamentId: true } } },
  });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  const guard = await requireTournamentOwner(event.match.tournamentId);
  if ("error" in guard) return guard.error;

  // Reverse player stat
  if (event.playerId) {
    const statUpdate: Record<string, unknown> = {};
    if (event.type === "GOAL") statUpdate.goals = { decrement: 1 };
    else if (event.type === "ASSIST") statUpdate.assists = { decrement: 1 };
    else if (event.type === "YELLOW_CARD") statUpdate.yellowCards = { decrement: 1 };
    else if (event.type === "RED_CARD") statUpdate.redCards = { decrement: 1 };

    if (Object.keys(statUpdate).length > 0) {
      await prisma.player.update({
        where: { id: event.playerId },
        data: statUpdate,
      });
    }
  }

  await prisma.matchEvent.delete({ where: { id: eventId } });
  return NextResponse.json({ ok: true });
}
