/**
 * Baixa o wikitext bruto de "2026 FIFA World Cup squads" e gera o CSV
 * consumido por importWorldCupSquads.ts.
 *
 * Uso:
 *   npx tsx scripts/fetchWikipediaSquads.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { WORLD_CUP_2026_TEAMS } from "../src/data/worldCup2026Teams.ts";

const ROOT = resolve(import.meta.dirname, "..");
const CSV_PATH = resolve(ROOT, "src/data/import/fifa-squad-lists-2026.csv");
const WIKITEXT_URL =
  "https://en.wikipedia.org/w/index.php?title=2026_FIFA_World_Cup_squads&action=raw";

const CSV_COLUMNS = [
  "teamFifaCode",
  "teamName",
  "playerName",
  "firstNames",
  "lastName",
  "shirtName",
  "position",
  "shirtNumber",
  "club",
  "dateOfBirth",
  "heightCm",
] as const;

type CsvColumn = (typeof CSV_COLUMNS)[number];
type CsvRow = Record<CsvColumn, string>;

interface TeamBlock {
  headerName: string;
  text: string;
}

function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function csvEscape(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function stripComments(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, "");
}

function cleanWikiText(value: string): string {
  return value
    .replace(/\{\{sort\|([^|{}]+)\|([^{}]+)\}\}/gi, "$2")
    .replace(/\{\{nowrap\|([^{}]+)\}\}/gi, "$1")
    .replace(/\{\{flagicon\|[^{}]+\}\}/gi, "")
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/<ref\b[^/]*\/>/gi, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/''+/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function splitTopLevelPipes(template: string): string[] {
  const parts: string[] = [];
  let current = "";
  let templateDepth = 0;
  let linkDepth = 0;

  for (let i = 0; i < template.length; i++) {
    const pair = template.slice(i, i + 2);
    if (pair === "{{") {
      templateDepth++;
      current += pair;
      i++;
      continue;
    }
    if (pair === "}}") {
      templateDepth = Math.max(0, templateDepth - 1);
      current += pair;
      i++;
      continue;
    }
    if (pair === "[[") {
      linkDepth++;
      current += pair;
      i++;
      continue;
    }
    if (pair === "]]") {
      linkDepth = Math.max(0, linkDepth - 1);
      current += pair;
      i++;
      continue;
    }
    if (template[i] === "|" && templateDepth === 1 && linkDepth === 0) {
      parts.push(current);
      current = "";
      continue;
    }
    current += template[i];
  }
  parts.push(current);
  return parts;
}

function parseTemplateParams(template: string): Record<string, string> {
  const parts = splitTopLevelPipes(template);
  const params: Record<string, string> = {};

  for (const part of parts.slice(1)) {
    const equalsIndex = part.indexOf("=");
    if (equalsIndex === -1) continue;
    const key = part.slice(0, equalsIndex).trim();
    const value = part.slice(equalsIndex + 1).trim();
    if (key) params[key] = value;
  }

  return params;
}

function findBalancedTemplates(text: string, templateName: string): string[] {
  const templates: string[] = [];
  const needle = `{{${templateName}`;
  let searchFrom = 0;

  while (true) {
    const start = text.indexOf(needle, searchFrom);
    if (start === -1) break;

    let depth = 0;
    let end = -1;
    for (let i = start; i < text.length - 1; i++) {
      const pair = text.slice(i, i + 2);
      if (pair === "{{") {
        depth++;
        i++;
      } else if (pair === "}}") {
        depth--;
        i++;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    if (end === -1) break;
    templates.push(text.slice(start, end + 1));
    searchFrom = end + 1;
  }

  return templates;
}

function getHeaderBefore(text: string, index: number): string | null {
  const before = text.slice(0, index);
  const headerPattern = /^===\s*([^=\n]+?)\s*===\s*$/gm;
  let match: RegExpExecArray | null;
  let last: string | null = null;

  while ((match = headerPattern.exec(before))) {
    last = cleanWikiText(match[1]);
  }

  return last;
}

function extractTeamBlocks(wikitext: string): TeamBlock[] {
  const blocks: TeamBlock[] = [];
  const startPattern = /\{\{nat fs g start[^}]*\}\}/g;
  let match: RegExpExecArray | null;

  while ((match = startPattern.exec(wikitext))) {
    const headerName = getHeaderBefore(wikitext, match.index);
    const endIndex = wikitext.indexOf("{{nat fs end}}", startPattern.lastIndex);
    if (!headerName || endIndex === -1) continue;

    blocks.push({
      headerName,
      text: wikitext.slice(startPattern.lastIndex, endIndex),
    });
    startPattern.lastIndex = endIndex + "{{nat fs end}}".length;
  }

  return blocks;
}

function normalizePosition(value: string): string {
  const position = cleanWikiText(value).toUpperCase();
  if (position === "FW") return "FWD";
  if (position === "MF") return "MID";
  if (position === "DF") return "DEF";
  if (position === "GK") return "GK";
  return "UNKNOWN";
}

function parseSortName(sortname: string, playerName: string): Pick<CsvRow, "firstNames" | "lastName"> {
  const cleaned = cleanWikiText(sortname);
  if (cleaned.includes(",")) {
    const [last, ...firstParts] = cleaned.split(",");
    return {
      firstNames: firstParts.join(",").trim(),
      lastName: last.trim(),
    };
  }

  const parts = playerName.split(/\s+/).filter(Boolean);
  return {
    firstNames: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? playerName,
  };
}

function parseDateOfBirth(ageTemplate: string): string {
  const match = ageTemplate.match(
    /\{\{\s*birth date and age2\s*\|\s*\d{4}\s*\|\s*\d{1,2}\s*\|\s*\d{1,2}\s*\|\s*(\d{4})\s*\|\s*(\d{1,2})\s*\|\s*(\d{1,2})/i
  );
  if (!match) return "";

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function makeShirtName(playerName: string): string {
  const words = cleanWikiText(playerName).split(/\s+/).filter(Boolean);
  const lastWord = words.at(-1);
  if (!lastWord) return playerName;

  if (/^(j[uú]nior|jr\.?)$/i.test(lastWord) && words[0]?.toLowerCase().startsWith("vin")) {
    return "Vini Jr";
  }

  return lastWord;
}

function buildTeamLookup(): Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]> {
  const lookup = new Map<string, (typeof WORLD_CUP_2026_TEAMS)[number]>();
  for (const team of WORLD_CUP_2026_TEAMS) {
    if (team.fifaName) lookup.set(normalizeName(team.fifaName), team);
    for (const alias of team.aliases ?? []) lookup.set(normalizeName(alias), team);
  }
  return lookup;
}

async function fetchWikitext(): Promise<string> {
  const response = await fetch(WIKITEXT_URL, {
    headers: {
      "User-Agent": "BolaoApp/1.0 (Wikipedia squad import)",
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia respondeu ${response.status} ${response.statusText}`);
  }

  return response.text();
}

async function main() {
  const wikitext = stripComments(await fetchWikitext());
  const teamLookup = buildTeamLookup();
  const blocks = extractTeamBlocks(wikitext);
  const rows: CsvRow[] = [];
  const ignoredHeaders = new Set<string>();
  const processedTeams = new Map<string, number>();

  for (const block of blocks) {
    const team = teamLookup.get(normalizeName(block.headerName));
    if (!team?.fifaCode) {
      ignoredHeaders.add(block.headerName);
      continue;
    }

    for (const template of findBalancedTemplates(block.text, "nat fs g player")) {
      const params = parseTemplateParams(template);
      const playerName = cleanWikiText(params.name ?? "");
      if (!playerName) continue;

      const names = parseSortName(params.sortname ?? "", playerName);
      const shirtName = makeShirtName(playerName);
      rows.push({
        teamFifaCode: team.fifaCode,
        teamName: team.name,
        playerName,
        firstNames: names.firstNames,
        lastName: names.lastName,
        shirtName,
        position: normalizePosition(params.pos ?? ""),
        shirtNumber: cleanWikiText(params.no ?? ""),
        club: cleanWikiText(params.club ?? ""),
        dateOfBirth: parseDateOfBirth(params.age ?? ""),
        heightCm: "",
      });
      processedTeams.set(team.id, (processedTeams.get(team.id) ?? 0) + 1);
    }
  }

  const csv = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");

  mkdirSync(dirname(CSV_PATH), { recursive: true });
  writeFileSync(CSV_PATH, `${csv}\n`);

  console.log(`CSV gerado: ${CSV_PATH}`);
  console.log(`${rows.length} jogadores em ${processedTeams.size} seleções mapeadas.`);
  for (const [teamId, count] of [...processedTeams.entries()].sort()) {
    console.log(`  ${teamId}: ${count}`);
  }
  if (ignoredHeaders.size) {
    console.log(`Headers ignorados (${ignoredHeaders.size}): ${[...ignoredHeaders].sort().join(", ")}`);
  }
}

main().catch((error) => {
  console.error(`✗ Falha ao buscar/parsear squads da Wikipedia: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
