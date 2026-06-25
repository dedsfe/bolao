import type { MatchResult, Prediction } from "../models";
import {
  evaluatePrediction,
  type PredictionResultStatus,
  type ScoreBreakdownItem,
} from "./calculatePredictionScore";
import { calculateScorerBonus } from "./calculateScorerBonus";

export interface RankedPrediction {
  position: number;
  prediction: Prediction;
  score: number; // pontos do placar
  scorerBonus: number; // pontos dos goleadores
  totalScore: number; // score + scorerBonus
  reasons: string[]; // motivos do placar (sistema aditivo)
  breakdown: ScoreBreakdownItem[]; // detalhamento hit/miss de cada categoria
  scorerReason: string; // motivo do bônus de goleadores
  matchedScorers: string[];
  totalError: number; // soma dos erros absolutos de gols (desempate)
  maxPossible: number; // pontuação máxima teórica do palpite
  status: PredictionResultStatus; // cor do card — sempre baseada no PLACAR
}

// Ordena por: totalScore desc, score desc, scorerBonus desc, menor erro,
// e por fim ordem de criação (sort estável).
export function rankPredictions(
  predictions: Prediction[],
  result: MatchResult
): RankedPrediction[] {
  return predictions
    .map((prediction, index) => {
      const { score, reasons, breakdown, status } = evaluatePrediction(prediction, result);
      const { scorerBonus, matchedScorers, reason: scorerReason } =
        calculateScorerBonus(prediction, result);
      const totalError =
        Math.abs(prediction.homeScore - result.homeScore) +
        Math.abs(prediction.awayScore - result.awayScore);

      const scorerMax = prediction.predictedScorers
        ? [
            ...prediction.predictedScorers.home,
            ...prediction.predictedScorers.away,
          ].filter((s) => s.type !== "unknown").length
        : 0;
      const maxPossible = 9 + scorerMax;

      return {
        prediction,
        score,
        scorerBonus,
        totalScore: score + scorerBonus,
        reasons,
        breakdown,
        scorerReason,
        matchedScorers,
        status,
        totalError,
        maxPossible,
        index,
      };
    })
    .sort(
      (a, b) =>
        b.totalScore - a.totalScore ||
        b.score - a.score ||
        b.scorerBonus - a.scorerBonus ||
        a.totalError - b.totalError ||
        a.index - b.index
    )
    .map((r, i) => ({
      position: i + 1,
      prediction: r.prediction,
      score: r.score,
      scorerBonus: r.scorerBonus,
      totalScore: r.totalScore,
      reasons: r.reasons,
      breakdown: r.breakdown,
      scorerReason: r.scorerReason,
      matchedScorers: r.matchedScorers,
      totalError: r.totalError,
      maxPossible: r.maxPossible,
      status: r.status,
    }));
}
