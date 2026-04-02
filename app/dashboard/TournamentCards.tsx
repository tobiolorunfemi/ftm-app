"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trophy, Users, CalendarDays, Pencil, Trash2, Loader2, X, Check } from "lucide-react";

const statusColor: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  REGISTRATION: "bg-blue-100 text-blue-700",
  ACTIVE: "bg-green-100 text-green-700",
  COMPLETED: "bg-purple-100 text-purple-700",
};

interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  format: string;
  status: string;
  maxTeams: number;
  organizer: { id: string; name: string | null };
  _count: { teams: number; matches: number };
}

export default function TournamentCards({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const deleteTournament = async (id: string) => {
    if (!confirm("Delete this tournament? This will remove all teams, fixtures, and standings. This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(null);
    }
  };

  const startEdit = (t: Tournament) => {
    setEditing(t.id);
    setEditName(t.name);
    setEditStatus(t.status);
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, status: editStatus }),
      });
      setEditing(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tournaments.map((t) => (
        <div
          key={t.id}
          className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-shadow relative group"
        >
          {/* Admin controls — top right */}
          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.preventDefault(); startEdit(t); }}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 transition-colors"
              title="Edit tournament"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); deleteTournament(t.id); }}
              disabled={deleting === t.id}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors disabled:opacity-40"
              title="Delete tournament"
            >
              {deleting === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Edit mode */}
          {editing === t.id ? (
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-medium">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase font-medium">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="REGISTRATION">Registration</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => saveEdit(t.id)}
                  disabled={saving || !editName.trim()}
                  className="flex-1 flex items-center justify-center gap-1 bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  Save
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex items-center justify-center gap-1 border text-gray-500 text-xs px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-3 h-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Normal view */
            <Link href={`/tournaments/${t.id}`} className="block">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-green-700" />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[t.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {t.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                {t.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{t.format.replace("_", " + ")}</p>
              <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {t._count.teams} / {t.maxTeams} teams
                </span>
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t._count.matches} matches
                </span>
              </div>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
