import type { Match, MatchResult } from "../models";
import { TeamFlag } from "./TeamFlag";

export type LiveMatchPhase = "pregame" | "syncing" | "live" | "finished" | "error";

interface Props {
  match: Match;
  result: MatchResult | null;
  phase: LiveMatchPhase;
  syncStatus: string;
  minuteLabel: string | null;
  lastUpdatedAt: string | null;
}

function phaseLabel(phase: LiveMatchPhase): string {
  switch (phase) {
    case "pregame":
      return "Antes do jogo";
    case "syncing":
      return "Sincronizando";
    case "live":
      return "Ao vivo";
    case "finished":
      return "Encerrado";
    case "error":
      return "Sem conexão";
  }
}

function phaseText(phase: LiveMatchPhase): string {
  switch (phase) {
    case "pregame":
      return "Assim que a Sportmonks listar a partida em andamento, o placar entra aqui sozinho.";
    case "syncing":
      return "Buscando o estado mais recente da partida.";
    case "live":
      return "Placar e ranking atualizando automaticamente.";
    case "finished":
      return "Partida encerrada. Ranking final calculado com o último placar recebido.";
    case "error":
      return "Não consegui buscar a Sportmonks agora. O último placar continua preservado.";
  }
}

export function LiveMatchStatusCard({
  match,
  result,
  phase,
  syncStatus,
  minuteLabel,
  lastUpdatedAt,
}: Props) {
  const homeScore = result?.homeScore ?? 0;
  const awayScore = result?.awayScore ?? 0;
  const updated = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : null;

  return (
    <section className={`live-state-card live-state-card--${phase}`}>
      <div className="live-state-card__top">
        <span className="live-state-pill">{phaseLabel(phase)}</span>
        {phase === "live" && minuteLabel && (
          <span className="live-state-minute">{minuteLabel}</span>
        )}
      </div>

      <div className="live-state-scoreboard">
        <div className="live-state-team">
          <TeamFlag team={match.homeTeam} className="live-state-team__flag" />
          <span>{match.homeTeam.name}</span>
        </div>

        <strong className="live-state-score">
          {homeScore} <span>X</span> {awayScore}
        </strong>

        <div className="live-state-team live-state-team--right">
          <TeamFlag team={match.awayTeam} className="live-state-team__flag" />
          <span>{match.awayTeam.name}</span>
        </div>
      </div>

      <div className="live-state-card__bottom">
        <p>{phaseText(phase)}</p>
        <span>{updated ? `${syncStatus} · ${updated}` : syncStatus}</span>
      </div>
    </section>
  );
}
