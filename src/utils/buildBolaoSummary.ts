import type { Match, Prediction } from "../models";
import { rankPredictions } from "./rankPredictions";
import { statusLabel } from "./calculatePredictionScore";
import { namedScorers } from "./scorers";

// Linhas de goleadores PREVISTOS de um palpite (indentadas), se houver.
function predictedScorerLines(prediction: Prediction, match: Match, indent: string): string[] {
  const home = namedScorers(prediction.predictedScorers?.home);
  const away = namedScorers(prediction.predictedScorers?.away);
  if (home.length === 0 && away.length === 0) return [];
  const lines = [`${indent}Goleadores:`];
  if (home.length > 0) lines.push(`${indent}${match.homeTeam.name}: ${home.join(", ")}`);
  if (away.length > 0) lines.push(`${indent}${match.awayTeam.name}: ${away.join(", ")}`);
  return lines;
}

export function buildBolaoSummary(match: Match): string {
  const { homeTeam, awayTeam, predictions, result } = match;
  const lines: string[] = [];

  lines.push(`Bolão: ${homeTeam.name} X ${awayTeam.name}`);
  lines.push("");

  if (result) {
    lines.push(
      `Resultado: ${homeTeam.name} ${result.homeScore} X ${result.awayScore} ${awayTeam.name}`
    );

    // Goleadores REAIS, se informados.
    const realHome = namedScorers(result.actualScorers?.home);
    const realAway = namedScorers(result.actualScorers?.away);
    if (realHome.length > 0 || realAway.length > 0) {
      lines.push("Goleadores reais:");
      if (realHome.length > 0) lines.push(`${homeTeam.name}: ${realHome.join(", ")}`);
      if (realAway.length > 0) lines.push(`${awayTeam.name}: ${realAway.join(", ")}`);
    }
    lines.push("");

    if (predictions.length > 0) {
      lines.push("Ranking:");
      lines.push("");
      for (const r of rankPredictions(predictions, result)) {
        lines.push(
          `${r.position}. ${r.prediction.personName} — +${r.totalScore} pts — placar +${r.score} — goleadores +${r.scorerBonus} — ${homeTeam.name} ${r.prediction.homeScore} X ${r.prediction.awayScore} ${awayTeam.name} — ${statusLabel(r.status)}`
        );
        if (r.matchedScorers.length > 0) {
          lines.push(`   Goleadores certos: ${r.matchedScorers.join(", ")}`);
        }
      }
    }
  } else if (predictions.length > 0) {
    lines.push("Palpites:");
    for (const p of predictions) {
      lines.push(
        `${p.personName} — ${homeTeam.name} ${p.homeScore} X ${p.awayScore} ${awayTeam.name}`
      );
      lines.push(...predictedScorerLines(p, match, "  "));
    }
  }

  return lines.join("\n").trim();
}
