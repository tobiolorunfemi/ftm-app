"use client";

import { useState } from "react";
import { Trophy, Users, CalendarDays, BarChart2, Phone, Calendar } from "lucide-react";
import StandingsPanel from "@/components/StandingsPanel";
import StatisticsPanel from "@/components/StatisticsPanel";
import CalendarPanel from "@/components/CalendarPanel";
import ContactPanel from "@/components/ContactPanel";
import PublicFixturesPanel from "@/components/PublicFixturesPanel";
import PublicTeamsPanel from "@/components/PublicTeamsPanel";

type Tab = { id: string; label: string; icon?: string };

const iconMap: Record<string, React.ReactNode> = {
  calendar: <CalendarDays className="w-3.5 h-3.5" />,
  trophy: <Trophy className="w-3.5 h-3.5" />,
  chart: <BarChart2 className="w-3.5 h-3.5" />,
  users: <Users className="w-3.5 h-3.5" />,
  phone: <Phone className="w-3.5 h-3.5" />,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PublicTabs({ tournament, tabs }: { tournament: any; tabs: Tab[] }) {
  const [active, setActive] = useState("overview");

  const finishedCount = tournament.matches.filter(
    (m: { status: string }) => m.status === "FINISHED"
  ).length;

  return (
    <>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`flex items-center gap-1.5 text-sm font-medium py-1.5 px-3 rounded-md transition-colors whitespace-nowrap ${
              active === t.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon && iconMap[t.icon]}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {active === "overview" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Teams", value: tournament.teams.length },
            { label: "Matches", value: tournament.matches.length },
            { label: "Finished", value: finishedCount },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border p-5 shadow-sm text-center">
              <div className="text-3xl font-bold text-green-700">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {active === "fixtures" && <PublicFixturesPanel tournament={tournament} />}
      {active === "standings" && <StandingsPanel tournament={tournament} />}
      {active === "statistics" && <StatisticsPanel tournament={tournament} />}
      {active === "teams" && <PublicTeamsPanel tournament={tournament} />}
      {active === "contact" && <ContactPanel tournament={tournament} readOnly />}
    </>
  );
}
