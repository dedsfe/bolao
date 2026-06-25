import type { Match, MatchResult } from "../models";
import { rankPredictions } from "../utils/rankPredictions";
import { statusLabel } from "../utils/calculatePredictionScore";

interface Props {
  match: Match;
  result: MatchResult;
}

const pts = (n: number) => `${n} ${n === 1 ? "pt" : "pts"}`;

export function RankingList({ match, result }: Props) {
  const ranked = rankPredictions(match.predictions, result);
  const { homeTeam, awayTeam } = match;

  if (ranked.length === 0) {
    return <p className="empty">Nenhum palpite para ranquear.</p>;
  }

  return (
    <div className="ranking-list">
      {ranked.map((r) => (
        <div key={r.prediction.id} className={`rank-card rank-card--${r.status}`}>
          <span className="rank-card__pos">{r.position}</span>

          <div className="rank-card__body">
            <div className="rank-card__head">
              <span className="rank-card__name">{r.prediction.personName}</span>
              <span className="rank-card__pts">+{pts(r.totalScore)}</span>
            </div>

            {/* placar separado dos goleadores */}
            <span className="rank-card__breakdown">
              Placar: +{r.score} · Goleadores: +{r.scorerBonus}
            </span>

            <span className="rank-card__palpite">
              {homeTeam.name} {r.prediction.homeScore} X {r.prediction.awayScore}{" "}
              {awayTeam.name}
            </span>

            <div className="rank-card__statusline">
              <span className={`status-badge status-badge--${r.status}`}>
                {statusLabel(r.status)}
              </span>
              <span className="rank-card__reason">{r.reasons.join(" · ")}</span>
            </div>

            {r.matchedScorers.length > 0 && (
              <span className="rank-card__matched">
                Goleadores certos: {r.matchedScorers.join(", ")}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
