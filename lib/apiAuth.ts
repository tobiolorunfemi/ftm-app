import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Verify the caller is logged in AND owns the tournament (or is SUPER_ADMIN).
 * Returns { error: NextResponse } if unauthorized, or { userId, isSuperAdmin } on success.
 */
export async function requireTournamentOwner(tournamentId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = session.user.id as string;
  const isSuperAdmin = (session.user as { role?: string }).role === "SUPER_ADMIN";

  if (!isSuperAdmin) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true },
    });

    if (!tournament) {
      return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
    }

    if (tournament.organizerId !== userId) {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
  }

  return { userId, isSuperAdmin };
}

/**
 * Verify the caller owns the tournament that the given team belongs to.
 */
export async function requireTeamOwner(teamId: string) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { tournamentId: true },
  });

  if (!team) {
    return { error: NextResponse.json({ error: "Team not found" }, { status: 404 }) };
  }

  return requireTournamentOwner(team.tournamentId);
}

/**
 * Verify the caller is logged in. Returns { error } or { userId, role }.
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return {
    userId: session.user.id as string,
    role: (session.user as { role?: string }).role ?? "COMPETITION_ADMIN",
  };
}
