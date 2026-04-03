import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { requireTeamOwner } from "@/lib/apiAuth";

const POSITIONS = ["GK", "DEF", "MID", "FWD"];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const guard = await requireTeamOwner(teamId);
  if ("error" in guard) return guard.error;

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const players = [];
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = String(row["Name"] ?? row["name"] ?? "").trim();
    const rawPos = String(row["Position"] ?? row["position"] ?? "MID").trim().toUpperCase();
    const position = POSITIONS.includes(rawPos) ? rawPos : "MID";
    const jerseyRaw = row["Jersey"] ?? row["jersey"] ?? row["Number"] ?? row["number"];
    const jerseyNumber = jerseyRaw ? Number(jerseyRaw) : undefined;

    if (!name || name.length < 2) {
      errors.push(`Row ${i + 2}: Invalid or missing name`);
      continue;
    }

    players.push({
      name,
      position,
      jerseyNumber: jerseyNumber && jerseyNumber >= 1 && jerseyNumber <= 99 ? jerseyNumber : undefined,
      teamId,
    });
  }

  if (players.length === 0) {
    return NextResponse.json({ error: "No valid players found in file", details: errors }, { status: 400 });
  }

  await prisma.player.createMany({ data: players });

  return NextResponse.json({ imported: players.length, errors });
}
