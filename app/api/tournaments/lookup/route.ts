import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const joinCode = req.nextUrl.searchParams.get("joinCode");
  if (!joinCode) {
    return NextResponse.json({ error: "Missing joinCode" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({
    where: { joinCode },
    select: { id: true, name: true },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(tournament);
}
