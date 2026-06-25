import type { MatchResult, Prediction } from "../models";

// Estado visual do palpite depois do resultado oficial.
export type PredictionResultStatus = "exact" | "partial" | "eliminated";

export interface ScoreBreakdownItem {
  label: string;
  points: number;
  hit: boolean; // true = acertou, false = errou
}

export interface PredictionScore {
  score: number;
  reasons: string[];
  breakdown: ScoreBreakdownItem[];
  status: PredictionResultStatus;
}

const outcome = (home: number, away: number) => Math.sign(home - away);

// ──────────────────────────────────────────────────────────
// Sistema ADITIVO de pontuação — cada acerto soma separadamente:
//
//   +3  Acertou o vencedor (ou empate)
//   +1  Acertou os gols do time da casa
//   +1  Acertou os gols do visitante
//   +1  Acertou a diferença de gols
//   +3  Bônus: placar exato (cumulativo com os acima = 9 do placar)
//
// Se errou o vencedor/empate → 0 pontos de placar.
// ──────────────────────────────────────────────────────────
export function evaluatePrediction(
  prediction: Prediction,
  result: MatchResult
): PredictionScore {
  const sameOutcome =
    outcome(prediction.homeScore, prediction.awayScore) ===
    outcome(result.homeScore, result.awayScore);

  if (!sameOutcome) {
    const breakdown: ScoreBreakdownItem[] = [
      { label: "Vencedor", points: 0, hit: false },
      { label: "Gols da casa", points: 0, hit: false },
      { label: "Gols do visitante", points: 0, hit: false },
      { label: "Diferença de gols", points: 0, hit: false },
      { label: "Placar exato", points: 0, hit: false },
    ];
    return { score: 0, reasons: ["Não pontuou"], breakdown, status: "eliminated" };
  }

  let score = 3; // acertou vencedor/empate
  const reasons: string[] = ["Acertou vencedor (+3)"];

  const homeRight = prediction.homeScore === result.homeScore;
  const awayRight = prediction.awayScore === result.awayScore;
  const diffRight =
    prediction.homeScore - prediction.awayScore ===
    result.homeScore - result.awayScore;

  if (homeRight) {
    score += 1;
    reasons.push("Gols da casa certos (+1)");
  }
  if (awayRight) {
    score += 1;
    reasons.push("Gols do visitante certos (+1)");
  }
  if (diffRight) {
    score += 1;
    reasons.push("Diferença de gols certa (+1)");
  }

  const exact = homeRight && awayRight;
  if (exact) {
    score += 3;
    reasons.push("Placar exato (+3)");
  }

  const breakdown: ScoreBreakdownItem[] = [
    { label: "Vencedor", points: 3, hit: true },
    { label: "Gols da casa", points: homeRight ? 1 : 0, hit: homeRight },
    { label: "Gols do visitante", points: awayRight ? 1 : 0, hit: awayRight },
    { label: "Diferença de gols", points: diffRight ? 1 : 0, hit: diffRight },
    { label: "Placar exato", points: exact ? 3 : 0, hit: exact },
  ];

  return { score, reasons, breakdown, status: exact ? "exact" : "partial" };
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
