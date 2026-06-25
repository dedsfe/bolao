import { useEffect, useState } from "react";
import type { ActualScorer, Match, MatchResult, Player } from "../models";
import { TeamFlag } from "./TeamFlag";
import { ScorerSlots } from "./ScorerSlots";
import { playerService } from "../services/PlayerService";
import { makeEmptyScorer, resizeScorers } from "../utils/scorers";

export interface MatchResultFormData {
  homeScore: number;
  awayScore: number;
  homeScorers: ActualScorer[];
  awayScorers: ActualScorer[];
}

interface Props {
  match: Match;
  initialResult?: MatchResult;
  onSubmit: (data: MatchResultFormData) => void;
  onCancel: () => void;
  onLiveChange?: (data: MatchResultFormData | null) => void;
  submitLabel?: string;
  title?: string;
}

function sanitizeScore(value: string | number): string {
  return String(value).replace(/[^0-9]/g, "").slice(0, 2);
}

function initialSlots(team: string, count: number, existing?: ActualScorer[]): ActualScorer[] {
  if (existing && existing.length) return existing;
  return Array.from({ length: count }, (_, i) => makeEmptyScorer(team, i + 1));
}

export function MatchResultForm({
  match,
  initialResult,
  onSubmit,
  onCancel,
  onLiveChange,
  submitLabel = "Salvar resultado",
  title,
}: Props) {
  const isEdit = Boolean(initialResult);
  const { homeTeam, awayTeam } = match;

  const [homeScore, setHomeScore] = useState(
    initialResult ? sanitizeScore(initialResult.homeScore) : ""
  );
  const [awayScore, setAwayScore] = useState(
    initialResult ? sanitizeScore(initialResult.awayScore) : ""
  );
  const [homeScorers, setHomeScorers] = useState<ActualScorer[]>(
    initialSlots(homeTeam.id, initialResult?.homeScore ?? 0, initialResult?.actualScorers?.home)
  );
  const [awayScorers, setAwayScorers] = useState<ActualScorer[]>(
    initialSlots(awayTeam.id, initialResult?.awayScore ?? 0, initialResult?.actualScorers?.away)
  );
  const [error, setError] = useState("");

  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  useEffect(() => {
    playerService.getPlayersByTeamId(homeTeam.id).then(setHomePlayers);
  }, [homeTeam.id]);
  useEffect(() => {
    playerService.getPlayersByTeamId(awayTeam.id).then(setAwayPlayers);
  }, [awayTeam.id]);

  const homeStatus = playerService.getSquadMeta(homeTeam.id).status;
  const awayStatus = playerService.getSquadMeta(awayTeam.id).status;

  useEffect(() => {
    if (!onLiveChange) return;
    if (homeScore === "" || awayScore === "") {
      onLiveChange(null);
      return;
    }
    onLiveChange({
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      homeScorers,
      awayScorers,
    });
  }, [awayScore, awayScorers, homeScore, homeScorers, onLiveChange]);

  // Slots de goleadores reais acompanham o placar informado.
  function changeHomeScore(v: string) {
    const clean = sanitizeScore(v);
    setHomeScore(clean);
    setHomeScorers((cur) => resizeScorers(cur, clean === "" ? 0 : Number(clean), homeTeam.id));
  }
  function changeAwayScore(v: string) {
    const clean = sanitizeScore(v);
    setAwayScore(clean);
    setAwayScorers((cur) => resizeScorers(cur, clean === "" ? 0 : Number(clean), awayTeam.id));
  }

  function handleSubmit() {
    if (homeScore === "" || awayScore === "") {
      setError("Informe um placar válido.");
      return;
    }
    const home = Number(homeScore);
    const away = Number(awayScore);
    if (!Number.isInteger(home) || !Number.isInteger(away) || home < 0 || away < 0) {
      setError("Informe um placar válido.");
      return;
    }
    setError("");
    onSubmit({ homeScore: home, awayScore: away, homeScorers, awayScorers });
  }

  const showScorers = (homeScore !== "" && Number(homeScore) > 0) ||
    (awayScore !== "" && Number(awayScore) > 0);

  return (
    <div className="form-card">
      <p className="section-label">
        {title ?? (isEdit ? "Editar resultado" : "Informar resultado")}
      </p>

      <div className="score-fields">
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="score-team">
            <TeamFlag team={homeTeam} className="score-team__flag" />
            {homeTeam.name}
          </label>
          <input
            className="input score-input"
            inputMode="numeric"
            placeholder="0"
            value={homeScore}
            onChange={(e) => changeHomeScore(e.target.value)}
            autoFocus
          />
        </div>
        <div className="x">×</div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label className="score-team">
            <TeamFlag team={awayTeam} className="score-team__flag" />
            {awayTeam.name}
          </label>
          <input
            className="input score-input"
            inputMode="numeric"
            placeholder="0"
            value={awayScore}
            onChange={(e) => changeAwayScore(e.target.value)}
          />
        </div>
      </div>

      {/* Goleadores reais, conforme o placar */}
      {showScorers && (
        <div className="scorers-area">
          <ScorerSlots
            team={homeTeam}
            players={homePlayers}
            scorers={homeScorers}
            squadStatus={homeStatus}
            mode="actual"
            onChangeScorer={(i, s) =>
              setHomeScorers((cur) => cur.map((c, idx) => (idx === i ? s : c)))
            }
          />
          <ScorerSlots
            team={awayTeam}
            players={awayPlayers}
            scorers={awayScorers}
            squadStatus={awayStatus}
            mode="actual"
            onChangeScorer={(i, s) =>
              setAwayScorers((cur) => cur.map((c, idx) => (idx === i ? s : c)))
            }
          />
        </div>
      )}

      {error && <p className="warning">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-ghost" onClick={onCancel}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
