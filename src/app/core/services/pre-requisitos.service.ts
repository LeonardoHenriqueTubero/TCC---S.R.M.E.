import { Injectable, inject } from '@angular/core';
import { CasaOracaoService } from './casa-oracao.service';
import { EventoService } from './evento.service';
import { InstrumentoService } from './instrumento.service';
import { MusicoService } from './musico.service';

/**
 * O que precisa existir antes de cadastrar um músico ou um lançamento.
 *
 * Os dois formulários só têm o que oferecer depois que outras telas já foram
 * preenchidas: o de músico escolhe uma casa de oração e um instrumento; o de
 * lançamento escolhe uma casa, um evento e quem tocou. Sem isso o usuário
 * chegava num formulário com listas vazias e nenhuma pista do que fazer — foi o
 * que travou os primeiros testadores.
 *
 * Cada nome aqui é o rótulo da aba onde o cadastro é feito, para a mensagem na
 * tela dizer exatamente onde ir.
 */
export interface PreRequisito {
  /** Como aparece na mensagem: "cadastre uma casa de oração". */
  artigo: string;
  nome: string;
  /** Aba onde se cadastra. */
  rota: string;
}

const CASA: PreRequisito = { artigo: 'uma', nome: 'casa de oração', rota: '/tabs/casas' };
const INSTRUMENTO: PreRequisito = { artigo: 'um', nome: 'instrumento', rota: '/tabs/instrumentos' };
const EVENTO: PreRequisito = { artigo: 'um', nome: 'evento', rota: '/tabs/eventos' };
const MUSICO: PreRequisito = { artigo: 'um', nome: 'músico', rota: '/tabs/musicos' };

@Injectable({
  providedIn: 'root',
})
export class PreRequisitosService {
  private readonly casaOracaoService = inject(CasaOracaoService);
  private readonly instrumentoService = inject(InstrumentoService);
  private readonly eventoService = inject(EventoService);
  private readonly musicoService = inject(MusicoService);

  /** O que falta para cadastrar um músico. Vazio = pode cadastrar. */
  async paraMusico(): Promise<PreRequisito[]> {
    const [casas, instrumentos] = await Promise.all([
      this.casaOracaoService.listarTodos(),
      this.instrumentoService.listarTodos(),
    ]);

    return [
      ...(casas.length === 0 ? [CASA] : []),
      ...(instrumentos.length === 0 ? [INSTRUMENTO] : []),
    ];
  }

  /** O que falta para cadastrar um lançamento. Vazio = pode cadastrar. */
  async paraLancamento(): Promise<PreRequisito[]> {
    const [casas, eventos, musicos] = await Promise.all([
      this.casaOracaoService.listarTodos(),
      this.eventoService.listarTodos(),
      this.musicoService.listarTodos(),
    ]);

    return [
      ...(casas.length === 0 ? [CASA] : []),
      ...(eventos.length === 0 ? [EVENTO] : []),
      ...(musicos.length === 0 ? [MUSICO] : []),
    ];
  }
}
