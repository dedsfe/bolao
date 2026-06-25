import { calculateScorerBonus } from "../src/utils/calculateScorerBonus";

const prediction = {
  homeScore: 4, awayScore: 1,
  predictedScorers: {
    home: [
      { type: "player", playerName: "Vini Jr" },
      { type: "player", playerName: "Vini Jr" },
      { type: "player", playerName: "Neymar" }
    ],
    away: [
      { type: "player", playerName: "McTominay" }
    ]
  }
};

const result = {
  homeScore: 2, awayScore: 0,
  actualScorers: {
    home: [
      { type: "player", playerName: "Vinícius Júnior" },
      { type: "player", playerName: "Vinícius Júnior" }
    ],
    away: []
  }
};

console.log(calculateScorerBonus(prediction as any, result as any));
