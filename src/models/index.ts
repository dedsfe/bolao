// Modelos de domínio — independentes da UI e da fonte de dados.
// Quando entrar a API real, basta o TeamService devolver objetos Team
// neste mesmo formato (ou mapear para ele).

export type TeamType = "selection" | "club";

export type Tournament = "world_cup_2026";

export type Group =
  | "A" | "B" | "C" | "D" | "E" | "F"
  | "G" | "H" | "I" | "J" | "K" | "L";

export type Confederation =
  | "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";

export interface Team {
  id: string;
  name: string;
  shortName?: string;
  fifaName?: string;
  type: TeamType;
  tournament?: Tournament | null;
  group?: Group;
  confederation?: Confederation;
  /** ISO 3166-1 alpha-2 quando existir. Ex.: "BR". */
  countryCode?: string;
  /** Código usado para gerar a bandeira (inclui casos como "gb-eng"). */
  flagCode?: string;
  fifaCode?: string;
  /** Emoji — fallback visual quando a imagem não carrega. */
  displayIcon?: string;
  /** Bandeira (imagem real). Gerada via getFlagUrl a partir do flagCode. */
  flagUrl?: string;
  /** Escudo/logo do clube — preparado para o futuro, null por enquanto. */
  logoUrl?: string | null;
  /** Brasão oficial — preparado para o futuro, null por enquanto. */
  crestUrl?: string | null;
  /** Apelidos/variações para a busca. */
  aliases?: string[];
}

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD" | "UNKNOWN";

export type PlayerSource =
  | "fifa"
  | "api-football"
  | "sportmonks"
  | "mock"
  | "official_import" // importado/verificado da lista oficial FIFA
  | "seed" // dado inicial plausível (NÃO é oficial)
  | "api_enriched"; // enriquecido por API (não é fonte da convocação)

// Origem declarada de um elenco no worldCupSquads2026.json.
export type SquadSource = "official_import" | "seed" | "mock" | "api_enriched";

// Estado honesto exibido na UI.
export type SquadStatus = "official" | "pending_verification" | "mock" | "missing";

export interface SquadMeta {
  teamId: string;
  source: SquadSource | null;
  sourceName: string | null;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  status: SquadStatus;
}

export interface Player {
  id: string;
  name: string;
  displayName?: string;
  shirtName?: string;
  teamId: string;
  teamName?: string;
  countryCode?: string;
  fifaCode?: string;
  position?: PlayerPosition;
  shirtNumber?: number;
  photoUrl?: string;
  source?: PlayerSource;
  /** Só jogadores confirmados no elenco da Copa entram no dropdown principal. */
  isWorldCupSquad?: boolean;
  aliases?: string[];
}

export type ScorerType = "player" | "unknown" | "own_goal";

// Um gol previsto no palpite (1 por gol do placar).
export interface PredictedScorer {
  id: string;
  teamId: string;
  playerId: string | null;
  playerName: string;
  goalIndex: number; // 1-based
  type: ScorerType;
}

export interface PredictedScorers {
  home: PredictedScorer[];
  away: PredictedScorer[];
}

// Goleador real do jogo — mesma forma do PredictedScorer.
export type ActualScorer = PredictedScorer;

export interface ActualScorers {
  home: ActualScorer[];
  away: ActualScorer[];
}

export interface Prediction {
  id: string;
  personName: string;
  homeScore: number;
  awayScore: number;
  predictedScorers?: PredictedScorers;
  locked: boolean;
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date — preenchido quando editar (Parte 4)
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  actualScorers?: ActualScorers; // quem realmente fez os gols
  createdAt: string; // ISO date
  updatedAt?: string; // ISO date — preenchido ao editar o resultado
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  predictions: Prediction[];
  locked: boolean;
  createdAt: string; // ISO date
  result?: MatchResult; // resultado oficial do jogo, quando informado
}

// Categoria usada no filtro da tela de seleção.
export type TeamCategory = "all" | "world_cup_2026" | "selection" | "club";
