import { useEffect, useState } from "react";
import type { Match, Player, PredictedScorer, Prediction, Team } from "../models";
import { TeamFlag } from "./TeamFlag";
import { ScorerSlots } from "./ScorerSlots";
import { playerService } from "../services/PlayerService";
import { hasAnyNamedScorer, makeEmptyScorer, resizeScorers } from "../utils/scorers";

export type PredictionFormMode = "create" | "edit";

export interface PredictionFormData {
  personName: string;
  homeScore: number;
  awayScore: number;
  homeScorers: PredictedScorer[];
  awayScorers: PredictedScorer[];
}

interface Props {
  match: Match;
  mode: PredictionFormMode;
  initialPrediction?: Prediction;
  onSubmit: (data: PredictionFormData) => void;
  onCancel?: () => void;
}

const MAX_GOALS = 20;

// ---------- Stepper de placar: [ - ] valor [ + ] ----------
function ScoreStepper({
  team,
  value,
  onChange,
}: {
  team: Team;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <div className="stepper">
      <div className="stepper__team">
        <TeamFlag team={team} className="stepper__flag" />
        <span className="stepper__name">{team.name}</span>
      </div>
      <div className="stepper__controls">
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Menos um gol para ${team.name}`}
          onClick={() => onChange(Math.max(0, value - 1))}
        >
          −
        </button>
        <span className="stepper__value">{value}</span>
        <button
          type="button"
          className="stepper__btn"
          aria-label={`Mais um gol para ${team.name}`}
          onClick={() => onChange(Math.min(MAX_GOALS, value + 1))}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PredictionForm({ match, mode, initialPrediction, onSubmit, onCancel }: Props) {
  const isEdit = mode === "edit";
  const { homeTeam, awayTeam } = match;

  // Status honesto do elenco de cada lado (oficial/pendente/teste/ausente).
  const homeSquadStatus = playerService.getSquadMeta(homeTeam.id).status;
  const awaySquadStatus = playerService.getSquadMeta(awayTeam.id).status;

  const [name, setName] = useState(initialPrediction?.personName ?? "");
  const [homeScore, setHomeScore] = useState(initialPrediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(initialPrediction?.awayScore ?? 0);
  const [homeScorers, setHomeScorers] = useState<PredictedScorer[]>(
    initialPrediction?.predictedScorers?.home ??
      Array.from({ length: initialPrediction?.homeScore ?? 0 }, (_, i) =>
        makeEmptyScorer(homeTeam.id, i + 1)
      )
  );
  const [awayScorers, setAwayScorers] = useState<PredictedScorer[]>(
    initialPrediction?.predictedScorers?.away ??
      Array.from({ length: initialPrediction?.awayScore ?? 0 }, (_, i) =>
        makeEmptyScorer(awayTeam.id, i + 1)
      )
  );
  const [error, setError] = useState("");
  // Liga/desliga a escolha de goleadores. No modo edição, começa ligado
  // só se o palpite já tinha algum goleador nomeado.
  const [scorersEnabled, setScorersEnabled] = useState(
    isEdit ? hasAnyNamedScorer(initialPrediction?.predictedScorers) : true
  );

  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);

  // Carrega elencos via service (mock hoje, API depois).
  useEffect(() => {
    playerService.getPlayersByTeamId(homeTeam.id).then(setHomePlayers);
  }, [homeTeam.id]);
  useEffect(() => {
    playerService.getPlayersByTeamId(awayTeam.id).then(setAwayPlayers);
  }, [awayTeam.id]);

  // Slots de goleador acompanham o placar, preservando escolhas por índice.
  function changeHomeScore(next: number) {
    setHomeScore(next);
    setHomeScorers((cur) => resizeScorers(cur, next, homeTeam.id));
  }
  function changeAwayScore(next: number) {
    setAwayScore(next);
    setAwayScorers((cur) => resizeScorers(cur, next, awayTeam.id));
  }

  function handleSubmit() {
    const cleanName = name.trim();
    if (cleanName === "") {
      setError("Preencha o nome.");
      return;
    }
    setError("");
    // Toggle desligado -> salva sem goleadores.
    onSubmit({
      personName: cleanName,
      homeScore,
      awayScore,
      homeScorers: scorersEnabled ? homeScorers : [],
      awayScorers: scorersEnabled ? awayScorers : [],
    });
  }

  return (
    <div className={isEdit ? "form-card" : "guess-card"}>
      {isEdit ? (
        <p className="section-label">Editar palpite</p>
      ) : (
        <>
          <h2 className="guess-card__title">Faça seu palpite</h2>
          <p className="guess-card__subtitle">
            Coloque seu nome, escolha o placar e trave seu palpite.
          </p>
        </>
      )}

      {/* Toggle: ligar/desligar a escolha de goleadores */}
      <label className="scorer-toggle">
        <span className="scorer-toggle__text">Escolher goleadores</span>
        <button
          type="button"
          role="switch"
          aria-checked={scorersEnabled}
          className={`switch${scorersEnabled ? " on" : ""}`}
          onClick={() => setScorersEnabled((v) => !v)}
        >
          <span className="switch__knob" />
        </button>
      </label>

      <div className="field">
        <label htmlFor="pname">Seu nome</label>
        <input
          id="pname"
          className="input"
          placeholder="Ex: André"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Placar com steppers e X grande no centro */}
      <div className="steppers">
        <ScoreStepper team={homeTeam} value={homeScore} onChange={changeHomeScore} />
        <span className="steppers__x">X</span>
        <ScoreStepper team={awayTeam} value={awayScore} onChange={changeAwayScore} />
      </div>

      {/* Goleadores conforme o placar — só quando o toggle está ligado */}
      {scorersEnabled && (homeScore > 0 || awayScore > 0) && (
        <div className="scorers-area">
          <ScorerSlots
            team={homeTeam}
            players={homePlayers}
            scorers={homeScorers}
            squadStatus={homeSquadStatus}
            mode="predicted"
            onChangeScorer={(i, s) =>
              setHomeScorers((cur) => cur.map((c, idx) => (idx === i ? s : c)))
            }
          />
          <ScorerSlots
            team={awayTeam}
            players={awayPlayers}
            scorers={awayScorers}
            squadStatus={awaySquadStatus}
            mode="predicted"
            onChangeScorer={(i, s) =>
              setAwayScorers((cur) => cur.map((c, idx) => (idx === i ? s : c)))
            }
          />
        </div>
      )}

      {error && <p className="warning">{error}</p>}

      <div className="form-actions">
        {isEdit && onCancel && (
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button className="btn btn-primary btn-cta" onClick={handleSubmit}>
          {isEdit ? "Salvar alterações" : "Travar palpite"}
        </button>
      </div>
    </div>
  );
}
