/**
 * Valida src/data/worldCupSquads2026.json.
 *
 * Uso:
 *   npx tsx scripts/validateWorldCupSquads.ts
 *
 * Checa, por seleção e no geral:
 *  - entre 23 e 26 jogadores (só para squads marcados como oficiais);
 *  - todo jogador tem id, name, teamId, fifaCode, position, isWorldCupSquad;
 *  - sem ids duplicados;
 *  - todo jogador tem seleção correspondente cadastrada.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { WORLD_CUP_2026_TEAMS } from "../src/data/worldCup2026Teams.ts";
import type { Player } from "../src/models/index.ts";

const ROOT = resolve(import.meta.dirname, "..");
const JSON_PATH = resolve(ROOT, "src/data/worldCupSquads2026.json");

interface SquadEntry {
  teamId: string;
  source: string;
  lastVerifiedAt: string | null;
  players: Player[];
}

function main() {
  if (!existsSync(JSON_PATH)) {
    console.error(`✗ Arquivo não encontrado: ${JSON_PATH}`);
    process.exit(1);
  }
  const squads = JSON.parse(readFileSync(JSON_PATH, "utf8")) as SquadEntry[];
  const validTeamIds = new Set(WORLD_CUP_2026_TEAMS.map((t) => t.id));

  const seenIds = new Map<string, number>();
  let hasError = false;

  for (const squad of squads) {
    const issues: string[] = [];
    const n = squad.players.length;
    const isOfficial = squad.source === "official_import" && squad.lastVerifiedAt;

    // Faixa de tamanho só é exigida para elenco oficial (seed pode estar parcial).
    if (isOfficial && (n < 23 || n > 26)) issues.push(`${n} jogadores (esperado 23–26)`);

    if (!validTeamIds.has(squad.teamId)) issues.push(`teamId desconhecido: ${squad.teamId}`);

    const noPosition = squad.players.filter((p) => !p.position || p.position === "UNKNOWN").length;
    const missingField = squad.players.filter(
      (p) => !p.id || !p.name || !p.teamId || !p.fifaCode || p.isWorldCupSquad !== true
    ).length;
    if (noPosition) issues.push(`sem posição definida: ${noPosition}`);
    if (missingField) issues.push(`com campo obrigatório faltando: ${missingField}`);

    for (const p of squad.players) {
      seenIds.set(p.id, (seenIds.get(p.id) ?? 0) + 1);
      if (p.teamId !== squad.teamId) issues.push(`jogador ${p.id} com teamId divergente`);
    }

    const teamName = WORLD_CUP_2026_TEAMS.find((t) => t.id === squad.teamId)?.name ?? squad.teamId;
    const tag = isOfficial ? "" : " (seed/não-oficial)";
    if (issues.length === 0) {
      console.log(`${teamName}: ${n} jogadores ✅${tag}`);
    } else {
      hasError = true;
      console.log(`${teamName}: ${n} jogadores ⚠️${tag}`);
      for (const i of issues) console.log(`   - ${i}`);
    }
  }

  const dups = [...seenIds.entries()].filter(([, c]) => c > 1).map(([id]) => id);
  if (dups.length) { hasError = true; console.log(`\n✗ IDs duplicados: ${dups.join(", ")}`); }

  console.log(`\n${hasError ? "✗ Validação encontrou problemas." : "✓ Tudo certo."}`);
  process.exit(hasError ? 1 : 0);
}

main();
