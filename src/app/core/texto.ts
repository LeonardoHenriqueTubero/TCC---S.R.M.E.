/**
 * Enumera nomes como se escreve em português: vírgula entre os do meio e "e"
 * antes do último.
 *
 *   []                            → ''
 *   ['Nome']                      → 'Nome'
 *   ['Nome', 'Cargo']             → 'Nome e Cargo'
 *   ['Nome', 'Cargo', 'Família']  → 'Nome, Cargo e Família'
 */
export function listaEmPortugues(itens: string[]): string {
  if (itens.length <= 1) {
    return itens.join('');
  }
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/**
 * Texto pronto para comparar numa busca: minúsculo e sem acentos.
 *
 * Tirar o acento não é capricho num cadastro em português. Quem procura o
 * organista digita "orgao", não "órgão"; quem procura o João digita "joao" —
 * ainda mais no celular, com pressa. Sem isto, a busca não acharia nenhum dos
 * dois e pareceria quebrada.
 *
 * O normalize('NFD') separa a letra do acento em dois caracteres, e o replace
 * joga fora os acentos que ficaram soltos — U+0300 a U+036F é o bloco dos
 * acentos combinantes do Unicode.
 *
 * O intervalo vai escrito como escape, e não com os acentos soltos digitados
 * direto: soltos, eles são caracteres invisíveis dentro de um par de colchetes,
 * que qualquer editor, ferramenta ou cópia pode comer sem ninguém notar — e o
 * defeito só apareceria na busca do usuário, não no build.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Se algum dos campos contém o termo procurado, ignorando acentos e maiúsculas.
 *
 * Termo vazio devolve `true`: sem busca, tudo passa — é o que deixa as telas
 * escreverem o filtro numa linha só, sem um `if` antes para o caso de ninguém
 * ter digitado nada.
 */
export function contemTermo(termo: string, ...campos: (string | null | undefined)[]): boolean {
  const procurado = normalizar(termo.trim());
  if (!procurado) {
    return true;
  }
  return campos.some((campo) => campo != null && normalizar(campo).includes(procurado));
}
