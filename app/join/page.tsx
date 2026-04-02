"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Loader2, Trophy } from "lucide-react";

export default function JoinPage() {
  const router = useRouter();
  const [form, setForm] = useState({ joinCode: "", teamName: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode: form.joinCode.trim(),
          teamName: form.teamName.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to join");
        return;
      }

      setSuccess(`"${data.team.name}" joined "${data.tournament.name}" successfully!`);
      setTimeout(() => {
        router.push(`/tournaments/${data.tournament.id}`);
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <LogIn className="w-7 h-7 text-green-700" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Join a Tournament</h1>
        <p className="text-gray-500 text-sm mt-1">
          Enter the join code shared by your tournament organizer
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Join Code *
          </label>
          <input
            type="text"
            required
            value={form.joinCode}
            onChange={(e) => setForm({ ...form, joinCode: e.target.value })}
            placeholder="Paste the join code here"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Name *
          </label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            placeholder="e.g. FC Warriors"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
            {error}
          </p>
        )}

        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-green-700 text-white font-semibold py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? "Joining..." : "Join Tournament"}
        </button>
      </form>
    </div>
  );
}
