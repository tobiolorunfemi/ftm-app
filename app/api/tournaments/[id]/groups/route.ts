import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireTournamentOwner } from "@/lib/apiAuth";

const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
  teamIds: z.array(z.string()).optional(),
});

const bulkSetupSchema = z.object({
  groups: z.array(
    z.object({
      name: z.string().min(1).max(50),
      teamIds: z.array(z.string()),
    })
  ),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const groups = await prisma.group.findMany({
    where: { tournamentId: id },
    include: { teams: true, standings: { include: { team: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(groups);
}

// POST: Create a single group or bulk-setup groups with team assignments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  const body = await req.json();

  // Bulk setup: { groups: [{ name, teamIds }] }
  if (body.groups) {
    const parsed = bulkSetupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Delete existing groups and standings
    await prisma.standing.deleteMany({ where: { tournamentId: id } });
    await prisma.match.deleteMany({ where: { tournamentId: id, groupId: { not: null } } });
    await prisma.group.deleteMany({ where: { tournamentId: id } });

    // Unassign all teams from groups
    await prisma.team.updateMany({
      where: { tournamentId: id },
      data: { groupId: null },
    });

    const created = [];
    for (const g of parsed.data.groups) {
      const group = await prisma.group.create({
        data: {
          name: g.name,
          tournamentId: id,
          teams: {
            connect: g.teamIds.map((tid) => ({ id: tid })),
          },
        },
        include: { teams: true },
      });

      // Create standings for each team in the group
      if (g.teamIds.length > 0) {
        await prisma.standing.createMany({
          data: g.teamIds.map((tid) => ({
            teamId: tid,
            tournamentId: id,
            groupId: group.id,
          })),
        });
      }

      created.push(group);
    }

    return NextResponse.json(created, { status: 201 });
  }

  // Single group creation
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const group = await prisma.group.create({
    data: {
      name: parsed.data.name,
      tournamentId: id,
      ...(parsed.data.teamIds && {
        teams: { connect: parsed.data.teamIds.map((tid) => ({ id: tid })) },
      }),
    },
    include: { teams: true },
  });

  return NextResponse.json(group, { status: 201 });
}
