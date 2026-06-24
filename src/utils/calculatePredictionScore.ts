import type { MatchResult, Prediction } from "../models";

// Estado visual do palpite depois do resultado oficial.
export type PredictionResultStatus = "exact" | "partial" | "eliminated";

export interface PredictionScore {
  score: number;
  reason: string;
  status: PredictionResultStatus;
}

const outcome = (home: number, away: number) => Math.sign(home - away);

// Escolhe a MELHOR categoria, sem somar pontos:
//   5 — placar exato
//   3 — acertou vencedor/empate e a diferença de gols
//   2 — acertou vencedor/empate e os gols exatos de um dos lados
//   1 — acertou apenas o vencedor/empate
//   0 — errou o resultado geral
export function evaluatePrediction(
  prediction: Prediction,
  result: MatchResult
): PredictionScore {
  const exact =
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore;
  if (exact) {
    return { score: 5, reason: "Placar exato", status: "exact" };
  }

  const sameOutcome =
    outcome(prediction.homeScore, prediction.awayScore) ===
    outcome(result.homeScore, result.awayScore);
  if (!sameOutcome) {
    return { score: 0, reason: "Não pontuou", status: "eliminated" };
  }

  const sameDiff =
    prediction.homeScore - prediction.awayScore ===
    result.homeScore - result.awayScore;
  if (sameDiff) {
    return {
      score: 3,
      reason: "Acertou o resultado e a diferença de gols",
      status: "partial",
    };
  }

  const oneSide =
    prediction.homeScore === result.homeScore ||
    prediction.awayScore === result.awayScore;
  if (oneSide) {
    return {
      score: 2,
      reason: "Acertou o resultado e os gols de um dos lados",
      status: "partial",
    };
  }

  return { score: 1, reason: "Acertou apenas o vencedor", status: "partial" };
}

// Atalho quando só interessa o número (lista simples, etc.).
export function calculatePredictionScore(
  prediction: Prediction,
  result: MatchResult
): number {
  return evaluatePrediction(prediction, result).score;
}

// Label curta do badge por status.
export function statusLabel(status: PredictionResultStatus): string {
  switch (status) {
    case "exact":
      return "Cravou";
    case "partial":
      return "Acertou vencedor";
    case "eliminated":
      return "Eliminado";
  }
}
