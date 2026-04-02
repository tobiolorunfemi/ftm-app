export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TournamentClient from "./TournamentClient";

export default async function TournamentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      organizer: { select: { id: true, name: true } },
      teams: {
        include: { group: true, standings: true },
        orderBy: { createdAt: "asc" },
      },
      groups: {
        include: {
          teams: true,
          standings: {
            include: { team: true },
            orderBy: [
              { points: "desc" },
              { goalDiff: "desc" },
              { goalsFor: "desc" },
            ],
          },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          group: true,
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
    },
  });

  if (!tournament) notFound();

  return <TournamentClient tournament={tournament} />;
}
