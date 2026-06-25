import { useEffect, useMemo, useRef, useState } from "react";
import type { Match, MatchResult, Prediction } from "../models";
import { rankPredictions, type RankedPrediction } from "../utils/rankPredictions";
import { statusLabel, type ScoreBreakdownItem } from "../utils/calculatePredictionScore";
import { namedScorers } from "../utils/scorers";
import { TeamFlag } from "./TeamFlag";
import type { LiveMatchPhase } from "./LiveMatchStatusCard";
import { PodiumModal } from "./PodiumModal";

interface Props {
  match: Match;
  result: MatchResult | null;
  phase: LiveMatchPhase;
}

type Movement = "up" | "down" | "same" | "new";

interface DisplayEntry {
  position: number;
  prediction: Prediction;
  score: number;
  scorerBonus: number;
  totalScore: number;
  reasons: string[];
  breakdown: ScoreBreakdownItem[];
  scorerReason: string;
  matchedScorers: string[];
  maxPossible: number;
  status: RankedPrediction["status"] | "waiting";
}

// ---------- helpers ----------

function getMovement(
  ranked: DisplayEntry[],
  previousPositions: Map<string, number>
): Map<string, Movement> {
  const movements = new Map<string, Movement>();
  ranked.forEach((entry) => {
    const previous = previousPositions.get(entry.prediction.id);
    if (!previous) {
      movements.set(entry.prediction.id, "new");
    } else if (entry.position < previous) {
      movements.set(entry.prediction.id, "up");
    } else if (entry.position > previous) {
      movements.set(entry.prediction.id, "down");
    } else {
      movements.set(entry.prediction.id, "same");
    }
  });
  return movements;
}

function movementLabel(movement: Movement): string {
  switch (movement) {
    case "up":
      return "Subiu";
    case "down":
      return "Caiu";
    case "new":
      return "Novo";
    case "same":
      return "Estável";
  }
}

function alphabeticalEntries(predictions: Prediction[]): DisplayEntry[] {
  return [...predictions]
    .sort((a, b) => a.personName.localeCompare(b.personName, "pt-BR"))
    .map((prediction, index) => ({
      position: index + 1,
      prediction,
      score: 0,
      scorerBonus: 0,
      totalScore: 0,
      reasons: [],
      breakdown: [],
      scorerReason: "",
      matchedScorers: [],
      maxPossible: 0,
      status: "waiting",
    }));
}

// Normaliza um nome de jogador para comparação.
function norm(v: string): string {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// Gera partículas de confetti com posições/cores aleatórias.
const CONFETTI_COLORS = ["#ffd54f", "#ff7043", "#66bb6a", "#42a5f5", "#ab47bc", "#ef5350"];
function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        left: `${8 + Math.random() * 84}%`,
        delay: `${Math.random() * 0.8}s`,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );
  return (
    <div className="confetti-burst" aria-hidden="true">
      {particles.map((p, i) => (
        <span key={i} style={{ left: p.left, animationDelay: p.delay, background: p.color }} />
      ))}
    </div>
  );
}

// ---------- scorer highlight helpers ----------

/** Retorna os nomes dos goleadores previstos com flag indicando acerto. */
function scorerNamesWithHits(
  predictedNames: string[],
  matchedNames: string[]
): { name: string; hit: boolean }[] {
  // Pool de nomes acertados (case/accent insensitive) para consumir 1-a-1.
  const pool = new Map<string, number>();
  for (const m of matchedNames) {
    const key = norm(m);
    pool.set(key, (pool.get(key) ?? 0) + 1);
  }
  return predictedNames.map((name) => {
    const key = norm(name);
    const left = pool.get(key) ?? 0;
    if (left > 0) {
      pool.set(key, left - 1);
      return { name, hit: true };
    }
    return { name, hit: false };
  });
}

function FormatScorersHighlighted({
  names,
  matchedScorers,
  hasResult,
}: {
  names: string[];
  matchedScorers: string[];
  hasResult: boolean;
}) {
  if (names.length === 0) return <span>Sem goleador escolhido</span>;
  if (!hasResult) return <span>{names.join(", ")}</span>;

  const items = scorerNamesWithHits(names, matchedScorers);
  return (
    <span>
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && ", "}
          <span className={item.hit ? "scorer-name--hit" : ""}>{item.name}</span>
        </span>
      ))}
    </span>
  );
}

// ---------- main component ----------

