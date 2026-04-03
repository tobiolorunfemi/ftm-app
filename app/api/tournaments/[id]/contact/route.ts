import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireTournamentOwner } from "@/lib/apiAuth";

const contactSchema = z.object({
  name: z.string().max(100).optional(),
  organisation: z.string().max(100).optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(30).optional(),
  facebook: z.string().max(200).optional(),
  instagram: z.string().max(200).optional(),
  twitter: z.string().max(200).optional(),
  whatsapp: z.string().max(30).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const contact = await prisma.organizerContact.findUnique({ where: { tournamentId: id } });
  return NextResponse.json(contact ?? null);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const guard = await requireTournamentOwner(id);
  if ("error" in guard) return guard.error;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });

  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const contact = await prisma.organizerContact.upsert({
    where: { tournamentId: id },
    update: parsed.data,
    create: { ...parsed.data, tournamentId: id },
  });

  return NextResponse.json(contact);
}
