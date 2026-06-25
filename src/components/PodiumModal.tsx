import { useEffect, useState } from "react";

import { namedScorers } from "../utils/scorers";
import type { Prediction } from "../models";

interface PodiumModalProps {
  entries: { position: number; prediction: Prediction; totalScore: number }[];
  onClose: () => void;
}

function PodiumGuess({ prediction }: { prediction: Prediction }) {
  const home = namedScorers(prediction.predictedScorers?.home);
  const away = namedScorers(prediction.predictedScorers?.away);
  const allScorers = [...home, ...away];

  return (
    <div className="podium-guess">
      <div className="podium-guess-score">
        {prediction.homeScore} x {prediction.awayScore}
      </div>
      {allScorers.length > 0 && (
        <div className="podium-guess-scorers">
          {allScorers.join(", ")}
        </div>
      )}
    </div>
  );
}

export function PodiumModal({ entries, onClose }: PodiumModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const top3 = entries.filter((e) => e.position <= 3).slice(0, 3);
  const first = top3.find((e) => e.position === 1);
  const second = top3.find((e) => e.position === 2);
  const third = top3.find((e) => e.position === 3);

  return (
    <div className={`podium-modal ${mounted ? "podium-modal--visible" : ""}`}>
      <div className="podium-modal__backdrop" onClick={onClose} />
      
      <div className="podium-modal__content">
        <button className="podium-modal__close" onClick={onClose}>
          ✕
        </button>

        <div className="podium-title">
          <h2>🏆 PÓDIO FINAL 🏆</h2>
        </div>

        <div className="podium-stage">
          {second && (
            <div className="podium-step podium-step--second">
              <div className="podium-avatar">🥈</div>
              <div className="podium-name">{second.prediction.personName}</div>
              <div className="podium-score">{second.totalScore} pts</div>
              <PodiumGuess prediction={second.prediction} />
              <div className="podium-block">2</div>
            </div>
          )}

          {first && (
            <div className="podium-step podium-step--first">
              <div className="podium-avatar">👑</div>
              <div className="podium-name">{first.prediction.personName}</div>
              <div className="podium-score">{first.totalScore} pts</div>
              <PodiumGuess prediction={first.prediction} />
              <div className="podium-block">1</div>
            </div>
          )}

          {third && (
            <div className="podium-step podium-step--third">
              <div className="podium-avatar">🥉</div>
              <div className="podium-name">{third.prediction.personName}</div>
              <div className="podium-score">{third.totalScore} pts</div>
              <PodiumGuess prediction={third.prediction} />
              <div className="podium-block">3</div>
            </div>
          )}
        </div>

        <div className="podium-modal__actions">
          <button className="btn-primary podium-modal__btn podium-modal__btn--share" onClick={() => {
            let text = "🏆 RESULTADO DO BOLÃO 🏆\n\n";
            if (first) text += `🥇 1º ${first.prediction.personName} (${first.totalScore} pts)\n`;
            if (second) text += `🥈 2º ${second.prediction.personName} (${second.totalScore} pts)\n`;
            if (third) text += `🥉 3º ${third.prediction.personName} (${third.totalScore} pts)\n`;
            text += "\nConfira o ranking completo!";
            
            if (navigator.share) {
              navigator.share({ title: "Bolão", text }).catch(() => {});
            } else {
              navigator.clipboard.writeText(text);
              alert("Copiado para a área de transferência!");
            }
          }}>
            Compartilhar
          </button>
          
          <button className="podium-modal__btn podium-modal__btn--close" onClick={onClose}>
            Voltar
          </button>
        </div>
      </div>
    </div>
  );
}
