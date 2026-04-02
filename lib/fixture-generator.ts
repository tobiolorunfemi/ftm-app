// Fixture generation engine for FTM App
// Supports: LEAGUE (round-robin), KNOCKOUT, GROUP_KNOCKOUT

export type TeamRef = { id: string; name: string };

export interface GeneratedMatch {
  round: number;
  matchNumber: number;
  stage: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  groupId?: string;
}

/** Shuffle array using Fisher-Yates */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Round-robin league: every team plays every other team once (or twice with reverseLegs)
 */
export function generateLeagueFixtures(
  teams: TeamRef[],
  reverseLegs = false
): GeneratedMatch[] {
  const shuffled = shuffle(teams);
  const n = shuffled.length;
  // Add a BYE if odd number of teams
  const list = n % 2 !== 0 ? [...shuffled, { id: "BYE", name: "BYE" }] : [...shuffled];
  const total = list.length;
  const rounds = total - 1;
  const matchesPerRound = total / 2;
  const fixtures: GeneratedMatch[] = [];
  let matchNumber = 1;

  for (let round = 0; round < rounds; round++) {
    for (let match = 0; match < matchesPerRound; match++) {
      const home = list[match];
      const away = list[total - 1 - match];
      if (home.id !== "BYE" && away.id !== "BYE") {
        fixtures.push({
          round: round + 1,
          matchNumber: matchNumber++,
          stage: "LEAGUE",
          homeTeamId: home.id,
          awayTeamId: away.id,
        });
        if (reverseLegs) {
          fixtures.push({
            round: rounds + round + 1,
            matchNumber: matchNumber++,
            stage: "LEAGUE",
            homeTeamId: away.id,
            awayTeamId: home.id,
          });
        }
      }
    }
    // Rotate all except first element
    list.splice(1, 0, list.pop()!);
  }

  return fixtures;
}

/**
 * Knockout: single-elimination bracket
 * teamCount must be a power of 2; byes are added if needed
 */
export function generateKnockoutFixtures(teams: TeamRef[]): GeneratedMatch[] {
  const shuffled = shuffle(teams);
  // Pad to next power of 2
  const size = Math.pow(2, Math.ceil(Math.log2(shuffled.length)));
  const padded: (TeamRef | null)[] = [...shuffled];
  while (padded.length < size) padded.push(null);

  const fixtures: GeneratedMatch[] = [];
  let matchNumber = 1;
  const rounds = Math.log2(size);

  // Build round 1 with actual teams
  const stageNames: Record<number, string> = {
    1: rounds === 1 ? "FINAL" : rounds === 2 ? "SF" : rounds === 3 ? "QF" : "R16",
    2: rounds === 2 ? "FINAL" : rounds === 3 ? "SF" : "QF",
    3: rounds === 3 ? "FINAL" : "SF",
    4: "FINAL",
  };

  for (let i = 0; i < padded.length; i += 2) {
    const home = padded[i];
    const away = padded[i + 1];
    fixtures.push({
      round: 1,
      matchNumber: matchNumber++,
      stage: stageNames[1] ?? "KO",
      homeTeamId: home?.id ?? null,
      awayTeamId: away?.id ?? null,
    });
  }

  // Placeholder matches for subsequent rounds
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = size / Math.pow(2, round);
    for (let m = 0; m < matchesInRound; m++) {
      fixtures.push({
        round,
        matchNumber: matchNumber++,
        stage: stageNames[round] ?? "KO",
        homeTeamId: null,
        awayTeamId: null,
      });
    }
  }

  return fixtures;
}

/**
 * Group + Knockout (UCL style)
 * - Divide teams into groups
 * - Each group plays round-robin
 * - Top N from each group advance to knockout
 */
export function generateGroupKnockoutFixtures(
  teams: TeamRef[],
  groupCount: number,
  teamsPerGroup: number,
  teamsQualifyPerGroup: number = 2
): {
  groupFixtures: (GeneratedMatch & { groupId: string })[];
  groups: { id: string; name: string; teamIds: string[] }[];
  knockoutPlaceholders: GeneratedMatch[];
} {
  const shuffled = shuffle(teams);
  const groups: { id: string; name: string; teamIds: string[] }[] = [];

  for (let g = 0; g < groupCount; g++) {
    const groupTeams = shuffled.slice(g * teamsPerGroup, (g + 1) * teamsPerGroup);
    groups.push({
      id: `group-${g}`,
      name: `Group ${String.fromCharCode(65 + g)}`, // A, B, C...
      teamIds: groupTeams.map((t) => t.id),
    });
  }

  const groupFixtures: (GeneratedMatch & { groupId: string })[] = [];
  let matchNumber = 1;

  for (const group of groups) {
    const groupTeamRefs = group.teamIds.map((id) => {
      const t = teams.find((t) => t.id === id)!;
      return t;
    });
    const roundRobin = generateLeagueFixtures(groupTeamRefs, false);
    for (const f of roundRobin) {
      groupFixtures.push({ ...f, groupId: group.id, matchNumber: matchNumber++ });
    }
  }

  // Knockout stage placeholders
  const totalQualifiers = groupCount * teamsQualifyPerGroup;
  const koTeams: TeamRef[] = Array.from({ length: totalQualifiers }, (_, i) => ({
    id: `TBD-${i}`,
    name: "TBD",
  }));
  const knockoutPlaceholders = generateKnockoutFixtures(koTeams);

  return { groupFixtures, groups, knockoutPlaceholders };
}
