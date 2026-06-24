import { useMemo, useState } from "react";
import type { Player, PredictedScorer, Team } from "../models";
import { scorerFromPlayer, scorerOwnGoal, scorerUnknown } from "../utils/scorers";

interface Props {
  team: Team;
  players: Player[];
  value: PredictedScorer;
  goalIndex: number;
  onChange: (scorer: PredictedScorer) => void;
}

function normalize(v: string): string {
  return v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function PlayerAvatar({ player }: { player: Player }) {
  if (player.photoUrl) {
    return <img className="player-avatar" src={player.photoUrl} alt={player.displayName ?? player.name} />;
  }
  return <span className="player-avatar player-avatar--initials">{initials(player.displayName ?? player.name)}</span>;
}

function playerMeta(player: Player): string {
  return [player.position, player.shirtNumber ? `#${player.shirtNumber}` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function PlayerScorerSelect({ team, players, value, goalIndex, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (q === "") return players;
    return players.filter((p) =>
      [p.name, p.displayName, p.shirtName, ...(p.aliases ?? [])]
        .filter(Boolean)
        .some((s) => normalize(s as string).includes(q))
    );
  }, [players, query]);

  function pick(scorer: PredictedScorer) {
    onChange(scorer);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="scorer-select">
      <span className="scorer-select__label">Gol {goalIndex}</span>

      <button
        type="button"
        className={`scorer-select__trigger${value.type === "player" ? " has-player" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="scorer-select__value">{value.playerName}</span>
        <span className="scorer-select__caret">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="scorer-select__panel">
          {players.length > 3 && (
            <input
              className="input scorer-select__search"
              placeholder={`Buscar jogador de ${team.name}…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          )}

          <button type="button" className="scorer-option" onClick={() => pick(scorerUnknown(value))}>
            <span className="scorer-option__name">Não sei</span>
          </button>
          <button type="button" className="scorer-option" onClick={() => pick(scorerOwnGoal(value))}>
            <span className="scorer-option__name">Gol contra</span>
          </button>

          <div className="scorer-option__divider" />

          {filtered.length === 0 ? (
            <p className="scorer-option__empty">Nenhum jogador.</p>
          ) : (
            filtered.map((player) => (
              <button
                key={player.id}
                type="button"
                className="scorer-option"
                onClick={() => pick(scorerFromPlayer(value, player))}
              >
                <PlayerAvatar player={player} />
                <span className="scorer-option__name">{player.displayName ?? player.name}</span>
                {playerMeta(player) && (
                  <span className="scorer-option__meta">{playerMeta(player)}</span>
                )}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
