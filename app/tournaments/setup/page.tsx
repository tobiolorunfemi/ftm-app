"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import {
  Trophy,
  Users,
  CalendarDays,
  Loader2,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Layers,
  Upload,
  Download,
  AlertCircle,
} from "lucide-react";

type Format = "LEAGUE" | "KNOCKOUT" | "GROUP_KNOCKOUT";
type Step = "details" | "teams" | "groups" | "fixtures" | "review";

const formats: { value: Format; label: string; desc: string }[] = [
  { value: "LEAGUE", label: "League (Round Robin)", desc: "Every team plays each other" },
  { value: "KNOCKOUT", label: "Knockout (Elimination)", desc: "Lose once, you're out" },
  { value: "GROUP_KNOCKOUT", label: "Group + Knockout (UCL style)", desc: "Groups then knockout" },
];

interface ManualMatch {
  id: string;
  round: number;
  stage: string;
  homeTeamIdx: number;
  awayTeamIdx: number;
  homeScore?: number;
  awayScore?: number;
  status: "SCHEDULED" | "FINISHED";
  groupIdx?: number;
  venue?: string;
  scheduledAt?: string; // ISO string
}

interface GroupDef {
  name: string;
  teamIndices: number[];
}

export default function ManualSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Tournament details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<Format>("GROUP_KNOCKOUT");
  const [status, setStatus] = useState<"DRAFT" | "ACTIVE">("ACTIVE");

  // Step 2: Teams
  const [teams, setTeams] = useState<string[]>([""]);

  // Step 3: Groups (for GROUP_KNOCKOUT)
  const [groups, setGroups] = useState<GroupDef[]>([{ name: "Group A", teamIndices: [] }]);

  // Step 4: Fixtures
  const [matches, setMatches] = useState<ManualMatch[]>([]);

  // Import state
  const teamsFileRef = useRef<HTMLInputElement>(null);
  const fixturesFileRef = useRef<HTMLInputElement>(null);
  const [teamsImportMsg, setTeamsImportMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [fixturesImportMsg, setFixturesImportMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const validTeams = teams.filter((t) => t.trim().length >= 2);

  // Parse an uploaded file (xlsx/xls/csv) and return rows as objects
  const parseFile = (file: File): Promise<Record<string, string>[]> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target!.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
          resolve(rows);
        } catch {
          reject(new Error("Could not read file. Make sure it is a valid .xlsx, .xls, or .csv file."));
        }
      };
      reader.onerror = () => reject(new Error("File read error"));
      reader.readAsArrayBuffer(file);
    });

  const importTeams = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTeamsImportMsg(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) { setTeamsImportMsg({ type: "err", text: "File is empty." }); return; }
      const cols = Object.keys(rows[0] ?? {});

      // Check if this is a fixture file with Team / Team_1 columns
      const isFixtureFile = cols.some((k) => /^team_?1$/i.test(k.trim()));

      let imported: string[];
      if (isFixtureFile) {
        // Extract all unique team names from Team and Team_1 columns
        const homeKey = cols.find((k) => /^team$/i.test(k.trim()));
        const awayKey = cols.find((k) => /^team_?1$/i.test(k.trim()));
        const names = new Set<string>();
        rows.forEach((r) => {
          if (homeKey) { const v = String(r[homeKey] ?? "").trim(); if (v.length >= 2) names.add(v); }
          if (awayKey) { const v = String(r[awayKey] ?? "").trim(); if (v.length >= 2) names.add(v); }
        });
        imported = [...names];
      } else {
        // Standard Team Name column
        const nameKey = cols.find((k) => /^team[\s_-]?name$|^name$|^team$/i.test(k.trim()));
        if (!nameKey) {
          setTeamsImportMsg({ type: "err", text: 'Column "Team Name" not found. See expected format below.' });
          return;
        }
        imported = rows.map((r) => String(r[nameKey] ?? "").trim()).filter((n) => n.length >= 2);
      }

      if (imported.length === 0) {
        setTeamsImportMsg({ type: "err", text: "No valid team names found in file." });
        return;
      }
      const existing = teams.filter((t) => t.trim().length >= 2);
      const merged = Array.from(new Set([...existing, ...imported]));
      setTeams(merged.length > 0 ? merged : [""]);
      const dupes = imported.length - (merged.length - existing.length);
      setTeamsImportMsg({ type: "ok", text: `Imported ${merged.length - existing.length} team(s).${dupes > 0 ? ` ${dupes} duplicate(s) skipped.` : ""}` });
    } catch (err) {
      setTeamsImportMsg({ type: "err", text: (err as Error).message });
    }
    if (teamsFileRef.current) teamsFileRef.current.value = "";
  };

  const importFixtures = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFixturesImportMsg(null);
    try {
      const rows = await parseFile(file);
      if (rows.length === 0) {
        setFixturesImportMsg({ type: "err", text: "File is empty." });
        return;
      }

      // Normalise column keys: lower-case, strip spaces/underscores
      const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, "");
      const col = (row: Record<string, string>, ...aliases: string[]) => {
        const key = Object.keys(row).find((k) => aliases.includes(norm(k)));
        return key ? String(row[key] ?? "").trim() : "";
      };

      const lowerNames = validTeams.map((t) => t.toLowerCase());
      const findTeamIdx = (name: string) => lowerNames.indexOf(name.toLowerCase());

      // Build group name → index map for GROUP_KNOCKOUT
      const groupNameToIdx: Record<string, number> = {};
      groups.forEach((g, i) => { groupNameToIdx[g.name.toLowerCase()] = i; });

      // Convert Excel date serial to ISO string (noon UTC to avoid tz shift)
      const excelDateToISO = (val: string): string | undefined => {
        const num = Number(val);
        if (!isNaN(num) && num > 40000) {
          // XLSX serial: days since 1900-01-01 (with Lotus 1-2-3 bug offset)
          const date = new Date(Math.round((num - 25569) * 86400 * 1000));
          return date.toISOString();
        }
        // Try parsing as a date string
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d.toISOString();
      };

      const imported: ManualMatch[] = [];
      const errors: string[] = [];

      rows.forEach((row, i) => {
        // Home team: "Home Team", "hometeam", "home", "Team", "team"
        const home = col(row, "hometeam", "home", "team");
        // Away team: "Away Team", "awayteam", "away", "Team_1", "team1"
        const away = col(row, "awayteam", "away", "team1");
        const homeIdx = findTeamIdx(home);
        const awayIdx = findTeamIdx(away);

        if (homeIdx === -1) { errors.push(`Row ${i + 2}: Home team "${home}" not found`); return; }
        if (awayIdx === -1) { errors.push(`Row ${i + 2}: Away team "${away}" not found`); return; }
        if (homeIdx === awayIdx) { errors.push(`Row ${i + 2}: Home and away team are the same`); return; }

        const roundRaw = col(row, "round", "matchday", "gameweek", "gw");
        const round = parseInt(roundRaw, 10) || 1;

        const stageRaw = col(row, "stage", "phase").toUpperCase();
        const stageMap: Record<string, string> = {
          GROUP: "GROUP", LEAGUE: "LEAGUE", R16: "R16", "ROUND OF 16": "R16",
          QF: "QF", "QUARTERFINAL": "QF", "QUARTER-FINAL": "QF",
          SF: "SF", "SEMIFINAL": "SF", "SEMI-FINAL": "SF",
          FINAL: "FINAL", KO: "KO", KNOCKOUT: "KO",
        };
        const defaultStage = format === "GROUP_KNOCKOUT" ? "GROUP" : format === "KNOCKOUT" ? "KO" : "LEAGUE";
        const stage = stageMap[stageRaw] ?? defaultStage;

        const homeScoreRaw = col(row, "homescore", "homeg", "hg", "score1");
        const awayScoreRaw = col(row, "awayscore", "awayg", "ag", "score2");
        const homeScore = homeScoreRaw !== "" ? parseInt(homeScoreRaw, 10) : undefined;
        const awayScore = awayScoreRaw !== "" ? parseInt(awayScoreRaw, 10) : undefined;

        const statusRaw = col(row, "status", "result").toUpperCase();
        const played = homeScore !== undefined && awayScore !== undefined;
        const status: "SCHEDULED" | "FINISHED" =
          statusRaw === "FINISHED" || statusRaw === "PLAYED" || played ? "FINISHED" : "SCHEDULED";

        // Venue: "Propose Location", "venue", "location", "ground"
        const venueRaw = col(row, "proposelocation", "venue", "location", "ground", "stadium");
        const venue = venueRaw || undefined;

        // Date: "Date", "date", "kickoff", "kickofftime"
        const dateRaw = col(row, "date", "kickoff", "kickofftime", "datetime");
        const scheduledAt = dateRaw ? excelDateToISO(dateRaw) : undefined;

        // Group assignment from "Group" column
        const groupNameRaw = col(row, "group", "groupname");
        let groupIdx: number | undefined;
        if (groupNameRaw) {
          const gi = groupNameToIdx[groupNameRaw.toLowerCase()];
          groupIdx = gi !== undefined ? gi : undefined;
        }

        imported.push({
          id: `m-${Date.now()}-${i}`,
          round,
          stage,
          homeTeamIdx: homeIdx,
          awayTeamIdx: awayIdx,
          homeScore: status === "FINISHED" ? (homeScore ?? 0) : undefined,
          awayScore: status === "FINISHED" ? (awayScore ?? 0) : undefined,
          status,
          venue,
          scheduledAt,
          groupIdx,
        });
      });

      if (imported.length === 0 && errors.length > 0) {
        setFixturesImportMsg({ type: "err", text: errors.slice(0, 3).join("; ") });
        return;
      }

      setMatches((prev) => [...prev, ...imported]);
      const withGroup = imported.filter((m) => m.groupIdx !== undefined).length;
      const withVenue = imported.filter((m) => m.venue).length;
      const withDate = imported.filter((m) => m.scheduledAt).length;
      let msg = `Imported ${imported.length} fixture(s).`;
      if (withGroup > 0) msg += ` ${withGroup} auto-assigned to groups.`;
      if (withVenue > 0) msg += ` ${withVenue} with venue.`;
      if (withDate > 0) msg += ` ${withDate} with date.`;
      if (errors.length > 0) msg += ` ${errors.length} row(s) skipped.`;
      setFixturesImportMsg({ type: imported.length > 0 ? "ok" : "err", text: msg });
    } catch (err) {
      setFixturesImportMsg({ type: "err", text: (err as Error).message });
    }
    if (fixturesFileRef.current) fixturesFileRef.current.value = "";
  };

  const downloadTeamsTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([["Team Name"], ["Arsenal FC"], ["Chelsea FC"], ["Liverpool FC"]]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Teams");
    XLSX.writeFile(wb, "teams-template.xlsx");
  };

  const downloadFixturesTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Round", "Stage", "Home Team", "Away Team", "Home Score", "Away Score", "Status"],
      [1, "LEAGUE", "Arsenal FC", "Chelsea FC", 2, 1, "FINISHED"],
      [1, "LEAGUE", "Liverpool FC", "Man United", "", "", "SCHEDULED"],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fixtures");
    XLSX.writeFile(wb, "fixtures-template.xlsx");
  };

  const stepsForFormat: Step[] =
    format === "GROUP_KNOCKOUT"
      ? ["details", "teams", "groups", "fixtures", "review"]
      : ["details", "teams", "fixtures", "review"];

  const currentStepIdx = stepsForFormat.indexOf(step);
  const canGoNext = () => {
    if (step === "details") return name.trim().length >= 2;
    if (step === "teams") return validTeams.length >= 2;
    if (step === "groups") {
      return groups.length >= 1 && groups.every((g) => g.teamIndices.length >= 2);
    }
    if (step === "fixtures") return true; // Fixtures are optional at setup
    return true;
  };

  const goNext = () => {
    const next = stepsForFormat[currentStepIdx + 1];
    if (next) setStep(next);
  };
  const goBack = () => {
    const prev = stepsForFormat[currentStepIdx - 1];
    if (prev) setStep(prev);
  };

  // Team management
  const addTeam = () => setTeams([...teams, ""]);
  const removeTeam = (idx: number) => {
    if (teams.length <= 1) return;
    setTeams(teams.filter((_, i) => i !== idx));
    // Remove from groups
    setGroups(
      groups.map((g) => ({
        ...g,
        teamIndices: g.teamIndices.filter((ti) => ti !== idx).map((ti) => (ti > idx ? ti - 1 : ti)),
      }))
    );
    // Remove matches referencing this team
    setMatches(
      matches.filter((m) => m.homeTeamIdx !== idx && m.awayTeamIdx !== idx).map((m) => ({
        ...m,
        homeTeamIdx: m.homeTeamIdx > idx ? m.homeTeamIdx - 1 : m.homeTeamIdx,
        awayTeamIdx: m.awayTeamIdx > idx ? m.awayTeamIdx - 1 : m.awayTeamIdx,
      }))
    );
  };
  const updateTeam = (idx: number, val: string) => {
    const copy = [...teams];
    copy[idx] = val;
    setTeams(copy);
  };

  // Group management
  const addGroup = () => {
    const letter = String.fromCharCode(65 + groups.length);
    setGroups([...groups, { name: `Group ${letter}`, teamIndices: [] }]);
  };
  const removeGroup = (idx: number) => {
    if (groups.length <= 1) return;
    setGroups(groups.filter((_, i) => i !== idx));
  };
  const toggleTeamInGroup = (groupIdx: number, teamIdx: number) => {
    setGroups(
      groups.map((g, gi) => {
        if (gi !== groupIdx) {
          // Remove from other groups
          return { ...g, teamIndices: g.teamIndices.filter((ti) => ti !== teamIdx) };
        }
        // Toggle in this group
        if (g.teamIndices.includes(teamIdx)) {
          return { ...g, teamIndices: g.teamIndices.filter((ti) => ti !== teamIdx) };
        }
        return { ...g, teamIndices: [...g.teamIndices, teamIdx] };
      })
    );
  };

  // Match management
  const addMatch = () => {
    const maxRound = matches.length > 0 ? Math.max(...matches.map((m) => m.round)) : 1;
    const defaultStage =
      format === "GROUP_KNOCKOUT" ? "GROUP" : format === "KNOCKOUT" ? "KO" : "LEAGUE";
    setMatches([
      ...matches,
      {
        id: `m-${Date.now()}`,
        round: maxRound,
        stage: defaultStage,
        homeTeamIdx: 0,
        awayTeamIdx: validTeams.length > 1 ? 1 : 0,
        status: "SCHEDULED",
      },
    ]);
  };
  const removeMatch = (idx: number) => setMatches(matches.filter((_, i) => i !== idx));
  const updateMatch = (idx: number, field: string, value: unknown) => {
    setMatches(
      matches.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  // Submit
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Create tournament (API uses session userId as organizerId)
      const tournRes = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          format,
          status,
          maxTeams: Math.max(validTeams.length, 16),
          ...(format === "GROUP_KNOCKOUT" && {
            groupCount: groups.length,
            teamsPerGroup: groups.length > 0 ? Math.max(...groups.map((g) => g.teamIndices.length)) : 4,
          }),
        }),
      });
      if (!tournRes.ok) {
        setError("Failed to create tournament");
        return;
      }
      const tournament = await tournRes.json();
      const tournId = tournament.id;

      // 2. Add teams
      const teamIds: string[] = [];
      for (const teamName of validTeams) {
        const res = await fetch(`/api/tournaments/${tournId}/teams`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: teamName }),
        });
        if (res.ok) {
          const team = await res.json();
          teamIds.push(team.id);
        }
      }

      // 3. Create groups and assign teams (GROUP_KNOCKOUT)
      if (format === "GROUP_KNOCKOUT" && groups.length > 0) {
        await fetch(`/api/tournaments/${tournId}/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groups: groups.map((g) => ({
              name: g.name,
              teamIds: g.teamIndices.map((ti) => teamIds[ti]).filter(Boolean),
            })),
          }),
        });

        // Refetch groups to get real IDs
        const groupsRes = await fetch(`/api/tournaments/${tournId}/groups`);
        const createdGroups = await groupsRes.json();
        const groupMap: Record<number, string> = {};
        groups.forEach((g, i) => {
          if (createdGroups[i]) groupMap[i] = createdGroups[i].id;
        });

        // 4. Create matches with real team IDs and group IDs
        if (matches.length > 0) {
          await fetch(`/api/tournaments/${tournId}/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              matches: matches.map((m) => ({
                round: m.round,
                stage: m.stage,
                homeTeamId: teamIds[m.homeTeamIdx],
                awayTeamId: teamIds[m.awayTeamIdx],
                homeScore: m.homeScore,
                awayScore: m.awayScore,
                status: m.status,
                groupId: m.groupIdx !== undefined ? groupMap[m.groupIdx] : undefined,
                venue: m.venue,
                scheduledAt: m.scheduledAt,
              })),
            }),
          });
        }
      } else if (matches.length > 0) {
        // Non-group formats
        await fetch(`/api/tournaments/${tournId}/matches`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matches: matches.map((m) => ({
              round: m.round,
              stage: m.stage,
              homeTeamId: teamIds[m.homeTeamIdx],
              awayTeamId: teamIds[m.awayTeamIdx],
              homeScore: m.homeScore,
              awayScore: m.awayScore,
              status: m.status,
              venue: m.venue,
              scheduledAt: m.scheduledAt,
            })),
          }),
        });
      }

      router.push(`/tournaments/${tournId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels: Record<Step, string> = {
    details: "Details",
    teams: "Teams",
    groups: "Groups",
    fixtures: "Fixtures",
    review: "Review",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <Layers className="w-5 h-5 text-orange-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Manual Tournament Setup</h1>
          <p className="text-sm text-gray-500">Import an existing or in-progress competition</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-8">
        {stepsForFormat.map((s, i) => (
          <div key={s} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= currentStepIdx ? "bg-green-600" : "bg-gray-200"
              }`}
            />
            <span className="text-[10px] text-gray-500 mt-0.5 block">{stepLabels[s]}</span>
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === "details" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Easter Cup 2026"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief description"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format *</label>
            <div className="space-y-2">
              {formats.map((f) => (
                <label
                  key={f.value}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    format === f.value ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={f.value}
                    checked={format === f.value}
                    onChange={() => setFormat(f.value)}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tournament Status</label>
            <div className="flex gap-3">
              {(["DRAFT", "ACTIVE"] as const).map((s) => (
                <label
                  key={s}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg cursor-pointer transition-colors ${
                    status === s ? "border-green-500 bg-green-50" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    checked={status === s}
                    onChange={() => setStatus(s)}
                  />
                  <span className="text-sm font-medium">{s === "DRAFT" ? "Not Started" : "Already In Progress"}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Teams */}
      {step === "teams" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" /> Add Teams ({validTeams.length})
            </h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer">
                <Upload className="w-3 h-3" /> Import File
                <input
                  ref={teamsFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={importTeams}
                />
              </label>
              <button
                onClick={downloadTeamsTemplate}
                className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                title="Download template"
              >
                <Download className="w-3 h-3" /> Template
              </button>
              <button
                onClick={addTeam}
                className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
              >
                <Plus className="w-3 h-3" /> Add Team
              </button>
            </div>
          </div>

          {/* Import feedback */}
          {teamsImportMsg && (
            <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
              teamsImportMsg.type === "ok"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {teamsImportMsg.text}
            </div>
          )}

          {/* Format hint */}
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">File format (.xlsx / .xls / .csv):</p>
            <p>One column header: <code className="bg-white border px-1 rounded">Team Name</code></p>
            <p className="mt-0.5">Each row = one team. Download the template above for a ready-to-fill file.</p>
          </div>

          <p className="text-xs text-gray-500">
            Enter all teams participating in the competition. You need at least 2.
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {teams.map((team, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-400 w-6 text-right">{idx + 1}.</span>
                <input
                  type="text"
                  value={team}
                  onChange={(e) => updateTeam(idx, e.target.value)}
                  placeholder={`Team ${idx + 1} name`}
                  className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                {teams.length > 1 && (
                  <button onClick={() => removeTeam(idx)} className="text-gray-300 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Groups (GROUP_KNOCKOUT only) */}
      {step === "groups" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Assign Teams to Groups
            </h2>
            <button
              onClick={addGroup}
              className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
            >
              <Plus className="w-3 h-3" /> Add Group
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Click a team name to assign it to a group. Each team should be in exactly one group.
          </p>

          {/* Unassigned teams */}
          {(() => {
            const assigned = new Set(groups.flatMap((g) => g.teamIndices));
            const unassigned = validTeams.map((_, i) => i).filter((i) => !assigned.has(i));
            if (unassigned.length === 0) return null;
            return (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-700 mb-1.5">
                  Unassigned ({unassigned.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unassigned.map((ti) => (
                    <span key={ti} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {validTeams[ti]}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <div className="space-y-4">
            {groups.map((group, gi) => (
              <div key={gi} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <input
                    type="text"
                    value={group.name}
                    onChange={(e) =>
                      setGroups(groups.map((g, i) => (i === gi ? { ...g, name: e.target.value } : g)))
                    }
                    className="text-sm font-semibold border-b border-transparent hover:border-gray-300 focus:border-green-500 outline-none px-1 py-0.5"
                  />
                  {groups.length > 1 && (
                    <button onClick={() => removeGroup(gi)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {validTeams.map((team, ti) => {
                    const inThisGroup = group.teamIndices.includes(ti);
                    const inAnotherGroup = !inThisGroup && groups.some((g, gj) => gj !== gi && g.teamIndices.includes(ti));
                    return (
                      <button
                        key={ti}
                        onClick={() => toggleTeamInGroup(gi, ti)}
                        disabled={inAnotherGroup}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          inThisGroup
                            ? "bg-green-100 border-green-300 text-green-800"
                            : inAnotherGroup
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                            : "bg-white border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50"
                        }`}
                      >
                        {team}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">
                  {group.teamIndices.length} team{group.teamIndices.length !== 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Fixtures */}
      {step === "fixtures" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Set Up Fixtures ({matches.length})
            </h2>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 cursor-pointer">
                <Upload className="w-3 h-3" /> Import File
                <input
                  ref={fixturesFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={importFixtures}
                />
              </label>
              <button
                onClick={downloadFixturesTemplate}
                className="flex items-center gap-1 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg hover:bg-gray-100"
                title="Download template"
              >
                <Download className="w-3 h-3" /> Template
              </button>
              <button
                onClick={addMatch}
                className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100"
              >
                <Plus className="w-3 h-3" /> Add Match
              </button>
            </div>
          </div>

          {/* Import feedback */}
          {fixturesImportMsg && (
            <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${
              fixturesImportMsg.type === "ok"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-600 border border-red-200"
            }`}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {fixturesImportMsg.text}
            </div>
          )}

          {/* Format hint */}
          <div className="bg-gray-50 border rounded-lg px-3 py-2 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Accepted file formats (.xlsx / .xls / .csv):</p>
            <p><span className="font-medium text-gray-600">Standard:</span> <code className="bg-white border px-1 rounded">Home Team</code> <code className="bg-white border px-1 rounded">Away Team</code> <code className="bg-white border px-1 rounded">Round</code></p>
            <p><span className="font-medium text-gray-600">Fixture-style:</span> <code className="bg-white border px-1 rounded">Team</code> <code className="bg-white border px-1 rounded">Team_1</code> <code className="bg-white border px-1 rounded">Matchday</code> <code className="bg-white border px-1 rounded">Group</code></p>
            <p>Also picks up: <code className="bg-white border px-1 rounded">Propose Location</code> → venue &nbsp;|&nbsp; <code className="bg-white border px-1 rounded">Date</code> → kick-off time</p>
            <p className="text-gray-400">Team names must match exactly what you entered in the Teams step.</p>
          </div>

          <p className="text-xs text-gray-500">
            Manually add fixtures or import from file. You can set scores for already-played matches and add more later.
          </p>

          {matches.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No fixtures added yet. Click &quot;Add Match&quot; to start.</p>
              <p className="text-xs mt-1">You can skip this and add fixtures later from the tournament page.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {matches.map((match, idx) => (
                <div key={match.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Match {idx + 1}</span>
                    <button onClick={() => removeMatch(idx)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500">Round</label>
                      <input
                        type="number"
                        min={1}
                        value={match.round}
                        onChange={(e) => updateMatch(idx, "round", Number(e.target.value))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500">Stage</label>
                      <select
                        value={match.stage}
                        onChange={(e) => updateMatch(idx, "stage", e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
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

                  {/* Group assignment for GROUP_KNOCKOUT */}
                  {format === "GROUP_KNOCKOUT" && match.stage === "GROUP" && (
                    <div>
                      <label className="text-[10px] text-gray-500">Group</label>
                      <select
                        value={match.groupIdx ?? ""}
                        onChange={(e) =>
                          updateMatch(idx, "groupIdx", e.target.value === "" ? undefined : Number(e.target.value))
                        }
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        <option value="">-- Select Group --</option>
                        {groups.map((g, gi) => (
                          <option key={gi} value={gi}>{g.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500">Home Team</label>
                      <select
                        value={match.homeTeamIdx}
                        onChange={(e) => updateMatch(idx, "homeTeamIdx", Number(e.target.value))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        {validTeams.map((t, ti) => (
                          <option key={ti} value={ti}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="text-center text-xs text-gray-400 py-1">vs</div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500">Away Team</label>
                      <select
                        value={match.awayTeamIdx}
                        onChange={(e) => updateMatch(idx, "awayTeamIdx", Number(e.target.value))}
                        className="w-full border rounded px-2 py-1 text-sm"
                      >
                        {validTeams.map((t, ti) => (
                          <option key={ti} value={ti}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Score (optional — for backfilling) */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={match.status === "FINISHED"}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateMatch(idx, "status", "FINISHED");
                            if (match.homeScore === undefined) updateMatch(idx, "homeScore", 0);
                            if (match.awayScore === undefined) updateMatch(idx, "awayScore", 0);
                          } else {
                            updateMatch(idx, "status", "SCHEDULED");
                          }
                        }}
                      />
                      Already played
                    </label>
                    {match.status === "FINISHED" && (
                      <div className="flex items-center gap-1 ml-auto">
                        <input
                          type="number"
                          min={0}
                          value={match.homeScore ?? 0}
                          onChange={(e) => updateMatch(idx, "homeScore", Number(e.target.value))}
                          className="w-12 border rounded px-2 py-1 text-center text-sm"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                          type="number"
                          min={0}
                          value={match.awayScore ?? 0}
                          onChange={(e) => updateMatch(idx, "awayScore", Number(e.target.value))}
                          className="w-12 border rounded px-2 py-1 text-center text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Review */}
      {step === "review" && (
        <div className="bg-white rounded-xl border p-6 shadow-sm space-y-5">
          <h2 className="text-sm font-semibold text-gray-700">Review & Create</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Name</span>
              <span className="font-medium">{name}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Format</span>
              <span className="font-medium">{format.replace("_", " + ")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Status</span>
              <span className={`font-medium ${status === "ACTIVE" ? "text-green-600" : "text-gray-600"}`}>
                {status === "ACTIVE" ? "In Progress" : "Not Started"}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Teams</span>
              <span className="font-medium">{validTeams.length}</span>
            </div>
            {format === "GROUP_KNOCKOUT" && (
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Groups</span>
                <span className="font-medium">{groups.length}</span>
              </div>
            )}
            <div className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Fixtures</span>
              <span className="font-medium">
                {matches.length} ({matches.filter((m) => m.status === "FINISHED").length} played)
              </span>
            </div>
          </div>

          {format === "GROUP_KNOCKOUT" && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Group Assignments:</p>
              {groups.map((g, gi) => (
                <div key={gi} className="text-xs text-gray-600">
                  <span className="font-medium">{g.name}:</span>{" "}
                  {g.teamIndices.map((ti) => validTeams[ti]).join(", ") || "No teams"}
                </div>
              ))}
            </div>
          )}

          {matches.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Fixtures Preview:</p>
              <div className="max-h-[200px] overflow-y-auto space-y-1">
                {matches.map((m, i) => (
                  <div key={i} className="text-xs text-gray-600 flex items-center gap-2">
                    <span className="text-gray-400">R{m.round}</span>
                    <span className="font-medium">{validTeams[m.homeTeamIdx]}</span>
                    {m.status === "FINISHED" ? (
                      <span className="text-green-600 font-bold">{m.homeScore} - {m.awayScore}</span>
                    ) : (
                      <span className="text-gray-400">vs</span>
                    )}
                    <span className="font-medium">{validTeams[m.awayTeamIdx]}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      m.status === "FINISHED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {m.status === "FINISHED" ? "Played" : "Upcoming"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-4">
          {error}
        </p>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={goBack}
          disabled={currentStepIdx === 0}
          className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {step === "review" ? (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {loading ? "Creating..." : "Create Tournament"}
          </button>
        ) : (
          <button
            onClick={goNext}
            disabled={!canGoNext()}
            className="flex items-center gap-1 bg-green-700 text-white px-4 py-2 text-sm rounded-lg hover:bg-green-600 disabled:opacity-40"
          >
            Next <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
