import { useEffect, useState } from "react";
import type { Team } from "../models";

interface Props {
  team: Team;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// Prioridade: crestUrl > logoUrl > flagUrl > displayIcon > iniciais.
// Se a imagem falhar, cai automaticamente para o próximo (emoji/iniciais)
// sem quebrar o layout.
export function TeamFlag({ team, className }: Props) {
  const imageUrl = team.crestUrl ?? team.logoUrl ?? team.flagUrl ?? null;
  const [failed, setFailed] = useState(false);

  // Reseta o erro quando o time/imagem muda (ex.: troca de seleção no slot).
  useEffect(() => setFailed(false), [imageUrl]);

  if (imageUrl && !failed) {
    return (
      <img
        src={imageUrl}
        alt={team.name}
        className={`team-img ${className ?? ""}`}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }

  if (team.displayIcon) {
    return (
      <span className={className} role="img" aria-label={team.name}>
        {team.displayIcon}
      </span>
    );
  }

  return (
    <span className={`team-initials ${className ?? ""}`} aria-label={team.name}>
      {initials(team.name)}
    </span>
  );
}
