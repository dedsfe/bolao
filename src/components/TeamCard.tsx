import type { Team } from "../models";
import { TeamFlag } from "./TeamFlag";

interface Props {
  team: Team;
  selected?: boolean;
  disabled?: boolean;
  onClick: (team: Team) => void;
}

// Subtítulo: Copa -> "Grupo C · CONMEBOL"; senão "Seleção" / "Clube".
function subtitle(team: Team): string {
  if (team.tournament === "world_cup_2026" && team.group) {
    return `Grupo ${team.group} · ${team.confederation}`;
  }
  return team.type === "selection" ? "Seleção" : "Clube";
}

export function TeamCard({ team, selected, disabled, onClick }: Props) {
  return (
    <button
      className={`team-card${selected ? " selected" : ""}`}
      disabled={disabled}
      onClick={() => onClick(team)}
    >
      <TeamFlag team={team} className="team-card__icon" />
      <span className="team-card__text">
        <span className="team-card__name">{team.name}</span>
        <span className="team-card__category">{subtitle(team)}</span>
      </span>
      {selected ? (
        <span className="team-card__check">✓</span>
      ) : team.fifaCode ? (
        <span className="team-card__fifa">{team.fifaCode}</span>
      ) : null}
    </button>
  );
}
