"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy, Users, CalendarDays, Copy, Zap, Loader2, Check,
  BarChart2, Phone, Calendar, Share2,
} from "lucide-react";
import TeamsPanel from "@/components/TeamsPanel";
import FixturesPanel from "@/components/FixturesPanel";
import StandingsPanel from "@/components/StandingsPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import ContactPanel from "@/components/ContactPanel";
import CalendarPanel from "@/components/CalendarPanel";

type Tab = "overview" | "teams" | "fixtures" | "calendar" | "standings" | "statistics" | "contact";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TournamentClient({ tournament }: { tournament: any }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const copyJoinCode = () => {
    navigator.clipboard.writeText(tournament.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/view/${tournament.joinCode}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const generateFixtures = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/generate-fixtures`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
        setTab("fixtures");
      } else {
        const data = await res.json();
        alert(data.error ?? "Failed to generate fixtures");
      }
    } finally {
      setGenerating(false);
    }
  };

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600",
    REGISTRATION: "bg-blue-100 text-blue-700",
    ACTIVE: "bg-green-100 text-green-700",
    COMPLETED: "bg-purple-100 text-purple-700",
  };

  const tabs: { id: Tab; label: string; icon?: React.ReactNode }[] = [
    { id: "overview", label: "Overview" },
    { id: "teams", label: `Teams (${tournament.teams.length})`, icon: <Users className="w-3.5 h-3.5" /> },
    { id: "fixtures", label: `Fixtures (${tournament.matches.length})`, icon: <CalendarDays className="w-3.5 h-3.5" /> },
    { id: "calendar", label: "Calendar", icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: "standings", label: "Standings", icon: <Trophy className="w-3.5 h-3.5" /> },
    { id: "statistics", label: "Statistics", icon: <BarChart2 className="w-3.5 h-3.5" /> },
    { id: "contact", label: "Contact", icon: <Phone className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-col gap-4">
          {/* Title row */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{tournament.name}</h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusColor[tournament.status]}`}>
                  {tournament.status}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {tournament.format.replace("_", " + ")} &bull; by {tournament.organizer.name}
              </p>
              {tournament.description && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{tournament.description}</p>
              )}
            </div>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-2">
            {/* Join code */}
            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5 text-sm">
              <span className="text-gray-500 text-xs hidden sm:inline">Join Code:</span>
              <span className="font-mono font-semibold text-gray-800 text-xs sm:text-sm">
                {tournament.joinCode.slice(0, 8)}
              </span>
              <button onClick={copyJoinCode} className="text-gray-400 hover:text-green-600">
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <button
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-xs sm:text-sm border border-gray-200 bg-white text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied!" : "Share"}
            </button>

            {tournament.teams.length >= 2 && tournament.matches.length === 0 && (
              <button
                onClick={generateFixtures}
                disabled={generating}
                className="flex items-center gap-1.5 bg-green-700 text-white text-xs sm:text-sm px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-60"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                {generating ? "Generating..." : "Generate Fixtures"}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 sm:gap-6 mt-4 pt-4 border-t text-xs sm:text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tournament.teams.length}/{tournament.maxTeams} teams
          </span>
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tournament.matches.length} matches
          </span>
          {tournament.groups.length > 0 && (
            <span className="flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tournament.groups.length} groups
            </span>
          )}
          <span className="flex items-center gap-1">
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {tournament.matches.filter((m: { status: string }) => m.status === "FINISHED").length} done
          </span>
        </div>
      </div>

      {/* Tabs — horizontally scrollable on mobile */}
      <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-4 sm:mb-6">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-max min-w-full">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1 text-xs sm:text-sm font-medium py-1.5 px-2.5 sm:px-3 rounded-md transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Teams" value={tournament.teams.length} />
          <StatCard label="Matches" value={tournament.matches.length} />
          <StatCard
            label="Finished"
            value={tournament.matches.filter((m: { status: string }) => m.status === "FINISHED").length}
          />
        </div>
      )}
      {tab === "teams" && <TeamsPanel tournament={tournament} />}
      {tab === "fixtures" && <FixturesPanel tournament={tournament} />}
      {tab === "calendar" && <CalendarPanel tournament={tournament} />}
      {tab === "standings" && <StandingsPanel tournament={tournament} />}
      {tab === "statistics" && <StatisticsPanel tournament={tournament} />}
      {tab === "contact" && <ContactPanel tournament={tournament} />}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border p-5 shadow-sm text-center">
      <div className="text-3xl font-bold text-green-700">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
}
