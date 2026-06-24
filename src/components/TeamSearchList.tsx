import { useEffect, useState } from "react";
import type { Team, TeamCategory } from "../models";
import { teamService } from "../services/TeamService";
import { TeamCard } from "./TeamCard";

interface Props {
  /** id do time selecionado neste lado (marca o card). */
  selectedId?: string;
  /** id do time já usado no outro lado (desabilita o card). */
  blockedId?: string;
  onPick: (team: Team) => void;
}

const FILTERS: { key: TeamCategory; label: string }[] = [
  { key: "world_cup_2026", label: "Copa 2026" },
  { key: "selection", label: "Seleções" },
  { key: "club", label: "Clubes" },
  { key: "all", label: "Todos" },
];

// Busca + filtro por categoria + lista. Não conhece o mock:
// conversa só com o teamService (trocável por API depois).
export function TeamSearchList({ selectedId, blockedId, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<TeamCategory>("world_cup_2026");
  const [results, setResults] = useState<Team[]>([]);

  useEffect(() => {
    let active = true;
    teamService.searchTeams({ query, category }).then((teams) => {
      if (active) setResults(teams);
    });
    return () => {
      active = false;
    };
  }, [query, category]);

  return (
    <div className="search-list">
      <input
        className="input search-input"
        placeholder="Buscar time ou seleção…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="segmented">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`segmented__item${category === f.key ? " active" : ""}`}
            onClick={() => setCategory(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="cards">
        {results.length === 0 ? (
          <p className="empty">Nenhum time encontrado.</p>
        ) : (
          results.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              selected={team.id === selectedId}
              disabled={team.id === blockedId}
              onClick={onPick}
            />
          ))
        )}
      </div>
    </div>
  );
}
