export const dynamic = "force-dynamic";

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Trophy, PlusCircle } from "lucide-react";
import TournamentCards from "./TournamentCards";

export default async function DashboardPage() {
  const tournaments = await prisma.tournament.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      organizer: { select: { id: true, name: true } },
      _count: { select: { teams: true, matches: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">All tournaments</p>
        </div>
        <Link
          href="/tournaments/new"
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> New Tournament
        </Link>
      </div>

      {tournaments.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-medium">No tournaments yet</p>
          <p className="text-sm mt-1">Create your first tournament to get started</p>
          <Link
            href="/tournaments/new"
            className="mt-4 inline-block bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
          >
            Create Tournament
          </Link>
        </div>
      ) : (
        <TournamentCards tournaments={tournaments} />
      )}
    </div>
  );
}
