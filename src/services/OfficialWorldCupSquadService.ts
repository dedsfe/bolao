import type { Player, SquadMeta, SquadSource, SquadStatus } from "../models";
import type { PlayerService } from "./PlayerService";
import squadsFile from "../data/worldCupSquads2026.json";

interface SquadEntry {
  teamId: string;
  source: SquadSource;
  sourceName: string;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  players: Player[];
}

const ENTRIES = squadsFile as unknown as SquadEntry[];
const BY_TEAM: Record<string, SquadEntry> = Object.fromEntries(
  ENTRIES.map((e) => [e.teamId, e])
);

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function haystack(p: Player): string {
  return [p.name, p.displayName, p.shirtName, p.fifaCode, ...(p.aliases ?? [])]
    .filter(Boolean)
    .map((s) => normalize(s as string))
    .join(" | ");
}

// Decide o status HONESTO do elenco. Dado plausível (seed) ou importado
// mas sem verificação (lastVerifiedAt null) NÃO conta como oficial.
function resolveStatus(entry: SquadEntry | undefined): SquadStatus {
  if (!entry) return "missing";
  if (entry.source === "mock") return "mock";
  if (entry.source === "official_import" && entry.lastVerifiedAt) return "official";
  return "pending_verification"; // seed, api_enriched, ou official sem verificação
}

// Provider baseado no arquivo oficial/cacheado (worldCupSquads2026.json).
// O enriquecimento futuro (foto, clube) virá do RemoteWorldCupPlayerService,
// mas a lista de convocados continua vindo daqui.
export class OfficialWorldCupSquadService implements PlayerService {
  // Só convocados confirmados entram no dropdown principal.
  async getPlayersByTeamId(teamId: string): Promise<Player[]> {
    return (BY_TEAM[teamId]?.players ?? []).filter((p) => p.isWorldCupSquad);
  }

  async searchPlayersByTeamId(teamId: string, query: string): Promise<Player[]> {
    const players = await this.getPlayersByTeamId(teamId);
    const q = normalize(query);
    if (q === "") return players;
    return players.filter((p) => haystack(p).includes(q));
  }

  async getPlayerById(playerId: string): Promise<Player | null> {
    for (const entry of ENTRIES) {
      const found = entry.players.find((p) => p.id === playerId);
      if (found) return found;
    }
    return null;
  }

  getSquadMeta(teamId: string): SquadMeta {
    const entry = BY_TEAM[teamId];
    return {
      teamId,
      source: entry?.source ?? null,
      sourceName: entry?.sourceName ?? null,
      lastVerifiedAt: entry?.lastVerifiedAt ?? null,
      verifiedBy: entry?.verifiedBy ?? null,
      status: resolveStatus(entry),
    };
  }
}

export const officialWorldCupSquadService = new OfficialWorldCupSquadService();
