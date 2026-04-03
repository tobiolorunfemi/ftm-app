import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/apiAuth";

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  format: z.enum(["LEAGUE", "KNOCKOUT", "GROUP_KNOCKOUT"]),
  status: z.enum(["DRAFT", "REGISTRATION", "ACTIVE", "COMPLETED"]).default("DRAFT"),
  maxTeams: z.number().int().min(2).max(64).default(16),
  groupCount: z.number().int().min(2).max(16).optional(),
  teamsPerGroup: z.number().int().min(2).max(8).optional(),
});

export async function GET() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organizer: { select: { id: true, name: true, email: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });
  return NextResponse.json(tournaments);
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tournament = await prisma.tournament.create({
    data: {
      ...parsed.data,
      organizer: { connect: { id: authResult.userId } },
    },
  });

  return NextResponse.json(tournament, { status: 201 });
}
