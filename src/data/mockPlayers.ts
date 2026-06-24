import type { Player } from "../models";

// ⚠️ MOCK PROVISÓRIO — só Brasil e Argentina, o suficiente para validar a UI.
// O provider REAL (ver RemoteWorldCupPlayerService) deve usar os squads
// OFICIAIS da Copa 2026 (FIFA SquadLists / API-Football / Sportmonks) e
// marcar cada jogador com isWorldCupSquad: true.

interface PlayerSeed {
  slug: string;
  name: string;
  displayName: string;
  position: Player["position"];
  shirtNumber: number;
  aliases?: string[];
}

function buildSquad(
  teamId: string,
  teamName: string,
  countryCode: string,
  fifaCode: string,
  prefix: string,
  seeds: PlayerSeed[]
): Player[] {
  return seeds.map((s) => ({
    id: `player-${prefix}-${s.slug}`,
    name: s.name,
    displayName: s.displayName,
    shirtName: s.displayName,
    teamId,
    teamName,
    countryCode,
    fifaCode,
    position: s.position,
    shirtNumber: s.shirtNumber,
    source: "mock",
    isWorldCupSquad: true,
    aliases: s.aliases,
  }));
}

const BRAZIL: Player[] = buildSquad(
  "selection-brazil",
  "Brasil",
  "BR",
  "BRA",
  "bra",
  [
    { slug: "alisson", name: "Alisson Becker", displayName: "Alisson", position: "GK", shirtNumber: 1 },
    { slug: "marquinhos", name: "Marcos Aoás (Marquinhos)", displayName: "Marquinhos", position: "DEF", shirtNumber: 4 },
    { slug: "casemiro", name: "Carlos Henrique Casimiro", displayName: "Casemiro", position: "MID", shirtNumber: 5 },
    { slug: "vini-jr", name: "Vinícius Júnior", displayName: "Vini Jr", position: "FWD", shirtNumber: 7, aliases: ["Vinicius", "Vini"] },
    { slug: "endrick", name: "Endrick Felipe", displayName: "Endrick", position: "FWD", shirtNumber: 9 },
    { slug: "neymar", name: "Neymar Jr", displayName: "Neymar", position: "FWD", shirtNumber: 10 },
    { slug: "rodrygo", name: "Rodrygo Goes", displayName: "Rodrygo", position: "FWD", shirtNumber: 11 },
    { slug: "raphinha", name: "Raphael Dias (Raphinha)", displayName: "Raphinha", position: "FWD", shirtNumber: 19 },
  ]
);

const ARGENTINA: Player[] = buildSquad(
  "selection-argentina",
  "Argentina",
  "AR",
  "ARG",
  "arg",
  [
    { slug: "messi", name: "Lionel Messi", displayName: "Lionel Messi", position: "FWD", shirtNumber: 10, aliases: ["Messi", "La Pulga"] },
    { slug: "julian-alvarez", name: "Julián Álvarez", displayName: "Julián Álvarez", position: "FWD", shirtNumber: 9, aliases: ["Julian Alvarez"] },
    { slug: "lautaro", name: "Lautaro Martínez", displayName: "Lautaro Martínez", position: "FWD", shirtNumber: 22, aliases: ["Lautaro"] },
    { slug: "di-maria", name: "Ángel Di María", displayName: "Di María", position: "FWD", shirtNumber: 11, aliases: ["Di Maria"] },
    { slug: "enzo", name: "Enzo Fernández", displayName: "Enzo Fernández", position: "MID", shirtNumber: 24, aliases: ["Enzo"] },
    { slug: "de-paul", name: "Rodrigo De Paul", displayName: "De Paul", position: "MID", shirtNumber: 7 },
    { slug: "romero", name: "Cristian Romero", displayName: "Cuti Romero", position: "DEF", shirtNumber: 13, aliases: ["Romero"] },
    { slug: "dibu", name: "Emiliano Martínez", displayName: "Dibu Martínez", position: "GK", shirtNumber: 23, aliases: ["Emiliano Martinez"] },
  ]
);

// Índice por teamId. Times sem mock retornam [] (dropdown só com Não sei/Gol contra).
export const MOCK_PLAYERS_BY_TEAM: Record<string, Player[]> = {
  "selection-brazil": BRAZIL,
  "selection-argentina": ARGENTINA,
};
