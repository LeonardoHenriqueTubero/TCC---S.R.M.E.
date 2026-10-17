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

const CONECTIVOS = new Set(['de', 'da', 'do', 'das', 'dos', 'e']);

export function siglas(nomes: string[]): Map<string, string> {
  const unicos = [...new Set(nomes.map((nome) => nome.trim()))];
  const palavras = unicos.map((nome) => {
    const partes = nome.split(/\s+/).filter((palavra) => !CONECTIVOS.has(palavra.toLowerCase()));
    return partes.length > 0 ? partes : [nome];
  });
  const extras = unicos.map(() => 0);

  const montar = (indice: number): string => {
    const partes = palavras[indice];
    const ultima = partes[partes.length - 1];
    const iniciais = partes.map((palavra) => palavra[0].toUpperCase()).join('');
    return iniciais + ultima.slice(1, 1 + extras[indice]).toLowerCase();
  };

  let atuais = unicos.map((_, indice) => montar(indice));
  for (;;) {
    const repetidas = atuais
      .map((sigla, indice) => (atuais.indexOf(sigla) !== atuais.lastIndexOf(sigla) ? indice : -1))
      .filter((indice) => indice >= 0);

    const avancaram = repetidas.filter((indice) => {
      const partes = palavras[indice];
      if (extras[indice] >= partes[partes.length - 1].length - 1) {
        return false;
      }
      extras[indice]++;
      return true;
    });

    if (avancaram.length === 0) {
      break;
    }
    atuais = unicos.map((_, indice) => montar(indice));
  }

  const vistas = new Map<string, number>();
  return new Map(
    unicos.map((nome, indice) => {
      const vezes = (vistas.get(atuais[indice]) ?? 0) + 1;
      vistas.set(atuais[indice], vezes);
      return [nome, vezes > 1 ? `${atuais[indice]}${vezes}` : atuais[indice]];
    })
  );
}
