import type { MatchResult, Prediction } from "../models";
import {
  evaluatePrediction,
  type PredictionResultStatus,
} from "./calculatePredictionScore";
import { calculateScorerBonus } from "./calculateScorerBonus";

export interface RankedPrediction {
  position: number;
  prediction: Prediction;
  score: number; // pontos do placar
  scorerBonus: number; // pontos dos goleadores
  totalScore: number; // score + scorerBonus
  reason: string; // motivo do placar
  scorerReason: string; // motivo do bônus de goleadores
  matchedScorers: string[];
  totalError: number; // soma dos erros absolutos de gols (desempate)
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
      const { score, reason, status } = evaluatePrediction(prediction, result);
      const { scorerBonus, matchedScorers, reason: scorerReason } =
        calculateScorerBonus(prediction, result);
      const totalError =
        Math.abs(prediction.homeScore - result.homeScore) +
        Math.abs(prediction.awayScore - result.awayScore);
      return {
        prediction,
        score,
        scorerBonus,
        totalScore: score + scorerBonus,
        reason,
        scorerReason,
        matchedScorers,
        status,
        totalError,
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
      reason: r.reason,
      scorerReason: r.scorerReason,
      matchedScorers: r.matchedScorers,
      totalError: r.totalError,
      status: r.status,
    }));
}
