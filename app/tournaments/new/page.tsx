"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Loader2 } from "lucide-react";

type Format = "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT";

const formats: { value: Format; label: string; desc: string }[] = [
  { value: "LEAGUE", label: "League (Round Robin)", desc: "Every team plays each other once" },
  { value: "KNOCKOUT", label: "Knockout (Elimination)", desc: "Lose once and you're out" },
  { value: "GROUP_KNOCKOUT", label: "Group + Knockout (UCL style)", desc: "Group stage then knockout" },
];

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    format: "LEAGUE" as Format,
    maxTeams: 16,
    groupCount: 4,
    teamsPerGroup: 4,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Create a demo organizer if none exists
      let organizerId: string;
      const userRes = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Demo Organizer",
          email: `organizer-${Date.now()}@ftm.app`,
          password: "password123",
          role: "ORGANIZER",
        }),
      });
      if (userRes.ok) {
        const user = await userRes.json();
        organizerId = user.id;
      } else {
        // Use a fallback — in real app, this comes from auth session
        organizerId = "demo";
      }

      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          format: form.format,
          maxTeams: form.maxTeams,
          ...(form.format === "GROUP_KNOCKOUT" && {
            groupCount: form.groupCount,
            teamsPerGroup: form.teamsPerGroup,
          }),
          organizerId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error?.formErrors?.[0] ?? "Failed to create tournament");
        return;
      }

      const tournament = await res.json();
      router.push(`/tournaments/${tournament.id}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Trophy className="w-5 h-5 text-green-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create Tournament</h1>
          <p className="text-sm text-gray-500">Set up your tournament in seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tournament Name *
          </label>
          <input
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Church League 2026"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (optional)
          </label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Brief description of the tournament"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          />
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
          <div className="space-y-2">
            {formats.map((f) => (
              <label
                key={f.value}
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  form.format === f.value
                    ? "border-green-500 bg-green-50"
                    : "hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={f.value}
                  checked={form.format === f.value}
                  onChange={() => setForm({ ...form, format: f.value })}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium text-gray-800">{f.label}</div>
                  <div className="text-xs text-gray-500">{f.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Max Teams */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Teams
          </label>
          <input
            type="number"
            min={2}
            max={64}
            value={form.maxTeams}
            onChange={(e) => setForm({ ...form, maxTeams: Number(e.target.value) })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {/* Group settings — only for GROUP_KNOCKOUT */}
        {form.format === "GROUP_KNOCKOUT" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Groups
              </label>
              <input
                type="number"
                min={2}
                max={16}
                value={form.groupCount}
                onChange={(e) => setForm({ ...form, groupCount: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teams per Group
              </label>
              <input
                type="number"
                min={2}
                max={8}
                value={form.teamsPerGroup}
                onChange={(e) => setForm({ ...form, teamsPerGroup: Number(e.target.value) })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
          {loading ? "Creating..." : "Create Tournament"}
        </button>
      </form>
    </div>
  );
}
