"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

export default function JoinCodeSearch() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/lookup?joinCode=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        router.push(`/view/${trimmed}`);
      } else {
        setError("No tournament found with that code.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError(""); }}
          placeholder="Enter join code (e.g. ABC123)"
          className="flex-1 px-4 py-3 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-white"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="flex items-center gap-2 bg-white text-green-700 font-semibold px-5 py-3 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          View
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-200">{error}</p>
      )}
    </div>
  );
}
