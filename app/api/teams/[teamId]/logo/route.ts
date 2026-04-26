import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTeamOwner } from "@/lib/apiAuth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const guard = await requireTeamOwner(teamId);
  if ("error" in guard) return guard.error;

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  // Validate type and size (max 500 KB)
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image" }, { status: 400 });
  }
  if (file.size > 512 * 1024) {
    return NextResponse.json({ error: "Image must be under 500 KB" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

  const team = await prisma.team.update({
    where: { id: teamId },
    data: { logo: dataUri },
    select: { id: true, logo: true },
  });

  return NextResponse.json(team);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const guard = await requireTeamOwner(teamId);
  if ("error" in guard) return guard.error;

  await prisma.team.update({ where: { id: teamId }, data: { logo: null } });
  return NextResponse.json({ ok: true });
}
