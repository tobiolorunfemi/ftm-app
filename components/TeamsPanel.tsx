"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users, PlusCircle, Loader2, Trash2, ChevronDown, ChevronUp,
  Pencil, Upload, X, Check, UserPlus, ShieldCheck, ExternalLink,
} from "lucide-react";

type Player = {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

type Team = {
  id: string;
  name: string;
  logo?: string | null;
  headCoach?: string | null;
  assistantCoach?: string | null;
  group?: { name: string } | null;
};

const POSITION_ORDER = ["GK", "DEF", "MID", "FWD"];
const POSITION_COLORS: Record<string, string> = {
  GK: "bg-yellow-100 text-yellow-700",
  DEF: "bg-blue-100 text-blue-700",
  MID: "bg-green-100 text-green-700",
  FWD: "bg-red-100 text-red-700",
};

function PlayerRow({
  player,
  teamId,
  onChanged,
}: {
  player: Player;
  teamId: string;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(player.name);
  const [position, setPosition] = useState(player.position);
  const [jersey, setJersey] = useState(player.jerseyNumber?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async () => {
    setSaving(true);
    await fetch(`/api/teams/${teamId}/players/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        position,
        jerseyNumber: jersey ? Number(jersey) : null,
      }),
    });
    setSaving(false);
    setEditing(false);
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Remove ${player.name}?`)) return;
    setDeleting(true);
    await fetch(`/api/teams/${teamId}/players/${player.id}`, { method: "DELETE" });
    onChanged();
  };

  if (editing) {
    return (
      <tr className="bg-green-50">
        <td className="px-3 py-2">
          <input
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            className="w-12 border rounded px-1 py-0.5 text-sm text-center"
            placeholder="#"
          />
        </td>
        <td className="px-3 py-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border rounded px-2 py-0.5 text-sm w-full"
          />
        </td>
        <td className="px-3 py-2">
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="border rounded px-1 py-0.5 text-sm"
          >
            {POSITION_ORDER.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </td>
        <td className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 hidden sm:table-cell">—</td>
        <td className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 hidden sm:table-cell">—</td>
        <td className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 hidden sm:table-cell">—</td>
        <td className="px-2 sm:px-3 py-2 text-center text-xs text-gray-400 hidden sm:table-cell">—</td>
        <td className="px-3 py-2">
          <div className="flex gap-1">
            <button onClick={save} disabled={saving} className="text-green-700 hover:text-green-900">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            </button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-2 sm:px-3 py-2 text-center text-xs text-gray-500 font-mono">
        {player.jerseyNumber ?? "—"}
      </td>
      <td className="px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-800">{player.name}</td>
      <td className="px-2 sm:px-3 py-2">
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${POSITION_COLORS[player.position] ?? "bg-gray-100 text-gray-600"}`}>
          {player.position}
        </span>
      </td>
      <td className="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm text-gray-700 hidden sm:table-cell">{player.goals}</td>
      <td className="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm text-gray-700 hidden sm:table-cell">{player.assists}</td>
      <td className="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm text-yellow-600 hidden sm:table-cell">{player.yellowCards}</td>
      <td className="px-2 sm:px-3 py-2 text-center text-xs sm:text-sm text-red-600 hidden sm:table-cell">{player.redCards}</td>
      <td className="px-2 sm:px-3 py-2">
        <div className="flex gap-1">
          <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-green-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={remove} disabled={deleting} className="text-gray-300 hover:text-red-500">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

function TeamCard({
  team,
  tournamentId,
  onChanged,
}: {
  team: Team;
  tournamentId: string;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [headCoach, setHeadCoach] = useState(team.headCoach ?? "");
  const [assistantCoach, setAssistantCoach] = useState(team.assistantCoach ?? "");
  const [logo, setLogo] = useState(team.logo ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  // Add player form
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPos, setNewPos] = useState("MID");
  const [newJersey, setNewJersey] = useState("");
  const [addingPlayer, setAddingPlayer] = useState(false);
  // Excel import
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const loadPlayers = async () => {
    setLoadingPlayers(true);
    const res = await fetch(`/api/teams/${team.id}/players`);
    const data = await res.json();
    setPlayers(data);
    setLoadingPlayers(false);
  };

  const toggle = () => {
    if (!expanded && players === null) loadPlayers();
    setExpanded(!expanded);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    await fetch(`/api/tournaments/${tournamentId}/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ headCoach, assistantCoach, logo }),
    });
    setSavingProfile(false);
    setEditProfile(false);
    onChanged();
  };

  const addPlayer = async () => {
    if (!newName.trim()) return;
    setAddingPlayer(true);
    await fetch(`/api/teams/${team.id}/players`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName.trim(),
        position: newPos,
        jerseyNumber: newJersey ? Number(newJersey) : undefined,
      }),
    });
    setNewName("");
    setNewJersey("");
    setAddingPlayer(false);
    setShowAdd(false);
    loadPlayers();
  };

  const importExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportMsg("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/teams/${team.id}/players/import`, { method: "POST", body: form });
    const data = await res.json();
    if (res.ok) {
      setImportMsg(`Imported ${data.imported} player(s).`);
      loadPlayers();
    } else {
      setImportMsg(data.error ?? "Import failed");
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const sortedPlayers = players
    ? [...players].sort((a, b) => {
        const pa = POSITION_ORDER.indexOf(a.position);
        const pb = POSITION_ORDER.indexOf(b.position);
        if (pa !== pb) return pa - pb;
        return a.name.localeCompare(b.name);
      })
    : [];

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Team header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Logo / Avatar */}
        <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0 overflow-hidden">
          {team.logo ? (
            <img src={team.logo} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <ShieldCheck className="w-5 h-5 text-green-700" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{team.name}</p>
          {(team.headCoach || team.assistantCoach) && (
            <p className="text-xs text-gray-400 truncate">
              {team.headCoach && `HC: ${team.headCoach}`}
              {team.headCoach && team.assistantCoach && " · "}
              {team.assistantCoach && `AC: ${team.assistantCoach}`}
            </p>
          )}
        </div>

        {team.group && (
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full shrink-0">
            {team.group.name}
          </span>
        )}

        <Link
          href={`/tournaments/${tournamentId}/teams/${team.id}`}
          className="text-gray-300 hover:text-blue-500"
          title="View team portal"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>

        <button
          onClick={() => setEditProfile(!editProfile)}
          className="text-gray-300 hover:text-green-600"
          title="Edit team profile"
        >
          <Pencil className="w-4 h-4" />
        </button>

        <button onClick={toggle} className="text-gray-400 hover:text-gray-600 ml-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Profile edit form */}
      {editProfile && (
        <div className="px-4 pb-3 border-t bg-gray-50 space-y-2 pt-3">
          <p className="text-xs font-semibold text-gray-500 uppercase">Team Profile</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-gray-500">Head Coach</label>
              <input
                value={headCoach}
                onChange={(e) => setHeadCoach(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="e.g. Pep Guardiola"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500">Assistant Coach</label>
              <input
                value={assistantCoach}
                onChange={(e) => setAssistantCoach(e.target.value)}
                className="w-full border rounded px-2 py-1 text-sm"
                placeholder="e.g. Juanma Lillo"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Logo URL</label>
            <input
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditProfile(false)} className="text-xs text-gray-500 hover:text-gray-700">
              Cancel
            </button>
            <button
              onClick={saveProfile}
              disabled={savingProfile}
              className="text-xs bg-green-700 text-white px-3 py-1 rounded hover:bg-green-600 flex items-center gap-1"
            >
              {savingProfile ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Squad table */}
      {expanded && (
        <div className="border-t">
          {loadingPlayers ? (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading squad...
            </div>
          ) : (
            <>
              {sortedPlayers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-left">
                        <th className="px-2 sm:px-3 py-2 text-center w-7 sm:w-8">#</th>
                        <th className="px-2 sm:px-3 py-2">Player</th>
                        <th className="px-2 sm:px-3 py-2">Pos</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">⚽</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">🎯</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">🟨</th>
                        <th className="px-2 sm:px-3 py-2 text-center hidden sm:table-cell">🟥</th>
                        <th className="px-2 sm:px-3 py-2 w-10 sm:w-14"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedPlayers.map((p) => (
                        <PlayerRow
                          key={p.id}
                          player={p}
                          teamId={team.id}
                          onChanged={loadPlayers}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 text-sm">
                  <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
                  No players registered yet.
                </div>
              )}

              {/* Add player row */}
              {showAdd ? (
                <div className="px-4 py-3 bg-gray-50 border-t space-y-2">
                  <div className="flex gap-2 items-end flex-wrap">
                    <div>
                      <label className="text-[10px] text-gray-500">Jersey</label>
                      <input
                        value={newJersey}
                        onChange={(e) => setNewJersey(e.target.value)}
                        className="w-12 border rounded px-2 py-1 text-sm text-center block"
                        placeholder="#"
                        type="number"
                        min={1}
                        max={99}
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] text-gray-500">Name *</label>
                      <input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm block"
                        placeholder="Player name"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Position</label>
                      <select
                        value={newPos}
                        onChange={(e) => setNewPos(e.target.value)}
                        className="border rounded px-2 py-1 text-sm block"
                      >
                        {POSITION_ORDER.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={addPlayer}
                      disabled={addingPlayer || !newName.trim()}
                      className="flex items-center gap-1 bg-green-700 text-white px-3 py-1.5 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                    >
                      {addingPlayer ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                      Add
                    </button>
                    <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xs hover:text-gray-600">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-2 border-t flex items-center gap-3 flex-wrap">
                  <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Player
                  </button>
                  <label className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer">
                    {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Import Excel
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={importExcel}
                    />
                  </label>
                  {importMsg && (
                    <span className={`text-xs ${importMsg.startsWith("Imported") ? "text-green-600" : "text-red-500"}`}>
                      {importMsg}
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TeamsPanel({ tournament }: { tournament: any }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const addTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim() }),
      });
      if (res.ok) {
        setTeamName("");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to add team");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!confirm("Remove this team? This will also remove their matches.")) return;
    setDeleting(teamId);
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/teams/${teamId}`, {
        method: "DELETE",
      });
      if (res.ok) router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add team form */}
      <form onSubmit={addTeam} className="bg-white rounded-xl border p-4 shadow-sm flex gap-2">
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Team name (e.g. FC Barcelona)"
          minLength={2}
          maxLength={80}
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          type="submit"
          disabled={loading || !teamName.trim()}
          className="flex items-center gap-1.5 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
          Add
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
      )}

      {tournament.teams.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No teams yet. Add the first team above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tournament.teams.map((team: Team) => (
            <div key={team.id} className="relative">
              <TeamCard
                team={team}
                tournamentId={tournament.id}
                onChanged={() => router.refresh()}
              />
              {/* Delete button overlay */}
              <button
                onClick={() => deleteTeam(team.id)}
                disabled={deleting === team.id}
                className="absolute top-3 right-12 text-gray-200 hover:text-red-400 transition-colors"
                title="Remove team"
              >
                {deleting === team.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
