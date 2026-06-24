// Gera um id estável e legível para o jogador.
// Ex.: createPlayerId("BRA", "Vinicius Junior") -> "player-bra-vinicius-junior"
//      createPlayerId("ARG", "Lionel Messi")    -> "player-arg-lionel-messi"
export function createPlayerId(teamFifaCode: string, playerName: string): string {
  const slug = playerName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // não-alfanumérico -> hífen
    .replace(/^-+|-+$/g, ""); // limpa hífens das pontas
  return `player-${teamFifaCode.toLowerCase()}-${slug}`;
}
