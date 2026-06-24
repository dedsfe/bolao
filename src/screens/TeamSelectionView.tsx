import { useState } from "react";
import type { Team } from "../models";
import { TeamFlag } from "../components/TeamFlag";
import { TeamSearchList } from "../components/TeamSearchList";

type Slot = "A" | "B";

interface Props {
  onBack: () => void;
  onConfirm: (teamA: Team, teamB: Team) => void;
}

interface SlotChipProps {
  label: string;
  team?: Team;
  active: boolean;
  onClick: () => void;
}

function SlotChip({ label, team, active, onClick }: SlotChipProps) {
  return (
    <button
      className={`slot${active ? " active" : ""}${team ? " filled" : ""}`}
      onClick={onClick}
    >
      <span className="slot__label">{label}</span>
      {team ? (
        <span className="slot__team">
          <TeamFlag team={team} className="slot__flag" />
          <span className="slot__name">{team.name}</span>
        </span>
      ) : (
        <span className="slot__placeholder">Escolher…</span>
      )}
    </button>
  );
}

// A view não conhece o mock — usa TeamSearchList, que fala com o TeamService.
export function TeamSelectionView({ onBack, onConfirm }: Props) {
  const [teamA, setTeamA] = useState<Team | undefined>();
  const [teamB, setTeamB] = useState<Team | undefined>();
  const [activeSlot, setActiveSlot] = useState<Slot>("A");
  const [warning, setWarning] = useState("");

  const active = activeSlot === "A" ? teamA : teamB;
  const other = activeSlot === "A" ? teamB : teamA;

  function pick(team: Team) {
    // Regra: não pode o mesmo time dos dois lados.
    if (other && other.id === team.id) {
      setWarning("Escolha dois times diferentes.");
      return;
    }
    setWarning("");

    if (activeSlot === "A") {
      setTeamA(team);
      if (!teamB) setActiveSlot("B"); // avança p/ o lado vazio
    } else {
      setTeamB(team);
      if (!teamA) setActiveSlot("A");
    }
  }

  const ready = teamA && teamB;

  return (
    <div className="screen">
      <div className="topbar">
        <button className="btn-link" onClick={onBack}>
          ← Voltar
        </button>
      </div>

      <h1 className="title">Escolha o confronto</h1>
      <p className="subtitle">
        Seleção ou clube, dos dois lados. Toque num lado e busque o time.
      </p>

      <div className="slots">
        <SlotChip
          label="Time A"
          team={teamA}
          active={activeSlot === "A"}
          onClick={() => setActiveSlot("A")}
        />
        <span className="slots__x">×</span>
        <SlotChip
          label="Time B"
          team={teamB}
          active={activeSlot === "B"}
          onClick={() => setActiveSlot("B")}
        />
      </div>

      {warning && <p className="warning">{warning}</p>}

      <TeamSearchList
        selectedId={active?.id}
        blockedId={other?.id}
        onPick={pick}
      />

      {/* Rodapé fixo: sempre alcançável, sem precisar rolar a lista toda. */}
      <div className="select-footer">
        {ready && (
          <div className="select-footer__preview">
            <span className="select-footer__side">
              <TeamFlag team={teamA!} className="select-footer__flag" />
              {teamA!.name}
            </span>
            <span className="select-footer__x">X</span>
            <span className="select-footer__side">
              <TeamFlag team={teamB!} className="select-footer__flag" />
              {teamB!.name}
            </span>
          </div>
        )}
        <button
          className="btn btn-primary"
          disabled={!ready}
          onClick={() => ready && onConfirm(teamA!, teamB!)}
        >
          {ready ? "Criar bolão" : "Escolha os dois times"}
        </button>
      </div>
    </div>
  );
}
