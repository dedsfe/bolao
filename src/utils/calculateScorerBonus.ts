import type { MatchResult, PredictedScorer, Prediction } from "../models";

export interface ScorerBonusResult {
  scorerBonus: number;
  matchedScorers: string[];
  reason: string;
}

const POINTS_PER_SCORER = 1;

function normalize(v: string): string {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Compara dois nomes normalizados por similaridade de tokens.
// Resolve o problema de "Vini Jr" vs "Vinícius Júnior" e "McTominay" vs "Scott McTominay"
function matchesName(a: string, b: string): boolean {
  const nA = normalize(a);
  const nB = normalize(b);
  if (nA === nB) return true;

  // Quebra em tokens significativos (>= 4 letras)
  const tokensA = nA.split(/\s+/).filter(t => t.length >= 4);
  const tokensB = nB.split(/\s+/).filter(t => t.length >= 4);

  for (const ta of tokensA) {
    for (const tb of tokensB) {
      if (ta === tb || ta.startsWith(tb) || tb.startsWith(ta)) {
        return true;
      }
    }
  }

  return false;
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
  const availableActual = [...actual].filter((s) => s.type !== "unknown");
  let bonus = 0;
  const matched: string[] = [];

  for (const p of predicted) {
    if (p.type === "unknown") continue;

    const matchIndex = availableActual.findIndex((a) => {
      if (p.type === "own_goal" && a.type === "own_goal") return true;
      if (p.type === "own_goal" || a.type === "own_goal") return false;

      const sameId = p.playerId && a.playerId && p.playerId === a.playerId;
      return sameId || matchesName(p.playerName, a.playerName);
    });

    if (matchIndex >= 0) {
      availableActual.splice(matchIndex, 1);
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
