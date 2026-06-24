import type { Team } from "../models";

// Clubes — categoria secundária. Continuam em emoji (displayIcon) por
// enquanto; logoUrl/crestUrl ficam null, prontos para o futuro.
interface ClubSeed {
  slug: string;
  name: string;
  countryCode: string;
  displayIcon: string;
  aliases?: string[];
}

const SEEDS: ClubSeed[] = [
  { slug: "sao-paulo", name: "São Paulo", countryCode: "BR", displayIcon: "⚪", aliases: ["SPFC", "Tricolor"] },
  { slug: "palmeiras", name: "Palmeiras", countryCode: "BR", displayIcon: "🟢", aliases: ["Verdão", "Palestra"] },
  { slug: "corinthians", name: "Corinthians", countryCode: "BR", displayIcon: "⚫", aliases: ["Timão"] },
  { slug: "santos", name: "Santos", countryCode: "BR", displayIcon: "⚪", aliases: ["Peixe"] },
  { slug: "flamengo", name: "Flamengo", countryCode: "BR", displayIcon: "🔴", aliases: ["Mengão", "Fla"] },
  { slug: "vasco", name: "Vasco", countryCode: "BR", displayIcon: "⚫", aliases: ["Vasco da Gama", "Gigante da Colina"] },
  { slug: "fluminense", name: "Fluminense", countryCode: "BR", displayIcon: "🟢", aliases: ["Flu", "Tricolor"] },
  { slug: "botafogo", name: "Botafogo", countryCode: "BR", displayIcon: "⚫", aliases: ["Fogão"] },
  { slug: "real-madrid", name: "Real Madrid", countryCode: "ES", displayIcon: "⚪", aliases: ["Real", "Merengue"] },
  { slug: "barcelona", name: "Barcelona", countryCode: "ES", displayIcon: "🔵", aliases: ["Barça", "Barca"] },
  { slug: "manchester-city", name: "Manchester City", countryCode: "GB", displayIcon: "🔵", aliases: ["Man City", "City"] },
  { slug: "liverpool", name: "Liverpool", countryCode: "GB", displayIcon: "🔴", aliases: ["Reds"] },
  { slug: "bayern", name: "Bayern de Munique", countryCode: "DE", displayIcon: "🔴", aliases: ["Bayern Munich", "Bayern München"] },
  { slug: "psg", name: "PSG", countryCode: "FR", displayIcon: "🔵", aliases: ["Paris Saint-Germain", "Paris"] },
];

export const MOCK_CLUB_TEAMS: Team[] = SEEDS.map((s) => ({
  id: `club-${s.slug}`,
  name: s.name,
  shortName: s.name,
  type: "club",
  tournament: null,
  countryCode: s.countryCode,
  displayIcon: s.displayIcon,
  logoUrl: null,
  crestUrl: null,
  aliases: s.aliases,
}));
