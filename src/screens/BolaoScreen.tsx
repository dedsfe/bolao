import { useEffect, useRef, useState } from "react";
import type { Match, Prediction } from "../models";
import { TeamFlag } from "../components/TeamFlag";
import { PredictionList } from "../components/PredictionList";
import { PredictionForm, type PredictionFormData } from "../components/PredictionForm";
import { MatchResultCard } from "../components/MatchResultCard";
import { MatchResultForm, type MatchResultFormData } from "../components/MatchResultForm";
import { RankingList } from "../components/RankingList";
import { LiveDisplayPanel } from "../components/LiveDisplayPanel";
import { ScoreHelpButton } from "../components/ScoreHelpButton";
import { LiveMatchStatusCard, type LiveMatchPhase } from "../components/LiveMatchStatusCard";
import { matchStorage } from "../services/MatchStorage";
import {
  fetchSportmonksLiveResult,
  SportmonksNoFixtureError,
} from "../services/SportmonksLiveScoreService";
import { fetchEspnLiveResult } from "../services/EspnLiveScoreService";
import { buildBolaoSummary } from "../utils/buildBolaoSummary";
import { burstConfetti } from "../utils/confetti";

interface Props {
  match: Match;
  onClose: () => void;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

export function BolaoScreen({ match: initialMatch, onClose }: Props) {
  const [match, setMatch] = useState<Match>(initialMatch);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [displayMode, setDisplayMode] = useState(false);
  const [liveResult, setLiveResult] = useState(match.result ?? null);
  const [livePhase, setLivePhase] = useState<LiveMatchPhase>("pregame");
  const [liveMinute, setLiveMinute] = useState<string | null>(null);
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<string | null>(null);
  const [liveSyncStatus, setLiveSyncStatus] = useState("Sportmonks aguardando");
  const [copied, setCopied] = useState(false);
  const [justLocked, setJustLocked] = useState(false);
  const hasSeenLiveRef = useRef(false);
  const finishedCelebratedRef = useRef(false);
  const liveResultRef = useRef(liveResult);
  // Muda a cada palpite travado para remontar o form e limpar os campos.
  const [createKey, setCreateKey] = useState(0);

  const hasResult = Boolean(match.result);
  const editing = match.predictions.find((p) => p.id === editingId);

  useEffect(() => {
    liveResultRef.current = liveResult;
  }, [liveResult]);

  useEffect(() => {
    if (!displayMode) return;
    let cancelled = false;

    async function syncLiveScore() {
      setLivePhase((phase) => (phase === "live" || phase === "finished" ? phase : "syncing"));
      setLiveSyncStatus("Buscando placar na Sportmonks...");
      try {
        const live = await fetchSportmonksLiveResult(match);
        if (cancelled) return;
        if (!live) {
          if (hasSeenLiveRef.current && liveResultRef.current) {
            setLivePhase("finished");
            setLiveMinute(null);
            setLiveUpdatedAt(new Date().toISOString());
            setLiveSyncStatus("Jogo saiu dos livescores em andamento");
            if (!finishedCelebratedRef.current) {
              finishedCelebratedRef.current = true;
              burstConfetti();
            }
          } else {
            setLivePhase("pregame");
            setLiveSyncStatus("Aguardando a partida entrar ao vivo na Sportmonks");
          }
          return;
        }
        hasSeenLiveRef.current = true;
        finishedCelebratedRef.current = false;
        setLiveResult(live.result);
        setLivePhase("live");
        setLiveMinute(live.minuteLabel);
        setLiveUpdatedAt(live.updatedAt);
        setLiveSyncStatus(`Sportmonks: ${live.fixtureName}`);
      } catch (error) {
        if (cancelled) return;
        const sportmonksMessage = error instanceof Error ? error.message : "erro desconhecido";

        try {
          setLiveSyncStatus("Sportmonks sem dados. Tentando ESPN...");
          const espn = await fetchEspnLiveResult(match);
          if (cancelled) return;
          if (!espn) {
            setLivePhase(error instanceof SportmonksNoFixtureError ? "pregame" : "error");
            setLiveSyncStatus(
              error instanceof SportmonksNoFixtureError
                ? "Aguardando dados da partida na Sportmonks ou ESPN"
                : `Sportmonks indisponível: ${sportmonksMessage}`
            );
            return;
          }

          setLiveResult(espn.result);
          setLiveMinute(espn.minuteLabel);
          setLiveUpdatedAt(espn.updatedAt);
          setLivePhase(espn.phase === "live" ? "live" : espn.phase === "finished" ? "finished" : "pregame");
          setLiveSyncStatus(`ESPN: ${espn.fixtureName}`);

          if (espn.phase === "live") {
            hasSeenLiveRef.current = true;
            finishedCelebratedRef.current = false;
          }
          if (espn.phase === "finished" && hasSeenLiveRef.current && !finishedCelebratedRef.current) {
            finishedCelebratedRef.current = true;
            burstConfetti();
          }
        } catch (fallbackError) {
          if (cancelled) return;
          const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "erro desconhecido";
          setLivePhase("error");
          setLiveSyncStatus(
            `Sportmonks: ${sportmonksMessage}. ESPN: ${fallbackMessage}`
          );
        }
      }
    }

    syncLiveScore();
    const interval = window.setInterval(syncLiveScore, 10000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [displayMode, match]);

  function commit(next: Match) {
    setMatch(next);
    matchStorage.saveMatch(next);
  }

  function handleCreate(data: PredictionFormData) {
    const prediction: Prediction = {
      id: makeId(),
      personName: data.personName,
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      predictedScorers: { home: data.homeScorers, away: data.awayScorers },
      locked: true,
      createdAt: new Date().toISOString(),
    };
    commit({ ...match, predictions: [...match.predictions, prediction] });
    setCreateKey((k) => k + 1); // limpa o form para o próximo palpiteiro
    setJustLocked(true);
    setTimeout(() => setJustLocked(false), 2000);
  }

  function handleEditSave(data: PredictionFormData) {
    const now = new Date().toISOString();
    const predictions = match.predictions.map((p) =>
      p.id === editingId
        ? {
            ...p,
            personName: data.personName,
            homeScore: data.homeScore,
            awayScore: data.awayScore,
            predictedScorers: { home: data.homeScorers, away: data.awayScorers },
            locked: true,
            updatedAt: now,
          }
        : p
    );
    commit({ ...match, predictions });
    setEditingId(null);
  }

  function startEdit(prediction: Prediction) {
    if (hasResult) {
      alert("Não é possível editar palpites depois do resultado informado.");
      return;
    }
    setEditingId(prediction.id);
  }

  function handleSaveResult(data: MatchResultFormData) {
    const now = new Date().toISOString();
    const isFirstResult = !match.result;
    const actualScorers = {
      home: data.homeScorers,
      away: data.awayScorers,
    };
    const result = match.result
      ? { ...match.result, homeScore: data.homeScore, awayScore: data.awayScore, actualScorers, updatedAt: now }
      : { homeScore: data.homeScore, awayScore: data.awayScore, actualScorers, createdAt: now };
    const nextMatch = { ...match, result };
    commit(nextMatch);
    setLiveResult(result);
    setResultFormOpen(false);
    if (isFirstResult) burstConfetti(); // 🎉 momento do resultado oficial
  }

  async function handleCopySummary() {
    const text = buildBolaoSummary(match);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEncerrar() {
    if (!window.confirm("Tem certeza que deseja encerrar este bolão?")) return;
    matchStorage.clearMatch();
    onClose();
  }

  return (
    <div className={`screen ${displayMode ? "screen--display" : ""}`}>
      {!displayMode && (
        <div className="matchup">
          <div className="side">
            <TeamFlag team={match.homeTeam} className="flag" />
            <span className="team-name">{match.homeTeam.name}</span>
          </div>
          <span className="vs">X</span>
          <div className="side">
            <TeamFlag team={match.awayTeam} className="flag" />
            <span className="team-name">{match.awayTeam.name}</span>
          </div>
        </div>
      )}

      <div className="bolao-actions">
        <button className="btn btn-ghost" onClick={() => setDisplayMode((open) => !open)}>
          {displayMode ? "Sair do display" : "Display ao vivo"}
        </button>
        <ScoreHelpButton />
      </div>

      <div className="divider" />

      {displayMode ? (
        <>
          <LiveMatchStatusCard
            match={match}
            result={liveResult}
            phase={livePhase}
            syncStatus={liveSyncStatus}
            minuteLabel={liveMinute}
            lastUpdatedAt={liveUpdatedAt}
          />

          <div className="divider" />

          <LiveDisplayPanel match={match} result={liveResult} phase={livePhase} />

          <div className="spacer" />
        </>
      ) : (
        <>

      {/* Resultado do jogo */}
      {resultFormOpen ? (
        <MatchResultForm
          match={match}
          initialResult={match.result}
          onSubmit={handleSaveResult}
          onCancel={() => setResultFormOpen(false)}
        />
      ) : (
        <MatchResultCard
          match={match}
          onInform={() => setResultFormOpen(true)}
          onEdit={() => setResultFormOpen(true)}
        />
      )}

      <div className="divider" />

      {hasResult ? (
        // Com resultado -> Ranking (edição bloqueada)
        <>
          <p className="section-label">Ranking</p>
          <RankingList match={match} result={match.result!} />
        </>
      ) : (
        <>
          {/* Card guiado: editar substitui o card; senão card de criação sempre visível */}
          {editing ? (
            <PredictionForm
              match={match}
              mode="edit"
              initialPrediction={editing}
              onSubmit={handleEditSave}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <>
              <PredictionForm key={createKey} match={match} mode="create" onSubmit={handleCreate} />
              {justLocked && <p className="copied-msg">Palpite travado.</p>}
            </>
          )}

          <p className="section-label" style={{ marginTop: 28 }}>
            Palpites travados
          </p>
          <PredictionList predictions={match.predictions} match={match} onEdit={startEdit} />
        </>
      )}

      <div className="spacer" />

      <button className="btn btn-ghost" onClick={handleCopySummary}>
        Copiar resumo
      </button>
      {copied && <p className="copied-msg">Resumo copiado.</p>}

      <button className="end-bolao" onClick={handleEncerrar}>
        Encerrar bolão
      </button>
        </>
      )}
    </div>
  );
}
