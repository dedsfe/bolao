# Bolão de Futebol

App web maleável de bolão — funciona para seleções ou clubes.

## Rodar

```bash
npm install
npm run dev   # http://localhost:5173
```

## Fluxo

Começar → Selecionar Time/Seleção A e B → Ver confronto → Adicionar palpite → Dar lock.

## Estrutura

```
src/
  models/        Team, Match, Prediction (domínio puro)
  data/          mockTeams.ts (dados mockados, separados da UI)
  services/      TeamService.ts (camada de dados — troca mock por API aqui)
  components/    TeamFlag, PredictionForm
  screens/       HomeScreen, SelectionScreen, BolaoScreen
```

## Plugar API real depois

1. Crie um `ApiTeamService implements TeamService` em `src/services/`.
2. Troque a instância exportada em `TeamService.ts` (`export const teamService = ...`).
3. Preencha `flagUrl` nos `Team` — o `TeamFlag` já usa imagem quando existe,
   e cai no emoji só como fallback. Nenhuma tela precisa mudar.
