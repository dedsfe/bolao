import type { ActualScorer, Match, MatchResult } from "../models";

const SPORTMONKS_INPLAY_URL =
  "https://api.sportmonks.com/v3/football/livescores/inplay";
const SPORTMONKS_DEV_PROXY_INPLAY_URL =
  "/sportmonks/v3/football/livescores/inplay";
const SPORTMONKS_FIXTURES_URL =
  "https://api.sportmonks.com/v3/football/fixtures";
const SPORTMONKS_DEV_PROXY_FIXTURES_URL =
  "/sportmonks/v3/football/fixtures";
const INCLUDE = "participants;scores;periods;events;league.country;round";

interface SportmonksParticipant {
  id: number;
  name: string;
  meta?: {
    location?: "home" | "away";
  };
}

interface SportmonksScore {
  description?: string;
  score?: {
    goals?: number;
    participant?: "home" | "away";
  };
}

interface SportmonksEvent {
  id: number;
  type_id?: number;
  participant_id?: number;
  player_id?: number | null;
  player_name?: string | null;
  minute?: number | null;
  result?: string | null;
  type?: {
    code?: string;
    developer_name?: string;
    name?: string;
  };
}

interface SportmonksFixture {
  id: number;
  state_id?: number;
  name: string;
  starting_at?: string;
  participants?: SportmonksParticipant[];
  scores?: SportmonksScore[];
  events?: SportmonksEvent[];
  periods?: Array<{
    ticking?: boolean;
    minutes?: number | null;
    seconds?: number | null;
    description?: string | null;
  }>;
}

interface SportmonksResponse {
  data?: SportmonksFixture[];
  message?: string;
}

export interface SportmonksLiveResult {
  fixtureId: number;
  fixtureName: string;
  result: MatchResult;
  minuteLabel: string | null;
  updatedAt: string;
}

export class SportmonksNoFixtureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SportmonksNoFixtureError";
  }
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function teamAliases(name: string): string[] {
  const normalized = normalize(name);
  if (normalized === "brasil") return ["brasil", "brazil"];
  if (normalized === "japao") return ["japao", "japan"];
  if (normalized === "escocia") return ["escocia", "scotland"];
  return [normalized];
}

function participantByLocation(
  fixture: SportmonksFixture,
  location: "home" | "away"
): SportmonksParticipant | undefined {
  return fixture.participants?.find((participant) => participant.meta?.location === location);
}

function fixtureMatchesAppMatch(fixture: SportmonksFixture, match: Match): boolean {
  const home = participantByLocation(fixture, "home");
  const away = participantByLocation(fixture, "away");
  const homeNames = teamAliases(match.homeTeam.name);
  const awayNames = teamAliases(match.awayTeam.name);

  if (home && away) {
    const sportmonksHome = normalize(home.name);
    const sportmonksAway = normalize(away.name);
    return homeNames.includes(sportmonksHome) && awayNames.includes(sportmonksAway);
  }

  const fixtureName = normalize(fixture.name);
  return homeNames.some((name) => fixtureName.includes(name)) &&
    awayNames.some((name) => fixtureName.includes(name));
}

function currentScore(fixture: SportmonksFixture, side: "home" | "away"): number {
  const current = fixture.scores?.find(
    (score) =>
      score.description === "CURRENT" &&
      score.score?.participant === side &&
      typeof score.score.goals === "number"
  );
  return current?.score?.goals ?? 0;
}

function isGoalEvent(event: SportmonksEvent): boolean {
  const code = event.type?.code?.toLowerCase();
  const developerName = event.type?.developer_name?.toLowerCase();
  const name = event.type?.name?.toLowerCase();
  return event.type_id === 14 || code === "goal" || developerName === "goal" || name === "goal";
}

function actualScorer(
  event: SportmonksEvent,
  teamId: string,
  goalIndex: number
): ActualScorer {
  return {
    id: `sportmonks-${event.id}`,
    teamId,
    playerId: event.player_id ? `sportmonks-${event.player_id}` : null,
    playerName: event.player_name ?? "Gol",
    goalIndex,
    type: "player",
  };
}

