import type { Team, TeamCategory } from "../models";
import { WORLD_CUP_2026_TEAMS } from "../data/worldCup2026Teams";
import { MOCK_CLUB_TEAMS } from "../data/mockClubTeams";

export interface SearchTeamsParams {
  query?: string;
  category?: TeamCategory;
}

// Camada de acesso a dados de times/seleções.
// A UI fala SÓ com esta interface — não conhece a origem dos dados.
// Para plugar API real depois: crie um RemoteTeamService que implemente
// TeamService e troque a instância exportada em `teamService`.
export interface TeamService {
  getTeams(): Promise<Team[]>;
  searchTeams(params: SearchTeamsParams): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | null>;
}

// remove acentos e baixa caixa para a busca casar "São" com "sao", etc.
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

// Tudo num índice só. Ordem padrão: Copa 2026 primeiro, depois clubes.
const ALL_TEAMS: Team[] = [...WORLD_CUP_2026_TEAMS, ...MOCK_CLUB_TEAMS];

// Peso de ordenação: seleções da Copa (0) < outras seleções (1) < clubes (2).
function sortWeight(team: Team): number {
  if (team.tournament === "world_cup_2026") return 0;
  if (team.type === "selection") return 1;
  return 2;
}

function matchesCategory(team: Team, category: TeamCategory): boolean {
  switch (category) {
    case "all":
      return true;
    case "world_cup_2026":
      return team.tournament === "world_cup_2026";
    case "selection":
      return team.type === "selection";
    case "club":
      return team.type === "club";
  }
}

// Texto pesquisável: nome, shortName, fifaName, fifaCode, aliases,
// "grupo X" e confederação. Tudo normalizado.
function haystack(team: Team): string {
  const parts = [
    team.name,
    team.shortName,
    team.fifaName,
    team.fifaCode,
    team.confederation,
    team.group ? `grupo ${team.group}` : "",
    ...(team.aliases ?? []),
  ];
  return parts.filter(Boolean).map((p) => normalize(p as string)).join(" | ");
}

class MockTeamService implements TeamService {
  async getTeams(): Promise<Team[]> {
    await new Promise((r) => setTimeout(r, 100));
    return [...ALL_TEAMS];
  }

  async searchTeams({ query = "", category = "world_cup_2026" }: SearchTeamsParams): Promise<Team[]> {
    await new Promise((r) => setTimeout(r, 60));
    const q = normalize(query);
    return ALL_TEAMS.filter(
      (team) => matchesCategory(team, category) && (q === "" || haystack(team).includes(q))
    ).sort((a, b) => sortWeight(a) - sortWeight(b));
  }

  async getTeamById(id: string): Promise<Team | null> {
    return ALL_TEAMS.find((team) => team.id === id) ?? null;
  }
}

// Ponto único de troca mock -> API real.
export const teamService: TeamService = new MockTeamService();
