# Pipeline de elencos da Copa 2026

Objetivo: trazer os elencos **oficiais** das 48 seleções de forma segura, sem
digitar jogador na mão dentro do JSON.

## Fluxo

1. Gere o CSV a partir do wikitext bruto da Wikipedia:

   ```bash
   npx tsx scripts/fetchWikipediaSquads.ts
   ```

   Origem: "Wikipedia — 2026 FIFA World Cup squads (per FIFA)".
   O conteúdo da Wikipedia é licenciado em CC BY-SA.

   O script salva o arquivo em:

   ```
   src/data/import/fifa-squad-lists-2026.csv
   ```

   Colunas:

   ```
   teamFifaCode,teamName,playerName,firstNames,lastName,shirtName,position,shirtNumber,club,dateOfBirth,heightCm
   ```

2. Importe (gera/atualiza `src/data/worldCupSquads2026.json`):

   ```bash
   npx tsx scripts/importWorldCupSquads.ts
   ```

   - Mapeia `teamFifaCode` → `teamId` pelas seleções já cadastradas.
   - IDs estáveis (`createPlayerId`) — rodar de novo **não duplica**.
   - Marca `source: "official_import"`, `lastVerifiedAt` = agora,
     `sourceName: "Wikipedia — 2026 FIFA World Cup squads (per FIFA)"`,
     `verifiedBy: "fetchWikipediaSquads"`, `isWorldCupSquad: true`.
   - Seleções fora do CSV são **preservadas** como estão.

3. Valide:

   ```bash
   npx tsx scripts/validateWorldCupSquads.ts
   ```

   Confere 23–26 jogadores (só para squads oficiais), campos obrigatórios,
   posições e IDs duplicados.

## Honestidade dos dados

- Enquanto o squad estiver como `source: "seed"` (dados iniciais plausíveis),
  a UI mostra **"Dados iniciais — aguardando verificação oficial"**, nunca
  "Elenco oficial".
- Só após importar do CSV oficial (que seta `official_import` +
  `lastVerifiedAt`) a UI passa a exibir **"Elenco oficial"**.
