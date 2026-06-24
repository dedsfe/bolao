import type { Team } from "../models";
import type { SearchTeamsParams, TeamService } from "./TeamService";

// Placeholder para a futura API real de times/seleções/bandeiras.
// Implementa a MESMA interface TeamService — então, quando a API
// existir, basta preencher os fetch abaixo e trocar a instância
// exportada em TeamService.ts (`export const teamService = ...`)
// por `new RemoteTeamService(...)`. Nenhuma tela precisa mudar.
//
// Espera-se que a API devolva objetos no formato Team
// (id, name, type, countryCode?, flagUrl?, logoUrl?). displayIcon
// continua como fallback visual quando não houver imagem.
export class RemoteTeamService implements TeamService {
  constructor(private readonly baseUrl: string) {}

  async getTeams(): Promise<Team[]> {
    // TODO: const res = await fetch(`${this.baseUrl}/teams`); return res.json();
    throw new Error(`getTeams não implementado (${this.baseUrl}/teams)`);
  }

  async searchTeams(_params: SearchTeamsParams): Promise<Team[]> {
    // TODO: montar querystring com query/category e chamar a API.
    throw new Error(`searchTeams não implementado (${this.baseUrl}/teams?q=...)`);
  }

  async getTeamById(id: string): Promise<Team | null> {
    // TODO: const res = await fetch(`${this.baseUrl}/teams/${id}`); ...
    throw new Error(`getTeamById não implementado (${this.baseUrl}/teams/${id})`);
  }
}
