export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Trophy, Users, CalendarDays, BarChart2, Phone, Calendar, Eye } from "lucide-react";
import StandingsPanel from "@/components/StandingsPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import CalendarPanel from "@/components/CalendarPanel";
import ContactPanel from "@/components/ContactPanel";
import PublicFixturesPanel from "@/components/PublicFixturesPanel";
import PublicTeamsPanel from "@/components/PublicTeamsPanel";
import PublicTabs from "@/components/PublicTabs";

export default async function PublicViewPage({
  params,
}: {
  params: Promise<{ joinCode: string }>;
}) {
  const { joinCode } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { joinCode },
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
            orderBy: [{ points: "desc" }, { goalDiff: "desc" }, { goalsFor: "desc" }],
          },
        },
        orderBy: { name: "asc" },
      },
      matches: {
        include: {
          homeTeam: true,
          awayTeam: true,
          group: true,
          events: {
            include: { player: true, team: true },
            orderBy: { minute: "asc" },
          },
        },
        orderBy: [{ round: "asc" }, { matchNumber: "asc" }],
      },
      contact: true,
    },
  });

  if (!tournament) notFound();

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    REGISTRATION: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-purple-100 text-purple-700",
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "fixtures", label: `Fixtures (${tournament.matches.length})`, icon: "calendar" },
    { id: "calendar", label: "Calendar", icon: "calendardays" },
    { id: "standings", label: "Standings", icon: "trophy" },
    { id: "statistics", label: "Statistics", icon: "chart" },
    { id: "teams", label: `Teams (${tournament.teams.length})`, icon: "users" },
    { id: "contact", label: "Contact", icon: "phone" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Read-only banner */}
      <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mb-4">
        <Eye className="w-3.5 h-3.5 shrink-0" />
        You are viewing this tournament as a guest. Sign in to manage it.
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6 text-green-700" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{tournament.name}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[tournament.status]}`}>
                {tournament.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {tournament.format.replace("_", " + ")} &bull; Organised by {tournament.organizer.name}
            </p>
            {tournament.description && (
              <p className="text-sm text-gray-600 mt-1">{tournament.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {tournament.teams.length} teams
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> {tournament.matches.length} matches
          </span>
          <span className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4" />
            {tournament.matches.filter((m) => m.status === "FINISHED").length} completed
          </span>
        </div>
      </div>

      {/* Tabs + content — client component handles tab switching */}
      <PublicTabs
        tournament={tournament}
        tabs={tabs}
      />
    </div>
  );
}
