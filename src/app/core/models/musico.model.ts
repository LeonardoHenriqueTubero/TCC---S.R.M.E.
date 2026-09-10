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

export interface MusicoListado extends Musico {
    instrumentoNome: string | null,
    casaNome: string | null
}
