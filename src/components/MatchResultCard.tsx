import type { Match } from "../models";

interface Props {
  match: Match;
  onInform: () => void;
  onEdit: () => void;
}

// Área "Resultado do jogo": estado vazio com botão, ou o placar oficial.
export function MatchResultCard({ match, onInform, onEdit }: Props) {
  const { result, homeTeam, awayTeam } = match;

  return (
    <div className="result-card">
      <div className="result-card__head">
        <p className="section-label" style={{ margin: 0 }}>
          Resultado do jogo
        </p>
        {result ? (
          <button className="btn-link" onClick={onEdit}>
            Editar resultado
          </button>
        ) : null}
      </div>

      {result ? (
        <>
          <p className="result-card__score">
            {homeTeam.name} <strong>{result.homeScore}</strong> X{" "}
            <strong>{result.awayScore}</strong> {awayTeam.name}
          </p>
          {result.updatedAt && (
            <span className="edited-tag">resultado editado</span>
          )}
        </>
      ) : (
        <>
          <p className="result-card__empty">Resultado ainda não informado.</p>
          <button className="btn btn-ghost" onClick={onInform}>
            Informar resultado
          </button>
        </>
      )}
    </div>
  );
}