export function LiveDisplayPanel({ match, result, phase }: Props) {
  const previousPositionsRef = useRef<Map<string, number>>(new Map());
  const [movements, setMovements] = useState<Map<string, Movement>>(new Map());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPodium, setShowPodium] = useState(false);
  const waitingForKickoff = !result && phase !== "finished";
  const entries = useMemo<DisplayEntry[]>(
    () =>
      waitingForKickoff
        ? alphabeticalEntries(match.predictions)
        : rankPredictions(match.predictions, result as MatchResult),
    [match.predictions, result, waitingForKickoff]
  );

  useEffect(() => {
    setMovements(getMovement(entries, previousPositionsRef.current));
    previousPositionsRef.current = new Map(
      entries.map((entry) => [entry.prediction.id, entry.position])
    );
  }, [entries]);

  if (match.predictions.length === 0) {
    return (
      <section className="display-panel display-panel--empty">
        <p className="section-label">Display ao vivo</p>
        <p className="display-empty">Adicione palpites para ver o placar coletivo.</p>
      </section>
    );
  }

  return (
    <section className="display-panel">
      <div className={`display-summary display-summary--${phase}`}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span>
            {waitingForKickoff
              ? "Pré-jogo"
              : phase === "finished"
                ? "Ranking final"
                : "Ranking ao vivo"}
          </span>
          {phase === "finished" && (
            <button
              className="btn-primary"
              style={{ padding: "4px 12px", fontSize: "12px" }}
              onClick={() => setShowPodium(true)}
            >
              🏆 Ver Pódio
            </button>
          )}
        </div>
        <span>{match.predictions.length} palpites</span>
        <span>{waitingForKickoff ? "Ordem alfabética" : `${entries[0]?.totalScore ?? 0} pts líder`}</span>
      </div>

      <div className="display-table">
        <div className="display-table__head">
          <span>#</span>
          <span>Participante</span>
          <span>Palpite</span>
          <span>Pontos</span>
        </div>

        {entries.map((entry) => {
          const homeScorers = namedScorers(entry.prediction.predictedScorers?.home);
          const awayScorers = namedScorers(entry.prediction.predictedScorers?.away);
          const movement = movements.get(entry.prediction.id) ?? "same";
          const statusText =
            entry.status === "waiting" ? "Aguardando jogo" : statusLabel(entry.status);
          const isExpanded = expandedId === entry.prediction.id;
          const canExpand = entry.status !== "waiting";
          const isExact = entry.status === "exact";

          return (
            <article
              key={entry.prediction.id}
              className={`display-row display-row--${entry.status}`}
            >
              {isExact && <ConfettiBurst />}

              <div className="display-row__rank">
                <strong>{entry.position}</strong>
                {!waitingForKickoff && (
                  <span className={`movement movement--${movement}`}>
                    {movementLabel(movement)}
                  </span>
                )}
              </div>

              <div className="display-row__person">
                <strong>{entry.prediction.personName}</strong>
                <span>{statusText}</span>
              </div>

              <div className="display-row__guess">
                <div className="display-row__scoreline">
                  <span>
                    <TeamFlag team={match.homeTeam} className="display-row__flag" />
                    {match.homeTeam.shortName ?? match.homeTeam.name}
                  </span>
                  <strong>{entry.prediction.homeScore}</strong>
                  <em>X</em>
                  <strong>{entry.prediction.awayScore}</strong>
                  <span>
                    <TeamFlag team={match.awayTeam} className="display-row__flag" />
                    {match.awayTeam.shortName ?? match.awayTeam.name}
                  </span>
                </div>
                <div className="display-row__scorers">
                  <FormatScorersHighlighted
                    names={homeScorers}
                    matchedScorers={entry.matchedScorers}
                    hasResult={canExpand}
                  />
                  <FormatScorersHighlighted
                    names={awayScorers}
                    matchedScorers={entry.matchedScorers}
                    hasResult={canExpand}
                  />
                </div>
              </div>

              <div className="display-row__points">
                <strong>{entry.totalScore}</strong>
                {canExpand && entry.maxPossible > 0 && (
                  <span className="points-max">/{entry.maxPossible}</span>
                )}
                <span>
                  {entry.score}+{entry.scorerBonus}
                </span>
                {canExpand && (
                  <button
                    className="breakdown-toggle"
                    onClick={() => setExpandedId(isExpanded ? null : entry.prediction.id)}
                    aria-expanded={isExpanded}
                    aria-label="Ver detalhes da pontuação"
                    title="Ver detalhes"
                  >
                    {isExpanded ? "▴" : "▾"}
                  </button>
                )}
              </div>

              {isExpanded && canExpand && (
                <div className="display-row__breakdown">
                  <ul className="breakdown-tags">
                    {entry.breakdown.map((item, i) => (
                      <li
                        key={i}
                        className={`breakdown-tag breakdown-tag--${item.hit ? "hit" : "miss"}`}
                      >
                        <span className="breakdown-tag__icon">{item.hit ? "✓" : "✗"}</span>
                        {item.label}
                        {item.hit && <span>+{item.points}</span>}
                      </li>
                    ))}
                    {entry.scorerBonus > 0 && entry.matchedScorers.length > 0 && (
                      <li className="breakdown-tag breakdown-tag--hit">
                        <span className="breakdown-tag__icon">✓</span>
                        Goleadores: {entry.matchedScorers.join(", ")} +{entry.scorerBonus}
                      </li>
                    )}
                    {entry.scorerBonus === 0 && (
                      <li className="breakdown-tag breakdown-tag--miss">
                        <span className="breakdown-tag__icon">✗</span>
                        {entry.scorerReason}
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {showPodium && (
        <PodiumModal entries={entries} onClose={() => setShowPodium(false)} />
      )}
    </section>
  );
}
