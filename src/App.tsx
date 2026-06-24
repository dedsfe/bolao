import { useEffect, useState } from "react";
import type { Match, Team } from "./models";
import { HomeScreen } from "./screens/HomeScreen";
import { TeamSelectionView } from "./screens/TeamSelectionView";
import { BolaoScreen } from "./screens/BolaoScreen";
import { matchStorage } from "./services/MatchStorage";

type Step = "loading" | "home" | "selection" | "bolao";

function createMatch(homeTeam: Team, awayTeam: Team): Match {
  return {
    id: Math.random().toString(36).slice(2, 10),
    homeTeam,
    awayTeam,
    predictions: [],
    locked: false,
    createdAt: new Date().toISOString(),
  };
}

export default function App() {
  const [step, setStep] = useState<Step>("loading");
  const [match, setMatch] = useState<Match | null>(null);

  // Ao abrir: recupera o bolão salvo. Se houver, vai direto pra ele.
  useEffect(() => {
    matchStorage.loadMatch().then((saved) => {
      if (saved) {
        setMatch(saved);
        setStep("bolao");
      } else {
        setStep("home");
      }
    });
  }, []);

  function handleCreateMatch(teamA: Team, teamB: Team) {
    const newMatch = createMatch(teamA, teamB);
    matchStorage.saveMatch(newMatch); // persiste já na criação
    setMatch(newMatch);
    setStep("bolao");
  }

  function handleCloseBolao() {
    setMatch(null);
    setStep("home");
  }

  switch (step) {
    case "loading":
      return null;

    case "home":
      return <HomeScreen onStart={() => setStep("selection")} />;

    case "selection":
      return (
        <TeamSelectionView
          onBack={() => setStep("home")}
          onConfirm={handleCreateMatch}
        />
      );

    case "bolao":
      return match ? (
        <BolaoScreen match={match} onClose={handleCloseBolao} />
      ) : null;
  }
}