function goalScorers(fixture: SportmonksFixture, match: Match): MatchResult["actualScorers"] {
  const home = participantByLocation(fixture, "home");
  const away = participantByLocation(fixture, "away");
  const goals = (fixture.events ?? []).filter(isGoalEvent);
  const homeGoals: ActualScorer[] = [];
  const awayGoals: ActualScorer[] = [];

  goals.forEach((event) => {
    if (event.participant_id === home?.id) {
      homeGoals.push(actualScorer(event, match.homeTeam.id, homeGoals.length + 1));
    } else if (event.participant_id === away?.id) {
      awayGoals.push(actualScorer(event, match.awayTeam.id, awayGoals.length + 1));
    }
  });

  return { home: homeGoals, away: awayGoals };
}

function minuteLabel(fixture: SportmonksFixture): string | null {
  const periods = fixture.periods ?? [];
  const ticking = periods.find((period) => period.ticking) ?? periods[periods.length - 1];
  if (!ticking || typeof ticking.minutes !== "number") return null;
  const seconds = typeof ticking.seconds === "number" ? String(ticking.seconds).padStart(2, "0") : "00";
  return `${ticking.minutes}:${seconds}`;
}

function endpoint(path: "inplay" | "date" | "fixture", value?: string): string {
  let baseUrl: string;
  if (path === "inplay") {
    baseUrl = import.meta.env.DEV ? SPORTMONKS_DEV_PROXY_INPLAY_URL : SPORTMONKS_INPLAY_URL;
  } else if (path === "date") {
    const root = import.meta.env.DEV ? SPORTMONKS_DEV_PROXY_FIXTURES_URL : SPORTMONKS_FIXTURES_URL;
    baseUrl = `${root}/date/${value}`;
  } else {
    const root = import.meta.env.DEV ? SPORTMONKS_DEV_PROXY_FIXTURES_URL : SPORTMONKS_FIXTURES_URL;
    baseUrl = `${root}/${value}`;
  }

  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set("include", INCLUDE);
  const token = import.meta.env.VITE_SPORTMONKS_API_TOKEN as string | undefined;
  if (token) url.searchParams.set("api_token", token);
  return import.meta.env.DEV ? `${url.pathname}${url.search}` : url.toString();
}

async function fetchFixtures(url: string): Promise<{ fixtures: SportmonksFixture[]; message?: string }> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Sportmonks respondeu HTTP ${response.status}`);
  }

  const payload = (await response.json()) as SportmonksResponse | SportmonksFixture | SportmonksFixture[];
  if (Array.isArray(payload)) return { fixtures: payload };
  if ("id" in payload) return { fixtures: [payload] };
  return { fixtures: payload.data ?? [], message: payload.message };
}

function toLiveResult(fixture: SportmonksFixture, match: Match): SportmonksLiveResult {

  const now = new Date().toISOString();
  return {
    fixtureId: fixture.id,
    fixtureName: fixture.name,
    minuteLabel: minuteLabel(fixture),
    updatedAt: now,
    result: {
      homeScore: currentScore(fixture, "home"),
      awayScore: currentScore(fixture, "away"),
      actualScorers: goalScorers(fixture, match),
      createdAt: now,
      updatedAt: now,
    },
  };
}

function candidateDates(): string[] {
  const today = new Date();
  const yyyyMmDd = (date: Date) => date.toISOString().slice(0, 10);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  return Array.from(new Set([yyyyMmDd(today), yyyyMmDd(yesterday), yyyyMmDd(tomorrow)]));
}

export async function fetchSportmonksLiveResult(match: Match): Promise<SportmonksLiveResult | null> {
  const fixtureId = import.meta.env.VITE_SPORTMONKS_FIXTURE_ID as string | undefined;
  const messages: string[] = [];

  if (fixtureId) {
    const byId = await fetchFixtures(endpoint("fixture", fixtureId));
    const fixture = byId.fixtures[0];
    if (fixture) return toLiveResult(fixture, match);
    if (byId.message) messages.push(byId.message);
  }

  const inplay = await fetchFixtures(endpoint("inplay"));
  const inplayMatch = inplay.fixtures.find((candidate) => fixtureMatchesAppMatch(candidate, match));
  if (inplayMatch) return toLiveResult(inplayMatch, match);
  if (inplay.message) messages.push(inplay.message);

  for (const date of candidateDates()) {
    const byDate = await fetchFixtures(endpoint("date", date));
    const dateMatch = byDate.fixtures.find((candidate) => fixtureMatchesAppMatch(candidate, match));
    if (dateMatch) return toLiveResult(dateMatch, match);
    if (byDate.message) messages.push(`${date}: ${byDate.message}`);
  }

  if (messages.length > 0) {
    throw new SportmonksNoFixtureError(messages[0]);
  }

  return null;
}
