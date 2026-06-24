import type { Match, Prediction } from "../models";
import { namedScorers } from "../utils/scorers";

interface Props {
  prediction: Prediction;
  match: Match;
  /** Quando há resultado, a edição fica bloqueada (não mostra "Editar"). */
  locked?: boolean;
  onEdit: (prediction: Prediction) => void;
}

// André · Brasil 2 X 1 Argentina
//                                  Editar
// Goleadores:
//   Brasil: Vini Jr, Neymar
//   Argentina: Messi
export function PredictionRow({ prediction, match, locked, onEdit }: Props) {
  const { homeTeam, awayTeam } = match;
  const home = namedScorers(prediction.predictedScorers?.home);
  const away = namedScorers(prediction.predictedScorers?.away);
  const showScorers = home.length > 0 || away.length > 0;

  return (
    <div className="guess-row">
      <div className="guess-row__head">
        <span className="guess-row__main">
          <strong>{prediction.personName}</strong> · {homeTeam.name}{" "}
          {prediction.homeScore} X {prediction.awayScore} {awayTeam.name}
          {prediction.updatedAt && <span className="edited-tag">editado</span>}
        </span>
        {!locked && (
          <button className="btn-link" onClick={() => onEdit(prediction)}>
            Editar
          </button>
        )}
      </div>

      {showScorers && (
        <div className="guess-row__scorers">
          <span className="guess-row__scorers-label">Goleadores:</span>
          {home.length > 0 && (
            <span className="guess-row__scorer-line">
              {homeTeam.name}: {home.join(", ")}
            </span>
          )}
          {away.length > 0 && (
            <span className="guess-row__scorer-line">
              {awayTeam.name}: {away.join(", ")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
