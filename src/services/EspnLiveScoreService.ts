import type { ActualScorer, Match, MatchResult } from "../models";

const ESPN_SCOREBOARD_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_DEV_PROXY_SCOREBOARD_URL =
  "/espn/apis/site/v2/sports/soccer/fifa.world/scoreboard";

interface EspnTeam {
  id: string;
  abbreviation?: string;
  displayName?: string;
  name?: string;
  shortDisplayName?: string;
}

interface EspnCompetitor {
  id: string;
  homeAway: "home" | "away";
  score?: string;
  team: EspnTeam;
}

interface EspnDetail {
  id?: string;
  scoringPlay?: boolean;
  ownGoal?: boolean;
  team?: { id?: string };
  athletesInvolved?: Array<{
    id?: string;
    displayName?: string;
    fullName?: string;
  }>;
  type?: {
    text?: string;
  };
}

interface EspnCompetition {
  id: string;
  competitors?: EspnCompetitor[];
  details?: EspnDetail[];
  status?: {
    displayClock?: string;
    type?: {
      state?: "pre" | "in" | "post";
      completed?: boolean;
      description?: string;
      detail?: string;
      shortDetail?: string;
    };
  };
}

interface EspnEvent {
  id: string;
  name: string;
  shortName?: string;
  competitions?: EspnCompetition[];
}

interface EspnScoreboardResponse {
  events?: EspnEvent[];
}

export interface EspnLiveResult {
  fixtureId: string;
  fixtureName: string;
  result: MatchResult;
  phase: "pregame" | "live" | "finished";
  minuteLabel: string | null;
  updatedAt: string;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function aliases(name: string): string[] {
  const normalized = normalize(name);
  if (normalized === "brasil") return ["brasil", "brazil", "bra"];
  if (normalized === "escocia") return ["escocia", "scotland", "sco"];
  return [normalized];
}

function competitorText(competitor: EspnCompetitor): string {
  return [
    competitor.team.displayName,
    competitor.team.name,
    competitor.team.shortDisplayName,
    competitor.team.abbreviation,
  ]
    .filter(Boolean)
    .map((value) => normalize(value as string))
    .join(" | ");
}

function competitorMatches(competitor: EspnCompetitor, names: string[]): boolean {
  const text = competitorText(competitor);
  return names.some((name) => text.includes(name));
}

function appCompetitors(
  competition: EspnCompetition,
  match: Match
): { appHome?: EspnCompetitor; appAway?: EspnCompetitor } {
  const competitors = competition.competitors ?? [];
  const homeAliases = aliases(match.homeTeam.name);
  const awayAliases = aliases(match.awayTeam.name);

  return {
    appHome: competitors.find((competitor) => competitorMatches(competitor, homeAliases)),
    appAway: competitors.find((competitor) => competitorMatches(competitor, awayAliases)),
  };
}

function eventMatches(event: EspnEvent, match: Match): boolean {
  const competition = event.competitions?.[0];
  const homeAliases = aliases(match.homeTeam.name);
  const awayAliases = aliases(match.awayTeam.name);

  if (competition) {
    const { appHome, appAway } = appCompetitors(competition, match);
    if (appHome && appAway) return true;
  }

  const eventName = normalize(`${event.name} ${event.shortName ?? ""}`);
  return homeAliases.some((name) => eventName.includes(name)) &&
    awayAliases.some((name) => eventName.includes(name));
}

function phase(competition: EspnCompetition): EspnLiveResult["phase"] {
  const state = competition.status?.type?.state;
  if (state === "in") return "live";
  if (state === "post" || competition.status?.type?.completed) return "finished";
  return "pregame";
}

function goalScorers(competition: EspnCompetition, match: Match): MatchResult["actualScorers"] {
  const { appHome, appAway } = appCompetitors(competition, match);
  const homeGoals: ActualScorer[] = [];
  const awayGoals: ActualScorer[] = [];

  (competition.details ?? [])
    .filter((detail) => detail.scoringPlay)
    .forEach((detail, index) => {
      const athlete = detail.athletesInvolved?.[0];
      const scorerName = detail.ownGoal
        ? "Gol contra"
        : athlete?.displayName ?? athlete?.fullName ?? "Gol";
      const target =
        detail.team?.id === appHome?.id ? "home" : detail.team?.id === appAway?.id ? "away" : null;
      if (!target) return;

      const goalList = target === "home" ? homeGoals : awayGoals;
      goalList.push({
        id: `espn-${detail.id ?? index}`,
        teamId: target === "home" ? match.homeTeam.id : match.awayTeam.id,
        playerId: athlete?.id ? `espn-${athlete.id}` : null,
        playerName: scorerName,
        goalIndex: goalList.length + 1,
        type: detail.ownGoal ? "own_goal" : "player",
      });
    });

  return { home: homeGoals, away: awayGoals };
}

function endpoint(): string {
  const baseUrl = import.meta.env.DEV ? ESPN_DEV_PROXY_SCOREBOARD_URL : ESPN_SCOREBOARD_URL;
  return import.meta.env.DEV ? baseUrl : new URL(baseUrl).toString();
}

export async function fetchEspnLiveResult(match: Match): Promise<EspnLiveResult | null> {
  const response = await fetch(endpoint(), { cache: "no-store" });
  if (!response.ok) throw new Error(`ESPN respondeu HTTP ${response.status}`);

  const payload = (await response.json()) as EspnScoreboardResponse;
  const event = (payload.events ?? []).find((candidate) => eventMatches(candidate, match));
  const competition = event?.competitions?.[0];
  if (!event || !competition) return null;

  const { appHome, appAway } = appCompetitors(competition, match);
  const now = new Date().toISOString();

  return {
    fixtureId: event.id,
    fixtureName: event.name,
    phase: phase(competition),
    minuteLabel: competition.status?.displayClock ?? null,
    updatedAt: now,
    result: {
      homeScore: Number(appHome?.score ?? 0),
      awayScore: Number(appAway?.score ?? 0),
      actualScorers: goalScorers(competition, match),
      createdAt: now,
      updatedAt: now,
    },
  };
}
