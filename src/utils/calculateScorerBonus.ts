import type { MatchResult, PredictedScorer, Prediction } from "../models";

export interface ScorerBonusResult {
  scorerBonus: number;
  matchedScorers: string[];
  reason: string;
}

const POINTS_PER_SCORER = 2;

function normalize(v: string): string {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Chave que identifica um gol (ignora "Não sei"/unknown, que nunca pontua).
function scorerKey(s: PredictedScorer): string | null {
  if (s.type === "unknown") return null;
  if (s.type === "own_goal") return "own_goal";
  return s.playerId ? `id:${s.playerId}` : `name:${normalize(s.playerName)}`;
}

function outcome(home: number, away: number): number {
  return Math.sign(home - away);
}

// Casa os goleadores previstos de um lado contra os reais. Cada gol real
// só pode ser usado uma vez; ordem do gol não importa.
function matchSide(
  predicted: PredictedScorer[],
  actual: PredictedScorer[]
): { bonus: number; matched: string[] } {
  const pool = new Map<string, number>();
  for (const s of actual) {
    const key = scorerKey(s);
    if (key) pool.set(key, (pool.get(key) ?? 0) + 1);
  }

  let bonus = 0;
  const matched: string[] = [];
  for (const p of predicted) {
    const key = scorerKey(p);
    if (!key) continue;
    const left = pool.get(key) ?? 0;
    if (left > 0) {
      pool.set(key, left - 1);
      bonus += POINTS_PER_SCORER;
      matched.push(p.playerName);
    }
  }
  return { bonus, matched };
}

// O bônus de goleadores SÓ conta se a pessoa acertou o vencedor/empate.
export function calculateScorerBonus(
  prediction: Prediction,
  result: MatchResult
): ScorerBonusResult {
  const gotOutcome =
    outcome(prediction.homeScore, prediction.awayScore) ===
    outcome(result.homeScore, result.awayScore);

  if (!gotOutcome) {
    return {
      scorerBonus: 0,
      matchedScorers: [],
      reason: "Sem bônus de goleadores porque errou o resultado",
    };
  }

  const actual = result.actualScorers;
  const predicted = prediction.predictedScorers;
  const hasRealScorers =
    !!actual &&
    (actual.home.some((s) => s.type !== "unknown") ||
      actual.away.some((s) => s.type !== "unknown"));

  if (!actual || !predicted || !hasRealScorers) {
    return {
      scorerBonus: 0,
      matchedScorers: [],
      reason: "Goleadores reais não informados",
    };
  }

  const home = matchSide(predicted.home, actual.home);
  const away = matchSide(predicted.away, actual.away);
  const scorerBonus = home.bonus + away.bonus;
  const matchedScorers = [...home.matched, ...away.matched];

  return {
    scorerBonus,
    matchedScorers,
    reason:
      scorerBonus > 0
        ? `Acertou ${matchedScorers.length} goleador${matchedScorers.length > 1 ? "es" : ""}`
        : "Nenhum goleador certo",
  };
}
