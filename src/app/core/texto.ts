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
