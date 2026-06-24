/**
 * Importa elencos OFICIAIS da Copa 2026 a partir de um CSV e gera/atualiza
 * src/data/worldCupSquads2026.json — sem digitar jogador na mão no JSON.
 *
 * Uso:
 *   npx tsx scripts/importWorldCupSquads.ts
 *
 * Entrada esperada:
 *   src/data/import/fifa-squad-lists-2026.csv
 * Colunas:
 *   teamFifaCode,teamName,playerName,firstNames,lastName,shirtName,
 *   position,shirtNumber,club,dateOfBirth,heightCm
 *
 * Regras:
 *  - Mapeia teamFifaCode -> teamId usando as seleções já cadastradas.
 *  - Gera Player com id estável (createPlayerId), sem duplicar em re-runs.
 *  - Marca source: "official_import", isWorldCupSquad: true.
 *  - Atualiza lastVerifiedAt (ISO de agora) e sourceName honesto da Wikipedia.
 *  - Preserva seleções já existentes que não estão no CSV.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { WORLD_CUP_2026_TEAMS } from "../src/data/worldCup2026Teams.ts";
import { createPlayerId } from "../src/utils/createPlayerId.ts";
import type { Player, PlayerPosition } from "../src/models/index.ts";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "src/data/import/fifa-squad-lists-2026.csv");
const JSON_PATH = resolve(ROOT, "src/data/worldCupSquads2026.json");

interface SquadEntry {
  teamId: string;
  source: string;
  sourceName: string;
  lastVerifiedAt: string | null;
  verifiedBy: string | null;
  players: Player[];
}

// --- mini parser de CSV (lida com aspas e vírgulas dentro de campo) ---
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((v) => v !== "")) rows.push(row); }

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? "").trim()])));
}

function normalizePosition(raw: string): PlayerPosition {
  const p = raw.toUpperCase().trim();
  if (["GK", "GOALKEEPER", "GOLEIRO"].includes(p)) return "GK";
  if (["DEF", "DEFENDER", "DF", "ZAGUEIRO", "LATERAL"].includes(p)) return "DEF";
  if (["MID", "MIDFIELDER", "MF", "MEIA", "VOLANTE"].includes(p)) return "MID";
  if (["FWD", "FORWARD", "FW", "ATACANTE"].includes(p)) return "FWD";
  return "UNKNOWN";
}

function main() {
  if (!existsSync(CSV_PATH)) {
    console.error(`✗ CSV não encontrado: ${CSV_PATH}`);
    console.error("  Coloque o arquivo oficial e rode de novo.");
    process.exit(1);
  }

  // fifaCode -> seleção cadastrada
  const teamByFifa = new Map(
    WORLD_CUP_2026_TEAMS.map((t) => [t.fifaCode?.toUpperCase(), t])
  );

  const rows = parseCsv(readFileSync(CSV_PATH, "utf8"));
  if (rows.length === 0) {
    console.error("✗ CSV vazio (só cabeçalho). Nada a importar.");
    process.exit(1);
  }

  // JSON atual indexado por teamId (preserva seleções fora do CSV)
  const existing: SquadEntry[] = existsSync(JSON_PATH)
    ? (JSON.parse(readFileSync(JSON_PATH, "utf8")) as SquadEntry[])
    : [];
  const byTeamId = new Map(existing.map((e) => [e.teamId, e]));

  const now = new Date().toISOString();
  const touched = new Set<string>();
  let skipped = 0;

  for (const r of rows) {
    const fifa = (r.teamFifaCode || "").toUpperCase();
    const team = teamByFifa.get(fifa);
    if (!team) { skipped++; continue; } // seleção não reconhecida

    const playerName = r.playerName || [r.firstNames, r.lastName].filter(Boolean).join(" ");
    if (!playerName) { skipped++; continue; }

    const id = createPlayerId(fifa, playerName);
    const displayName = r.shirtName || r.lastName || playerName;
    const player: Player = {
      id,
      name: playerName,
      displayName,
      shirtName: r.shirtName || displayName,
      teamId: team.id,
      teamName: team.name,
      countryCode: team.countryCode,
      fifaCode: fifa,
      position: normalizePosition(r.position),
      shirtNumber: r.shirtNumber ? Number(r.shirtNumber) : undefined,
      photoUrl: null,
      source: "official_import",
      isWorldCupSquad: true,
      aliases: Array.from(
        new Set([playerName, r.shirtName, r.lastName].filter(Boolean) as string[])
      ),
    };

    let entry = byTeamId.get(team.id);
    if (!entry) {
      entry = {
        teamId: team.id,
        source: "official_import",
        sourceName: "Wikipedia — 2026 FIFA World Cup squads (per FIFA)",
        lastVerifiedAt: now,
        verifiedBy: "fetchWikipediaSquads",
        players: [],
      };
      byTeamId.set(team.id, entry);
    }
    if (!touched.has(team.id)) {
      // Primeira vez que vemos esse time nesta execução: começa squad limpo
      // e atualiza metadados para oficial (re-run não duplica).
      entry.players = [];
      entry.source = "official_import";
      entry.sourceName = "Wikipedia — 2026 FIFA World Cup squads (per FIFA)";
      entry.lastVerifiedAt = now;
      entry.verifiedBy = "fetchWikipediaSquads";
      touched.add(team.id);
    }
    if (!entry.players.some((p) => p.id === id)) entry.players.push(player);
  }

  const out = Array.from(byTeamId.values());
  writeFileSync(JSON_PATH, JSON.stringify(out, null, 2) + "\n");

  console.log("Importação concluída:");
  for (const id of touched) {
    const e = byTeamId.get(id)!;
    console.log(`  ${e.teamId}: ${e.players.length} jogadores (oficial)`);
  }
  if (skipped) console.log(`  ⚠️ ${skipped} linha(s) ignorada(s) (sem seleção/nome).`);
  console.log(`Arquivo: ${JSON_PATH}`);
}

main();
