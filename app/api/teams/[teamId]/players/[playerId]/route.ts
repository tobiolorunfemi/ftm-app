import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  position: z.enum(["GK", "DEF", "MID", "FWD"]).optional(),
  jerseyNumber: z.number().int().min(1).max(99).nullable().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string; playerId: string }> }
) {
  const { playerId } = await params;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const player = await prisma.player.update({
    where: { id: playerId },
    data: parsed.data,
  });
  return NextResponse.json(player);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string; playerId: string }> }
) {
  const { playerId } = await params;
  await prisma.player.delete({ where: { id: playerId } });
  return NextResponse.json({ ok: true });
}
