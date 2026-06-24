import type { Player, SquadMeta } from "../models";
import { MOCK_PLAYERS_BY_TEAM } from "../data/mockPlayers";

// Acesso a jogadores por seleção/time. A UI fala só com esta interface.
// Trocar mock por API real é só fornecer outra implementação (ver
// RemoteWorldCupPlayerService) e mudar a instância exportada abaixo.
export interface PlayerService {
  getPlayersByTeamId(teamId: string): Promise<Player[]>;
  searchPlayersByTeamId(teamId: string, query: string): Promise<Player[]>;
  getPlayerById(playerId: string): Promise<Player | null>;
  /** Metadado honesto do elenco para a UI (status official/pending/mock/missing). */
  getSquadMeta(teamId: string): SquadMeta;
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function haystack(p: Player): string {
  return [p.name, p.displayName, p.shirtName, p.fifaCode, ...(p.aliases ?? [])]
    .filter(Boolean)
    .map((s) => normalize(s as string))
    .join(" | ");
}

export class MockWorldCupPlayerService implements PlayerService {
  async getPlayersByTeamId(teamId: string): Promise<Player[]> {
    await new Promise((r) => setTimeout(r, 40));
    // Só jogadores confirmados no elenco da Copa entram no dropdown.
    return (MOCK_PLAYERS_BY_TEAM[teamId] ?? []).filter((p) => p.isWorldCupSquad);
  }

  async searchPlayersByTeamId(teamId: string, query: string): Promise<Player[]> {
    const players = await this.getPlayersByTeamId(teamId);
    const q = normalize(query);
    if (q === "") return players;
    return players.filter((p) => haystack(p).includes(q));
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    for (const players of Object.values(MOCK_PLAYERS_BY_TEAM)) {
      const found = players.find((p) => p.id === playerId);
      if (found) return found;
    }
    return null;
  }

  getSquadMeta(teamId: string): SquadMeta {
    const has = (MOCK_PLAYERS_BY_TEAM[teamId] ?? []).length > 0;
    return {
      teamId,
      source: has ? "mock" : null,
      sourceName: has ? "Mock data (test)" : null,
      lastVerifiedAt: null,
      verifiedBy: null,
      status: has ? "mock" : "missing",
    };
  }
}

// Provider ativo: a verdade do elenco vem do arquivo oficial/cacheado.
// (MockWorldCupPlayerService segue disponível para testes/fallback.)
export { officialWorldCupSquadService as playerService } from "./OfficialWorldCupSquadService";
