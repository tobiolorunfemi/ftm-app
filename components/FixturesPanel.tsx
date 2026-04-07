"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays, Loader2, Plus, Trash2, Pencil,
  MapPin, Clock, ChevronDown, ChevronUp, X, Save, Check,
} from "lucide-react";

type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";

const statusStyle: Record<MatchStatus, string> = {
  SCHEDULED: "bg-gray-100 text-gray-600",
  LIVE: "bg-red-100 text-red-600 animate-pulse",
  FINISHED: "bg-green-100 text-green-700",
  POSTPONED: "bg-yellow-100 text-yellow-700",
};

const EVENT_ICONS: Record<string, string> = {
  GOAL: "⚽",
  ASSIST: "🎯",
  YELLOW_CARD: "🟨",
  RED_CARD: "🟥",
};

type MatchEvent = {
  id: string;
  type: string;
  minute: number | null;
  player: { id: string; name: string } | null;
  team: { id: string; name: string } | null;
};

type Player = { id: string; name: string; position: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MatchEventsPanel({ match, onChanged }: { match: any; onChanged: () => void }) {
  const [events, setEvents] = useState<MatchEvent[] | null>(null);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("GOAL");
  const [minute, setMinute] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [teamId, setTeamId] = useState(match.homeTeamId ?? "");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [evRes, homeRes, awayRes] = await Promise.all([
      fetch(`/api/matches/${match.id}/events`),
      match.homeTeamId ? fetch(`/api/teams/${match.homeTeamId}/players`) : Promise.resolve(null),
      match.awayTeamId ? fetch(`/api/teams/${match.awayTeamId}/players`) : Promise.resolve(null),
    ]);
    setEvents(await evRes.json());
    if (homeRes) setHomePlayers(await homeRes.json());
    if (awayRes) setAwayPlayers(await awayRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const allPlayers = teamId === match.homeTeamId ? homePlayers : awayPlayers;

  const addEvent = async () => {
    if (!type || !teamId) return;
    setAdding(true);
    await fetch(`/api/matches/${match.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        minute: minute ? Number(minute) : undefined,
        playerId: playerId || undefined,
        teamId,
      }),
    });
    setMinute("");
    setPlayerId("");
    setAdding(false);
    load();
    onChanged();
  };

  const removeEvent = async (eventId: string) => {
    setDeleting(eventId);
    await fetch(`/api/matches/${match.id}/events/${eventId}`, { method: "DELETE" });
    setDeleting(null);
    load();
    onChanged();
  };

  const homeEvents = events?.filter((e) => e.team?.id === match.homeTeamId) ?? [];
  const awayEvents = events?.filter((e) => e.team?.id === match.awayTeamId) ?? [];

  return (
    <div className="mt-3 pt-3 border-t space-y-3">
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 className="w-3 h-3 animate-spin" /> Loading events...
        </div>
      ) : (
        <>
          {/* Events timeline */}
          {events && events.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="space-y-1">
                {homeEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-1 group">
                    <span>{EVENT_ICONS[e.type] ?? "•"}</span>
                    <span className="font-medium">{e.player?.name ?? "Unknown"}</span>
                    {e.minute && <span className="text-gray-400">{e.minute}&apos;</span>}
                    <button
                      onClick={() => removeEvent(e.id)}
                      disabled={deleting === e.id}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                    >
                      {deleting === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-1 text-right">
                {awayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-1 group justify-end">
                    <button
                      onClick={() => removeEvent(e.id)}
                      disabled={deleting === e.id}
                      className="mr-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"
                    >
                      {deleting === e.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    </button>
                    {e.minute && <span className="text-gray-400">{e.minute}&apos;</span>}
                    <span className="font-medium">{e.player?.name ?? "Unknown"}</span>
                    <span>{EVENT_ICONS[e.type] ?? "•"}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add event form */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase">Log Match Event</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-gray-400">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full block border rounded px-2 py-1.5 text-xs">
                  <option value="GOAL">⚽ Goal</option>
                  <option value="ASSIST">🎯 Assist</option>
                  <option value="YELLOW_CARD">🟨 Yellow Card</option>
                  <option value="RED_CARD">🟥 Red Card</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Minute</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="w-full block border rounded px-2 py-1.5 text-xs text-center"
                  placeholder="45"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Team</label>
                <select
                  value={teamId}
                  onChange={(e) => { setTeamId(e.target.value); setPlayerId(""); }}
                  className="w-full block border rounded px-2 py-1.5 text-xs"
                >
                  {match.homeTeam && <option value={match.homeTeamId}>{match.homeTeam.name}</option>}
                  {match.awayTeam && <option value={match.awayTeamId}>{match.awayTeam.name}</option>}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400">Player</label>
                <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className="w-full block border rounded px-2 py-1.5 text-xs">
                  <option value="">— select —</option>
                  {allPlayers.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.position})</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={addEvent}
              disabled={adding || !type || !teamId}
              className="w-full flex items-center justify-center gap-1.5 bg-green-700 text-white px-3 py-2 rounded text-xs font-medium hover:bg-green-600 disabled:opacity-50"
            >
              {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Log Event
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ScoreEditor({ match, onSave }: { match: any; onSave: () => void }) {
  const [home, setHome] = useState(match.homeScore ?? 0);
  const [away, setAwayScore] = useState(match.awayScore ?? 0);
  const [status, setStatus] = useState<MatchStatus>(match.status ?? "SCHEDULED");
  const [venue, setVenue] = useState(match.venue ?? "");
  const [venueLocation, setVenueLocation] = useState(match.venueLocation ?? "");
  const [scheduledAt, setScheduledAt] = useState(
    match.scheduledAt ? new Date(match.scheduledAt).toISOString().slice(0, 16) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showEvents, setShowEvents] = useState(false);

  const save = async (overrideStatus?: MatchStatus) => {
    const finalStatus = overrideStatus ?? status;
    setSaving(true);
    try {
      await fetch(`/api/matches/${match.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: home,
          awayScore: away,
          status: finalStatus,
          venue: venue || undefined,
          venueLocation: venueLocation || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        }),
      });
      if (overrideStatus) setStatus(overrideStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onSave();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Score + status row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            value={home}
            onChange={(e) => setHome(Number(e.target.value))}
            className="w-14 border rounded px-2 py-1.5 text-center text-base font-semibold"
          />
          <span className="text-gray-400 font-bold">–</span>
          <input
            type="number"
            min={0}
            value={away}
            onChange={(e) => setAwayScore(Number(e.target.value))}
            className="w-14 border rounded px-2 py-1.5 text-center text-base font-semibold"
          />
        </div>
        {/* Status quick-select — wraps on mobile */}
        <div className="flex flex-wrap gap-1">
          {(["SCHEDULED", "LIVE", "FINISHED", "POSTPONED"] as MatchStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`text-[10px] font-medium px-2.5 py-1.5 rounded transition-colors ${
                status === s
                  ? statusStyle[s] + " ring-1 ring-offset-1 ring-current"
                  : "bg-gray-100 text-gray-400 hover:bg-gray-200"
              }`}
            >
              {s === "SCHEDULED" ? "Scheduled" : s === "LIVE" ? "Live" : s === "FINISHED" ? "Full Time" : "Postponed"}
            </button>
          ))}
        </div>
      </div>

      {/* Venue & time */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="text-[10px] text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Venue
          </label>
          <input
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full border rounded px-2 py-1 text-xs"
            placeholder="e.g. Wembley Stadium"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400">Location</label>
          <input
            value={venueLocation}
            onChange={(e) => setVenueLocation(e.target.value)}
            className="w-full border rounded px-2 py-1 text-xs"
            placeholder="e.g. London, UK"
          />
        </div>
        <div>
          <label className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Kick-off
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full border rounded px-2 py-1 text-xs"
          />
        </div>
      </div>

      {/* Save + events row */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => save()}
          disabled={saving}
          className="flex items-center gap-1.5 bg-green-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-green-600 disabled:opacity-60 transition-colors"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saved ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
        </button>

        <button
          onClick={() => setShowEvents(!showEvents)}
          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900"
        >
          {showEvents ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          Match Events (Goals / Cards / Assists)
        </button>
      </div>

      {showEvents && (
        <MatchEventsPanel match={match} onChanged={onSave} />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddMatchForm({ tournament, onAdded }: { tournament: any; onAdded: () => void }) {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [round, setRound] = useState(1);
  const [stage, setStage] = useState("GROUP");
  const [homeScore, setHomeScore] = useState<number | undefined>(undefined);
  const [awayScore, setAwayScore] = useState<number | undefined>(undefined);
  const [isPlayed, setIsPlayed] = useState(false);
  const [venue, setVenue] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) return;
    setSaving(true);
    try {
      await fetch(`/api/tournaments/${tournament.id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          round,
          stage,
          homeTeamId,
          awayTeamId,
          venue: venue || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          ...(isPlayed && { homeScore: homeScore ?? 0, awayScore: awayScore ?? 0, status: "FINISHED" }),
        }),
      });
      onAdded();
      setHomeTeamId("");
      setAwayTeamId("");
      setIsPlayed(false);
      setHomeScore(undefined);
      setAwayScore(undefined);
      setVenue("");
      setScheduledAt("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase">Add Match Manually</h4>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500">Round</label>
          <input type="number" min={1} value={round} onChange={(e) => setRound(Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500">Stage</label>
          <select value={stage} onChange={(e) => setStage(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="GROUP">Group</option>
            <option value="LEAGUE">League</option>
            <option value="R16">Round of 16</option>
            <option value="QF">Quarter-final</option>
            <option value="SF">Semi-final</option>
            <option value="FINAL">Final</option>
            <option value="KO">Knockout</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 items-end">
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500">Home Team</label>
          <select value={homeTeamId} onChange={(e) => setHomeTeamId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="">Select...</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tournament.teams.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="text-center text-xs text-gray-400 py-1">vs</div>
        <div className="col-span-2">
          <label className="text-[10px] text-gray-500">Away Team</label>
          <select value={awayTeamId} onChange={(e) => setAwayTeamId(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="">Select...</option>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tournament.teams.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Venue</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="Stadium name" />
        </div>
        <div>
          <label className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Kick-off</label>
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-gray-500">
          <input type="checkbox" checked={isPlayed} onChange={(e) => setIsPlayed(e.target.checked)} />
          Already played
        </label>
        {isPlayed && (
          <div className="flex items-center gap-1 ml-auto">
            <input type="number" min={0} value={homeScore ?? 0} onChange={(e) => setHomeScore(Number(e.target.value))} className="w-12 border rounded px-2 py-1 text-center text-sm" />
            <span className="text-gray-400">-</span>
            <input type="number" min={0} value={awayScore ?? 0} onChange={(e) => setAwayScore(Number(e.target.value))} className="w-12 border rounded px-2 py-1 text-center text-sm" />
          </div>
        )}
      </div>
      <button
        onClick={save}
        disabled={saving || !homeTeamId || !awayTeamId || homeTeamId === awayTeamId}
        className="w-full flex items-center justify-center gap-1.5 bg-green-700 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Add Match
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FixturesPanel({ tournament }: { tournament: any }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const deleteMatch = async (matchId: string) => {
    if (!confirm("Delete this match?")) return;
    setDeleting(matchId);
    try {
      await fetch(`/api/matches/${matchId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(null);
    }
  };

  if (tournament.matches.length === 0 && !showAddForm) {
    return (
      <div className="space-y-4">
        <div className="text-center py-12 text-gray-400">
          <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>No fixtures yet.</p>
          <p className="text-sm mt-1">
            Add teams then &quot;Generate Fixtures&quot;, or add matches manually below.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full flex items-center justify-center gap-1.5 border-2 border-dashed border-gray-300 text-gray-500 py-3 rounded-xl hover:border-green-400 hover:text-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Match Manually
        </button>
      </div>
    );
  }

  // Group matches by round
  const byRound: Record<number, typeof tournament.matches> = {};
  for (const m of tournament.matches) {
    byRound[m.round] = byRound[m.round] ?? [];
    byRound[m.round].push(m);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
        >
          <Plus className="w-3 h-3" /> {showAddForm ? "Hide" : "Add Match"}
        </button>
      </div>

      {showAddForm && (
        <AddMatchForm
          tournament={tournament}
          onAdded={() => router.refresh()}
        />
      )}

      {Object.entries(byRound).map(([round, matches]) => (
        <div key={round}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {matches[0].stage === "LEAGUE" || matches[0].stage === "GROUP"
              ? `Matchday ${round}`
              : matches[0].stage}
          </h3>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {matches.map((match: any) => (
              <div
                key={match.id}
                className="bg-white rounded-xl border shadow-sm px-4 py-3"
              >
                {/* Venue / kickoff info */}
                {(match.venue || match.scheduledAt) && (
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2">
                    {match.venue && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {match.venue}{match.venueLocation ? `, ${match.venueLocation}` : ""}
                      </span>
                    )}
                    {match.scheduledAt && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(match.scheduledAt).toLocaleString(undefined, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs sm:text-sm font-medium text-right text-gray-800 truncate">
                    {match.homeTeam?.name ?? "TBD"}
                  </span>

                  <div className="flex flex-col items-center shrink-0 min-w-[64px] sm:min-w-[80px]">
                    {match.status === "FINISHED" ? (
                      <span className="text-base sm:text-lg font-bold text-gray-900">
                        {match.homeScore} – {match.awayScore}
                      </span>
                    ) : match.status === "LIVE" ? (
                      <span className="text-base sm:text-lg font-bold text-red-600">
                        {match.homeScore ?? 0} – {match.awayScore ?? 0}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">vs</span>
                    )}
                    <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 ${statusStyle[match.status as MatchStatus]}`}>
                      {match.status}
                    </span>
                  </div>

                  <span className="flex-1 text-xs sm:text-sm font-medium text-gray-800 truncate">
                    {match.awayTeam?.name ?? "TBD"}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {match.homeTeam && match.awayTeam && (
                      <button
                        onClick={() => setEditing(editing === match.id ? null : match.id)}
                        className="text-xs text-green-700 border border-green-200 p-1.5 rounded hover:bg-green-50"
                        title="Edit"
                      >
                        {editing === match.id ? <X className="w-3 h-3" /> : <Pencil className="w-3 h-3" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMatch(match.id)}
                      disabled={deleting === match.id}
                      className="text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50"
                      title="Delete"
                    >
                      {deleting === match.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {editing === match.id && (
                  <div className="mt-3 pt-3 border-t">
                    <ScoreEditor
                      match={match}
                      onSave={() => {
                        setEditing(null);
                        router.refresh();
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
