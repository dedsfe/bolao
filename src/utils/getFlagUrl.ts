// Centraliza a montagem da URL da bandeira. Hoje usa o CDN flagcdn.com
// (suporta subdivisões como "gb-eng" / "gb-sct"). Trocar de CDN ou para
// assets locais é só mexer aqui — nenhum objeto Team tem URL hardcoded.
//
// Ex.: getFlagUrl("br")     -> bandeira do Brasil
//      getFlagUrl("gb-eng") -> bandeira da Inglaterra
//      getFlagUrl("gb-sct") -> bandeira da Escócia
export function getFlagUrl(flagCode: string): string {
  return `https://flagcdn.com/${flagCode.toLowerCase()}.svg`;
}
