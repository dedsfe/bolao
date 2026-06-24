import { useState } from "react";
import type { Match, Prediction } from "../models";
import { TeamFlag } from "../components/TeamFlag";
import { PredictionList } from "../components/PredictionList";
import { PredictionForm, type PredictionFormData } from "../components/PredictionForm";
import { MatchResultCard } from "../components/MatchResultCard";
import { MatchResultForm, type MatchResultFormData } from "../components/MatchResultForm";
import { RankingList } from "../components/RankingList";
import { matchStorage } from "../services/MatchStorage";
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
  const [copied, setCopied] = useState(false);
  const [justLocked, setJustLocked] = useState(false);
  // Muda a cada palpite travado para remontar o form e limpar os campos.
  const [createKey, setCreateKey] = useState(0);

  const hasResult = Boolean(match.result);
  const editing = match.predictions.find((p) => p.id === editingId);

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
    commit({ ...match, result });
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
    <div className="screen">
      {/* Confronto centralizado */}
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

      <div className="divider" />

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
    </div>
  );
}
