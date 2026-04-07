import Link from "next/link";
import { Trophy, Zap, Users, BarChart3, ArrowRight } from "lucide-react";
import JoinCodeSearch from "@/components/JoinCodeSearch";

const features = [
  {
    icon: Trophy,
    title: "Tournament Creation",
    desc: "Create tournaments in seconds — League, Knockout, or UCL-style Group + Knockout.",
  },
  {
    icon: Zap,
    title: "Auto Fixture Generator",
    desc: "Randomized or seeded draws. Fixtures generated instantly with the correct format.",
  },
  {
    icon: Users,
    title: "Team Registration",
    desc: "Teams join via unique code or link. No spreadsheets, no WhatsApp chaos.",
  },
  {
    icon: BarChart3,
    title: "Live Standings",
    desc: "Scores update standings automatically — points, GD, goals for/against.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-green-700 text-white py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Trophy className="w-16 h-16 opacity-90" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Football Tournament Manager
          </h1>
          <p className="text-base sm:text-xl text-green-100 mb-8 max-w-xl mx-auto">
            Run your community tournament like a pro. Generate fixtures, track scores,
            and keep teams updated — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              href="/tournaments/new"
              className="inline-flex items-center gap-2 bg-white text-green-700 font-semibold px-6 py-3 rounded-lg hover:bg-green-50 transition-colors"
            >
              Create Tournament <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/tournaments/setup"
              className="inline-flex items-center gap-2 bg-orange-500 text-white font-semibold px-6 py-3 rounded-lg hover:bg-orange-400 transition-colors"
            >
              Import Existing Competition <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Join code search */}
          <div className="border-t border-green-600 pt-8">
            <p className="text-green-200 text-sm mb-3">Have a join code? View a tournament instantly:</p>
            <JoinCodeSearch />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-5xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10 text-gray-800">
          Everything you need to run a tournament
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-xl border p-6 flex gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-900 text-white py-12 px-4 text-center">
        <h2 className="text-2xl font-bold mb-3">Ready to kick off?</h2>
        <p className="text-gray-400 mb-6">
          Start with your current tournament. Takes less than 5 minutes.
        </p>
        <Link
          href="/tournaments/new"
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
