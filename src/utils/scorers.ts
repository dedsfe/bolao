import type { Player, PredictedScorer, PredictedScorers } from "../models";

let counter = 0;
function makeId(): string {
  counter += 1;
  return `sc-${Date.now().toString(36)}-${counter}`;
}

// Slot novo nasce como "Não sei" — sempre válido sem forçar escolha.
export function makeEmptyScorer(teamId: string, goalIndex: number): PredictedScorer {
  return {
    id: makeId(),
    teamId,
    playerId: null,
    playerName: "Não sei",
    goalIndex,
    type: "unknown",
  };
}

// Ajusta a lista para `count` slots, preservando as escolhas por índice.
export function resizeScorers(
  current: PredictedScorer[],
  count: number,
  teamId: string
): PredictedScorer[] {
  const next: PredictedScorer[] = [];
  for (let i = 0; i < count; i++) {
    const existing = current[i];
    next.push(
      existing
        ? { ...existing, teamId, goalIndex: i + 1 }
        : makeEmptyScorer(teamId, i + 1)
    );
  }
  return next;
}

// Converte a escolha do dropdown num PredictedScorer completo.
export function scorerFromPlayer(slot: PredictedScorer, player: Player): PredictedScorer {
  return {
    ...slot,
    playerId: player.id,
    playerName: player.displayName ?? player.name,
    type: "player",
  };
}

export function scorerUnknown(slot: PredictedScorer): PredictedScorer {
  return { ...slot, playerId: null, playerName: "Não sei", type: "unknown" };
}

export function scorerOwnGoal(slot: PredictedScorer): PredictedScorer {
  return { ...slot, playerId: null, playerName: "Gol contra", type: "own_goal" };
}

// Nomes para exibir/resumo: ignora os "Não sei" (unknown).
export function namedScorers(list: PredictedScorer[] | undefined): string[] {
  return (list ?? []).filter((s) => s.type !== "unknown").map((s) => s.playerName);
}

export function hasAnyNamedScorer(scorers: PredictedScorers | undefined): boolean {
  if (!scorers) return false;
  return namedScorers(scorers.home).length > 0 || namedScorers(scorers.away).length > 0;
}
