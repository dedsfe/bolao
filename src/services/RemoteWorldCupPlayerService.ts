import type { Player, SquadMeta } from "../models";
import type { PlayerService } from "./PlayerService";

// Placeholder do provider REAL de elencos da Copa 2026.
// Implementa a MESMA interface PlayerService — quando houver fonte oficial,
// preencher os fetch abaixo e trocar a instância em PlayerService.ts.
//
// Prioridade de fonte recomendada (do mais confiável ao fallback):
//   1. FIFA / SquadLists oficiais (fonte oficial do elenco da Copa).
//   2. API-Football (players/squads) — requer chave de API.
//   3. Sportmonks (squads) — requer chave de API.
//   4. TheSportsDB — APENAS fallback visual (fotos), nunca fonte oficial.
//
// Regra: só retornar/aceitar jogadores com isWorldCupSquad: true no
// dropdown principal. Jogadores fora da lista oficial ficam ocultos por
// padrão (no futuro, eventualmente, numa seção "Fora da lista oficial").
export class RemoteWorldCupPlayerService implements PlayerService {
  constructor(private readonly config: { baseUrl: string; apiKey?: string }) {}

  async getPlayersByTeamId(teamId: string): Promise<Player[]> {
    // TODO: fetch(`${this.config.baseUrl}/squads?team=${teamId}`) -> mapear p/ Player
    throw new Error(`getPlayersByTeamId não implementado (${this.config.baseUrl}, team=${teamId})`);
  }

  async searchPlayersByTeamId(teamId: string, query: string): Promise<Player[]> {
    // TODO: buscar no endpoint da API ou filtrar localmente o squad do time.
    throw new Error(`searchPlayersByTeamId não implementado (team=${teamId}, q=${query})`);
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    // TODO: fetch(`${this.config.baseUrl}/players/${playerId}`)
    throw new Error(`getPlayerById não implementado (${playerId})`);
  }

  // A verdade da convocação NÃO vem da API: o status oficial continua sendo
  // resolvido pelo arquivo (OfficialWorldCupSquadService). Aqui é só enriquecimento.
  getSquadMeta(teamId: string): SquadMeta {
    return {
      teamId,
      source: "api_enriched",
      sourceName: this.config.baseUrl,
      lastVerifiedAt: null,
      verifiedBy: null,
      status: "pending_verification",
    };
  }
}
