import { useState } from "react";

export function ScoreHelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="score-help-trigger"
        onClick={() => setOpen(true)}
        aria-label="Como funciona a pontuação"
        title="Como funciona a pontuação"
      >
        ?
      </button>

      {open && (
        <div className="score-help-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="score-help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="score-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="score-help-head">
              <h2 id="score-help-title">Sistema de pontos</h2>
              <button
                className="score-help-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar explicação"
              >
                ×
              </button>
            </div>

            <div className="score-help-rules">
              <div>
                <strong>+3 pts</strong>
                <span>Acertou o vencedor (ou empate).</span>
              </div>
              <div>
                <strong>+1 pt</strong>
                <span>Acertou os gols do time da casa.</span>
              </div>
              <div>
                <strong>+1 pt</strong>
                <span>Acertou os gols do visitante.</span>
              </div>
              <div>
                <strong>+1 pt</strong>
                <span>Acertou a diferença de gols.</span>
              </div>
              <div>
                <strong>+3 pts</strong>
                <span>Bônus por placar exato (cumulativo).</span>
              </div>
              <div>
                <strong>+1 pt</strong>
                <span>Por cada goleador acertado (se acertou o vencedor).</span>
              </div>
            </div>

            <p className="score-help-note">
              Pontos são cumulativos. Placar exato = até 9 pts + goleadores.
              Desempate: mais pontos totais, pontos de placar, bônus de goleadores,
              menor erro total de gols e ordem de envio.
            </p>
          </section>
        </div>
      )}
    </>
  );
}
