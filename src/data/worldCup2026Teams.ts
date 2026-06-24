import type { Confederation, Group, Team } from "../models";
import { getFlagUrl } from "../utils/getFlagUrl";

// Semente enxuta: só o que varia por seleção. O resto (tournament, type,
// flagUrl, logoUrl/crestUrl null, aliases padrão) é derivado no map abaixo.
interface Seed {
  slug: string;
  name: string; // nome em PT
  fifaName: string; // nome FIFA (EN)
  fifaCode: string;
  group: Group;
  confederation: Confederation;
  flagCode: string; // código da bandeira (ISO alpha-2 ou gb-eng/gb-sct)
  countryCode?: string; // ISO alpha-2 quando existir
  displayIcon: string;
  aliases?: string[]; // extras além de fifaName/fifaCode
}

const SEEDS: Seed[] = [
  // Grupo A
  { slug: "mexico", name: "México", fifaName: "Mexico", fifaCode: "MEX", group: "A", confederation: "CONCACAF", flagCode: "mx", countryCode: "MX", displayIcon: "🇲🇽" },
  { slug: "south-africa", name: "África do Sul", fifaName: "South Africa", fifaCode: "RSA", group: "A", confederation: "CAF", flagCode: "za", countryCode: "ZA", displayIcon: "🇿🇦" },
  { slug: "south-korea", name: "Coreia do Sul", fifaName: "Korea Republic", fifaCode: "KOR", group: "A", confederation: "AFC", flagCode: "kr", countryCode: "KR", displayIcon: "🇰🇷", aliases: ["South Korea", "Coreia"] },
  { slug: "czechia", name: "Tchéquia", fifaName: "Czechia", fifaCode: "CZE", group: "A", confederation: "UEFA", flagCode: "cz", countryCode: "CZ", displayIcon: "🇨🇿", aliases: ["Czech Republic", "República Tcheca"] },

  // Grupo B
  { slug: "canada", name: "Canadá", fifaName: "Canada", fifaCode: "CAN", group: "B", confederation: "CONCACAF", flagCode: "ca", countryCode: "CA", displayIcon: "🇨🇦" },
  { slug: "bosnia", name: "Bósnia e Herzegovina", fifaName: "Bosnia and Herzegovina", fifaCode: "BIH", group: "B", confederation: "UEFA", flagCode: "ba", countryCode: "BA", displayIcon: "🇧🇦", aliases: ["Bosnia"] },
  { slug: "qatar", name: "Catar", fifaName: "Qatar", fifaCode: "QAT", group: "B", confederation: "AFC", flagCode: "qa", countryCode: "QA", displayIcon: "🇶🇦", aliases: ["Qatar"] },
  { slug: "switzerland", name: "Suíça", fifaName: "Switzerland", fifaCode: "SUI", group: "B", confederation: "UEFA", flagCode: "ch", countryCode: "CH", displayIcon: "🇨🇭" },

  // Grupo C
  { slug: "brazil", name: "Brasil", fifaName: "Brazil", fifaCode: "BRA", group: "C", confederation: "CONMEBOL", flagCode: "br", countryCode: "BR", displayIcon: "🇧🇷", aliases: ["Seleção Brasileira", "Canarinho"] },
  { slug: "morocco", name: "Marrocos", fifaName: "Morocco", fifaCode: "MAR", group: "C", confederation: "CAF", flagCode: "ma", countryCode: "MA", displayIcon: "🇲🇦" },
  { slug: "haiti", name: "Haiti", fifaName: "Haiti", fifaCode: "HAI", group: "C", confederation: "CONCACAF", flagCode: "ht", countryCode: "HT", displayIcon: "🇭🇹" },
  { slug: "scotland", name: "Escócia", fifaName: "Scotland", fifaCode: "SCO", group: "C", confederation: "UEFA", flagCode: "gb-sct", displayIcon: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", aliases: ["Scotland"] },

  // Grupo D
  { slug: "usa", name: "Estados Unidos", fifaName: "United States", fifaCode: "USA", group: "D", confederation: "CONCACAF", flagCode: "us", countryCode: "US", displayIcon: "🇺🇸", aliases: ["USA", "EUA", "United States"] },
  { slug: "paraguay", name: "Paraguai", fifaName: "Paraguay", fifaCode: "PAR", group: "D", confederation: "CONMEBOL", flagCode: "py", countryCode: "PY", displayIcon: "🇵🇾" },
  { slug: "australia", name: "Austrália", fifaName: "Australia", fifaCode: "AUS", group: "D", confederation: "AFC", flagCode: "au", countryCode: "AU", displayIcon: "🇦🇺" },
  { slug: "turkey", name: "Turquia", fifaName: "Türkiye", fifaCode: "TUR", group: "D", confederation: "UEFA", flagCode: "tr", countryCode: "TR", displayIcon: "🇹🇷", aliases: ["Turkey", "Türkiye"] },

  // Grupo E
  { slug: "germany", name: "Alemanha", fifaName: "Germany", fifaCode: "GER", group: "E", confederation: "UEFA", flagCode: "de", countryCode: "DE", displayIcon: "🇩🇪" },
  { slug: "curacao", name: "Curaçao", fifaName: "Curaçao", fifaCode: "CUW", group: "E", confederation: "CONCACAF", flagCode: "cw", countryCode: "CW", displayIcon: "🇨🇼", aliases: ["Curacao"] },
  { slug: "ivory-coast", name: "Costa do Marfim", fifaName: "Côte d'Ivoire", fifaCode: "CIV", group: "E", confederation: "CAF", flagCode: "ci", countryCode: "CI", displayIcon: "🇨🇮", aliases: ["Ivory Coast", "Cote d'Ivoire"] },
  { slug: "ecuador", name: "Equador", fifaName: "Ecuador", fifaCode: "ECU", group: "E", confederation: "CONMEBOL", flagCode: "ec", countryCode: "EC", displayIcon: "🇪🇨" },

  // Grupo F
  { slug: "netherlands", name: "Holanda", fifaName: "Netherlands", fifaCode: "NED", group: "F", confederation: "UEFA", flagCode: "nl", countryCode: "NL", displayIcon: "🇳🇱", aliases: ["Netherlands", "Países Baixos"] },
  { slug: "japan", name: "Japão", fifaName: "Japan", fifaCode: "JPN", group: "F", confederation: "AFC", flagCode: "jp", countryCode: "JP", displayIcon: "🇯🇵" },
  { slug: "sweden", name: "Suécia", fifaName: "Sweden", fifaCode: "SWE", group: "F", confederation: "UEFA", flagCode: "se", countryCode: "SE", displayIcon: "🇸🇪" },
  { slug: "tunisia", name: "Tunísia", fifaName: "Tunisia", fifaCode: "TUN", group: "F", confederation: "CAF", flagCode: "tn", countryCode: "TN", displayIcon: "🇹🇳" },

  // Grupo G
  { slug: "belgium", name: "Bélgica", fifaName: "Belgium", fifaCode: "BEL", group: "G", confederation: "UEFA", flagCode: "be", countryCode: "BE", displayIcon: "🇧🇪" },
  { slug: "egypt", name: "Egito", fifaName: "Egypt", fifaCode: "EGY", group: "G", confederation: "CAF", flagCode: "eg", countryCode: "EG", displayIcon: "🇪🇬" },
  { slug: "iran", name: "Irã", fifaName: "IR Iran", fifaCode: "IRN", group: "G", confederation: "AFC", flagCode: "ir", countryCode: "IR", displayIcon: "🇮🇷", aliases: ["Iran", "IR Iran"] },
  { slug: "new-zealand", name: "Nova Zelândia", fifaName: "New Zealand", fifaCode: "NZL", group: "G", confederation: "OFC", flagCode: "nz", countryCode: "NZ", displayIcon: "🇳🇿", aliases: ["New Zealand"] },

  // Grupo H
  { slug: "spain", name: "Espanha", fifaName: "Spain", fifaCode: "ESP", group: "H", confederation: "UEFA", flagCode: "es", countryCode: "ES", displayIcon: "🇪🇸" },
  { slug: "cape-verde", name: "Cabo Verde", fifaName: "Cabo Verde", fifaCode: "CPV", group: "H", confederation: "CAF", flagCode: "cv", countryCode: "CV", displayIcon: "🇨🇻", aliases: ["Cape Verde"] },
  { slug: "saudi-arabia", name: "Arábia Saudita", fifaName: "Saudi Arabia", fifaCode: "KSA", group: "H", confederation: "AFC", flagCode: "sa", countryCode: "SA", displayIcon: "🇸🇦", aliases: ["Saudi Arabia"] },
  { slug: "uruguay", name: "Uruguai", fifaName: "Uruguay", fifaCode: "URU", group: "H", confederation: "CONMEBOL", flagCode: "uy", countryCode: "UY", displayIcon: "🇺🇾" },

  // Grupo I
  { slug: "france", name: "França", fifaName: "France", fifaCode: "FRA", group: "I", confederation: "UEFA", flagCode: "fr", countryCode: "FR", displayIcon: "🇫🇷" },
  { slug: "senegal", name: "Senegal", fifaName: "Senegal", fifaCode: "SEN", group: "I", confederation: "CAF", flagCode: "sn", countryCode: "SN", displayIcon: "🇸🇳" },
  { slug: "iraq", name: "Iraque", fifaName: "Iraq", fifaCode: "IRQ", group: "I", confederation: "AFC", flagCode: "iq", countryCode: "IQ", displayIcon: "🇮🇶", aliases: ["Iraq"] },
  { slug: "norway", name: "Noruega", fifaName: "Norway", fifaCode: "NOR", group: "I", confederation: "UEFA", flagCode: "no", countryCode: "NO", displayIcon: "🇳🇴" },

  // Grupo J
  { slug: "argentina", name: "Argentina", fifaName: "Argentina", fifaCode: "ARG", group: "J", confederation: "CONMEBOL", flagCode: "ar", countryCode: "AR", displayIcon: "🇦🇷", aliases: ["Albiceleste"] },
  { slug: "algeria", name: "Argélia", fifaName: "Algeria", fifaCode: "ALG", group: "J", confederation: "CAF", flagCode: "dz", countryCode: "DZ", displayIcon: "🇩🇿", aliases: ["Algeria"] },
  { slug: "austria", name: "Áustria", fifaName: "Austria", fifaCode: "AUT", group: "J", confederation: "UEFA", flagCode: "at", countryCode: "AT", displayIcon: "🇦🇹" },
  { slug: "jordan", name: "Jordânia", fifaName: "Jordan", fifaCode: "JOR", group: "J", confederation: "AFC", flagCode: "jo", countryCode: "JO", displayIcon: "🇯🇴", aliases: ["Jordan"] },

  // Grupo K
  { slug: "portugal", name: "Portugal", fifaName: "Portugal", fifaCode: "POR", group: "K", confederation: "UEFA", flagCode: "pt", countryCode: "PT", displayIcon: "🇵🇹" },
  { slug: "dr-congo", name: "República Democrática do Congo", fifaName: "DR Congo", fifaCode: "COD", group: "K", confederation: "CAF", flagCode: "cd", countryCode: "CD", displayIcon: "🇨🇩", aliases: ["DR Congo", "Congo DR", "RD Congo"] },
  { slug: "uzbekistan", name: "Uzbequistão", fifaName: "Uzbekistan", fifaCode: "UZB", group: "K", confederation: "AFC", flagCode: "uz", countryCode: "UZ", displayIcon: "🇺🇿", aliases: ["Uzbekistan"] },
  { slug: "colombia", name: "Colômbia", fifaName: "Colombia", fifaCode: "COL", group: "K", confederation: "CONMEBOL", flagCode: "co", countryCode: "CO", displayIcon: "🇨🇴", aliases: ["Colombia"] },

  // Grupo L
  { slug: "england", name: "Inglaterra", fifaName: "England", fifaCode: "ENG", group: "L", confederation: "UEFA", flagCode: "gb-eng", displayIcon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", aliases: ["England"] },
  { slug: "croatia", name: "Croácia", fifaName: "Croatia", fifaCode: "CRO", group: "L", confederation: "UEFA", flagCode: "hr", countryCode: "HR", displayIcon: "🇭🇷", aliases: ["Croatia"] },
  { slug: "ghana", name: "Gana", fifaName: "Ghana", fifaCode: "GHA", group: "L", confederation: "CAF", flagCode: "gh", countryCode: "GH", displayIcon: "🇬🇭", aliases: ["Ghana"] },
  { slug: "panama", name: "Panamá", fifaName: "Panama", fifaCode: "PAN", group: "L", confederation: "CONCACAF", flagCode: "pa", countryCode: "PA", displayIcon: "🇵🇦", aliases: ["Panama"] },
];

export const WORLD_CUP_2026_TEAMS: Team[] = SEEDS.map((s) => ({
  id: `selection-${s.slug}`,
  name: s.name,
  shortName: s.name,
  fifaName: s.fifaName,
  type: "selection",
  tournament: "world_cup_2026",
  group: s.group,
  confederation: s.confederation,
  countryCode: s.countryCode,
  flagCode: s.flagCode,
  fifaCode: s.fifaCode,
  displayIcon: s.displayIcon,
  flagUrl: getFlagUrl(s.flagCode),
  logoUrl: null,
  crestUrl: null,
  // aliases sempre incluem nome FIFA e código FIFA, + extras da seed
  aliases: Array.from(new Set([s.fifaName, s.fifaCode, ...(s.aliases ?? [])])),
}));
