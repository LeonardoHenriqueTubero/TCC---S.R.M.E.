export function listaEmPortugues(itens: string[]): string {
  if (itens.length <= 1) {
    return itens.join('');
  }
  return `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function contemTermo(termo: string, ...campos: (string | null | undefined)[]): boolean {
  const procurado = normalizar(termo.trim());
  if (!procurado) {
    return true;
  }
  return campos.some((campo) => campo != null && normalizar(campo).includes(procurado));
}

export function nomearVisitas<T extends { nome: string | null }>(
  visitas: T[]
): (T & { nome: string; anonima: boolean })[] {
  let semNome = 0;
  return visitas.map((visita) => {
    const nome = visita.nome?.trim();
    return nome
      ? { ...visita, nome, anonima: false }
      : { ...visita, nome: `Visita ${++semNome}`, anonima: true };
  });
}
