import type { Match, Prediction } from "../models";
import { PredictionRow } from "./PredictionRow";
import { EmptyPredictionsState } from "./EmptyPredictionsState";

interface Props {
  predictions: Prediction[];
  match: Match;
  locked?: boolean;
  onEdit: (prediction: Prediction) => void;
}

export function PredictionList({ predictions, match, locked, onEdit }: Props) {
  if (predictions.length === 0) {
    return <EmptyPredictionsState />;
  }

  return (
    <div className="prediction-list">
      {predictions.map((p) => (
        <PredictionRow
          key={p.id}
          prediction={p}
          match={match}
          locked={locked}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
}
