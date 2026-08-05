export interface Musico {
    id?: number,
    nome: string,
    oficializado: string,
    batizado: string,
    cargo: string,
    ativo: boolean,
    comum_congregacao: number,
    instrumento: number
}

/**
 * Músico com o instrumento e a casa de oração já pelo nome, para a listagem
 * não precisar cruzar os ids na tela.
 *
 * É um tipo à parte, e não campos opcionais em Musico, porque criar() e
 * atualizar() recebem Omit<Musico, ...>: campos a mais ali passariam a ser
 * exigidos do formulário, que não tem — nem deveria ter — esses nomes.
 * Os dois são nulos quando o músico não tem instrumento ou casa, ou quando o
 * cadastro deles foi excluído depois.
 */
export interface MusicoListado extends Musico {
    instrumentoNome: string | null,
    casaNome: string | null
}
