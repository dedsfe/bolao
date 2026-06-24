import type { Player, PredictedScorer, SquadStatus, Team } from "../models";
import { PlayerScorerSelect } from "./PlayerScorerSelect";

export type ScorerMode = "predicted" | "actual";

// Texto honesto do selo conforme o status do elenco.
const SQUAD_STATUS_LABEL: Record<SquadStatus, string> = {
  official: "Elenco oficial",
  pending_verification: "Dados iniciais — aguardando verificação oficial",
  mock: "Dados de teste",
  missing: "Elenco oficial ainda não carregado para esta seleção.",
};

interface Props {
  team: Team;
  players: Player[];
  scorers: PredictedScorer[];
  squadStatus: SquadStatus;
  mode: ScorerMode;
  onChangeScorer: (index: number, scorer: PredictedScorer) => void;
}

// Bloco de goleadores de um lado, reutilizado no palpite (predicted)
// e no resultado oficial (actual). A diferença é só o tempo verbal.
export function ScorerSlots({ team, players, scorers, squadStatus, mode, onChangeScorer }: Props) {
  if (scorers.length === 0) {
    const empty =
      mode === "actual"
        ? `Sem gols para ${team.name}.`
        : `Sem gols previstos para ${team.name}.`;
    return <p className="scorer-block__empty">{empty}</p>;
  }

  const title =
    mode === "actual"
      ? `Quem fez os gols de ${team.name}?`
      : `Quem faz os gols de ${team.name}?`;

  return (
    <div className="scorer-block">
      <p className="scorer-block__title">{title}</p>
      <p className={`squad-status squad-status--${squadStatus}`}>
        {SQUAD_STATUS_LABEL[squadStatus]}
      </p>
      {scorers.map((scorer, i) => (
        <PlayerScorerSelect
          key={scorer.id}
          team={team}
          players={players}
          value={scorer}
          goalIndex={i + 1}
          onChange={(s) => onChangeScorer(i, s)}
        />
      ))}
    </div>
  );
}
