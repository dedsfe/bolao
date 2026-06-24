import type { Match } from "../models";

// Persistência local do bolão ativo. A UI nunca toca em localStorage
// direto — fala só com este serviço. Para trocar por outro backend
// (IndexedDB, AsyncStorage no RN, API), basta reimplementar aqui.
export interface MatchStorage {
  saveMatch(match: Match): Promise<void>;
  loadMatch(): Promise<Match | null>;
  clearMatch(): Promise<void>;
}

const STORAGE_KEY = "bolao:active-match";

class LocalMatchStorage implements MatchStorage {
  async saveMatch(match: Match): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(match));
    } catch {
      // storage cheio/indisponível — ignora silenciosamente nesta etapa
    }
  }

  async loadMatch(): Promise<Match | null> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Match;
    } catch {
      return null;
    }
  }

  async clearMatch(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // nada a fazer
    }
  }
}

export const matchStorage: MatchStorage = new LocalMatchStorage();
